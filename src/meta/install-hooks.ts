import { createRequire } from "node:module";
import { join } from "node:path";
import { downgradeMetaContent } from "./downgrade.js";

function maybeDowngrade(file: unknown, data: unknown): unknown {
  if (typeof file !== "string" && !Buffer.isBuffer(file)) return data;
  const path = String(file);
  if (!path.endsWith(".meta")) return data;
  if (typeof data === "string") {
    return downgradeMetaContent(data).content;
  }
  if (Buffer.isBuffer(data)) {
    return Buffer.from(downgradeMetaContent(data.toString("utf8")).content, "utf8");
  }
  return data;
}

let installed = false;

type FsModule = {
  writeFileSync: (
    file: string | URL | Buffer,
    data: string | Buffer,
    options?: unknown,
  ) => void;
  writeFile: (file: string | URL | Buffer, data: string | Buffer, ...rest: unknown[]) => void;
  promises: {
    writeFile: (
      file: string | URL | Buffer,
      data: string | Buffer,
      options?: unknown,
    ) => Promise<void>;
  };
};

/**
 * Monkey-patch Node `fs` (and `fs-extra` if resolvable) so `.meta` writes
 * are capped to Creator 3.8.8 gold versions before they hit disk.
 */
export function installMetaHooks(): void {
  if (installed) return;
  installed = true;

  const req = createRequire(import.meta.url);
  const fs = req("fs") as FsModule;

  const origSync = fs.writeFileSync.bind(fs);
  fs.writeFileSync = ((file, data, options) => {
    return origSync(file, maybeDowngrade(file, data) as never, options);
  }) as typeof fs.writeFileSync;

  const origWrite = fs.promises.writeFile.bind(fs.promises);
  fs.promises.writeFile = (async (file, data, options) => {
    return origWrite(file, maybeDowngrade(file, data) as never, options);
  }) as typeof fs.promises.writeFile;

  const origWriteCb = fs.writeFile.bind(fs);
  fs.writeFile = ((file, data, ...rest) => {
    return origWriteCb(file, maybeDowngrade(file, data) as never, ...rest);
  }) as typeof fs.writeFile;

  try {
    const coreRoot = process.env.ENJI_COCOS_CORE_ROOT;
    const coreReq = coreRoot ? createRequire(join(coreRoot, "package.json")) : req;
    const fsExtra = coreReq("fs-extra") as {
      writeFileSync?: typeof fs.writeFileSync;
      outputFileSync?: (file: string, data: string | Buffer, options?: unknown) => void;
      writeFile?: (file: string, data: string | Buffer, options?: unknown) => Promise<void>;
      outputFile?: (file: string, data: string | Buffer, options?: unknown) => Promise<void>;
    };
    if (typeof fsExtra.writeFileSync === "function") {
      const extraSync = fsExtra.writeFileSync.bind(fsExtra);
      fsExtra.writeFileSync = ((file, data, options) => {
        return extraSync(file, maybeDowngrade(file, data) as never, options);
      }) as typeof fs.writeFileSync;
    }
    if (typeof fsExtra.outputFileSync === "function") {
      const extraOut = fsExtra.outputFileSync.bind(fsExtra);
      fsExtra.outputFileSync = (file, data, options) => {
        return extraOut(file, maybeDowngrade(file, data) as never, options);
      };
    }
    if (typeof fsExtra.writeFile === "function") {
      const extraAsync = fsExtra.writeFile.bind(fsExtra);
      fsExtra.writeFile = async (file, data, options) => {
        return extraAsync(file, maybeDowngrade(file, data) as never, options);
      };
    }
    if (typeof fsExtra.outputFile === "function") {
      const extraOutAsync = fsExtra.outputFile.bind(fsExtra);
      fsExtra.outputFile = async (file, data, options) => {
        return extraOutAsync(file, maybeDowngrade(file, data) as never, options);
      };
    }
  } catch {
    // fs-extra is optional: graceful-fs already captures the patched fs functions.
  }

  process.stderr.write("[enji-meta] write hooks installed (3.8 meta cap)\n");
}
