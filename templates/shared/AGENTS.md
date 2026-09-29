# Cocos project rules (Enji / Creator 3.8)

This is a **Cocos Creator 3.8.8** project. Preview runs through Enji (4.0 host
with **3.8 `.meta` caps**). There is **no** `enji publish` — build in the
Creator 3.8.8 IDE (or a separate build MCP).

## Where to write

- Game code goes under `assets/game/`. Create files and folders freely.
- `assets/game/MainView.ts` must export `class MainView` with `bind(root: Node)`.
  It is the entry point: `assets/enji/Boot.ts` runs
  `root.addComponent(MainView).bind(root)` when the scene starts.
- Prefabs go under `assets/resources/prefabs/`, materials under
  `assets/resources/materials/`, other files (images, audio) under `assets/resources/`.
- Do not edit `assets/enji/Boot.ts` or `*.scene`.
- Never write or edit `.meta` files by hand. Enji / the host creates them on
  import and **keeps importer `ver` on Creator 3.8.8 gold**. Get uuids with
  `enji asset info <file>`.
- `assets/enji/helpers.ts` holds small helpers (`loadPrefab`, canvas, labels).

## `@ccclass` reserved names

Do **not** use these `@ccclass` names (engine collisions):

- `game`, `Game`
- `camera`, `Camera`
- `cc`, `CC`

Prefer unique names like `MainView`, `EnemyView`.

## Prefabs

- A prefab must not contain script components.
- A prefab must not reference another prefab. Compose in code.
- Prefer handwritten minimal prefabs; the importer may reformat them.

## Getting uuids

```sh
enji asset info assets/resources/materials/red.mtl
```

Returns `{ ok, asset: { uuid, type, url, subAssets } }`. Enji normalizes `.meta`
after import so stamps stay 3.8-compatible.

## Feedback loop

```sh
enji host start
# edit assets/…
enji logs --errors
enji check
```

`enji check` scans reserved `@ccclass` names and re-caps any `.meta` above
3.8 gold. It does **not** run a full TypeScript publish build.

## Build (not Enji)

Open this project in **Cocos Creator 3.8.8** and build there. Do not install
kurenai into a 3.8 project (kurenai would write 4.0-oriented defaults / publish).

## Product line

| Tool | Engine | Role |
|------|--------|------|
| Akane | Creator 2.x | reserved (not this package) |
| **Enji** | Creator **3.8** | preview / edit, no publish |
| Kurenai | Creator 4.0 | full preview + publish |
