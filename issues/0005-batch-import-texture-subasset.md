# glTF texture sub-asset left unimported when imported in one batch with its texture

Status: open. Found 2026-10-03 while reproducing phantom-pocket-3d in Docker.

## Problem

`enji import` of a folder holding several `.glb` files and their shared
`Textures/colormap.png` left the texture sub-asset of the GLBs that sort before
`Textures/` (`animal-bee.glb`, `animal-crab.glb`) at `"imported": false`. At
runtime:

```
The asset 9731abe0-c27b-476e-be30-5726be45929a@96c50 is missing!
```

Running the same `enji import` again was a no-op (the files had not changed).

## Workaround

`touch` the affected `.glb` files, then `enji import` them again.

## Direction

- Import images before models in a batch, or re-import models whose external
  textures were imported later in the same batch.
- `enji import` could report sub-assets that ended with `imported: false` in its
  result (`failed` stayed 0 here).
