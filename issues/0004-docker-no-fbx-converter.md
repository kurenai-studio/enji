# Builtin primitive meshes are missing in Docker (no Linux FBX converter)

Status: open. Found 2026-10-03 while reproducing phantom-pocket-3d in `enji-dev:local`
(linux/arm64).

## Problem

A prefab that references the engine's builtin primitive meshes (the sub-assets
of `primitives.fbx`, uuid `1263d74c-8167-4928-91a6-4e2672411f47`) works with a
host on macOS but fails in the Docker preview:

```
The asset 1263d74c-8167-4928-91a6-4e2672411f47@a804a is missing!
http 404 …/assets/resources/import/12/1263d74c-…@a804a.json
```

`vendor/cocos-core/node_modules/@cocos/fbx-gltf-conv/bin/` ships only `darwin/`
and `win32/` binaries. The image's `npm install` does not add a Linux one, so
the internal `primitives.fbx` (and any project `.fbx`) cannot be imported in
the container. The same prefab (`enji-demos/phantom-pocket-3d`
`BattleStage.prefab`, 80 primitive MeshRenderers) loads on the Mac host.

## Workaround

Ship your own meshes as glTF/GLB (the repro generated `prims.glb` with
cube/quad/cylinder/sphere/torus and referenced its mesh sub-assets).

## Direction

- Bake the internal library entries for `primitives.fbx` (and other internal
  FBX) into the image, so the container never has to convert them.
- Or install a Linux FBX-glTF-conv build in `docker/Dockerfile`, if one exists
  for linux-arm64 / x64.
- `enji import` of a project `.fbx` in Docker should fail with a clear message
  instead of leaving a missing sub-asset.
