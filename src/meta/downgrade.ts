import { META_ALLOWED_KEYS, META_GOLD_VER, META_KNOWN_IMPORTERS } from "./gold.js";

export type MetaObject = {
  ver?: unknown;
  importer?: unknown;
  subMetas?: unknown;
  userData?: unknown;
  [key: string]: unknown;
};

export interface DowngradeResult {
  changed: boolean;
  content: string;
  caps: Array<{ importer: string; from: string; to: string }>;
}

/** Compare dotted semver-like strings (e.g. 1.0.18 vs 1.0.16). */
export function compareVer(a: string, b: string): number {
  const pa = a.split(".").map((p) => Number.parseInt(p, 10) || 0);
  const pb = b.split(".").map((p) => Number.parseInt(p, 10) || 0);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i += 1) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) return da < db ? -1 : 1;
  }
  return 0;
}

function capNode(
  node: MetaObject,
  caps: DowngradeResult["caps"],
  gold: Readonly<Record<string, string>>,
): boolean {
  let changed = false;
  const importer = typeof node.importer === "string" ? node.importer : undefined;
  const ver = typeof node.ver === "string" ? node.ver : undefined;
  if (importer && ver) {
    const max = gold[importer];
    if (max && compareVer(ver, max) > 0) {
      caps.push({ importer, from: ver, to: max });
      node.ver = max;
      changed = true;
    }
  }

  for (const key of Object.keys(node)) {
    if (!META_ALLOWED_KEYS.has(key)) {
      delete node[key];
      changed = true;
    }
  }

  const sub = node.subMetas;
  if (sub && typeof sub === "object" && !Array.isArray(sub)) {
    for (const child of Object.values(sub as Record<string, unknown>)) {
      if (child && typeof child === "object" && !Array.isArray(child)) {
        if (capNode(child as MetaObject, caps, gold)) changed = true;
      }
    }
  }
  return changed;
}

/**
 * Cap `.meta` JSON to Creator 3.8.8 gold versions.
 * Does not raise older valid vers — only lowers stamps above gold.
 */
export function downgradeMetaObject(
  meta: MetaObject,
  gold: Readonly<Record<string, string>> = META_GOLD_VER,
): { changed: boolean; caps: DowngradeResult["caps"]; meta: MetaObject } {
  const caps: DowngradeResult["caps"] = [];
  const clone = structuredClone(meta) as MetaObject;
  const changed = capNode(clone, caps, gold);
  return { changed, caps, meta: clone };
}

export function downgradeMetaContent(
  raw: string,
  gold: Readonly<Record<string, string>> = META_GOLD_VER,
): DowngradeResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { changed: false, content: raw, caps: [] };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { changed: false, content: raw, caps: [] };
  }
  const { changed, caps, meta } = downgradeMetaObject(parsed as MetaObject, gold);
  if (!changed) return { changed: false, content: raw, caps: [] };
  // Creator writes meta with 2-space indent and trailing newline.
  return {
    changed: true,
    content: `${JSON.stringify(meta, null, 2)}\n`,
    caps,
  };
}

/** Importer names in the meta tree (root + subMetas) that a 3.8 project does not know. */
export function unknownImporters(
  meta: MetaObject,
  known: ReadonlySet<string> = META_KNOWN_IMPORTERS,
): string[] {
  const found = new Set<string>();
  const walk = (node: MetaObject) => {
    if (typeof node.importer === "string" && !known.has(node.importer)) found.add(node.importer);
    const sub = node.subMetas;
    if (sub && typeof sub === "object" && !Array.isArray(sub)) {
      for (const child of Object.values(sub as Record<string, unknown>)) {
        if (child && typeof child === "object" && !Array.isArray(child)) walk(child as MetaObject);
      }
    }
  };
  walk(meta);
  return [...found];
}

/** True when any importer `ver` in the meta tree exceeds gold. */
export function metaExceedsGold(
  meta: MetaObject,
  gold: Readonly<Record<string, string>> = META_GOLD_VER,
): boolean {
  const walk = (node: MetaObject): boolean => {
    const importer = typeof node.importer === "string" ? node.importer : undefined;
    const ver = typeof node.ver === "string" ? node.ver : undefined;
    if (importer && ver) {
      const max = gold[importer];
      if (max && compareVer(ver, max) > 0) return true;
    }
    const sub = node.subMetas;
    if (sub && typeof sub === "object" && !Array.isArray(sub)) {
      for (const child of Object.values(sub as Record<string, unknown>)) {
        if (
          child &&
          typeof child === "object" &&
          !Array.isArray(child) &&
          walk(child as MetaObject)
        ) {
          return true;
        }
      }
    }
    return false;
  };
  return walk(meta);
}
