# Task: hand-write a Cocos Creator 3.8 prefab (LightRig)

Project: `/private/tmp/prefab-write/runs/T5-A-r1` (an Enji project; read `AGENTS.md` for the toolchain).
Write the prefab described below to `assets/resources/prefabs/test/LightRig.prefab`.
There is no Cocos editor: author the prefab JSON yourself, either directly or with a small script you write (your choice;
keep any script outside `assets/`).

## Rules

- Engine built-in components only: no script components, no nested prefab instances.
- Never create or edit a `.meta` file by hand. After writing the prefab run
  `enji import /private/tmp/prefab-write/runs/T5-A-r1/assets/resources/prefabs/test/LightRig.prefab --project /private/tmp/prefab-write/runs/T5-A-r1` (it generates the meta),
  then `enji check --project /private/tmp/prefab-write/runs/T5-A-r1`. Fix anything they report.
- Images are referenced through their sprite-frame sub-asset; uuids are in each image's `.meta` file.
- Do not modify anything else in the project. Do not use git or a browser. Do not read or write files outside the project directory.

## Grading

The prefab is loaded at runtime with `resources.load(path, Prefab)` + `instantiate`, then the instantiated node tree is compared
to the spec: node names, hierarchy and child order, positions, rotations, sizes and anchors, layers, and the listed component
properties. Properties not listed may keep engine defaults.

## Reference

The project already contains working prefabs under `assets/resources/prefabs/` (outside `test/`). You may read them as format examples.

## Spec

3D prefab. No node has a UITransform. Every node is on layer DEFAULT. Positions and rotations are local to the parent.

- **LightRig** (prefab root)
  - **Sun**: position (0, 10, 0), rotation (euler degrees) (-50, 30, 0)
    - cc.DirectionalLight: color (255, 244, 214, 255), illuminance (HDR) 80000 lux, shadows enabled
  - **Lamps**: position (0, 0, -1), rotation (euler degrees) (0, 90, 0)
    - **FillLight**: position (3, 2, -2)
      - cc.SphereLight: color (120, 160, 255, 255), luminance (HDR) 2000, size 0.5, range 6
    - **RimSpot**: position (-4, 5, 4), rotation (euler degrees) (-35, -45, 0)
      - cc.SpotLight: color (255, 120, 80, 255), luminance (HDR) 3000, size 0.2, range 12, spotAngle 40 degrees
  - **Probes**
    - cc.LightProbeGroup: generating method UNIFORM, minPos (-4, 0, -4), maxPos (4, 3, 4), probe counts X=3 Y=2 Z=3, and these 18 probe positions (local, in this order): (-4, 0, -4) (0, 0, -4) (4, 0, -4) (-4, 0, 0) (0, 0, 0) (4, 0, 0) (-4, 0, 4) (0, 0, 4) (4, 0, 4) (-4, 3, -4) (0, 3, -4) (4, 3, -4) (-4, 3, 0) (0, 3, 0) (4, 3, 0) (-4, 3, 4) (0, 3, 4) (4, 3, 4)
  - **Reflection**: position (0, 1.5, 0)
    - cc.ReflectionProbe: probeType CUBE, resolution 256, size (5, 1.5, 5), backgroundColor (20, 24, 32, 255)

## When done

Reply with: the method you used (hand-written JSON / script), how many import/check rounds you needed,
and anything you were unsure about.
