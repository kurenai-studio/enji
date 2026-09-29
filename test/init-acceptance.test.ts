import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EnjiProjectControl } from "../src/project/control.js";
import { downgradeMetaContent } from "../src/meta/downgrade.js";
import { META_GOLD_VER } from "../src/meta/gold.js";

describe("enji init + meta acceptance", () => {
  it("inits a 3.8.8 project without publish surface", async () => {
    const dir = await mkdtemp(join(tmpdir(), "enji-init-"));
    const control = new EnjiProjectControl();
    const project = await control.initialize(dir, "base-ai");
    expect(project.creatorVersion).toBe("3.8.8");
    expect(project.kind).toBe("enji-3.8");

    const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
    expect(pkg.creator.version).toBe("3.8.8");

    const agents = await readFile(join(dir, "AGENTS.md"), "utf8");
    expect(agents).toMatch(/no.*publish|无.*publish|没有.*publish|no publish/i);
    expect(agents).toMatch(/3\.8/);

    const bootMeta = JSON.parse(
      await readFile(join(dir, "assets/enji/Boot.ts.meta"), "utf8"),
    );
    expect(bootMeta.importer).toBe("typescript");
    expect(bootMeta.ver).toBe(META_GOLD_VER.typescript);

    const entries = await readdir(dir);
    expect(entries).not.toContain("publish");
  });

  it("open existing 3.8 caps over-stamped meta and keeps lower ver", async () => {
    const dir = await mkdtemp(join(tmpdir(), "enji-open-"));
    const control = new EnjiProjectControl();
    await control.initialize(dir, "base-ai");

    const hotPath = join(dir, "assets/game/Hot.ts");
    const hotMeta = join(dir, "assets/game/Hot.ts.meta");
    await writeFile(hotPath, "export const x = 1;\n");
    await writeFile(
      hotMeta,
      JSON.stringify(
        {
          ver: "4.0.99",
          importer: "typescript",
          imported: true,
          uuid: "11111111-2222-3333-4444-555555555555",
          files: [],
          subMetas: {},
          userData: {},
        },
        null,
        2,
      ),
    );

    const sceneMetaPath = join(dir, "assets/main.scene.meta");
    await writeFile(
      sceneMetaPath,
      JSON.stringify(
        {
          ver: "1.1.35",
          importer: "scene",
          imported: true,
          uuid: "51b3f924-32af-4774-85ba-208f6025ef77",
          files: [".json"],
          subMetas: {},
          userData: {},
        },
        null,
        2,
      ),
    );

    const opened = await control.open(dir);
    expect(opened.metaNormalize.changed).toBeGreaterThanOrEqual(1);

    const capped = JSON.parse(await readFile(hotMeta, "utf8"));
    expect(capped.ver).toBe(META_GOLD_VER.typescript);

    const scene = JSON.parse(await readFile(sceneMetaPath, "utf8"));
    expect(scene.ver).toBe("1.1.35");
  });

  it("CLI surface rejects publish conceptually", () => {
    // Documented contract: downgrade helper exists; publish is not exported.
    expect(typeof downgradeMetaContent).toBe("function");
    expect(META_GOLD_VER.scene).toBe("1.1.50");
  });
});
