import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

export type ProjectKind = "enji-3.8" | "kurenai-4.0" | "other-3.x" | "unknown";

export interface DetectedProject {
  name: string;
  projectPath: string;
  creatorVersion: string;
  kind: ProjectKind;
  dimension: "2d" | "3d" | "unknown";
}

function parseCreatorVersion(pkg: {
  creator?: { version?: unknown };
  version?: unknown;
}): string | undefined {
  if (typeof pkg.creator?.version === "string") return pkg.creator.version;
  if (typeof pkg.version === "string" && /^\d+\.\d+/.test(pkg.version)) return pkg.version;
  return undefined;
}

export function classifyCreatorVersion(version: string): ProjectKind {
  if (version.startsWith("4.")) return "kurenai-4.0";
  if (version.startsWith("3.8")) return "enji-3.8";
  if (version.startsWith("3.")) return "other-3.x";
  return "unknown";
}

/** 3d when the engine's 3d module is enabled (the modules decide what runs), else package.json type. */
async function detectDimension(projectPath: string): Promise<"2d" | "3d" | "unknown"> {
  try {
    const engine = JSON.parse(
      await readFile(join(projectPath, "settings/v2/packages/engine.json"), "utf8"),
    ) as { modules?: { configs?: Record<string, { includeModules?: string[] }> } };
    const modules =
      engine.modules?.configs?.defaultConfig?.includeModules ??
      Object.values(engine.modules?.configs ?? {})[0]?.includeModules ??
      [];
    if (modules.includes("3d")) return "3d";
    if (modules.includes("2d")) return "2d";
  } catch {
    // fall through
  }
  try {
    const pkg = JSON.parse(await readFile(join(projectPath, "package.json"), "utf8")) as {
      type?: unknown;
    };
    if (pkg.type === "2d" || pkg.type === "3d") return pkg.type;
  } catch {
    // ignore
  }
  return "unknown";
}

export async function detectProject(projectPath: string): Promise<DetectedProject | undefined> {
  const absolutePath = resolve(projectPath);
  if (!existsSync(join(absolutePath, "assets")) || !existsSync(join(absolutePath, "package.json"))) {
    return undefined;
  }
  try {
    const pkg = JSON.parse(await readFile(join(absolutePath, "package.json"), "utf8")) as {
      name?: unknown;
      creator?: { version?: unknown };
      version?: unknown;
    };
    const creatorVersion = parseCreatorVersion(pkg);
    if (!creatorVersion) return undefined;
    return {
      name:
        typeof pkg.name === "string" && pkg.name.trim()
          ? pkg.name
          : basename(absolutePath),
      projectPath: absolutePath,
      creatorVersion,
      kind: classifyCreatorVersion(creatorVersion),
      dimension: await detectDimension(absolutePath),
    };
  } catch {
    return undefined;
  }
}

/** Enji accepts 3.8.x (and other 3.x for open/preview with warnings). */
export function assertEnjiProject(project: DetectedProject): void {
  if (project.kind === "kurenai-4.0") {
    throw new Error(
      `This is a Creator ${project.creatorVersion} project — use kurenai, not enji.`,
    );
  }
  if (project.kind === "unknown") {
    throw new Error(
      `Unrecognized creator.version "${project.creatorVersion}"; enji expects 3.8.x.`,
    );
  }
}
