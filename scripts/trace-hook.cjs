/**
 * Maintainer tool: record every file under TRACE_ROOT that the host touches
 * (module resolution + fs reads), across child processes via NODE_OPTIONS.
 *
 *   TRACE_ROOT=<cocos-core> TRACE_OUT=<dir> node --require scripts/trace-hook.cjs <host>
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const root = process.env.TRACE_ROOT && path.resolve(process.env.TRACE_ROOT);
const outDir = process.env.TRACE_OUT;
if (root && outDir) {
  const seen = new Set();
  const origWrite = fs.writeFileSync;
  const outFile = path.join(outDir, `trace-${process.pid}.txt`);
  fs.mkdirSync(outDir, { recursive: true });

  const record = (p) => {
    if (typeof p !== 'string' && !(p instanceof URL) && !Buffer.isBuffer(p)) return;
    let s = p instanceof URL ? p.pathname : String(p);
    if (!path.isAbsolute(s)) s = path.resolve(s);
    if (!s.startsWith(root)) return;
    const rel = s.slice(root.length + 1);
    if (!rel || seen.has(rel)) return;
    seen.add(rel);
    dirty = true;
  };
  let dirty = false;
  const flush = () => {
    if (!dirty) return;
    dirty = false;
    try {
      origWrite(outFile, [...seen].join('\n'));
    } catch {
      // ignore
    }
  };
  setInterval(flush, 2000).unref();
  process.on('exit', flush);

  const origResolve = Module._resolveFilename;
  Module._resolveFilename = function (...args) {
    const r = origResolve.apply(this, args);
    record(r);
    return r;
  };

  const wrap = (obj, name) => {
    const orig = obj[name];
    if (typeof orig !== 'function') return;
    const wrapped = function (p, ...rest) {
      record(p);
      return orig.call(this, p, ...rest);
    };
    // Keep attached helpers such as fs.realpathSync.native.
    Object.assign(wrapped, orig);
    obj[name] = wrapped;
  };
  for (const name of [
    'readFileSync', 'readFile', 'statSync', 'stat', 'lstatSync', 'lstat',
    'existsSync', 'exists', 'readdirSync', 'readdir', 'createReadStream',
    'openSync', 'open', 'accessSync', 'access', 'realpathSync', 'copyFileSync', 'copyFile',
  ]) wrap(fs, name);
  for (const name of ['readFile', 'stat', 'lstat', 'readdir', 'open', 'access', 'realpath', 'copyFile', 'cp']) {
    wrap(fs.promises, name);
  }
  const hookPath = __filename;
  const opt = process.env.NODE_OPTIONS || '';
  if (!opt.includes(hookPath)) process.env.NODE_OPTIONS = `${opt} --require ${hookPath}`.trim();
}
