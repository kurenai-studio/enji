import { a as metaExceedsGold, c as META_GOLD_SHAPES, i as downgradeMetaObject, l as META_GOLD_VER, n as compareVer, o as unknownImporters, r as downgradeMetaContent, s as CREATOR_VERSION, t as installMetaHooks } from "./install-hooks-f3uKyFtQ.js";
import { createRequire } from "node:module";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
//#region src/meta/normalize.ts
async function walkMetas(dir, into = []) {
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
function parseMeta(raw) {
	try {
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : void 0;
	} catch {
		return;
	}
}
/** Cap every `.meta` under `assets/` to 3.8 gold (post-write / open-existing). */
async function normalizeProjectMetas(projectRoot) {
	const metas = await walkMetas(join(projectRoot, "assets"));
	const report = {
		scanned: metas.length,
		changed: 0,
		files: [],
		unknownImporters: [],
		orphans: []
	};
	const rel = (path) => relative(projectRoot, path).split(sep).join("/");
	for (const path of metas) {
		const assetPath = path.slice(0, -5);
		if (!existsSync(assetPath)) report.orphans.push(rel(path));
		const raw = await readFile(path, "utf8");
		const meta = parseMeta(raw);
		const unknown = meta ? unknownImporters(meta) : [];
		if (unknown.length) report.unknownImporters.push({
			path: rel(assetPath),
			importers: unknown
		});
		const result = downgradeMetaContent(raw);
		if (!result.changed) continue;
		await writeFile(path, result.content, "utf8");
		report.changed += 1;
		report.files.push({
			path,
			caps: result.caps
		});
	}
	return report;
}
//#endregion
//#region src/meta/asset-info.ts
/** Absolute path of `file` if it lies inside `<project>/assets`, else undefined. */
function assetPathInProject(project, file) {
	const assetsDir = join(resolve(project), "assets");
	const target = resolve(file);
	if (target !== assetsDir && !target.startsWith(assetsDir + sep)) return void 0;
	return target;
}
/**
* Reads uuid / importer / sub-assets from an existing `.meta` without starting the
* host. Throws when the file has not been imported yet.
*/
async function readAssetInfo(project, file) {
	const target = assetPathInProject(project, file);
	if (!target) throw new Error(`path must be inside ${join(resolve(project), "assets")}`);
	if (!existsSync(target)) throw new Error(`no such file: ${relative(project, target)}`);
	const metaPath = `${target}.meta`;
	if (!existsSync(metaPath)) throw new Error(`not imported yet (no .meta): run \`enji import ${relative(process.cwd(), target) || target}\``);
	const meta = JSON.parse(await readFile(metaPath, "utf8"));
	if (!meta.uuid) throw new Error(`${relative(project, metaPath)} has no uuid`);
	const subAssets = [];
	const collect = (subMetas) => {
		for (const sub of Object.values(subMetas ?? {})) {
			if (sub.uuid) subAssets.push({
				uuid: sub.uuid,
				...sub.name ? { name: sub.name } : {},
				...sub.importer ? { importer: sub.importer } : {}
			});
			collect(sub.subMetas);
		}
	};
	collect(meta.subMetas);
	const rel = relative(resolve(project), target).split(sep).join("/");
	return {
		path: rel,
		url: `db://${rel}`,
		uuid: meta.uuid,
		importer: meta.importer ?? "unknown",
		imported: meta.imported !== false,
		subAssets
	};
}
/** Files under `path` (or `path` itself), skipping `.meta` and dotfiles. */
function listImportTargets(path) {
	const target = resolve(path);
	if (!statSync(target).isDirectory()) return [target];
	const files = [];
	const walk = (dir) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (entry.name.startsWith(".") || entry.name.endsWith(".meta")) continue;
			const full = join(dir, entry.name);
			if (entry.isDirectory()) walk(full);
			else if (entry.isFile()) files.push(full);
		}
	};
	walk(target);
	return files.sort();
}
//#endregion
//#region src/project/ccclass-check.ts
/** `@ccclass` names that collide with engine / reserved identifiers in Creator 3.x. */
const RESERVED_CCCLASS_NAMES = /* @__PURE__ */ new Set([
	"game",
	"Game",
	"camera",
	"Camera",
	"cc",
	"CC"
]);
const CCCLASS_RE = /@ccclass\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
async function walkTs(dir, into = []) {
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
async function scanReservedCcclass(projectRoot) {
	const files = await walkTs(join(projectRoot, "assets"));
	const hits = [];
	for (const file of files) {
		const lines = (await readFile(file, "utf8")).split("\n");
		for (let i = 0; i < lines.length; i += 1) {
			const line = lines[i];
			CCCLASS_RE.lastIndex = 0;
			let match;
			while (match = CCCLASS_RE.exec(line)) {
				const name = match[1];
				hits.push({
					file,
					name,
					line: i + 1,
					reserved: RESERVED_CCCLASS_NAMES.has(name)
				});
			}
		}
	}
	const reserved = hits.filter((h) => h.reserved);
	return {
		ok: reserved.length === 0,
		hits,
		reserved
	};
}
//#endregion
//#region src/project/detect.ts
function parseCreatorVersion(pkg) {
	if (typeof pkg.creator?.version === "string") return pkg.creator.version;
	if (typeof pkg.version === "string" && /^\d+\.\d+/.test(pkg.version)) return pkg.version;
}
function classifyCreatorVersion(version) {
	if (version.startsWith("4.")) return "kurenai-4.0";
	if (version.startsWith("3.8")) return "enji-3.8";
	if (version.startsWith("3.")) return "other-3.x";
	return "unknown";
}
async function detectDimension(projectPath) {
	try {
		const pkg = JSON.parse(await readFile(join(projectPath, "package.json"), "utf8"));
		if (pkg.type === "2d" || pkg.type === "3d") return pkg.type;
	} catch {}
	try {
		const engine = JSON.parse(await readFile(join(projectPath, "settings/v2/packages/engine.json"), "utf8"));
		const modules = engine.modules?.configs?.defaultConfig?.includeModules ?? Object.values(engine.modules?.configs ?? {})[0]?.includeModules ?? [];
		if (modules.includes("3d") && !modules.includes("2d")) return "3d";
		if (modules.includes("2d")) return "2d";
	} catch {}
	return "unknown";
}
async function detectProject(projectPath) {
	const absolutePath = resolve(projectPath);
	if (!existsSync(join(absolutePath, "assets")) || !existsSync(join(absolutePath, "package.json"))) return;
	try {
		const pkg = JSON.parse(await readFile(join(absolutePath, "package.json"), "utf8"));
		const creatorVersion = parseCreatorVersion(pkg);
		if (!creatorVersion) return void 0;
		return {
			name: typeof pkg.name === "string" && pkg.name.trim() ? pkg.name : basename(absolutePath),
			projectPath: absolutePath,
			creatorVersion,
			kind: classifyCreatorVersion(creatorVersion),
			dimension: await detectDimension(absolutePath)
		};
	} catch {
		return;
	}
}
/** Enji accepts 3.8.x (and other 3.x for open/preview with warnings). */
function assertEnjiProject(project) {
	if (project.kind === "kurenai-4.0") throw new Error(`This is a Creator ${project.creatorVersion} project — use kurenai, not enji.`);
	if (project.kind === "unknown") throw new Error(`Unrecognized creator.version "${project.creatorVersion}"; enji expects 3.8.x.`);
}
//#endregion
//#region src/project/uuid.ts
const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
/** Creator's 23-char form used for script class ids in scenes / prefabs (`__type__`). */
function compressUuid(uuid) {
	const hex = uuid.replace(/-/g, "");
	let out = hex.slice(0, 5);
	for (let i = 5; i < hex.length; i += 3) {
		const value = Number.parseInt(hex.slice(i, i + 3), 16);
		out += BASE64[value >> 6] + BASE64[value & 63];
	}
	return out;
}
/** Files whose content may reference asset uuids. */
const TEXT_EXTENSIONS = /\.(meta|scene|prefab|json|mtl|pmtl|anim|animask|effect|ts|js|txt)$/;
async function walk(dir, into = []) {
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
async function regenerateAssetUuids(projectPath) {
	const files = [...await walk(join(projectPath, "assets")), ...await walk(join(projectPath, "settings"))];
	const mapping = /* @__PURE__ */ new Map();
	for (const file of files) {
		if (!file.endsWith(".meta")) continue;
		const meta = JSON.parse(await readFile(file, "utf8"));
		if (typeof meta.uuid === "string" && !mapping.has(meta.uuid)) mapping.set(meta.uuid, randomUUID());
	}
	if (!mapping.size) return mapping;
	const replacements = [];
	for (const [from, to] of mapping) replacements.push([from, to], [compressUuid(from), compressUuid(to)]);
	for (const file of files) {
		const text = await readFile(file, "utf8");
		let next = text;
		for (const [from, to] of replacements) next = next.split(from).join(to);
		if (next !== text) await writeFile(file, next, "utf8");
	}
	return mapping;
}
//#endregion
//#region src/project/control.ts
const require = createRequire(import.meta.url);
const IGNORED_WORKSPACE_ENTRIES = /* @__PURE__ */ new Set([
	".git",
	".DS_Store",
	".cursor",
	".vscode",
	".idea"
]);
/** Resolve package root whether running from `src/` or bundled `lib/`. */
function packageRoot() {
	try {
		return dirname(require.resolve("@kurenai-studio/enji/package.json"));
	} catch {}
	let dir = dirname(fileURLToPath(import.meta.url));
	for (;;) {
		const pkgPath = join(dir, "package.json");
		if (existsSync(pkgPath)) try {
			if (JSON.parse(readFileSync(pkgPath, "utf8")).name === "@kurenai-studio/enji") return dir;
		} catch {}
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	throw new Error("Cannot find @kurenai-studio/enji package root");
}
function templateDir(id) {
	return join(packageRoot(), "templates", id);
}
function sharedDir() {
	return join(packageRoot(), "templates", "shared");
}
async function copyDirectoryContents(from, to) {
	await mkdir(to, { recursive: true });
	const entries = await readdir(from, { withFileTypes: true });
	for (const entry of entries) {
		const src = join(from, entry.name);
		const dest = join(to, entry.name);
		if (entry.isDirectory()) await copyDirectoryContents(src, dest);
		else {
			await mkdir(dirname(dest), { recursive: true });
			await cp(src, dest);
		}
	}
}
async function assignProjectIdentity(projectPath) {
	const pkgPath = join(projectPath, "package.json");
	const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
	const name = basename(projectPath);
	const prevCreator = typeof pkg.creator === "object" && pkg.creator !== null ? pkg.creator : {};
	pkg.name = name;
	pkg.uuid = randomUUID();
	pkg.version = CREATOR_VERSION;
	pkg.creator = {
		...prevCreator,
		version: CREATOR_VERSION
	};
	await writeFile(pkgPath, `${JSON.stringify(pkg, null, 4)}\n`, "utf8");
}
var EnjiProjectControl = class {
	async inspect(projectPath) {
		return detectProject(projectPath);
	}
	async initialize(projectPath, template = "base-ai") {
		const target = resolve(projectPath);
		await mkdir(target, { recursive: true });
		if (await this.inspect(target)) throw new Error("This directory is already a Cocos Creator project");
		const projectEntries = (await readdir(target)).filter((entry) => !IGNORED_WORKSPACE_ENTRIES.has(entry));
		if (projectEntries.length) throw new Error(`Enji init requires an empty directory; found: ${projectEntries.join(", ")}`);
		if (template !== "base-ai") throw new Error(`Unknown template "${template}"; use base-ai`);
		await copyDirectoryContents(templateDir(template), target);
		await copyDirectoryContents(sharedDir(), target);
		await assignProjectIdentity(target);
		await regenerateAssetUuids(target);
		const project = await this.inspect(target);
		if (!project) throw new Error("The initialized template is not a Cocos Creator project");
		return project;
	}
	/** Open an existing 3.x project: detect, normalize metas, reserved-name scan. */
	async open(projectPath) {
		const project = await this.inspect(projectPath);
		if (!project) throw new Error("The directory is not a Cocos Creator project");
		assertEnjiProject(project);
		return {
			project,
			metaNormalize: await normalizeProjectMetas(project.projectPath),
			ccclass: await scanReservedCcclass(project.projectPath)
		};
	}
	async check(projectPath) {
		const project = await this.inspect(projectPath);
		const errors = [];
		const warnings = [];
		if (!project) return {
			ok: false,
			metaNormalize: {
				scanned: 0,
				changed: 0,
				files: [],
				unknownImporters: [],
				orphans: []
			},
			ccclass: {
				ok: false,
				hits: [],
				reserved: []
			},
			errors: ["not a Cocos Creator project"],
			warnings: []
		};
		if (project.kind === "kurenai-4.0") errors.push(`Creator ${project.creatorVersion}: use kurenai, not enji`);
		else if (project.kind === "unknown") errors.push(`unrecognized creator.version "${project.creatorVersion}"`);
		else if (project.kind === "other-3.x") warnings.push(`creator.version ${project.creatorVersion} is 3.x but not 3.8; preview may work, IDE target is 3.8.8`);
		const metaNormalize = await normalizeProjectMetas(project.projectPath);
		for (const { path, importers } of metaNormalize.unknownImporters) warnings.push(`${path}.meta: importer ${importers.map((name) => `"${name}"`).join(", ")} is not a Creator 3.8 importer, so enji cannot cap its ver; correct the importer name in that .meta and keep its uuid (enji import keeps whatever importer the .meta names)`);
		for (const path of metaNormalize.orphans) warnings.push(`${path}: orphan .meta (asset file is gone); delete it`);
		const ccclass = await scanReservedCcclass(project.projectPath);
		if (!ccclass.ok) for (const hit of ccclass.reserved) errors.push(`reserved @ccclass('${hit.name}') in ${hit.file}:${hit.line}`);
		return {
			ok: errors.length === 0,
			project,
			metaNormalize,
			ccclass,
			errors,
			warnings
		};
	}
	contextText(project, preview) {
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
			`.meta files must stay on Creator 3.8 importer stamps (enji caps them).`
		].join("\n");
	}
};
//#endregion
//#region src/cocos/core.ts
/** Default wait for first host readiness (first engine/asset import can be slow). */
const DEFAULT_HOST_READY_TIMEOUT_MS = 6e5;
/** Enji package root, from either `src/cocos` or bundled `lib/`. */
function enjiPackageRoot() {
	for (const up of ["..", "../.."]) {
		const dir = fileURLToPath(new URL(up, import.meta.url));
		if (existsSync(join(dir, "package.json")) && existsSync(join(dir, "host"))) return dir;
	}
	throw new Error("Cannot locate the enji package root");
}
/** Trimmed cocos-cli runtime shipped in `vendor/cocos-core` (override: ENJI_COCOS_CORE_ROOT). */
function cocosCoreRoot(env = process.env) {
	if (env.ENJI_COCOS_CORE_ROOT) return resolve(env.ENJI_COCOS_CORE_ROOT);
	return join(enjiPackageRoot(), "vendor", "cocos-core");
}
function hostEntry() {
	return join(enjiPackageRoot(), "host", "cocos-host.mjs");
}
/** Markers for a completed `npm install` inside vendor/cocos-core. */
function coreDepsReady(root = cocosCoreRoot()) {
	return existsSync(join(root, "node_modules/@babel/core/package.json")) && existsSync(join(root, "node_modules/@cocos/lib-programming/package.json")) && existsSync(join(root, "node_modules/sharp/package.json"));
}
function npmInstall(dir, stdio) {
	return new Promise((done, reject) => {
		const child = spawn("npm", [
			"install",
			"--omit=dev",
			"--no-audit",
			"--no-fund",
			"--ignore-scripts"
		], {
			cwd: dir,
			stdio: stdio === "inherit" ? "inherit" : [
				"ignore",
				"ignore",
				"pipe"
			],
			env: {
				...process.env,
				npm_config_progress: "false"
			},
			shell: process.platform === "win32"
		});
		let stderr = "";
		child.stderr?.on("data", (chunk) => {
			stderr += String(chunk);
		});
		child.on("error", reject);
		child.on("exit", (code) => {
			if (code === 0) done();
			else reject(/* @__PURE__ */ new Error(`npm install failed in ${dir} (code=${String(code)}): ${stderr.trim()}`));
		});
	});
}
/** Install vendor/cocos-core runtime dependencies if missing (postinstall normally did it). */
async function ensureCoreDeps(options = {}) {
	const root = options.root ?? cocosCoreRoot();
	if (!existsSync(join(root, "dist", "core", "launcher.js"))) throw new Error(`cocos core runtime missing at ${root}`);
	if (coreDepsReady(root)) return {
		root,
		installed: false
	};
	await npmInstall(root, options.stdio ?? "pipe");
	if (!coreDepsReady(root)) throw new Error(`cocos core dependencies incomplete after npm install in ${root}`);
	return {
		root,
		installed: true
	};
}
/**
* Host readiness timeout.
* Priority: explicit ms → `--timeout` seconds → `ENJI_HOST_READY_TIMEOUT_MS` → 10 minutes.
*/
function resolveHostReadyTimeoutMs(options = {}, env = process.env) {
	if (typeof options.readinessTimeoutMs === "number" && Number.isFinite(options.readinessTimeoutMs)) return Math.max(1e3, options.readinessTimeoutMs);
	if (typeof options.timeout === "string" && options.timeout.trim()) {
		const seconds = Number(options.timeout);
		if (Number.isFinite(seconds) && seconds > 0) return Math.max(1e3, Math.round(seconds * 1e3));
	}
	const fromEnv = Number(env.ENJI_HOST_READY_TIMEOUT_MS);
	if (Number.isFinite(fromEnv) && fromEnv > 0) return Math.max(1e3, Math.round(fromEnv));
	return DEFAULT_HOST_READY_TIMEOUT_MS;
}
//#endregion
export { CREATOR_VERSION, DEFAULT_HOST_READY_TIMEOUT_MS, EnjiProjectControl, META_GOLD_SHAPES, META_GOLD_VER, RESERVED_CCCLASS_NAMES, assertEnjiProject, assetPathInProject, classifyCreatorVersion, cocosCoreRoot, compareVer, coreDepsReady, detectProject, downgradeMetaContent, downgradeMetaObject, enjiPackageRoot, ensureCoreDeps, hostEntry, installMetaHooks, listImportTargets, metaExceedsGold, normalizeProjectMetas, readAssetInfo, resolveHostReadyTimeoutMs, scanReservedCcclass };

//# sourceMappingURL=index.js.map