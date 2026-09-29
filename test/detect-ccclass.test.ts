import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scanReservedCcclass } from "../src/project/ccclass-check.js";
import { classifyCreatorVersion, detectProject } from "../src/project/detect.js";

describe("classifyCreatorVersion", () => {
  it("maps product lines", () => {
    expect(classifyCreatorVersion("3.8.8")).toBe("enji-3.8");
    expect(classifyCreatorVersion("3.7.0")).toBe("other-3.x");
    expect(classifyCreatorVersion("4.0.0")).toBe("kurenai-4.0");
  });
});

describe("detectProject", () => {
  it("reads creator.version 3.8.8", async () => {
    const dir = await mkdtemp(join(tmpdir(), "enji-detect-"));
    await mkdir(join(dir, "assets"), { recursive: true });
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({ name: "demo", creator: { version: "3.8.8" }, type: "2d" }),
    );
    const project = await detectProject(dir);
    expect(project?.kind).toBe("enji-3.8");
    expect(project?.dimension).toBe("2d");
  });
});

describe("scanReservedCcclass", () => {
  it("flags Camera / game", async () => {
    const dir = await mkdtemp(join(tmpdir(), "enji-cc-"));
    await mkdir(join(dir, "assets", "game"), { recursive: true });
    await writeFile(
      join(dir, "assets", "game", "Bad.ts"),
      `@ccclass('Camera')\nexport class Camera {}\n@ccclass('game')\nexport class Game {}\n`,
    );
    const result = await scanReservedCcclass(dir);
    expect(result.ok).toBe(false);
    expect(result.reserved.map((h) => h.name).sort()).toEqual(["Camera", "game"]);
  });
});
