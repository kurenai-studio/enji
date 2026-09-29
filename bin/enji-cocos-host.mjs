#!/usr/bin/env node
/**
 * Enji host wrapper: install 3.8 meta write hooks, then run kurenai-cocos-host.
 * After the host process would write metas, stamps above Creator 3.8.8 gold are capped.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const enjiRoot = resolve(here, '..');
const require = createRequire(import.meta.url);

function resolveKurenaiHost() {
  try {
    const pkg = dirname(require.resolve('@kurenai-studio/kurenai/package.json'));
    return join(pkg, 'bin', 'kurenai-cocos-host.mjs');
  } catch {
    const fallback = join(enjiRoot, '..', 'kurenai', 'bin', 'kurenai-cocos-host.mjs');
    if (existsSync(fallback)) return fallback;
    throw new Error('Cannot find kurenai-cocos-host.mjs; npm install @kurenai-studio/kurenai');
  }
}

const hook = join(enjiRoot, 'lib', 'meta', 'hook.js');
if (!existsSync(hook)) {
  console.error('[enji-host] missing lib/meta/hook.js — run `npm run build` in enji first');
  process.exit(1);
}

const host = resolveKurenaiHost();
const child = spawn(
  process.execPath,
  ['--import', pathToFileURL(hook).href, '--max-old-space-size=8192', host],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ENJI_META_DOWNGRADE: '1',
    },
    stdio: 'inherit',
  },
);

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    try {
      child.kill(sig);
    } catch {
      // ignore
    }
  });
}
