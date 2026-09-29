import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

/** `@ccclass` names that collide with engine / reserved identifiers in Creator 3.x. */
export const RESERVED_CCCLASS_NAMES = new Set([
  "game",
  "Game",
  "camera",
  "Camera",
  "cc",
  "CC",
]);

export interface CcclassHit {
  file: string;
  name: string;
  line: number;
  reserved: boolean;
}

const CCCLASS_RE = /@ccclass\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

async function walkTs(dir: string, into: string[] = []): Promise<string[]> {
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
      await walkTs(path, into);
      continue;
    }
    if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) into.push(path);
  }
  return into;
}

export async function scanReservedCcclass(projectRoot: string): Promise<{
  ok: boolean;
  hits: CcclassHit[];
  reserved: CcclassHit[];
}> {
  const files = await walkTs(join(projectRoot, "assets"));
  const hits: CcclassHit[] = [];
  for (const file of files) {
    const text = await readFile(file, "utf8");
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i]!;
      CCCLASS_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = CCCLASS_RE.exec(line))) {
        const name = match[1]!;
        hits.push({
          file,
          name,
          line: i + 1,
          reserved: RESERVED_CCCLASS_NAMES.has(name),
        });
      }
    }
  }
  const reserved = hits.filter((h) => h.reserved);
  return { ok: reserved.length === 0, hits, reserved };
}
