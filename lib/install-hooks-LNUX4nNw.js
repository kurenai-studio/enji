import { createRequire } from "node:module";
import { join } from "node:path";
//#region src/meta/gold.ts
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
const CREATOR_VERSION = "3.8.8";
/** Max importer `ver` accepted / written for Creator 3.8.8. */
const META_GOLD_VER = {
	"animation-clip": "2.0.4",
	"animation-graph": "1.2.0",
	"animation-graph-variant": "1.0.0",
	"animation-mask": "1.0.0",
	"audio-clip": "1.0.0",
	"auto-atlas": "1.0.8",
	"bitmap-font": "1.0.6",
	buffer: "1.0.3",
	directory: "1.2.0",
	effect: "1.7.1",
	"effect-header": "1.0.7",
	"erp-texture-cube": "1.0.10",
	fbx: "2.3.14",
	"gltf-animation": "1.0.16",
	"gltf-embeded-image": "1.0.3",
	"gltf-material": "1.0.14",
	"gltf-mesh": "1.1.1",
	"gltf-scene": "1.0.14",
	"gltf-skeleton": "1.0.1",
	image: "1.0.27",
	javascript: "4.0.24",
	json: "2.0.1",
	"label-atlas": "1.0.1",
	material: "1.0.21",
	particle: "1.0.2",
	"physics-material": "1.0.1",
	prefab: "1.1.50",
	"render-pipeline": "1.0.0",
	"render-flow": "1.0.0",
	"render-stage": "1.0.0",
	"render-texture": "1.2.1",
	"rt-sprite-frame": "1.0.0",
	scene: "1.1.50",
	spine: "1.2.0",
	"sprite-atlas": "1.0.0",
	"sprite-frame": "1.0.12",
	terrain: "1.1.50",
	text: "1.0.1",
	texture: "1.0.22",
	"texture-cube": "1.0.4",
	"texture-packer": "1.0.8",
	"tiled-map": "1.0.2",
	"ttf-font": "1.0.1",
	typescript: "4.0.24",
	unknown: "1.0.0",
	"video-clip": "1.0.0"
};
/** Canonical empty userData shapes for newly generated template metas. */
const META_GOLD_SHAPES = {
	typescript: {
		ver: "4.0.24",
		importer: "typescript",
		files: [],
		userData: {}
	},
	javascript: {
		ver: "4.0.24",
		importer: "javascript",
		files: [".js"],
		userData: {
			isPlugin: false,
			loadPluginInEditor: true,
			loadPluginInWeb: true,
			loadPluginInNative: true
		}
	},
	scene: {
		ver: "1.1.50",
		importer: "scene",
		files: [".json"],
		userData: {}
	},
	prefab: {
		ver: "1.1.50",
		importer: "prefab",
		files: [".json"],
		userData: {}
	},
	material: {
		ver: "1.0.21",
		importer: "material",
		files: [".json"],
		userData: {}
	},
	image: {
		ver: "1.0.27",
		importer: "image",
		files: [".json", ".png"],
		userData: { type: "sprite-frame" }
	},
	texture: {
		ver: "1.0.22",
		importer: "texture",
		files: [".json"],
		userData: {}
	},
	"sprite-frame": {
		ver: "1.0.12",
		importer: "sprite-frame",
		files: [".json"],
		userData: {}
	},
	"audio-clip": {
		ver: "1.0.0",
		importer: "audio-clip",
		files: [".mp3", ".json"],
		userData: { downloadMode: 0 }
	},
	"ttf-font": {
		ver: "1.0.1",
		importer: "ttf-font",
		files: [".json"],
		userData: {}
	},
	"animation-clip": {
		ver: "2.0.4",
		importer: "animation-clip",
		files: [".cconb"],
		userData: {}
	},
	directory: {
		ver: "1.2.0",
		importer: "directory",
		files: [],
		userData: {}
	},
	json: {
		ver: "2.0.1",
		importer: "json",
		files: [".json"],
		userData: {}
	},
	text: {
		ver: "1.0.1",
		importer: "text",
		files: [".json"],
		userData: {}
	}
};
/** Top-level keys Creator 3.x `.meta` files use. Extra keys from 4.0 host are stripped. */
const META_ALLOWED_KEYS = /* @__PURE__ */ new Set([
	"ver",
	"importer",
	"imported",
	"uuid",
	"files",
	"subMetas",
	"userData",
	"displayName",
	"id",
	"name"
]);
//#endregion
//#region src/meta/downgrade.ts
/** Compare dotted semver-like strings (e.g. 1.0.18 vs 1.0.16). */
function compareVer(a, b) {
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
function capNode(node, caps, gold) {
	let changed = false;
	const importer = typeof node.importer === "string" ? node.importer : void 0;
	const ver = typeof node.ver === "string" ? node.ver : void 0;
	if (importer && ver) {
		const max = gold[importer];
		if (max && compareVer(ver, max) > 0) {
			caps.push({
				importer,
				from: ver,
				to: max
			});
			node.ver = max;
			changed = true;
		}
	}
	for (const key of Object.keys(node)) if (!META_ALLOWED_KEYS.has(key)) {
		delete node[key];
		changed = true;
	}
	const sub = node.subMetas;
	if (sub && typeof sub === "object" && !Array.isArray(sub)) {
		for (const child of Object.values(sub)) if (child && typeof child === "object" && !Array.isArray(child)) {
			if (capNode(child, caps, gold)) changed = true;
		}
	}
	return changed;
}
/**
* Cap `.meta` JSON to Creator 3.8.8 gold versions.
* Does not raise older valid vers — only lowers stamps above gold.
*/
function downgradeMetaObject(meta, gold = META_GOLD_VER) {
	const caps = [];
	const clone = structuredClone(meta);
	return {
		changed: capNode(clone, caps, gold),
		caps,
		meta: clone
	};
}
function downgradeMetaContent(raw, gold = META_GOLD_VER) {
	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return {
			changed: false,
			content: raw,
			caps: []
		};
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {
		changed: false,
		content: raw,
		caps: []
	};
	const { changed, caps, meta } = downgradeMetaObject(parsed, gold);
	if (!changed) return {
		changed: false,
		content: raw,
		caps: []
	};
	return {
		changed: true,
		content: `${JSON.stringify(meta, null, 2)}\n`,
		caps
	};
}
/** True when any importer `ver` in the meta tree exceeds gold. */
function metaExceedsGold(meta, gold = META_GOLD_VER) {
	const walk = (node) => {
		const importer = typeof node.importer === "string" ? node.importer : void 0;
		const ver = typeof node.ver === "string" ? node.ver : void 0;
		if (importer && ver) {
			const max = gold[importer];
			if (max && compareVer(ver, max) > 0) return true;
		}
		const sub = node.subMetas;
		if (sub && typeof sub === "object" && !Array.isArray(sub)) {
			for (const child of Object.values(sub)) if (child && typeof child === "object" && !Array.isArray(child) && walk(child)) return true;
		}
		return false;
	};
	return walk(meta);
}
//#endregion
//#region src/meta/install-hooks.ts
function maybeDowngrade(file, data) {
	if (typeof file !== "string" && !Buffer.isBuffer(file)) return data;
	if (!String(file).endsWith(".meta")) return data;
	if (typeof data === "string") return downgradeMetaContent(data).content;
	if (Buffer.isBuffer(data)) return Buffer.from(downgradeMetaContent(data.toString("utf8")).content, "utf8");
	return data;
}
let installed = false;
/**
* Monkey-patch Node `fs` (and `fs-extra` if resolvable) so `.meta` writes
* are capped to Creator 3.8.8 gold versions before they hit disk.
*/
function installMetaHooks() {
	if (installed) return;
	installed = true;
	const req = createRequire(import.meta.url);
	const fs = req("fs");
	const origSync = fs.writeFileSync.bind(fs);
	fs.writeFileSync = ((file, data, options) => {
		return origSync(file, maybeDowngrade(file, data), options);
	});
	const origWrite = fs.promises.writeFile.bind(fs.promises);
	fs.promises.writeFile = (async (file, data, options) => {
		return origWrite(file, maybeDowngrade(file, data), options);
	});
	const origWriteCb = fs.writeFile.bind(fs);
	fs.writeFile = ((file, data, ...rest) => {
		return origWriteCb(file, maybeDowngrade(file, data), ...rest);
	});
	try {
		const coreRoot = process.env.ENJI_COCOS_CORE_ROOT;
		const fsExtra = (coreRoot ? createRequire(join(coreRoot, "package.json")) : req)("fs-extra");
		if (typeof fsExtra.writeFileSync === "function") {
			const extraSync = fsExtra.writeFileSync.bind(fsExtra);
			fsExtra.writeFileSync = ((file, data, options) => {
				return extraSync(file, maybeDowngrade(file, data), options);
			});
		}
		if (typeof fsExtra.outputFileSync === "function") {
			const extraOut = fsExtra.outputFileSync.bind(fsExtra);
			fsExtra.outputFileSync = (file, data, options) => {
				return extraOut(file, maybeDowngrade(file, data), options);
			};
		}
		if (typeof fsExtra.writeFile === "function") {
			const extraAsync = fsExtra.writeFile.bind(fsExtra);
			fsExtra.writeFile = async (file, data, options) => {
				return extraAsync(file, maybeDowngrade(file, data), options);
			};
		}
		if (typeof fsExtra.outputFile === "function") {
			const extraOutAsync = fsExtra.outputFile.bind(fsExtra);
			fsExtra.outputFile = async (file, data, options) => {
				return extraOutAsync(file, maybeDowngrade(file, data), options);
			};
		}
	} catch {}
	process.stderr.write("[enji-meta] write hooks installed (3.8 meta cap)\n");
}
//#endregion
export { metaExceedsGold as a, META_GOLD_VER as c, downgradeMetaObject as i, compareVer as n, CREATOR_VERSION as o, downgradeMetaContent as r, META_GOLD_SHAPES as s, installMetaHooks as t };

//# sourceMappingURL=install-hooks-LNUX4nNw.js.map