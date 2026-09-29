//#region src/meta/gold.d.ts
/**
 * Creator 3.8.8 meta gold samples.
 *
 * Built from max `ver` per importer observed under a clean Creator 3.8.8 install
 * (engine editor assets + bundled templates taxi / hello-3d-world).
 *
 * Notes:
 * - `typescript` / `javascript` already use `4.0.x` importer stamps in 3.8.8;
 *   that is not a Creator 4.0 project stamp.
 * - Policy: never write a `ver` higher than the gold max; never raise an
 *   existing lower `ver` up to gold (preserve older-but-valid 3.8 metas).
 */
declare const CREATOR_VERSION = "3.8.8";
/** Max importer `ver` accepted / written for Creator 3.8.8. */
declare const META_GOLD_VER: Readonly<Record<string, string>>;
/** Canonical empty userData shapes for newly generated template metas. */
declare const META_GOLD_SHAPES: Readonly<Record<string, {
  ver: string;
  importer: string;
  files: string[];
  userData: Record<string, unknown>;
}>>;
//#endregion
//#region src/meta/downgrade.d.ts
type MetaObject = {
  ver?: unknown;
  importer?: unknown;
  subMetas?: unknown;
  userData?: unknown;
  [key: string]: unknown;
};
interface DowngradeResult {
  changed: boolean;
  content: string;
  caps: Array<{
    importer: string;
    from: string;
    to: string;
  }>;
}
/** Compare dotted semver-like strings (e.g. 1.0.18 vs 1.0.16). */
declare function compareVer(a: string, b: string): number;
/**
 * Cap `.meta` JSON to Creator 3.8.8 gold versions.
 * Does not raise older valid vers — only lowers stamps above gold.
 */
declare function downgradeMetaObject(meta: MetaObject, gold?: Readonly<Record<string, string>>): {
  changed: boolean;
  caps: DowngradeResult["caps"];
  meta: MetaObject;
};
declare function downgradeMetaContent(raw: string, gold?: Readonly<Record<string, string>>): DowngradeResult;
/** True when any importer `ver` in the meta tree exceeds gold. */
declare function metaExceedsGold(meta: MetaObject, gold?: Readonly<Record<string, string>>): boolean;
//#endregion
//#region src/meta/install-hooks.d.ts
/**
 * Monkey-patch Node `fs` (and `fs-extra` if resolvable) so `.meta` writes
 * are capped to Creator 3.8.8 gold versions before they hit disk.
 */
declare function installMetaHooks(): void;
//#endregion
//#region src/meta/normalize.d.ts
interface NormalizeReport {
  scanned: number;
  changed: number;
  files: Array<{
    path: string;
    caps: Array<{
      importer: string;
      from: string;
      to: string;
    }>;
  }>;
  /** Assets whose `.meta` names an importer outside the 3.8 set; never capped. */
  unknownImporters: Array<{
    path: string;
    importers: string[];
  }>;
  /** `.meta` files whose asset no longer exists (project-relative meta paths). */
  orphans: string[];
}
/** Cap every `.meta` under `assets/` to 3.8 gold (post-write / open-existing). */
declare function normalizeProjectMetas(projectRoot: string): Promise<NormalizeReport>;
//#endregion
//#region src/meta/asset-info.d.ts
interface MetaSubAsset {
  uuid: string;
  name?: string;
  importer?: string;
}
interface MetaAssetInfo {
  path: string;
  url: string;
  uuid: string;
  importer: string;
  imported: boolean;
  subAssets: MetaSubAsset[];
}
/** Absolute path of `file` if it lies inside `<project>/assets`, else undefined. */
declare function assetPathInProject(project: string, file: string): string | undefined;
/**
 * Reads uuid / importer / sub-assets from an existing `.meta` without starting the
 * host. Throws when the file has not been imported yet.
 */
declare function readAssetInfo(project: string, file: string): Promise<MetaAssetInfo>;
/** Files under `path` (or `path` itself), skipping `.meta` and dotfiles. */
declare function listImportTargets(path: string): string[];
//#endregion
//#region src/project/ccclass-check.d.ts
/** `@ccclass` names that collide with engine / reserved identifiers in Creator 3.x. */
declare const RESERVED_CCCLASS_NAMES: Set<string>;
interface CcclassHit {
  file: string;
  name: string;
  line: number;
  reserved: boolean;
}
declare function scanReservedCcclass(projectRoot: string): Promise<{
  ok: boolean;
  hits: CcclassHit[];
  reserved: CcclassHit[];
}>;
//#endregion
//#region src/project/detect.d.ts
type ProjectKind = "enji-3.8" | "kurenai-4.0" | "other-3.x" | "unknown";
interface DetectedProject {
  name: string;
  projectPath: string;
  creatorVersion: string;
  kind: ProjectKind;
  dimension: "2d" | "3d" | "unknown";
}
declare function classifyCreatorVersion(version: string): ProjectKind;
declare function detectProject(projectPath: string): Promise<DetectedProject | undefined>;
/** Enji accepts 3.8.x (and other 3.x for open/preview with warnings). */
declare function assertEnjiProject(project: DetectedProject): void;
//#endregion
//#region src/project/control.d.ts
type EnjiTemplateId = "base-ai";
declare class EnjiProjectControl {
  inspect(projectPath: string): Promise<DetectedProject | undefined>;
  initialize(projectPath: string, template?: EnjiTemplateId): Promise<DetectedProject>;
  /** Open an existing 3.x project: detect, normalize metas, reserved-name scan. */
  open(projectPath: string): Promise<{
    project: DetectedProject;
    metaNormalize: Awaited<ReturnType<typeof normalizeProjectMetas>>;
    ccclass: Awaited<ReturnType<typeof scanReservedCcclass>>;
  }>;
  check(projectPath: string): Promise<{
    ok: boolean;
    project?: DetectedProject;
    metaNormalize: Awaited<ReturnType<typeof normalizeProjectMetas>>;
    ccclass: Awaited<ReturnType<typeof scanReservedCcclass>>;
    errors: string[];
    warnings: string[];
  }>;
  contextText(project: DetectedProject, preview: {
    phase: string;
    url: string;
  }): string;
}
//#endregion
//#region src/cocos/core.d.ts
/** Default wait for first host readiness (first engine/asset import can be slow). */
declare const DEFAULT_HOST_READY_TIMEOUT_MS = 600000;
/** Enji package root, from either `src/cocos` or bundled `lib/`. */
declare function enjiPackageRoot(): string;
/** Trimmed cocos-cli runtime shipped in `vendor/cocos-core` (override: ENJI_COCOS_CORE_ROOT). */
declare function cocosCoreRoot(env?: NodeJS.ProcessEnv): string;
declare function hostEntry(): string;
/** Markers for a completed `npm install` inside vendor/cocos-core. */
declare function coreDepsReady(root?: string): boolean;
/** Install vendor/cocos-core runtime dependencies if missing (postinstall normally did it). */
declare function ensureCoreDeps(options?: {
  root?: string;
  stdio?: "inherit" | "pipe";
}): Promise<{
  root: string;
  installed: boolean;
}>;
/**
 * Host readiness timeout.
 * Priority: explicit ms → `--timeout` seconds → `ENJI_HOST_READY_TIMEOUT_MS` → 10 minutes.
 */
declare function resolveHostReadyTimeoutMs(options?: {
  timeout?: string | true | undefined;
  readinessTimeoutMs?: number | undefined;
}, env?: NodeJS.ProcessEnv): number;
//#endregion
export { CREATOR_VERSION, DEFAULT_HOST_READY_TIMEOUT_MS, type DetectedProject, EnjiProjectControl, type EnjiTemplateId, META_GOLD_SHAPES, META_GOLD_VER, type MetaAssetInfo, type MetaSubAsset, type ProjectKind, RESERVED_CCCLASS_NAMES, assertEnjiProject, assetPathInProject, classifyCreatorVersion, cocosCoreRoot, compareVer, coreDepsReady, detectProject, downgradeMetaContent, downgradeMetaObject, enjiPackageRoot, ensureCoreDeps, hostEntry, installMetaHooks, listImportTargets, metaExceedsGold, normalizeProjectMetas, readAssetInfo, resolveHostReadyTimeoutMs, scanReservedCcclass };
//# sourceMappingURL=index.d.ts.map