#!/usr/bin/env node
/**
 * Maintainer: refresh vendor/cocos-core from a full cocos-cli tree, keeping only
 * what Enji's preview host uses.
 *
 *   node scripts/vendor-cocos-core.mjs [--from <cocos-core dir>] [--no-lock]
 *
 * Default source is a sibling kurenai checkout (../kurenai/vendor/cocos-core),
 * which already carries the portable (no native addon) patches.
 *
 * Rules were derived by tracing every file the host touched while importing
 * scripts, images, glTF/glb (incl. morph), materials, effects, prefabs, audio and
 * fonts, and while serving the browser preview. See scripts/trace-hook.cjs.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const enjiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const argValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const from = resolve(argValue('--from') ?? join(enjiRoot, '..', 'kurenai', 'vendor', 'cocos-core'));
const out = join(enjiRoot, 'vendor', 'cocos-core');

/** Paths (relative to cocos-core, `/`-separated) that are never shipped. */
const DROP = [
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)\.DS_Store$/,
  /\.map$/,
  /\.asm\.js(\.js)?$/, // wasm is always available in preview browsers
  // cocos-cli command line, MCP server and public API surface — Enji drives the host directly.
  /^dist\/(api|commands|display|lib|mcp|tests)\//,
  /^dist\/(cli|index)\.(js|d\.ts)$/,
  /^dist\/core\/scene\/scene-process\/(?!service\/operation\/types\.js$)/,
  /^dist\/core\/filesystem\//,
  /^dist\/core\/base\/sentry\.js$/,
  /\.d\.ts$/,
  // Build, packaging and texture-compression toolchain (publish happens in Creator 3.8 IDE).
  /^workflow\//,
  /^static\/tools\/(?!cmft\/)/,
  /^packages\/(cocos-cli-types|engine-compiler)\//,
  /^\.kurenai-pack\.json$/,
];

/** Inside packages/engine only these are kept: prebuilt preview bundles + editor assets. */
const ENGINE_KEEP = [
  /^packages\/engine\/(package\.json|cc\.config\.json|LICENSE)$/,
  /^packages\/engine\/licenses\//,
  /^packages\/engine\/bin\/\.cache\/dev-cli\/(web|editor)\/(bundled|external)\//,
  /^packages\/engine\/bin\/\.cache\/dev-cli\/(web|editor)\/(import-map|partial-import-map)\.json$/,
  /^packages\/engine\/bin\/\.cache\/dev-cli\/(web|editor)\/loader\.js$/,
  /^packages\/engine\/bin\/\.declarations\/cc\.d\.ts$/,
  /^packages\/engine\/bin\/\.editor\//,
  /^packages\/engine\/cocos\/core\/platform\/macro\.ts$/,
  /^packages\/engine\/editor\/(assets|library|i18n|engine-features|exports)\//,
  /^packages\/engine\/editor\/(i18n-utils\.js|auto_material_settings\.json)$/,
  /^packages\/engine\/exports\//,
  /^packages\/engine\/native\/external\/emscripten\//,
];

/** Kept even though a DROP rule matches. */
const FORCE_KEEP = [/^packages\/engine\/bin\/\.declarations\/cc\.d\.ts$/];

/** npm dependencies of cocos-cli that preview never loads. */
const DROP_DEPENDENCIES = [
  '@cocos/build-polyfills',
  '@cocos/creator-programming-rollup-plugin-mod-lo',
  '@cocos/fbx2gltf', // legacy FBX2glTF importer (userData.legacyFbxImporter)
  '@cocos/quick-compiler',
  '@microsoft/api-extractor',
  '@modelcontextprotocol/sdk',
  '@sentry/node',
  'cli-progress',
  'commander',
  'figlet',
  'globby',
  'gradient-string',
  'inquirer',
  'listr2',
  'max-rects-packing',
  'ora',
  'pino-pretty',
  'reflect-metadata',
  'replace-in-file',
  'rotating-file-stream',
  'xml2js',
  'xxtea-node',
  'zod',
  'zod-to-json-schema',
  'zod-to-ts',
];

/**
 * Previously pulled in transitively by a dropped dependency, but read at runtime:
 * scripting-routes serves node_modules/@cocos/systemjs/dist as /scripting/systemjs.
 */
const ADD_DEPENDENCIES = {
  '@cocos/systemjs': '1.0.4',
};

function keep(rel) {
  if (FORCE_KEEP.some((re) => re.test(rel))) return true;
  if (DROP.some((re) => re.test(rel))) return false;
  if (rel.startsWith('packages/engine/')) return ENGINE_KEEP.some((re) => re.test(rel));
  return true;
}

const INLINE_MAP = /\n\/\/# sourceMappingURL=data:application\/json;base64,[A-Za-z0-9+/=]+\s*$/;

function copyFile(src, dest, rel) {
  mkdirSync(dirname(dest), { recursive: true });
  if (rel.endsWith('.js') && (rel.startsWith('dist/') || rel.startsWith('packages/asset-db/dist/'))) {
    const text = readFileSync(src, 'utf8');
    const stripped = text.replace(INLINE_MAP, '\n');
    writeFileSync(dest, stripped);
    return stripped.length;
  }
  copyFileSync(src, dest);
  return statSync(dest).size;
}

function walk(dir, visit) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = relative(from, full).split('\\').join('/');
    if (entry.isDirectory()) {
      if (/(^|\/)node_modules$/.test(rel)) continue;
      walk(full, visit);
    } else if (entry.isFile()) {
      visit(full, rel);
    }
  }
}

function rewritePackageJson() {
  const path = join(out, 'package.json');
  const pkg = JSON.parse(readFileSync(path, 'utf8'));
  for (const name of DROP_DEPENDENCIES) delete pkg.dependencies?.[name];
  pkg.dependencies = Object.fromEntries(
    Object.entries({ ...pkg.dependencies, ...ADD_DEPENDENCIES }).sort(([a], [b]) => a.localeCompare(b)),
  );
  delete pkg.devDependencies;
  delete pkg.scripts;
  delete pkg.bin;
  delete pkg.main;
  pkg.files = undefined;
  pkg.private = true;
  writeFileSync(path, `${JSON.stringify(pkg, null, 4)}\n`);
  return Object.keys(pkg.dependencies ?? {}).length;
}

/** The host rewrites these timestamps at runtime; ship the committed version from the source repo. */
function restoreRuntimeMutatedFiles() {
  const rel = 'packages/engine/editor/library/.internal-info.json';
  const result = spawnSync('git', ['show', `HEAD:./${rel}`], { cwd: from, encoding: 'utf8' });
  if (result.status === 0 && result.stdout) writeFileSync(join(out, rel), result.stdout);
}

function pruneLockfile() {
  const result = spawnSync(
    'npm',
    ['install', '--package-lock-only', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'],
    { cwd: out, stdio: 'inherit', shell: process.platform === 'win32' },
  );
  if (result.status !== 0) throw new Error('npm install --package-lock-only failed');
}

function main() {
  if (!existsSync(join(from, 'dist', 'core', 'launcher.js'))) {
    throw new Error(`not a cocos-cli tree: ${from}`);
  }
  rmSync(out, { recursive: true, force: true });
  let files = 0;
  let bytes = 0;
  let dropped = 0;
  walk(from, (full, rel) => {
    if (!keep(rel)) {
      dropped += 1;
      return;
    }
    bytes += copyFile(full, join(out, rel), rel);
    files += 1;
  });
  mkdirSync(join(out, 'packages', 'platforms'), { recursive: true });
  writeFileSync(join(out, 'packages', 'platforms', '.gitkeep'), '');
  restoreRuntimeMutatedFiles();
  const dependencies = rewritePackageJson();
  if (!args.includes('--no-lock')) pruneLockfile();

  const source = JSON.parse(readFileSync(join(from, 'package.json'), 'utf8'));
  const engine = JSON.parse(readFileSync(join(from, 'packages', 'engine', 'package.json'), 'utf8'));
  const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: from, encoding: 'utf8' });
  const manifest = {
    cocosCli: source.version,
    engine: engine.version,
    sourceCommit: commit.status === 0 ? commit.stdout.trim() : null,
    addedDependencies: ADD_DEPENDENCIES,
    vendoredAt: new Date().toISOString(),
    files,
    megabytes: Math.round(bytes / 1e5) / 10,
    droppedFiles: dropped,
    dependencies,
    droppedDependencies: DROP_DEPENDENCIES,
  };
  writeFileSync(join(out, 'ENJI_VENDOR.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, out, ...manifest }, null, 2));
}

main();
