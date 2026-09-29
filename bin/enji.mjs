#!/usr/bin/env node
/**
 * Enji CLI — Creator 3.8 preview / edit (no publish).
 *
 *   enji init <dir> [--template base-ai]
 *   enji open [--project <dir>]
 *   enji host start|status|stop [--project <dir>] [--timeout <seconds>]
 *   enji asset info <file> [--project <dir>]
 *   enji logs [--since <seq>] [--errors [--all]] [--project <dir>]
 *   enji check [--project <dir>]
 *   enji context [--project <dir>]
 *
 * There is no `enji publish`. Build with Creator 3.8.8 IDE (or a separate MCP).
 */
import { spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, resolveProjectDir, wantsHelp } from '../lib/cli/parse.js';

const HOST_ENTRY = join(dirname(fileURLToPath(import.meta.url)), 'enji-cocos-host.mjs');
const STOP_TIMEOUT_MS = 8_000;
const POLL_MS = 500;

const USAGE = `usage:
  enji init <dir> [--template base-ai]
  enji open [--project <dir>]
  enji host start|status|stop [--project <dir>] [--timeout <seconds>]
  enji asset info <file> [--project <dir>]
  enji logs [--since <seq>] [--errors [--all]] [--project <dir>]
  enji check [--project <dir>]
  enji context [--project <dir>]

Enji is Creator 3.8 only. Preview uses the kurenai 4.0 host with 3.8 meta caps.
There is no publish — build in Creator 3.8.8 IDE.

host start waits for readiness (default 600s). Override with --timeout <seconds>
or env KURENAI_HOST_READY_TIMEOUT_MS / ENJI_HOST_READY_TIMEOUT_MS.`;

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
    const host = JSON.parse(readFileSync(join(project, 'temp', 'kurenai-host.json'), 'utf8'));
    return alive(host.pid) ? host : undefined;
  } catch {
    return undefined;
  }
}

async function hostStatus(host) {
  try {
    const response = await fetch(`${host.serverUrl}/__kurenai/status`);
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
  const { resolveHostReadyTimeoutMs, ensureCorePack, resolveCocosCliRoot } = await import(
    '@kurenai-studio/kurenai'
  );
  if (process.env.ENJI_HOST_READY_TIMEOUT_MS && !process.env.KURENAI_HOST_READY_TIMEOUT_MS) {
    process.env.KURENAI_HOST_READY_TIMEOUT_MS = process.env.ENJI_HOST_READY_TIMEOUT_MS;
  }
  const readyTimeoutMs = resolveHostReadyTimeoutMs(options);

  const running = readHostFile(project);
  if (running && (await hostStatus(running))?.ready) return running;

  const cocosCliRoot = resolveCocosCliRoot();
  await ensureCorePack({ cocosCliRoot });

  const logFile = join(project, 'temp', 'enji-host.log');
  if (!running) {
    mkdirSync(dirname(logFile), { recursive: true });
    const out = openSync(logFile, 'w');
    const child = spawn(process.execPath, ['--max-old-space-size=8192', HOST_ENTRY], {
      cwd: project,
      env: {
        ...process.env,
        PROJECT: project,
        PORT: process.env.PORT || '7460',
        KURENAI_COCOS_CLI_ROOT: cocosCliRoot,
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
    if (!host && tail.some((line) => line.includes('[kurenai-host]') && /failed|not found|required/.test(line))) {
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
    print(await (await fetch(`${host.serverUrl}/__kurenai/logs?${query}`)).json());
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

  if (group === 'asset' && command === 'info' && target) {
    const file = resolve(target);
    const project = resolveProject(options, file);
    const host = await ensureHost(project, options);
    const response = await fetch(`${host.serverUrl}/__kurenai/asset?path=${encodeURIComponent(file)}`);
    const body = await response.json();
    // Cap metas again after asset-db refresh.
    const { normalizeProjectMetas } = await import('../lib/index.js');
    const meta = await normalizeProjectMetas(project);
    print({ ...body, metaNormalize: { scanned: meta.scanned, changed: meta.changed } });
    if (!body.ok) process.exitCode = 1;
    return;
  }

  printUsage(2);
}

main().catch((error) => exitWith(error instanceof Error ? error.message : String(error)));
