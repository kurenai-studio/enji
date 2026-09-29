export { CREATOR_VERSION, META_GOLD_SHAPES, META_GOLD_VER } from "./meta/gold.js";
export {
  compareVer,
  downgradeMetaContent,
  downgradeMetaObject,
  metaExceedsGold,
} from "./meta/downgrade.js";
export { installMetaHooks } from "./meta/install-hooks.js";
export { normalizeProjectMetas } from "./meta/normalize.js";
export {
  RESERVED_CCCLASS_NAMES,
  scanReservedCcclass,
} from "./project/ccclass-check.js";
export {
  assertEnjiProject,
  classifyCreatorVersion,
  detectProject,
} from "./project/detect.js";
export type { DetectedProject, ProjectKind } from "./project/detect.js";
export {
  EnjiProjectControl,
  resolveKurenaiBin,
  resolveKurenaiPackageRoot,
} from "./project/control.js";
export type { EnjiTemplateId } from "./project/control.js";
