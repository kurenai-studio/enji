# Task: hand-write a Cocos Creator 3.8 prefab (Badge)

Project: `/private/tmp/prefab-write/runs/T1-B-r1` (an Enji project; read `AGENTS.md` for the toolchain).
Write the prefab described below to `assets/resources/prefabs/test/Badge.prefab`.
There is no Cocos editor: author the prefab JSON yourself, either directly or with a small script you write (your choice;
keep any script outside `assets/`).

## Rules

- Engine built-in components only: no script components, no nested prefab instances.
- Never create or edit a `.meta` file by hand. After writing the prefab run
  `enji import /private/tmp/prefab-write/runs/T1-B-r1/assets/resources/prefabs/test/Badge.prefab --project /private/tmp/prefab-write/runs/T1-B-r1` (it generates the meta),
  then `enji check --project /private/tmp/prefab-write/runs/T1-B-r1`. Fix anything they report.
- Images are referenced through their sprite-frame sub-asset; uuids are in each image's `.meta` file.
- Do not modify anything else in the project. Do not use git or a browser. Do not read or write files outside the project directory.

## Grading

The prefab is loaded at runtime with `resources.load(path, Prefab)` + `instantiate`, then the instantiated node tree is compared
to the spec: node names, hierarchy and child order, positions, rotations, sizes and anchors, layers, and the listed component
properties. Properties not listed may keep engine defaults.

## Spec

2D UI prefab. Every node has a UITransform (anchor (0.5, 0.5) unless stated) and is on layer UI_2D.
Positions are local to the parent (Cocos convention: +y up, origin at the parent's anchor). Unlisted position = (0, 0).

- **Badge** (prefab root): size 248x80
  - cc.Sprite: spriteFrame = `assets/resources/ui/battle/lv_chip__248x80__normal.png`, type SIMPLE, sizeMode CUSTOM, color (255, 255, 255, 255)
  - **Text**: size 200x50
    - cc.Label: string "LV 16", fontSize 32, lineHeight 40, color (255, 255, 255, 255), bold, horizontalAlign CENTER, verticalAlign CENTER, overflow SHRINK, system font Arial

## When done

Reply with: the method you used (hand-written JSON / script), how many import/check rounds you needed,
and anything you were unsure about.
