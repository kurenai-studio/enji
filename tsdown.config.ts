import { defineConfig } from "tsdown";

export default defineConfig({
  name: "enji",
  entry: ["src/index.ts", "src/cli/parse.ts", "src/meta/hook.ts"],
  outDir: "lib",
  format: ["esm"],
  platform: "node",
  target: "es2022",
  dts: true,
  clean: true,
  fixedExtension: false,
});
