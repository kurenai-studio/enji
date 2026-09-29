#!/usr/bin/env node
/**
 * Enji CLI — Creator 3.8 preview / edit (no publish).
 *
 *   enji init <dir> [--template base-ai]
 *   enji open [--project <dir>]
 *   enji host start|status|stop [--project <dir>] [--timeout <seconds>]
 *   enji import <file|dir>... [--project <dir>]
 *   enji asset info <file> [--project <dir>]
 *   enji logs [--since <seq>] [--errors [--all]] [--project <dir>]
 *   enji check [--project <dir>]
 *   enji context [--project <dir>]
 *
 * There is no `enji publish`. Build with Creator 3.8.8 IDE (or a separate MCP).
 */
import { spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { parseArgs, resolveProjectDir, wantsHelp } from '../lib/cli/parse.js';

const META_HOOK = new URL('../lib/meta/hook.js', import.meta.url);
const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const STOP_TIMEOUT_MS = 8_000;
const POLL_MS = 500;

const USAGE = `enji ${VERSION}

usage:
  enji --version
  enji init <dir> [--template base-ai]
  enji open [--project <dir>]
  enji host start|status|stop [--project <dir>] [--timeout <seconds>]
  enji import <file|dir>... [--project <dir>]
  enji asset info <file> [--project <dir>]
  enji logs [--since <seq>] [--errors [--all]] [--project <dir>]
  enji check [--project <dir>]
  enji context [--project <dir>]

import      import new or changed files under assets/ and write their .meta
            (starts the host if needed); returns uuid / type / sub-assets.
asset info  read uuid / importer / sub-assets from an existing .meta
            (read-only, no host); fails if the file was never imported.

Enji is Creator 3.8 only. Preview runs a bundled cocos runtime with 3.8 meta caps.
There is no publish — build in Creator 3.8.8 IDE.

host start waits for readiness (default 600s). Override with --timeout <seconds>
or env ENJI_HOST_READY_TIMEOUT_MS.`;

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function exitWith(message, code = 1) {
  print({ ok: false, error: message });
  process.exit(code);
}

function resolveProject(options, hint) {
  try {
    return resolveProjectDir(options, hint);
  } catch (error) {
    exitWith(error instanceof Error ? error.message : String(error));
  }
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readHostFile(project) {
  try {
    const host = JSON.parse(readFileSync(join(project, 'temp', 'enji-host.json'), 'utf8'));
    return alive(host.pid) ? host : undefined;
  } catch {
    return undefined;
  }
}

async function hostStatus(host) {
  try {
    const response = await fetch(`${host.serverUrl}/__enji/status`);
    return response.ok ? await response.json() : undefined;
  } catch {
    return undefined;
  }
}

function logTail(logFile, lines = 20) {
  try {
    return readFileSync(logFile, 'utf8').trimEnd().split('\n').slice(-lines);
  } catch {
    return [];
  }
}

async function ensureHost(project, options = {}) {
  const { resolveHostReadyTimeoutMs, ensureCoreDeps, hostEntry } = await import('../lib/index.js');
  const readyTimeoutMs = resolveHostReadyTimeoutMs(options);

  const running = readHostFile(project);
  if (running && (await hostStatus(running))?.ready) return running;

  const { root: coreRoot } = await ensureCoreDeps();

  const logFile = join(project, 'temp', 'enji-host.log');
  if (!running) {
    if (!existsSync(META_HOOK)) exitWith('missing lib/meta/hook.js — run `npm run build` in enji first');
    mkdirSync(dirname(logFile), { recursive: true });
    const out = openSync(logFile, 'w');
    const nodeArgs = ['--import', META_HOOK.href, '--max-old-space-size=8192', hostEntry()];
    const child = spawn(process.execPath, nodeArgs, {
      cwd: project,
      env: {
        ...process.env,
        PROJECT: project,
        PORT: process.env.PORT || '7460',
        ENJI_COCOS_CORE_ROOT: coreRoot,
        ENJI_META_DOWNGRADE: '1',
      },
      stdio: ['ignore', out, out],
      detached: true,
    });
    child.unref();
    closeSync(out);
  }

  const deadline = Date.now() + readyTimeoutMs;
  while (Date.now() < deadline) {
    await sleep(POLL_MS);
    const host = readHostFile(project);
    if (host && (await hostStatus(host))?.ready) {
      // Cap any metas the first import may have written before hooks attached.
      const { normalizeProjectMetas } = await import('../lib/index.js');
      await normalizeProjectMetas(project);
      return host;
    }
    const tail = logTail(logFile, 5);
    if (!host && tail.some((line) => line.includes('[enji-host]') && /failed|not found|required/.test(line))) {
      exitWith(`host failed to start:\n${logTail(logFile).join('\n')}`);
    }
  }

  const still = readHostFile(project);
  if (still) {
    exitWith(
      `host still starting after ${Math.round(readyTimeoutMs / 1000)}s (pid ${still.pid}); left running — poll with \`enji host status\` or see ${logFile}.`,
    );
  }
  exitWith(`host not ready after ${Math.round(readyTimeoutMs / 1000)}s; see ${logFile}`);
}

async function stopHost(project) {
  const host = readHostFile(project);
  if (!host) return { ok: true, running: false };
  process.kill(host.pid, 'SIGTERM');
  const deadline = Date.now() + STOP_TIMEOUT_MS;
  while (alive(host.pid) && Date.now() < deadline) await sleep(200);
  if (alive(host.pid)) process.kill(host.pid, 'SIGKILL');
  return { ok: true, running: false, stopped: host.pid };
}

function printUsage(exitCode) {
  process.stderr.write(`${USAGE}\n`);
  process.exit(exitCode);
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv[0] === '--version' || argv[0] === '-v' || argv[0] === 'version') {
    process.stdout.write(`${VERSION}\n`);
    return;
  }
  if (wantsHelp(argv)) printUsage(0);

  const { positional, options } = parseArgs(argv);
  const [group, command, target] = positional;

  if (group === 'publish') {
    exitWith(
      'enji has no publish — build with Creator 3.8.8 IDE (or a separate build MCP). For Creator 4.0 builds use kurenai.',
    );
  }

  if (group === 'init' && command) {
    const { EnjiProjectControl } = await import('../lib/index.js');
    const control = new EnjiProjectControl();
    const template = typeof options.template === 'string' ? options.template : 'base-ai';
    const project = await control.initialize(resolve(command), template);
    print({ ok: true, project, note: 'no publish; build in Creator 3.8.8 IDE' });
    return;
  }

  if (group === 'open') {
    const projectDir = resolveProject(options);
    const { EnjiProjectControl } = await import('../lib/index.js');
    const result = await new EnjiProjectControl().open(projectDir);
    print({ ok: true, ...result });
    if (!result.ccclass.ok) process.exitCode = 1;
    return;
  }

  if (group === 'context') {
    const projectDir = resolveProject(options);
    const { EnjiProjectControl } = await import('../lib/index.js');
    const control = new EnjiProjectControl();
    const project = await control.inspect(projectDir);
    if (!project) exitWith('not a Cocos Creator project');
    const host = readHostFile(projectDir);
    const status = host && (await hostStatus(host));
    const preview = {
      phase: status?.ready ? 'ready' : host ? 'starting' : 'not-started',
      url: host?.previewUrl ?? '(none)',
    };
    process.stdout.write(`${control.contextText(project, preview)}\n`);
    return;
  }

  if (group === 'logs') {
    const project = resolveProject(options);
    const host = readHostFile(project);
    if (!host) exitWith('host is not running; start it with `enji host start`');
    const query = new URLSearchParams({
      since: String(options.since ?? 0),
      ...(options.errors ? { errors: '1' } : {}),
      ...(options.all ? { all: '1' } : {}),
    });
    print(await (await fetch(`${host.serverUrl}/__enji/logs?${query}`)).json());
    return;
  }

  if (group === 'check') {
    const project = resolveProject(options);
    const { EnjiProjectControl } = await import('../lib/index.js');
    const result = await new EnjiProjectControl().check(project);
    print(result);
    if (!result.ok) process.exitCode = 1;
    return;
  }

  if (group === 'host') {
    const project = resolveProject(options);
    const { EnjiProjectControl } = await import('../lib/index.js');
    const inspected = await new EnjiProjectControl().inspect(project);
    if (inspected?.kind === 'kurenai-4.0') {
      exitWith(`Creator ${inspected.creatorVersion} project — use kurenai host, not enji`);
    }
    if (command === 'start') {
      // Normalize before first import so existing 3.8 metas are not left over-stamped.
      const { normalizeProjectMetas } = await import('../lib/index.js');
      await normalizeProjectMetas(project);
      const host = await ensureHost(project, options);
      print({ ok: true, project, pid: host.pid, previewUrl: host.previewUrl, meta: '3.8-capped' });
      return;
    }
    if (command === 'status') {
      const host = readHostFile(project);
      const status = host && (await hostStatus(host));
      print({
        ok: true,
        project,
        running: Boolean(host),
        ready: Boolean(status?.ready),
        previewUrl: host?.previewUrl,
        lastRefresh: status?.lastRefresh,
        lastError: status?.lastError,
      });
      return;
    }
    if (command === 'stop') {
      print({ project, ...(await stopHost(project)) });
      return;
    }
  }

  if (group === 'import' && command) {
    const paths = positional.slice(1).map((path) => resolve(path));
    const project = resolveProject(options, paths[0]);
    const { assetPathInProject, listImportTargets, normalizeProjectMetas } = await import('../lib/index.js');
    for (const path of paths) {
      if (!assetPathInProject(project, path)) exitWith(`path must be inside ${join(project, 'assets')}: ${path}`);
      if (!existsSync(path)) exitWith(`no such file or directory: ${path}`);
    }
    const host = await ensureHost(project, options);
    const assets = [];
    for (const path of paths) {
      const isDir = statSync(path).isDirectory();
      if (isDir) await fetch(`${host.serverUrl}/__enji/refresh?path=${encodeURIComponent(path)}`, { method: 'POST' });
      for (const file of listImportTargets(path)) {
        const query = `path=${encodeURIComponent(file)}${isDir ? '&refresh=0' : ''}`;
        const body = await (await fetch(`${host.serverUrl}/__enji/asset?${query}`)).json();
        assets.push(
          body.ok
            ? { ok: true, ...body.asset }
            : { ok: false, path: relative(project, file), error: body.error, ...(body.asset ? { asset: body.asset } : {}) },
        );
      }
    }
    // Cap metas again after asset-db refresh.
    const meta = await normalizeProjectMetas(project);
    const failed = assets.filter((asset) => !asset.ok).length;
    print({
      ok: failed === 0,
      imported: assets.length - failed,
      failed,
      assets,
      metaNormalize: { scanned: meta.scanned, changed: meta.changed },
    });
    if (failed) process.exitCode = 1;
    return;
  }

  if (group === 'asset' && command === 'info' && target) {
    const file = resolve(target);
    const project = resolveProject(options, file);
    const { readAssetInfo } = await import('../lib/index.js');
    try {
      print({ ok: true, asset: await readAssetInfo(project, file) });
    } catch (error) {
      exitWith(error instanceof Error ? error.message : String(error));
    }
    return;
  }

  printUsage(2);
}

main().catch((error) => exitWith(error instanceof Error ? error.message : String(error)));
