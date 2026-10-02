# Task: hand-write a Cocos Creator 3.8 prefab (ItemSlot)

Project: `/private/tmp/prefab-write/runs/T2-A-r1` (an Enji project; read `AGENTS.md` for the toolchain).
Write the prefab described below to `assets/resources/prefabs/test/ItemSlot.prefab`.
There is no Cocos editor: author the prefab JSON yourself, either directly or with a small script you write (your choice;
keep any script outside `assets/`).

## Rules

- Engine built-in components only: no script components, no nested prefab instances.
- Never create or edit a `.meta` file by hand. After writing the prefab run
  `enji import /private/tmp/prefab-write/runs/T2-A-r1/assets/resources/prefabs/test/ItemSlot.prefab --project /private/tmp/prefab-write/runs/T2-A-r1` (it generates the meta),
  then `enji check --project /private/tmp/prefab-write/runs/T2-A-r1`. Fix anything they report.
- Images are referenced through their sprite-frame sub-asset; uuids are in each image's `.meta` file.
- Do not modify anything else in the project. Do not use git or a browser. Do not read or write files outside the project directory.

## Grading

The prefab is loaded at runtime with `resources.load(path, Prefab)` + `instantiate`, then the instantiated node tree is compared
to the spec: node names, hierarchy and child order, positions, rotations, sizes and anchors, layers, and the listed component
properties. Properties not listed may keep engine defaults.

## Reference

The project already contains working prefabs under `assets/resources/prefabs/` (outside `test/`). You may read them as format examples.

## Spec

2D UI prefab. Every node has a UITransform (anchor (0.5, 0.5) unless stated) and is on layer UI_2D.
Positions are local to the parent (Cocos convention: +y up, origin at the parent's anchor). Unlisted position = (0, 0).

- **ItemSlot** (prefab root): size 200x240
  - cc.Button: target = node `<root>`, transition NONE, interactable, no click events
  - **Bg**: size 200x240
    - cc.Sprite: spriteFrame = `assets/resources/ui/battle/ink_well__408x456__normal.png`, type SLICED, sizeMode CUSTOM, color (255, 255, 255, 255)
  - **Frame**: size 200x240
    - cc.Sprite: spriteFrame = `assets/resources/ui/battle/portrait_rim__472x520__normal.png`, type SIMPLE, sizeMode CUSTOM, color (255, 255, 255, 255)
  - **Icon**: size 120x120, position (0, 24)
    - cc.Sprite: spriteFrame = `assets/resources/creatures/crimson_fox.png`, type SIMPLE, sizeMode CUSTOM, color (255, 255, 255, 255)
  - **Name**: size 180x36, position (0, -70)
    - cc.Label: string "回复药", fontSize 26, lineHeight 32, color (255, 255, 255, 255), bold, horizontalAlign CENTER, verticalAlign CENTER, overflow SHRINK, system font Arial
  - **CountBadge**: size 72x36, position (62, 98)
    - cc.Sprite: spriteFrame = `assets/resources/ui/battle/lv_chip__248x80__normal.png`, type SLICED, sizeMode CUSTOM, color (255, 255, 255, 255)
    - **Count**: size 64x30
      - cc.Label: string "x3", fontSize 22, lineHeight 28, color (17, 17, 17, 255), bold, horizontalAlign CENTER, verticalAlign CENTER, overflow SHRINK, system font Arial

## When done

Reply with: the method you used (hand-written JSON / script), how many import/check rounds you needed,
and anything you were unsure about.
