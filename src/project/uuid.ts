import { randomUUID } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Creator's 23-char form used for script class ids in scenes / prefabs (`__type__`). */
export function compressUuid(uuid: string): string {
  const hex = uuid.replace(/-/g, "");
  let out = hex.slice(0, 5);
  for (let i = 5; i < hex.length; i += 3) {
    const value = Number.parseInt(hex.slice(i, i + 3), 16);
    out += BASE64[value >> 6]! + BASE64[value & 63]!;
  }
  return out;
}

/** Files whose content may reference asset uuids. */
const TEXT_EXTENSIONS = /\.(meta|scene|prefab|json|mtl|pmtl|anim|animask|effect|ts|js|txt)$/;

async function walk(dir: string, into: string[] = []): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return into;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path, into);
    else if (TEXT_EXTENSIONS.test(entry.name)) into.push(path);
  }
  return into;
}

/**
 * Gives every asset under `assets/` a fresh uuid and rewrites references in
 * assets/ and settings/, so projects created from the same template do not
 * share uuids. Returns the old → new mapping.
 */
export async function regenerateAssetUuids(projectPath: string): Promise<Map<string, string>> {
  const files = [...(await walk(join(projectPath, "assets"))), ...(await walk(join(projectPath, "settings")))];
  const mapping = new Map<string, string>();
  for (const file of files) {
    if (!file.endsWith(".meta")) continue;
    const meta = JSON.parse(await readFile(file, "utf8")) as { uuid?: unknown };
    if (typeof meta.uuid === "string" && !mapping.has(meta.uuid)) mapping.set(meta.uuid, randomUUID());
  }
  if (!mapping.size) return mapping;

  const replacements: Array<[string, string]> = [];
  for (const [from, to] of mapping) {
    replacements.push([from, to], [compressUuid(from), compressUuid(to)]);
  }
  for (const file of files) {
    const text = await readFile(file, "utf8");
    let next = text;
    for (const [from, to] of replacements) next = next.split(from).join(to);
    if (next !== text) await writeFile(file, next, "utf8");
  }
  return mapping;
}
