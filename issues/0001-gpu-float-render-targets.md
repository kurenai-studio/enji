# GPU simulation needs float render targets (project-level pipeline pass)

Status: open. Recorded 2026-09-29 on branch `feat/3d-water`.

## Problem

`RenderTexture` is always 8 bits per channel. `RenderTexture._initWindow`
overwrites every color attachment format with `root.device.swapchainFormat`,
so a requested `RGBA16F` / `RGBA32F` `passInfo` is ignored:

```js
_windowInfo.renderPassInfo.colorAttachments.forEach(colorAttachment => {
  colorAttachment.format = root.device.swapchainFormat;
});
```

Found in the Enji preview engine source (4.0.0-alpha.33). Not yet checked
against the Creator 3.8.8 engine source, and no pixel readback test has been
written yet; the prototype should start with one (write values outside [0, 1],
read them back through a second pass).

The device itself supports it: RGBA16F reports format features 27 and RGBA32F
31 (both include RENDER_TARGET), and the builtin pipeline already uses
`RGBA16F` intermediates for HDR.

Consequence: GPU ping-pong simulations (height fields, fluids, particles) are
not possible through the public `RenderTexture` API. The current workaround is
CPU simulation + `createDataTexture(w, h, { float: true })` upload each frame.
That is fine at 256×256 (about 1 ms and 1 MB upload per frame) but not at
1024×1024 or 100k+ particles (10+ ms and 16 MB per frame).

## Proposed direction

Keep it in project code, not an engine patch (an engine patch would only work in
the Enji preview and break Creator 3.8.8 builds).

1. Preferred: a `BuiltinPipelinePassBuilder` component (the extension point in
   `default_renderpipeline/builtin-pipeline-pass.ts`, same mechanism as
   `builtin-dof-pass.ts`) that declares float targets with
   `ppl.addRenderTarget(name, gfx.Format.RGBA16F, w, h)` and runs simulation
   materials with `addFullscreenQuad(material, passIndex)`.
2. Fallback: pack floats into RGBA8 in shaders and ping-pong ordinary
   `RenderTexture`s (point sampling only, limited precision).
3. Last resort: a full custom pipeline registered with
   `rendering.setCustomPipeline` + `CUSTOM_PIPELINE_NAME`.

Ship the result as a helper (for example `assets/enji/gpgpu.ts` +
`createGpuSimulation`) and document it in `docs/rendering.md`.

## Open questions to verify with a prototype

- Do pipeline-managed render targets (`addRenderTarget`) keep their contents
  across frames, or can they be aliased? Ping-pong needs persistence. If not,
  create the float textures ourselves and hand them to the pipeline as external
  resources.
- How does an ordinary material sample a pipeline-managed target (for example
  the water surface reading the simulated height field)?
- Does `BuiltinPipelinePassBuilder` exist with the same interface in Creator
  3.8.8? The prototype must run both in the Enji preview and in a Creator 3.8.8
  build (needs a local Creator 3.8.8).

## Done when

- A GPU height-field prototype runs in the Enji preview and in a Creator 3.8.8
  web build.
- `examples/pool-water` can switch its simulation from CPU to GPU, with frame
  time measured for both at 256² and 1024².
- `docs/rendering.md` documents the helper and its limits.
