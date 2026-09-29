import { a as metaExceedsGold, c as META_GOLD_VER, i as downgradeMetaObject, n as compareVer, o as CREATOR_VERSION, r as downgradeMetaContent, s as META_GOLD_SHAPES, t as installMetaHooks } from "./install-hooks-LNUX4nNw.js";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
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
/** Cap every `.meta` under `assets/` to 3.8 gold (post-write / open-existing). */
async function normalizeProjectMetas(projectRoot) {
	const metas = await walkMetas(join(projectRoot, "assets"));
	const report = {
		scanned: metas.length,
		changed: 0,
		files: []
	};
	for (const path of metas) {
		const raw = await readFile(path, "utf8");
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
				files: []
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
			`Rules: follow AGENTS.md. Preview via enji host (4.0 runtime).`,
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
export { CREATOR_VERSION, DEFAULT_HOST_READY_TIMEOUT_MS, EnjiProjectControl, META_GOLD_SHAPES, META_GOLD_VER, RESERVED_CCCLASS_NAMES, assertEnjiProject, classifyCreatorVersion, cocosCoreRoot, compareVer, coreDepsReady, detectProject, downgradeMetaContent, downgradeMetaObject, enjiPackageRoot, ensureCoreDeps, hostEntry, installMetaHooks, metaExceedsGold, normalizeProjectMetas, resolveHostReadyTimeoutMs, scanReservedCcclass };

//# sourceMappingURL=index.js.map