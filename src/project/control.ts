import { existsSync, readFileSync } from "node:fs";
import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CREATOR_VERSION } from "../meta/gold.js";
import { normalizeProjectMetas } from "../meta/normalize.js";
import { scanReservedCcclass } from "./ccclass-check.js";
import { regenerateAssetUuids } from "./uuid.js";
import {
  assertEnjiProject,
  detectProject,
  type DetectedProject,
} from "./detect.js";

const require = createRequire(import.meta.url);

const IGNORED_WORKSPACE_ENTRIES = new Set([
  ".git",
  ".DS_Store",
  ".cursor",
  ".vscode",
  ".idea",
]);

export type EnjiTemplateId = "base-ai";

/** Resolve package root whether running from `src/` or bundled `lib/`. */
function packageRoot(): string {
  try {
    return dirname(require.resolve("@kurenai-studio/enji/package.json"));
  } catch {
    // local/dev: walk up from this module
  }
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { name?: string };
        if (pkg.name === "@kurenai-studio/enji") return dir;
      } catch {
        // continue
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Cannot find @kurenai-studio/enji package root");
}

function templateDir(id: EnjiTemplateId): string {
  return join(packageRoot(), "templates", id);
}

function sharedDir(): string {
  return join(packageRoot(), "templates", "shared");
}

async function copyDirectoryContents(from: string, to: string): Promise<void> {
  await mkdir(to, { recursive: true });
  const entries = await readdir(from, { withFileTypes: true });
  for (const entry of entries) {
    const src = join(from, entry.name);
    const dest = join(to, entry.name);
    if (entry.isDirectory()) {
      await copyDirectoryContents(src, dest);
    } else {
      await mkdir(dirname(dest), { recursive: true });
      await cp(src, dest);
    }
  }
}

async function assignProjectIdentity(projectPath: string): Promise<void> {
  const pkgPath = join(projectPath, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf8")) as Record<string, unknown>;
  const name = basename(projectPath);
  const prevCreator =
    typeof pkg.creator === "object" && pkg.creator !== null
      ? (pkg.creator as Record<string, unknown>)
      : {};
  pkg.name = name;
  pkg.uuid = randomUUID();
  pkg.version = CREATOR_VERSION;
  pkg.creator = { ...prevCreator, version: CREATOR_VERSION };
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 4)}\n`, "utf8");
}

export class EnjiProjectControl {
  async inspect(projectPath: string): Promise<DetectedProject | undefined> {
    return detectProject(projectPath);
  }

  async initialize(
    projectPath: string,
    template: EnjiTemplateId = "base-ai",
  ): Promise<DetectedProject> {
    const target = resolve(projectPath);
    await mkdir(target, { recursive: true });
    if (await this.inspect(target)) {
      throw new Error("This directory is already a Cocos Creator project");
    }
    const projectEntries = (await readdir(target)).filter(
      (entry) => !IGNORED_WORKSPACE_ENTRIES.has(entry),
    );
    if (projectEntries.length) {
      throw new Error(
        `Enji init requires an empty directory; found: ${projectEntries.join(", ")}`,
      );
    }
    if (template !== "base-ai") {
      throw new Error(`Unknown template "${template}"; use base-ai`);
    }
    await copyDirectoryContents(templateDir(template), target);
    await copyDirectoryContents(sharedDir(), target);
    await assignProjectIdentity(target);
    await regenerateAssetUuids(target);
    const project = await this.inspect(target);
    if (!project) {
      throw new Error("The initialized template is not a Cocos Creator project");
    }
    return project;
  }

  /** Open an existing 3.x project: detect, normalize metas, reserved-name scan. */
  async open(projectPath: string): Promise<{
    project: DetectedProject;
    metaNormalize: Awaited<ReturnType<typeof normalizeProjectMetas>>;
    ccclass: Awaited<ReturnType<typeof scanReservedCcclass>>;
  }> {
    const project = await this.inspect(projectPath);
    if (!project) throw new Error("The directory is not a Cocos Creator project");
    assertEnjiProject(project);
    const metaNormalize = await normalizeProjectMetas(project.projectPath);
    const ccclass = await scanReservedCcclass(project.projectPath);
    return { project, metaNormalize, ccclass };
  }

  async check(projectPath: string): Promise<{
    ok: boolean;
    project?: DetectedProject;
    metaNormalize: Awaited<ReturnType<typeof normalizeProjectMetas>>;
    ccclass: Awaited<ReturnType<typeof scanReservedCcclass>>;
    errors: string[];
    warnings: string[];
  }> {
    const project = await this.inspect(projectPath);
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!project) {
      return {
        ok: false,
        metaNormalize: { scanned: 0, changed: 0, files: [], unknownImporters: [], orphans: [] },
        ccclass: { ok: false, hits: [], reserved: [] },
        errors: ["not a Cocos Creator project"],
        warnings: [],
      };
    }
    if (project.kind === "kurenai-4.0") {
      errors.push(`Creator ${project.creatorVersion}: use kurenai, not enji`);
    } else if (project.kind === "unknown") {
      errors.push(`unrecognized creator.version "${project.creatorVersion}"`);
    } else if (project.kind === "other-3.x") {
      warnings.push(
        `creator.version ${project.creatorVersion} is 3.x but not 3.8; preview may work, IDE target is 3.8.8`,
      );
    }
    const metaNormalize = await normalizeProjectMetas(project.projectPath);
    for (const { path, importers } of metaNormalize.unknownImporters) {
      warnings.push(
        `${path}.meta: importer ${importers.map((name) => `"${name}"`).join(", ")} is not a Creator 3.8 importer, so enji cannot cap its ver; correct the importer name in that .meta and keep its uuid (enji import keeps whatever importer the .meta names)`,
      );
    }
    for (const path of metaNormalize.orphans) {
      warnings.push(`${path}: orphan .meta (asset file is gone); delete it`);
    }
    const ccclass = await scanReservedCcclass(project.projectPath);
    if (!ccclass.ok) {
      for (const hit of ccclass.reserved) {
        errors.push(
          `reserved @ccclass('${hit.name}') in ${hit.file}:${hit.line}`,
        );
      }
    }
    return {
      ok: errors.length === 0,
      project,
      metaNormalize,
      ccclass,
      errors,
      warnings,
    };
  }

  contextText(
    project: DetectedProject,
    preview: { phase: string; url: string },
  ): string {
    return [
      `# Enji project context`,
      ``,
      `- name: ${project.name}`,
      `- path: ${project.projectPath}`,
      `- creator: ${project.creatorVersion} (${project.kind})`,
      `- dimension: ${project.dimension}`,
      `- preview: ${preview.phase} ${preview.url}`,
      ``,
      `Rules: follow AGENTS.md. Preview via enji host (bundled cocos runtime).`,
      `Build with Creator ${CREATOR_VERSION} IDE — enji has no publish.`,
      `.meta files must stay on Creator 3.8 importer stamps (enji caps them).`,
    ].join("\n");
  }
}
