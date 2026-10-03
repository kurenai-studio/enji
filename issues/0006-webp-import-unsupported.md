# WebP images fail to import

Status: open. Found 2026-10-04 while rebuilding enji-demos/slots with the Power of Thor 2 symbol pack
from CocosSlotsEditor.

## Problem

Textures pulled from online games through HAR captures are often WebP, sometimes behind a `.png` or
`.jpg` name: the Thor 2 pack has 19 such files (Spine atlas pages `symbolM1.png`, the effect pages
`symbol_win.jpg`, the bitmap font page `font_symbolF.webp`). Creator 3.8.8 imports all of them.
`enji import` fails each one:

```
Unsupported MIME type: image/webp
```

and every Spine skeleton, effect and font that references a failed page is unusable at runtime.

The image importer decodes through `vendor/cocos-core/packages/portable-sharp/index.js`, a
sharp-compatible facade over Jimp. Jimp sniffs the bytes and has no WebP decoder. `formatFromPath`
already maps a `.webp` output to PNG, so only decoding is missing.

## Workaround

Transcode before importing, keeping the file names so the `.atlas` and `.fnt` references stay valid
(rename `.webp` pages and update the `.fnt` `page` line):

```sh
python3 -c "from PIL import Image; im = Image.open('symbolM1.png'); im.save('symbolM1.png', 'PNG')"
```

`.jpg` names were re-encoded as JPEG (quality 95), which loses the alpha a WebP page could carry; the
Thor 2 `.jpg` pages are opaque.

## Direction

- Decode WebP in portable-sharp with a pure-JS/WASM decoder (for example `@jsquash/webp` or
  `webp-wasm`), to RGBA, then hand the bitmap to Jimp as for the other formats.
- Until then, `enji import` could name the format in the error (`WebP is not supported; transcode to
  PNG`) instead of the generic MIME message.
