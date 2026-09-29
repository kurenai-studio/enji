# Enji (Creator 3.8) — agent bootstrap

Treat this file as the **only entry point**. Follow it in order. After
`enji init`, coding rules live in the project root `AGENTS.md` (this file covers
tooling install and the feedback loop).

## Goal

Use **Enji** to develop / preview **Cocos Creator 3.8** projects.

- Do **not** use kurenai for 3.8 work, and do not install it alongside Enji.
- Do **not** install full cocos-cli / PinK.
- Enji has **no** `publish`. Ship builds with the local **Creator 3.8.8 IDE**
  (or another build MCP).

## Environment

- Node.js **22+**, npm, GitHub access
- Nothing else. Enji is self-contained: the preview runtime is bundled in
  `vendor/cocos-core`. Do **not** clone kurenai or cocos-cli next to it.

## Install

```sh
git clone --depth 1 https://github.com/kurenai-studio/enji.git
cd enji && npm install --omit=dev && npm link
```

`lib/` is committed, so no build step is needed. `npm install` also installs the
runtime's npm dependencies into `vendor/cocos-core/node_modules` (postinstall,
about 80 MB download). If scripts were skipped (`--ignore-scripts`), run
`node scripts/install-cocos-deps.mjs`; `enji host start` also does this on
first run.

Check: `enji --help`. Without link: `node <enji>/bin/enji.mjs --help`.

**On-disk `.meta` is forced down to Creator 3.8.8 gold.** Never hand-write `.meta`.

## Not covered by the bundled runtime

The runtime is trimmed to what preview needs. These need the Creator 3.8.8 IDE:

- Publishing / building (web, native, mini-games)
- Legacy FBX importer (`userData.legacyFbxImporter`); the default FBX importer works
- Converting PNG/JPG panoramas to HDR cubemaps
- Lightmap baking and lightmap UV generation
- Texture compression (ASTC / ETC / PVRTC)

If an asset needs one of these, tell the user to open the project in Creator 3.8.8.

## Loop

```sh
enji init <dir> [--template base-ai]
cd <dir>
enji host start
# after adding or changing asset files (images, prefabs, materials, audio, …)
enji import <file|dir>...   # writes .meta, returns uuids
enji logs --errors
enji check
enji asset info <file>      # read-only uuid lookup of an imported file
enji context
```

Also: `enji open`, `enji host status|stop`.  
There is **no** `enji publish`. For release builds, open Creator **3.8.8**.

## What to edit

- Only `assets/game/` and `assets/resources/` (plus paths allowed by `AGENTS.md`)
- Entry: `MainView.bind(root)` in `assets/game/MainView.ts`
- Do not hand-edit `assets/enji/Boot.ts`, `*.scene`, or any `*.meta`
- Reserved `@ccclass` names: `game`, `Game`, `camera`, `Camera`, `cc`, `CC`

Full authoring rules: project **`AGENTS.md`** (camera `clearFlags`, preview
`builtin-unlit`, etc.).

## Checklist

- [ ] `enji --help` works from a single enji clone (no kurenai checkout)
- [ ] `enji host start` returns a preview URL; `enji logs --errors` stays clean
- [ ] New assets keep 3.8-shaped `.meta` (no 4.0.x importer `ver`)
- [ ] Shipping goes through Creator 3.8.8 IDE, not a publish subcommand
