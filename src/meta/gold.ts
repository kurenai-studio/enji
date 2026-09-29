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

export const CREATOR_VERSION = "3.8.8";

/** Max importer `ver` accepted / written for Creator 3.8.8. */
export const META_GOLD_VER: Readonly<Record<string, string>> = {
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
  "video-clip": "1.0.0",
};

/**
 * Importers a 3.8 project may legitimately contain: the gold table plus the ones the
 * bundled runtime registers that the gold sample happened not to cover (no ver cap).
 * Anything else is a typo or a foreign (e.g. Creator 4.0) importer that escapes capping.
 */
export const META_KNOWN_IMPORTERS: ReadonlySet<string> = new Set([
  ...Object.keys(META_GOLD_VER),
  "alpha-image",
  "dragonbones",
  "dragonbones-atlas",
  "gltf",
  "instantiation-animation",
  "instantiation-material",
  "instantiation-mesh",
  "instantiation-skeleton",
  "sign-image",
  "spine-data",
  "texture-cube-face",
]);

/** Canonical empty userData shapes for newly generated template metas. */
export const META_GOLD_SHAPES: Readonly<
  Record<
    string,
    {
      ver: string;
      importer: string;
      files: string[];
      userData: Record<string, unknown>;
    }
  >
> = {
  typescript: {
    ver: "4.0.24",
    importer: "typescript",
    files: [],
    userData: {},
  },
  javascript: {
    ver: "4.0.24",
    importer: "javascript",
    files: [".js"],
    userData: {
      isPlugin: false,
      loadPluginInEditor: true,
      loadPluginInWeb: true,
      loadPluginInNative: true,
    },
  },
  scene: {
    ver: "1.1.50",
    importer: "scene",
    files: [".json"],
    userData: {},
  },
  prefab: {
    ver: "1.1.50",
    importer: "prefab",
    files: [".json"],
    userData: {},
  },
  material: {
    ver: "1.0.21",
    importer: "material",
    files: [".json"],
    userData: {},
  },
  image: {
    ver: "1.0.27",
    importer: "image",
    files: [".json", ".png"],
    userData: { type: "sprite-frame" },
  },
  texture: {
    ver: "1.0.22",
    importer: "texture",
    files: [".json"],
    userData: {},
  },
  "sprite-frame": {
    ver: "1.0.12",
    importer: "sprite-frame",
    files: [".json"],
    userData: {},
  },
  "audio-clip": {
    ver: "1.0.0",
    importer: "audio-clip",
    files: [".mp3", ".json"],
    userData: { downloadMode: 0 },
  },
  "ttf-font": {
    ver: "1.0.1",
    importer: "ttf-font",
    files: [".json"],
    userData: {},
  },
  "animation-clip": {
    ver: "2.0.4",
    importer: "animation-clip",
    files: [".cconb"],
    userData: {},
  },
  directory: {
    ver: "1.2.0",
    importer: "directory",
    files: [],
    userData: {},
  },
  json: {
    ver: "2.0.1",
    importer: "json",
    files: [".json"],
    userData: {},
  },
  text: {
    ver: "1.0.1",
    importer: "text",
    files: [".json"],
    userData: {},
  },
};

/** Top-level keys Creator 3.x `.meta` files use. Extra keys from 4.0 host are stripped. */
export const META_ALLOWED_KEYS = new Set([
  "ver",
  "importer",
  "imported",
  "uuid",
  "files",
  "subMetas",
  "userData",
  "displayName",
  "id",
  "name",
]);
