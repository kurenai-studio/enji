/**
 * Side-effect entry for `node --import ./lib/meta/hook.js`.
 * Installs fs write hooks before host/cocos-host.mjs loads asset-db.
 */
import { installMetaHooks } from "./install-hooks.js";

installMetaHooks();
