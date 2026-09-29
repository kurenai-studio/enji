import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Default wait for first host readiness (first engine/asset import can be slow). */
export const DEFAULT_HOST_READY_TIMEOUT_MS = 600_000;

/** Enji package root, from either `src/cocos` or bundled `lib/`. */
export function enjiPackageRoot(): string {
  for (const up of ["..", "../.."]) {
    const dir = fileURLToPath(new URL(up, import.meta.url));
    if (existsSync(join(dir, "package.json")) && existsSync(join(dir, "host"))) return dir;
  }
  throw new Error("Cannot locate the enji package root");
}

/** Trimmed cocos-cli runtime shipped in `vendor/cocos-core` (override: ENJI_COCOS_CORE_ROOT). */
export function cocosCoreRoot(env: NodeJS.ProcessEnv = process.env): string {
  if (env.ENJI_COCOS_CORE_ROOT) return resolve(env.ENJI_COCOS_CORE_ROOT);
  return join(enjiPackageRoot(), "vendor", "cocos-core");
}

export function hostEntry(): string {
  return join(enjiPackageRoot(), "host", "cocos-host.mjs");
}

/** Markers for a completed `npm install` inside vendor/cocos-core. */
export function coreDepsReady(root: string = cocosCoreRoot()): boolean {
  return (
    existsSync(join(root, "node_modules/@babel/core/package.json")) &&
    existsSync(join(root, "node_modules/@cocos/lib-programming/package.json")) &&
    existsSync(join(root, "node_modules/sharp/package.json"))
  );
}

function npmInstall(dir: string, stdio: "inherit" | "pipe"): Promise<void> {
  return new Promise((done, reject) => {
    const child = spawn(
      "npm",
      ["install", "--omit=dev", "--no-audit", "--no-fund", "--ignore-scripts"],
      {
        cwd: dir,
        stdio: stdio === "inherit" ? "inherit" : ["ignore", "ignore", "pipe"],
        env: { ...process.env, npm_config_progress: "false" },
        // npm is npm.cmd on Windows, which Node only runs through a shell.
        shell: process.platform === "win32",
      },
    );
    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) done();
      else reject(new Error(`npm install failed in ${dir} (code=${String(code)}): ${stderr.trim()}`));
    });
  });
}

/** Install vendor/cocos-core runtime dependencies if missing (postinstall normally did it). */
export async function ensureCoreDeps(
  options: { root?: string; stdio?: "inherit" | "pipe" } = {},
): Promise<{ root: string; installed: boolean }> {
  const root = options.root ?? cocosCoreRoot();
  if (!existsSync(join(root, "dist", "core", "launcher.js"))) {
    throw new Error(`cocos core runtime missing at ${root}`);
  }
  if (coreDepsReady(root)) return { root, installed: false };
  await npmInstall(root, options.stdio ?? "pipe");
  if (!coreDepsReady(root)) throw new Error(`cocos core dependencies incomplete after npm install in ${root}`);
  return { root, installed: true };
}

/**
 * Host readiness timeout.
 * Priority: explicit ms → `--timeout` seconds → `ENJI_HOST_READY_TIMEOUT_MS` → 10 minutes.
 */
export function resolveHostReadyTimeoutMs(
  options: { timeout?: string | true | undefined; readinessTimeoutMs?: number | undefined } = {},
  env: NodeJS.ProcessEnv = process.env,
): number {
  if (typeof options.readinessTimeoutMs === "number" && Number.isFinite(options.readinessTimeoutMs)) {
    return Math.max(1_000, options.readinessTimeoutMs);
  }
  if (typeof options.timeout === "string" && options.timeout.trim()) {
    const seconds = Number(options.timeout);
    if (Number.isFinite(seconds) && seconds > 0) return Math.max(1_000, Math.round(seconds * 1000));
  }
  const fromEnv = Number(env.ENJI_HOST_READY_TIMEOUT_MS);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return Math.max(1_000, Math.round(fromEnv));
  return DEFAULT_HOST_READY_TIMEOUT_MS;
}
