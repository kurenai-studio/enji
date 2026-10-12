# Task: hand-write a Cocos Creator 3.8 prefab (BattleScreen)

Project: `/private/tmp/prefab-write/runs/T4-A-r1` (an Enji project; read `AGENTS.md` for the toolchain).
Write the prefab described below to `assets/resources/prefabs/test/BattleScreen.prefab`.
There is no Cocos editor: author the prefab JSON yourself, either directly or with a small script you write (your choice;
keep any script outside `assets/`).

## Rules

- Engine built-in components only: no script components, no nested prefab instances.
- Never create or edit a `.meta` file by hand. After writing the prefab run
  `enji import /private/tmp/prefab-write/runs/T4-A-r1/assets/resources/prefabs/test/BattleScreen.prefab --project /private/tmp/prefab-write/runs/T4-A-r1` (it generates the meta),
  then `enji check --project /private/tmp/prefab-write/runs/T4-A-r1`. Fix anything they report.
- Images are referenced through their sprite-frame sub-asset; uuids are in each image's `.meta` file.
- Do not modify anything else in the project. Do not use git or a browser. Do not read or write files outside the project directory.

## Grading

The prefab is loaded at runtime with `resources.load(path, Prefab)` + `instantiate`, then the instantiated node tree is compared
to the spec: node names, hierarchy and child order, positions, rotations, sizes and anchors, layers, and the listed component
properties. Properties not listed may keep engine defaults.

## Reference

The project already contains working prefabs under `assets/resources/prefabs/` (outside `test/`). You may read them as format examples.

## Spec

Build the prefab **BattleScreen** from the layout file `assets/resources/ui/battle/uilayout.json` (already in the project).
The file describes a 720x1280 battle screen: `parts[]` with `id`, `parent` (part id or null), `type`, `render`, `kind`,
rectangle `x, y, w, h` (top-left origin, y grows downward, design pixels), `z`, optional `img`, `text`, `bar`, `slice`.
`dir` is the image directory relative to `assets/resources/`.

Rules (follow exactly):
1. Root node **BattleScreen**: size 720x1280, position (0, 0). Its first child is **Bg**: size 720x1280, position (0, 0),
   cc.Sprite with `assets/resources/ui/battle/bg_main.png`, type SIMPLE, sizeMode CUSTOM, white.
2. Every part becomes exactly one node named after its `id`. Hierarchy follows `parent`: parts with `parent: null` are children of
   BattleScreen (after Bg); others are children of their parent part's node.
3. Children order (for BattleScreen after Bg, and inside every part): ascending `z`; ties keep the order of appearance in `parts[]`.
4. Every part node: anchor (0.5, 0.5), size `w x h`. Position = (cx - pcx, pcy - cy) where (cx, cy) = (x + w/2, y + h/2) is the
   part's rectangle center and (pcx, pcy) is the parent part's rectangle center, or (360, 640) for top-level parts.
5. Part has `img`: add cc.Sprite using image `dir + img.normal`; type SLICED if `kind` is "nine_slice", else SIMPLE; sizeMode CUSTOM; color white.
6. Part has `text`: add cc.Label: string `text.s`, fontSize `text.fs`, lineHeight round(fs * 1.25), color `text.col` with alpha 255,
   bold = `text.bold`, horizontalAlign from `text.align` (start=LEFT, middle=CENTER, end=RIGHT), verticalAlign CENTER, overflow SHRINK,
   system font Arial.
7. Part has `type` "button" and `render` "program": add cc.Button, target = that node itself, transition SCALE, zoomScale 0.95, no click events.
8. Part has `bar`: after all of its other children, append one more child **Fill**: anchor (0, 0.5), position (-w/2, 0),
   size (w * 0.75) x h, cc.Sprite using the image of the part's child `<id>_track` (same file), type SLICED, sizeMode CUSTOM,
   color `bar.col` with alpha 255.
9. Parts that match none of 5-7 get only the UITransform. Every node in this prefab has a UITransform and layer UI_2D.


## When done

Reply with: the method you used (hand-written JSON / script), how many import/check rounds you needed,
and anything you were unsure about.
