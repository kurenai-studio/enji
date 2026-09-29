import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { downgradeMetaContent, unknownImporters, type MetaObject } from "./downgrade.js";

export interface NormalizeReport {
  scanned: number;
  changed: number;
  files: Array<{ path: string; caps: Array<{ importer: string; from: string; to: string }> }>;
  /** Assets whose `.meta` names an importer outside the 3.8 set; never capped. */
  unknownImporters: Array<{ path: string; importers: string[] }>;
  /** `.meta` files whose asset no longer exists (project-relative meta paths). */
  orphans: string[];
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

function parseMeta(raw: string): MetaObject | undefined {
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as MetaObject)
      : undefined;
  } catch {
    return undefined;
  }
}

/** Cap every `.meta` under `assets/` to 3.8 gold (post-write / open-existing). */
export async function normalizeProjectMetas(projectRoot: string): Promise<NormalizeReport> {
  const assets = join(projectRoot, "assets");
  const metas = await walkMetas(assets);
  const report: NormalizeReport = {
    scanned: metas.length,
    changed: 0,
    files: [],
    unknownImporters: [],
    orphans: [],
  };
  const rel = (path: string) => relative(projectRoot, path).split(sep).join("/");
  for (const path of metas) {
    const assetPath = path.slice(0, -".meta".length);
    if (!existsSync(assetPath)) report.orphans.push(rel(path));
    const raw = await readFile(path, "utf8");
    const meta = parseMeta(raw);
    const unknown = meta ? unknownImporters(meta) : [];
    if (unknown.length) report.unknownImporters.push({ path: rel(assetPath), importers: unknown });
    const result = downgradeMetaContent(raw);
    if (!result.changed) continue;
    await writeFile(path, result.content, "utf8");
    report.changed += 1;
    report.files.push({ path, caps: result.caps });
  }
  return report;
}
