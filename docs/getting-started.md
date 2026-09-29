<!-- enji-doc-version: 0.3.1 -->
# Enji (Creator 3.8) — agent bootstrap

Verified against **enji v0.3.1** (2026-09-29). After install, `enji --version`
must print the same version; if it does not, re-read this file from the
repository you actually installed.

Treat this file as the **only entry point**. Follow it in order. After
`enji init`, coding rules live in the project root `AGENTS.md` (this file covers
tooling install and the feedback loop).

## Goal

Use **Enji** to develop / preview **Cocos Creator 3.8** projects.

- Do **not** use kurenai for 3.8 work, and do not install it alongside Enji.
- Do **not** install full cocos-cli / PinK.
- Enji has **no** `publish`. Ship builds with the local **Creator 3.8.8 IDE**
  (or another build MCP).

## If you followed older instructions

Older notes, skills or memories may describe a previous layout. They are obsolete:

- **v0.1** needed a sibling `kurenai` checkout (`file:../kurenai`) and `npm run build`.
  Since v0.2 Enji is self-contained: delete any kurenai clone you made for Enji
  and install only as below.
- **v0.1** required Node 24 (native `gl` module). Since v0.2 there are no native
  addons to build; Node 22 and 24 both work.
- **v0.2** `enji asset info` imported files and wrote `.meta`. Since v0.3 that is
  `enji import`; `asset info` only reads an existing `.meta`.
- **v0.3.0** `enji check` reported only `scanned` / `changed`. Since v0.3.1 it
  also warns about unknown importers and orphan `.meta` files (see Loop), and
  `asset info` waits briefly for the running host to import a new file.
- **v0.3** project `AGENTS.md` said `builtin-standard` is not available in
  preview. It is (loaded on demand); see [rendering.md](rendering.md). Projects
  created before v0.4 also lack the rendering helpers in `assets/enji/helpers.ts`
  (`loadBuiltinEffect`, `updateDynamicMesh`, `createDataTexture`,
  `createTexturePass`); copy them from `templates/shared/assets/enji/helpers.ts`.

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
about 80 MB download). npm may warn that the postinstall script is not covered
by `allowScripts`; that is harmless. If the script was skipped, `enji host start`
and `enji import` install the runtime dependencies on first use (or run
`node scripts/install-cocos-deps.mjs`). `init`, `check` and `asset info` do not
need them.

Check: `enji --version` and `enji --help`. Without link: `node <enji>/bin/enji.mjs --help`.

**On-disk `.meta` is capped to the Creator 3.8.8 gold table.** Never hand-write `.meta`.

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
enji init <dir> [--3d]      # --3d: 3d modules, lit scene, PBR material
cd <dir>
enji host start             # prints previewUrl; open it in a browser
# after adding or changing asset files (images, prefabs, materials, audio, …)
enji import <file|dir>...   # writes .meta, returns uuids
enji logs --errors          # trust it only when "clean": true
enji check
enji asset info <file>      # read-only uuid lookup of an imported file
enji context
```

Also: `enji open`, `enji host status|stop`.
There is **no** `enji publish`. For release builds, open Creator **3.8.8**.

The preview port is **not fixed**: it starts at 7460 and moves to the next free
port when that one is taken. Always use the `previewUrl` printed by
`enji host start` / `enji host status`; never hard-code a port.

`enji logs --errors` returns `clean: true` only when a preview page has booted
and no current errors remain. `clean: false` with `previewPage: "none"` means no
page has run yet — open or reload `previewUrl` and ask again. Runtime errors
carry `source` (first stack frame, mapped to `assets/…ts:line`); a shader
compile failure is one entry whose `shader` field names the `.effect` file and
line. All open preview tabs log into the same buffer (`openPages`, `page`).
An `asset-error` clears once `enji import` of the same path succeeds.

3D, lighting, custom shaders, render textures and per-frame meshes:
read [rendering.md](rendering.md) first. It lists what the bundled renderer
supports (for example, render textures are 8-bit, so float simulations run on
the CPU and upload a float texture) and the helpers that make it work.

`enji check` **writes**: any `.meta` `ver` above gold is rewritten in place and
listed in `metaNormalize.files`, so expect those files in `git diff`. It also
lists, as `warnings`, `.meta` files naming an importer Creator 3.8 does not know
(`metaNormalize.unknownImporters`; enji cannot cap those, and `enji import` keeps
the importer the `.meta` names, so correct the name and keep the uuid) and orphan
`.meta` files whose asset is gone (`metaNormalize.orphans`; delete them).

While the host runs it imports new files by itself, and `enji asset info` waits
up to 3 s for that. Outside that window, or with no host, use `enji import`.

## What to edit

- Only `assets/game/` and `assets/resources/` (plus paths allowed by `AGENTS.md`)
- Entry: `MainView.bind(root)` in `assets/game/MainView.ts`
- Do not hand-edit `assets/enji/Boot.ts`, `*.scene`, or any `*.meta`
- Reserved `@ccclass` names: `game`, `Game`, `camera`, `Camera`, `cc`, `CC`

Full authoring rules: project **`AGENTS.md`** (camera `clearFlags`, materials,
helpers). Rendering details: [rendering.md](rendering.md).

## Checklist

- [ ] `enji --version` prints the version this file was verified against
- [ ] `enji --help` works from a single enji clone (no kurenai checkout)
- [ ] `enji host start` returns a preview URL; after opening it, `enji logs --errors` reports `"clean": true`
- [ ] No `.meta` has an importer `ver` above the Creator 3.8.8 gold table
  ([meta-gold.json](meta-gold.json)). `typescript` / `javascript` at `4.0.24` **is**
  the 3.8.8 gold value, not a 4.0 stamp — see
  [meta-gold.md, Notable facts](meta-gold.md#notable-facts). Do not edit `.meta`
  to "fix" it; `enji check` caps anything above gold.
- [ ] Shipping goes through Creator 3.8.8 IDE, not a publish subcommand
