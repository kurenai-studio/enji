#!/usr/bin/env bash
# Build the two base projects the runs are copied from.
#   SRC: a phantom-pocket checkout (enji-demos) with the battle UI assets and the
#        leaf prefab kit (assets/resources/prefabs/ui) — the state of 2026-10-02.
#   PREFAB_WRITE: working directory (default /private/tmp/prefab-write; use the
#        /private path, `enji import` rejects paths through the /tmp symlink).
set -euo pipefail
SRC=${1:?usage: prepare_base.sh <phantom-pocket dir>}
W=${PREFAB_WRITE:-/private/tmp/prefab-write}
HERE=$(cd "$(dirname "$0")" && pwd)
B=$W/_base2d

rm -rf "$B" && mkdir -p "$B"
rsync -a --exclude 'temp/enji-host*' --exclude 'temp/logs' --exclude .git "$SRC/" "$B/"
cd "$B"
rm -rf tools README.md assets/resources/prefabs/ui/README.md* \
  assets/game/UiTree.ts* assets/game/UiPrefabs.ts* assets/game/BattleConfig.ts*
cp "$HERE/../harness/MainView.ts" assets/game/MainView.ts
cp "$HERE/../harness/AGENTS.neutral.md" AGENTS.md

# 9-slice borders for the battle images. This is the one place .meta files are
# edited by hand: it prepares the fixture, the agents never touch metas.
python3 - "$B" <<'PY'
import glob, json, pathlib, sys
B = pathlib.Path(sys.argv[1])
slices = {'comic_panel': (48, 40, 48, 40), 'util_face': (24, 20, 24, 20), 'skill_face': (28, 20, 28, 20),
          'lv_chip': (16, 16, 16, 16), 'bar_track': (12, 6, 12, 6), 'hazard_stripe': (16, 4, 16, 4),
          'ink_well': (32, 32, 32, 32)}
for m in glob.glob(str(B / 'assets/resources/ui/battle/*.png.meta')):
    key = pathlib.Path(m).name.split('__')[0]
    if key not in slices:
        continue
    d = json.load(open(m))
    l, t, r, b = slices[key]
    d['subMetas']['f9941']['userData'].update(borderLeft=l, borderTop=t, borderRight=r, borderBottom=b)
    json.dump(d, open(m, 'w'), indent=2)
PY
enji import "$B/assets" --project "$B" >/dev/null
enji host stop --project "$B" >/dev/null 2>&1 || true

# 3D base: same project with the 3d / light-probe / primitive engine modules on.
rm -rf "$W/_base3d"
rsync -a --exclude 'temp/enji-host*' "$B/" "$W/_base3d/"
python3 - "$W/_base3d/settings/v2/packages/engine.json" <<'PY'
import json, sys
p = sys.argv[1]
d = json.load(open(p))
c = d['modules']['configs']['defaultConfig']
for k in ['3d', 'light-probe', 'primitive']:
    c['cache'].setdefault(k, {})['_value'] = True
    if k not in c['includeModules']:
        c['includeModules'].append(k)
json.dump(d, open(p, 'w'), indent=2)
PY
echo "bases ready under $W"
