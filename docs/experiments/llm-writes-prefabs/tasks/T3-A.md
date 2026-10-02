# Task: hand-write a Cocos Creator 3.8 prefab (BagDialog)

Project: `/private/tmp/prefab-write/runs/T3-A-r1` (an Enji project; read `AGENTS.md` for the toolchain).
Write the prefab described below to `assets/resources/prefabs/test/BagDialog.prefab`.
There is no Cocos editor: author the prefab JSON yourself, either directly or with a small script you write (your choice;
keep any script outside `assets/`).

## Rules

- Engine built-in components only: no script components, no nested prefab instances.
- Never create or edit a `.meta` file by hand. After writing the prefab run
  `enji import /private/tmp/prefab-write/runs/T3-A-r1/assets/resources/prefabs/test/BagDialog.prefab --project /private/tmp/prefab-write/runs/T3-A-r1` (it generates the meta),
  then `enji check --project /private/tmp/prefab-write/runs/T3-A-r1`. Fix anything they report.
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

Slot positions below are where the cc.Layout places them; write them into the prefab as well.

- **BagDialog** (prefab root): size 720x1280
  - cc.BlockInputEvents
  - **Dim**: size 720x1280
    - cc.Sprite: spriteFrame = `assets/resources/ui/battle/bar_track__500x32__normal.png`, type SLICED, sizeMode CUSTOM, color (0, 0, 0, 170)
  - **Panel**: size 640x820
    - cc.Sprite: spriteFrame = `assets/resources/ui/battle/comic_panel__1344x416__normal.png`, type SLICED, sizeMode CUSTOM, color (255, 255, 255, 255)
    - **TitlePlate**: size 260x72, position (0, 370)
      - cc.Sprite: spriteFrame = `assets/resources/ui/battle/lv_chip__248x80__normal.png`, type SLICED, sizeMode CUSTOM, color (255, 255, 255, 255)
      - **Title**: size 240x56
        - cc.Label: string "道具袋", fontSize 36, lineHeight 45, color (255, 255, 255, 255), bold, horizontalAlign CENTER, verticalAlign CENTER, overflow SHRINK, system font Arial
    - **Close**: size 72x72, position (276, 370)
      - cc.Sprite: spriteFrame = `assets/resources/ui/battle/lv_chip__248x80__normal.png`, type SLICED, sizeMode CUSTOM, color (255, 255, 255, 255)
      - cc.Button: target = node `Panel/Close`, transition SCALE, zoomScale 0.9, interactable, no click events
      - **X**: size 60x60
        - cc.Label: string "×", fontSize 40, lineHeight 50, color (255, 255, 255, 255), bold, horizontalAlign CENTER, verticalAlign CENTER, overflow SHRINK, system font Arial
    - **Grid**: size 580x520, position (0, -10)
      - cc.Layout: type GRID, resizeMode NONE, cellSize 180x240, startAxis HORIZONTAL, spacingX 20, spacingY 40, all paddings 0, constraint FIXED_COL, constraintNum 3, horizontalDirection LEFT_TO_RIGHT, verticalDirection TOP_TO_BOTTOM
      - **Slot0**: size 180x240, position (-200, 140)
        - cc.Button: target = node `Panel/Grid/Slot0`, transition NONE, interactable, no click events
        - **Bg**: size 180x240
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/ink_well__408x456__normal.png`, type SLICED, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Frame**: size 180x240
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/portrait_rim__472x520__normal.png`, type SIMPLE, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Icon**: size 110x110, position (0, 24)
          - cc.Sprite: spriteFrame = `assets/resources/creatures/crimson_fox.png`, type SIMPLE, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Name**: size 170x36, position (0, -70)
          - cc.Label: string "回复药", fontSize 26, lineHeight 32, color (255, 255, 255, 255), bold, horizontalAlign CENTER, verticalAlign CENTER, overflow SHRINK, system font Arial
        - **CountBadge**: size 72x36, position (54, 98)
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/lv_chip__248x80__normal.png`, type SLICED, sizeMode CUSTOM, color (255, 255, 255, 255)
          - **Count**: size 64x30
            - cc.Label: string "x3", fontSize 22, lineHeight 28, color (17, 17, 17, 255), bold, horizontalAlign CENTER, verticalAlign CENTER, overflow SHRINK, system font Arial
      - **Slot1**: size 180x240, position (0, 140)
        - cc.Button: target = node `Panel/Grid/Slot1`, transition NONE, interactable, no click events
        - **Bg**: size 180x240
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/ink_well__408x456__normal.png`, type SLICED, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Frame**: size 180x240
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/portrait_rim__472x520__normal.png`, type SIMPLE, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Icon**: size 110x110, position (0, 24)
          - cc.Sprite: spriteFrame = `assets/resources/creatures/ink_raven.png`, type SIMPLE, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Name**: size 170x36, position (0, -70)
          - cc.Label: string "大回复药", fontSize 26, lineHeight 32, color (255, 255, 255, 255), bold, horizontalAlign CENTER, verticalAlign CENTER, overflow SHRINK, system font Arial
        - **CountBadge**: size 72x36, position (54, 98)
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/lv_chip__248x80__normal.png`, type SLICED, sizeMode CUSTOM, color (255, 255, 255, 255)
          - **Count**: size 64x30
            - cc.Label: string "x1", fontSize 22, lineHeight 28, color (17, 17, 17, 255), bold, horizontalAlign CENTER, verticalAlign CENTER, overflow SHRINK, system font Arial
      - **Slot2**: size 180x240, position (200, 140)
        - cc.Button: target = node `Panel/Grid/Slot2`, transition NONE, interactable, no click events
        - **Bg**: size 180x240
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/ink_well__408x456__normal.png`, type SLICED, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Frame**: size 180x240
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/portrait_rim__472x520__normal.png`, type SIMPLE, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Icon**: size 110x110, position (0, 24)
          - cc.Sprite: spriteFrame = `assets/resources/creatures/crimson_fox.png`, type SIMPLE, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Name**: size 170x36, position (0, -70)
          - cc.Label: string "解毒剂", fontSize 26, lineHeight 32, color (255, 255, 255, 255), bold, horizontalAlign CENTER, verticalAlign CENTER, overflow SHRINK, system font Arial
        - **CountBadge**: size 72x36, position (54, 98)
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/lv_chip__248x80__normal.png`, type SLICED, sizeMode CUSTOM, color (255, 255, 255, 255)
          - **Count**: size 64x30
            - cc.Label: string "x5", fontSize 22, lineHeight 28, color (17, 17, 17, 255), bold, horizontalAlign CENTER, verticalAlign CENTER, overflow SHRINK, system font Arial
      - **Slot3**: size 180x240, position (-200, -140)
        - cc.Button: target = node `Panel/Grid/Slot3`, transition NONE, interactable, no click events
        - **Bg**: size 180x240
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/ink_well__408x456__normal.png`, type SLICED, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Frame**: size 180x240
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/portrait_rim__472x520__normal.png`, type SIMPLE, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Icon**: size 110x110, position (0, 24)
          - cc.Sprite: spriteFrame = `assets/resources/creatures/ink_raven.png`, type SIMPLE, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Name**: size 170x36, position (0, -70)
          - cc.Label: string "怪谈球", fontSize 26, lineHeight 32, color (255, 255, 255, 255), bold, horizontalAlign CENTER, verticalAlign CENTER, overflow SHRINK, system font Arial
        - **CountBadge**: size 72x36, position (54, 98)
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/lv_chip__248x80__normal.png`, type SLICED, sizeMode CUSTOM, color (255, 255, 255, 255)
          - **Count**: size 64x30
            - cc.Label: string "x12", fontSize 22, lineHeight 28, color (17, 17, 17, 255), bold, horizontalAlign CENTER, verticalAlign CENTER, overflow SHRINK, system font Arial
      - **Slot4**: size 180x240, position (0, -140)
        - cc.Button: target = node `Panel/Grid/Slot4`, transition NONE, interactable, no click events
        - **Bg**: size 180x240
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/ink_well__408x456__normal.png`, type SLICED, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Frame**: size 180x240
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/portrait_rim__472x520__normal.png`, type SIMPLE, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Icon**: size 110x110, position (0, 24)
          - cc.Sprite: spriteFrame = `assets/resources/creatures/crimson_fox.png`, type SIMPLE, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Name**: size 170x36, position (0, -70)
          - cc.Label: string "烟雾弹", fontSize 26, lineHeight 32, color (255, 255, 255, 255), bold, horizontalAlign CENTER, verticalAlign CENTER, overflow SHRINK, system font Arial
        - **CountBadge**: size 72x36, position (54, 98)
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/lv_chip__248x80__normal.png`, type SLICED, sizeMode CUSTOM, color (255, 255, 255, 255)
          - **Count**: size 64x30
            - cc.Label: string "x2", fontSize 22, lineHeight 28, color (17, 17, 17, 255), bold, horizontalAlign CENTER, verticalAlign CENTER, overflow SHRINK, system font Arial
      - **Slot5**: size 180x240, position (200, -140)
        - cc.Button: target = node `Panel/Grid/Slot5`, transition NONE, interactable, no click events
        - **Bg**: size 180x240
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/ink_well__408x456__normal.png`, type SLICED, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Frame**: size 180x240
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/portrait_rim__472x520__normal.png`, type SIMPLE, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Icon**: size 110x110, position (0, 24)
          - cc.Sprite: spriteFrame = `assets/resources/creatures/ink_raven.png`, type SIMPLE, sizeMode CUSTOM, color (255, 255, 255, 255)
        - **Name**: size 170x36, position (0, -70)
          - cc.Label: string "复活草", fontSize 26, lineHeight 32, color (255, 255, 255, 255), bold, horizontalAlign CENTER, verticalAlign CENTER, overflow SHRINK, system font Arial
        - **CountBadge**: size 72x36, position (54, 98)
          - cc.Sprite: spriteFrame = `assets/resources/ui/battle/lv_chip__248x80__normal.png`, type SLICED, sizeMode CUSTOM, color (255, 255, 255, 255)
          - **Count**: size 64x30
            - cc.Label: string "x1", fontSize 22, lineHeight 28, color (17, 17, 17, 255), bold, horizontalAlign CENTER, verticalAlign CENTER, overflow SHRINK, system font Arial

## When done

Reply with: the method you used (hand-written JSON / script), how many import/check rounds you needed,
and anything you were unsure about.
