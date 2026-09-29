/**
 * Side-effect entry for `node --import ./lib/meta/hook.js`.
 * Installs fs write hooks before kurenai-cocos-host loads asset-db.
 */
import { installMetaHooks } from "./install-hooks.js";

installMetaHooks();
