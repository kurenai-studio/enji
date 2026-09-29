# Enji（臙脂）

Creator **3.8** preview / edit for agents. **No publish.**

Product line (浅 → 深): Pink → **Akane (2.x, reserved)** → **Enji (3.8)** → Kurenai (4.0).

> Agents working on **3.8** projects install **enji**, not kurenai.  
> Preview reuses the kurenai 4.0 host; **disk `.meta` is capped to Creator 3.8.8**.

## One-liner

```text
自学并用 Enji（本仓：clone 后 Node.js 22+ 下 `npm install && npm link`；依赖本地 kurenai 的 host，不要单独装完整 cocos-cli）开发 Cocos Creator 3.8 工程：`enji init` → `host start` → 按项目 AGENTS.md 只改 assets/game 与 assets/resources；用 asset info / logs / check 闭环；.meta 由 Enji 按 3.8 金样生成/退级，不要手写；构建请用本机 Creator 3.8.8 IDE（enji 无 publish）。
```

## Why a separate repo

| | kurenai | enji |
|---|---|---|
| Promise | Creator 4.0 + publish | Creator 3.8 preview/edit |
| `.meta` | 4.0 host defaults | **forced 3.8 gold** |
| Build | `kurenai publish` | Creator 3.8 IDE / other MCP |

## CLI

```text
enji init <dir> [--template base-ai]
enji open [--project <dir>]
enji host start|status|stop [--project <dir>]
enji asset info <file>
enji logs [--errors [--all]]
enji check
enji context
```

There is **no** `enji publish`.

## Meta contract

See [docs/meta-gold.md](docs/meta-gold.md). Host writes go through an fs hook
plus post-import normalization so importer `ver` never exceeds Creator 3.8.8 gold.

## Install

Sibling layout expected during development:

```text
sub-private/
  kurenai/     # @kurenai-studio/kurenai (file: dependency)
  enji/        # this package
```

```sh
cd kurenai && npm install && npm run build
cd ../enji && npm install && npm run build && npm link
```

## Acceptance checklist

- [x] Independent `enji` package depending on kurenai (no second cocos-core vendor)
- [x] Meta gold table from Creator 3.8.8 samples
- [x] Meta downgrade on host write / check / asset info
- [x] CLI: init / open / host / asset / logs / check — no publish
- [x] 3.8 template + AGENTS (reserved `@ccclass`, IDE build)
- [x] Existing 3.8 open: detect, ccclass scan, meta not upgraded past gold
