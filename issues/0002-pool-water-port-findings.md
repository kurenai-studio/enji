# Enji rough edges found while porting the three.js pool demo

Status: open. Recorded 2026-09-29 on branch `feat/3d-water` from the
`pool-water` port (now in the enji-demos repository). Already fixed in that branch: stale `asset-error`
entries (now superseded by a successful import of the same path) and the
template Canvas camera drawing the 3D world a second time.

## 1. `enji import` hides the importer's reason

A failed import prints only `import failed`. The effect compiler's message
(for example `EFX2001: can not resolve './chunks/pool-world-vs'`) is not in the
response or in `enji logs --errors`. Capture the importer error and put it in
both the `/__enji/asset` response and the `asset-error` log line.

## 2. Failed files are not retried until they change

An unchanged file whose import failed (for example because a chunk it includes
was missing at the time) is skipped by later refreshes until it is touched.
Re-import files whose last import failed when a dependency changes, or at least
on an explicit `enji import`.

## 3. Nested relative chunk includes resolve against the effect

A relative `#include` inside a `.chunk` resolves against the including
effect's folder. Workaround documented in `docs/rendering.md` (include every
chunk from the effect). Decide whether to fix it in the host importer or keep it
documented; check what Creator 3.8.8 does before changing anything.

## 4. Effect names carry a relative prefix

Runtime effect names come out as `../resources/effects/<name>` instead of
`<name>`, which makes `EffectAsset.get(name)` and error messages awkward.

## 5. Slow boot and full reload on every script edit

The first boot took about 54 s (up to about 250 s under machine load) with about
190 requests, and every script edit reloads the whole page. Profile the boot and
look at caching the engine chunks.

## 6. Mouse wheel scaling differs by platform

Cocos web input reports `scrollY = -5 * DOM deltaY`; other input paths scale by
1 or 120. The example divides by 5. Consider a helper (or a note in AGENTS.md)
that normalizes wheel deltas to DOM pixels.
