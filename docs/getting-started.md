# Enji (Creator 3.8) — agent bootstrap

Treat this file as the **only entry point**. Follow it in order. After
`enji init`, coding rules live in the project root `AGENTS.md` (this file covers
tooling install and the feedback loop).

## Goal

Use **Enji** to develop / preview **Cocos Creator 3.8** projects.

- Do **not** use kurenai as the primary CLI for 3.8 work.
- Do **not** install full cocos-cli / PinK.
- Enji has **no** `publish`. Ship builds with the local **Creator 3.8.8 IDE**
  (or another build MCP).

## Environment

- Node.js **22+**, npm, GitHub access
- Sibling layout for local `file:` dependency on kurenai’s host:

```text
<workspace>/
  kurenai/    # https://github.com/kurenai-studio/kurenai
  enji/       # https://github.com/kurenai-studio/enji  (this repo)
```

## Install

```sh
git clone https://github.com/kurenai-studio/kurenai.git
cd kurenai && npm install && npm run build

cd ..
git clone https://github.com/kurenai-studio/enji.git
cd enji && npm install && npm run build && npm link
```

Check: `enji --help`. Without link: `node <enji>/bin/enji.mjs --help`.

Preview reuses the kurenai 4.0 host; **on-disk `.meta` is forced down to Creator
3.8.8 gold**. Never hand-write `.meta`.

## Loop

```sh
enji init <dir> [--template base-ai]
cd <dir>
enji host start
# after editing assets/…
enji logs --errors
enji check
enji asset info <file>
enji context
```

Also: `enji open`, `enji host status|stop`.  
There is **no** `enji publish`. For release builds, open Creator **3.8.8**.

## What to edit

- Only `assets/game/` and `assets/resources/` (plus paths allowed by `AGENTS.md`)
- Entry: `MainView.bind(root)` in `assets/game/MainView.ts`
- Do not hand-edit `assets/enji/Boot.ts`, `*.scene`, or any `*.meta`
- Reserved `@ccclass` names: `game`, `Game`, `camera`, `Camera`, `cc`, `CC`

Full authoring rules: project **`AGENTS.md`** (camera `clearFlags`, preview
`builtin-unlit`, etc.).

## Checklist

- [ ] `enji --help` works; the project uses enji, not kurenai as main CLI
- [ ] `enji host start` returns a preview URL; `enji logs --errors` stays clean
- [ ] New assets keep 3.8-shaped `.meta` (no 4.0.x importer `ver`)
- [ ] Shipping goes through Creator 3.8.8 IDE, not a publish subcommand
