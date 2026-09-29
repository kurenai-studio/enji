import { describe, expect, it } from "vitest";
import {
  compareVer,
  downgradeMetaContent,
  metaExceedsGold,
} from "../src/meta/downgrade.js";
import { META_GOLD_VER } from "../src/meta/gold.js";

describe("compareVer", () => {
  it("orders dotted versions", () => {
    expect(compareVer("1.0.16", "1.0.18")).toBe(-1);
    expect(compareVer("4.0.24", "4.0.24")).toBe(0);
    expect(compareVer("1.1.50", "1.1.35")).toBe(1);
  });
});

describe("downgradeMetaContent", () => {
  it("caps typescript above gold (hypothetical)", () => {
    const raw = JSON.stringify(
      {
        ver: "4.0.99",
        importer: "typescript",
        imported: true,
        uuid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        files: [],
        subMetas: {},
        userData: {},
      },
      null,
      2,
    );
    const result = downgradeMetaContent(raw);
    expect(result.changed).toBe(true);
    expect(JSON.parse(result.content).ver).toBe(META_GOLD_VER.typescript);
  });

  it("does not raise lower valid ver", () => {
    const raw = JSON.stringify(
      {
        ver: "1.1.35",
        importer: "scene",
        imported: true,
        uuid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        files: [".json"],
        subMetas: {},
        userData: {},
      },
      null,
      2,
    );
    const result = downgradeMetaContent(raw);
    expect(result.changed).toBe(false);
  });

  it("caps nested subMetas and strips unknown keys", () => {
    const raw = JSON.stringify(
      {
        ver: "1.0.27",
        importer: "image",
        imported: true,
        uuid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        files: [".json", ".png"],
        futureOnlyField: true,
        subMetas: {
          abc: {
            ver: "1.0.99",
            importer: "texture",
            uuid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee@abc",
            imported: true,
            files: [".json"],
            subMetas: {},
            userData: {},
          },
        },
        userData: { type: "sprite-frame" },
      },
      null,
      2,
    );
    const result = downgradeMetaContent(raw);
    expect(result.changed).toBe(true);
    const meta = JSON.parse(result.content);
    expect(meta.futureOnlyField).toBeUndefined();
    expect(meta.subMetas.abc.ver).toBe(META_GOLD_VER.texture);
  });

  it("accepts 3.8.8 typescript 4.0.24 as in-gold", () => {
    const meta = {
      ver: "4.0.24",
      importer: "typescript",
      subMetas: {},
    };
    expect(metaExceedsGold(meta)).toBe(false);
  });
});
