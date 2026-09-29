#!/usr/bin/env node
/**
 * postinstall: install the runtime dependencies of vendor/cocos-core.
 * Only the preview-relevant subset is listed in its package.json (see
 * scripts/vendor-cocos-core.mjs), so this skips build / MCP / telemetry packages.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const coreDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'vendor', 'cocos-core');

function depsReady() {
  return (
    existsSync(join(coreDir, 'node_modules/@babel/core/package.json')) &&
    existsSync(join(coreDir, 'node_modules/@cocos/lib-programming/package.json')) &&
    existsSync(join(coreDir, 'node_modules/sharp/package.json'))
  );
}

if (!existsSync(join(coreDir, 'dist/core/launcher.js'))) {
  console.warn('[enji] vendor/cocos-core missing — skipped. Maintainer: node scripts/vendor-cocos-core.mjs');
  process.exit(0);
}
if (depsReady()) process.exit(0);

console.log(`[enji] npm install --omit=dev in ${coreDir}`);
const result = spawnSync('npm', ['install', '--omit=dev', '--no-audit', '--no-fund', '--ignore-scripts'], {
  cwd: coreDir,
  stdio: 'inherit',
  env: { ...process.env, npm_config_progress: 'false' },
  // npm is npm.cmd on Windows, which Node only runs through a shell.
  shell: process.platform === 'win32',
});
if (result.status !== 0 || !depsReady()) {
  console.error('[enji] cocos core dependency install failed; retry with `npm run postinstall`');
  process.exit(1);
}
