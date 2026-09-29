import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { downgradeMetaContent } from "./downgrade.js";

export interface NormalizeReport {
  scanned: number;
  changed: number;
  files: Array<{ path: string; caps: Array<{ importer: string; from: string; to: string }> }>;
}

async function walkMetas(dir: string, into: string[] = []): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return into;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkMetas(path, into);
      continue;
    }
    if (entry.name.endsWith(".meta")) into.push(path);
  }
  return into;
}

/** Cap every `.meta` under `assets/` to 3.8 gold (post-write / open-existing). */
export async function normalizeProjectMetas(projectRoot: string): Promise<NormalizeReport> {
  const assets = join(projectRoot, "assets");
  const metas = await walkMetas(assets);
  const report: NormalizeReport = { scanned: metas.length, changed: 0, files: [] };
  for (const path of metas) {
    const raw = await readFile(path, "utf8");
    const result = downgradeMetaContent(raw);
    if (!result.changed) continue;
    await writeFile(path, result.content, "utf8");
    report.changed += 1;
    report.files.push({ path, caps: result.caps });
  }
  return report;
}
