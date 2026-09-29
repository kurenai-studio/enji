# Creator 3.8.8 meta gold

Source: max `ver` per importer observed under a local Creator **3.8.8** install
(`Resources/templates/{taxi,hello-3d-world}` + `resources/3d/engine/editor/assets`).

Public Cocos docs do **not** publish a 3.8↔4.0 importer/`ver` table. This file
is Enji’s contract for disk `.meta` stamps.

## Policy

1. **Cap**: never write `ver` higher than gold for that `importer`.
2. **Preserve lower**: do not raise an existing older-but-valid 3.8 `ver` to gold.
3. **Strip**: drop unknown top-level keys outside the 3.x meta allowlist.

## Notable facts

- `typescript` / `javascript` already use `4.0.24` in Creator 3.8.8 — that is
  the **importer** version, not “this project is Creator 4.0”.
- 4.0 host may emit higher stamps for some importers (e.g. `gltf-animation`
  `1.0.18` vs gold `1.0.16`). Enji caps those on write / `check` / `import`.

## Gold `ver` table

See [meta-gold.json](meta-gold.json) and `src/meta/gold.ts` (`META_GOLD_VER`)
for the machine-readable table shipped with the package.
