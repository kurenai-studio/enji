# Enji（臙脂）

Creator **3.8** preview / edit for agents. **No publish.**

Product line (浅 → 深): Pink → Akane (reserved) → **Enji (3.8)** → Kurenai (4.0).

> Agents working on **3.8** projects install **enji**, not kurenai.  
> Self-contained: the preview runtime is bundled; **disk `.meta` is capped to Creator 3.8.8**.

## One-liner (for agents)

Paste only this; everything else is in the linked doc:

```text
Download and follow https://raw.githubusercontent.com/kurenai-studio/enji/main/docs/getting-started.md (Enji / Creator 3.8).
```

If the repo is already cloned: `Read enji/docs/getting-started.md and follow it exactly.`

## Why a separate repo

| | kurenai | enji |
|---|---|---|
| Promise | Creator 4.0 + publish | Creator 3.8 preview/edit |
| `.meta` | 4.0 host defaults | **forced 3.8 gold** |
| Build | `kurenai publish` | Creator 3.8 IDE / other MCP |

## CLI

```text
enji --version
enji init <dir> [--template base-ai]
enji open [--project <dir>]
enji host start|status|stop [--project <dir>]
enji import <file|dir>...      # import assets, write .meta, return uuids
enji asset info <file>         # read-only lookup from an existing .meta
enji logs [--errors [--all]]
enji check
enji context
```

There is **no** `enji publish`.

## Meta contract

See [docs/meta-gold.md](docs/meta-gold.md). Host writes go through an fs hook
plus post-import normalization so importer `ver` never exceeds Creator 3.8.8 gold.

## Install

```sh
git clone --depth 1 https://github.com/kurenai-studio/enji.git
cd enji && npm install --omit=dev && npm link
```

No other checkout is needed. `lib/` is committed; postinstall fetches the
runtime's npm dependencies (about 80 MB download, 380 MB on disk).

## Bundled runtime

`vendor/cocos-core` is a trimmed snapshot of the cocos-cli 0.0.1-alpha.41
runtime (engine 4.0.0-alpha.33, prebuilt) that the preview host needs, plus
`host/cocos-host.mjs`. Enji owns this copy; it does not track kurenai.

Removed: publishing/builder dependencies, CLI/MCP/API surface, engine TypeScript
sources, source maps, and native tools except `cmft`. Not supported as a result:
publishing, the legacy FBX importer, panorama-to-HDR conversion, lightmap UV
generation, and texture compression. Use the Creator 3.8.8 IDE for those.

Maintainers regenerate it with:

```sh
npm run vendor:cocos -- --from <path-to-cocos-core-source>
```

See `scripts/vendor-cocos-core.mjs` for the keep/drop rules; `ENJI_VENDOR.json`
records the source commit and what was dropped.

## Acceptance checklist

- [x] Self-contained `enji` package (bundled, trimmed runtime; no kurenai checkout)
- [x] Meta gold table from Creator 3.8.8 samples
- [x] Meta downgrade on host write / check / import
- [x] CLI: init / open / host / asset / logs / check — no publish
- [x] 3.8 template + AGENTS (reserved `@ccclass`, IDE build)
- [x] Existing 3.8 open: detect, ccclass scan, meta not upgraded past gold
