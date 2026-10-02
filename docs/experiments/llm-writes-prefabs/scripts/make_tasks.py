"""Create run copies + TASK.md for every tier x condition x rep."""
import glob, json, os, shutil, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
import tiers

W = os.environ.get('PREFAB_WRITE', '/private/tmp/prefab-write')
UUID2PATH = {}
for meta in glob.glob(f'{tiers.RES}/**/*.png.meta', recursive=True):
    m = json.load(open(meta))
    UUID2PATH[m['subMetas']['f9941']['uuid']] = meta[len(tiers.BASE2D) + 1:-5]

SPRITE_TYPE = {0: 'SIMPLE', 1: 'SLICED'}
HALIGN = {0: 'LEFT', 1: 'CENTER', 2: 'RIGHT'}
VALIGN = {0: 'TOP', 1: 'CENTER', 2: 'BOTTOM'}
OVERFLOW = {0: 'NONE', 1: 'CLAMP', 2: 'SHRINK', 3: 'RESIZE_HEIGHT'}
TRANSITION = {0: 'NONE', 3: 'SCALE'}


def fmt(v):
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    return str(v)


def tup(vs):
    return '(' + ', '.join(fmt(v) for v in vs) + ')'


def comp_line(c):
    t = c['type']
    if t == 'cc.Sprite':
        return (f"cc.Sprite: spriteFrame = `{UUID2PATH[c['frame']]}`, type {SPRITE_TYPE[c['spriteType']]}, "
                f"sizeMode CUSTOM, color {tup(c['color'])}")
    if t == 'cc.Label':
        return (f"cc.Label: string {json.dumps(c['string'], ensure_ascii=False)}, fontSize {c['fontSize']}, lineHeight {c['lineHeight']}, "
                f"color {tup(c['color'])}, {'bold' if c['bold'] else 'not bold'}, horizontalAlign {HALIGN[c['hAlign']]}, "
                f"verticalAlign {VALIGN[c['vAlign']]}, overflow {OVERFLOW[c['overflow']]}, system font Arial")
    if t == 'cc.Button':
        s = f"cc.Button: target = node `{c['target'] or '<root>'}`, transition {TRANSITION[c['transition']]}"
        if c['transition'] == 3:
            s += f", zoomScale {c['zoomScale']}"
        return s + ', interactable, no click events'
    if t == 'cc.Layout':
        return (f"cc.Layout: type GRID, resizeMode NONE, cellSize {c['cellW']}x{c['cellH']}, startAxis HORIZONTAL, "
                f"spacingX {c['spacingX']}, spacingY {c['spacingY']}, all paddings 0, constraint FIXED_COL, constraintNum {c['constraintNum']}, "
                f"horizontalDirection LEFT_TO_RIGHT, verticalDirection TOP_TO_BOTTOM")
    if t == 'cc.BlockInputEvents':
        return 'cc.BlockInputEvents'
    if t == 'cc.DirectionalLight':
        return f"cc.DirectionalLight: color {tup(c['color'])}, illuminance (HDR) {c['illuminanceHDR']} lux, shadows enabled"
    if t in ('cc.SphereLight', 'cc.SpotLight'):
        s = f"{t}: color {tup(c['color'])}, luminance (HDR) {c['luminanceHDR']}, size {c['size']}, range {c['range']}"
        if t == 'cc.SpotLight':
            s += f", spotAngle {c['spotAngle']} degrees"
        return s
    if t == 'cc.LightProbeGroup':
        pts = ' '.join(tup(p) for p in c['probes'])
        return (f"cc.LightProbeGroup: generating method UNIFORM, minPos {tup(c['minPos'])}, maxPos {tup(c['maxPos'])}, "
                f"probe counts X={c['nProbes'][0]} Y={c['nProbes'][1]} Z={c['nProbes'][2]}, and these {len(c['probes'])} probe positions "
                f"(local, in this order): {pts}")
    if t == 'cc.ReflectionProbe':
        return (f"cc.ReflectionProbe: probeType CUBE, resolution {c['resolution']}, size {tup(c['size'])}, "
                f"backgroundColor {tup(c['backgroundColor'])}")
    raise ValueError(t)


def tree_md(n, depth=0, root=True):
    ind = '  ' * depth
    head = f"{ind}- **{n['name']}**" + (' (prefab root)' if root else '')
    attrs = []
    if 'ui' in n:
        attrs.append(f"size {fmt(n['ui']['w'])}x{fmt(n['ui']['h'])}")
        if (n['ui']['ax'], n['ui']['ay']) != (0.5, 0.5):
            attrs.append(f"anchor {tup([n['ui']['ax'], n['ui']['ay']])}")
    if any(n['pos']):
        attrs.append(f"position {tup(n['pos'] if 'ui' not in n else n['pos'][:2])}")
    if any(n['euler']):
        attrs.append(f"rotation (euler degrees) {tup(n['euler'])}")
    lines = [head + (': ' + ', '.join(attrs) if attrs else '')]
    for c in n['comps']:
        lines.append(f'{ind}  - {comp_line(c)}')
    for ch in n['children']:
        lines.extend(tree_md(ch, depth + 1, False))
    return lines


T4_RULES = """Build the prefab **BattleScreen** from the layout file `assets/resources/ui/battle/uilayout.json` (already in the project).
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
"""


def task_md(tier, name, root, proj, cond):
    lines = [f'# Task: hand-write a Cocos Creator 3.8 prefab ({name})', '',
             f'Project: `{proj}` (an Enji project; read `AGENTS.md` for the toolchain).',
             f'Write the prefab described below to `assets/resources/prefabs/test/{name}.prefab`.',
             'There is no Cocos editor: author the prefab JSON yourself, either directly or with a small script you write (your choice;',
             'keep any script outside `assets/`).', '',
             '## Rules', '',
             '- Engine built-in components only: no script components, no nested prefab instances.',
             '- Never create or edit a `.meta` file by hand. After writing the prefab run',
             f'  `enji import {proj}/assets/resources/prefabs/test/{name}.prefab --project {proj}` (it generates the meta),',
             f'  then `enji check --project {proj}`. Fix anything they report.',
             '- Images are referenced through their sprite-frame sub-asset; uuids are in each image\'s `.meta` file.',
             '- Do not modify anything else in the project. Do not use git or a browser. Do not read or write files outside the project directory.',
             '', '## Grading', '',
             'The prefab is loaded at runtime with `resources.load(path, Prefab)` + `instantiate`, then the instantiated node tree is compared',
             'to the spec: node names, hierarchy and child order, positions, rotations, sizes and anchors, layers, and the listed component',
             'properties. Properties not listed may keep engine defaults.', '']
    if cond == 'A':
        lines += ['## Reference', '',
                  'The project already contains working prefabs under `assets/resources/prefabs/` (outside `test/`). You may read them as format examples.', '']
    lines += ['## Spec', '']
    if tier == 'T4':
        lines.append(T4_RULES)
    else:
        if tier == 'T5':
            lines += ['3D prefab. No node has a UITransform. Every node is on layer DEFAULT. Positions and rotations are local to the parent.', '']
        else:
            lines += ['2D UI prefab. Every node has a UITransform (anchor (0.5, 0.5) unless stated) and is on layer UI_2D.',
                      'Positions are local to the parent (Cocos convention: +y up, origin at the parent\'s anchor). Unlisted position = (0, 0).', '']
            if tier == 'T3':
                lines += ['Slot positions below are where the cc.Layout places them; write them into the prefab as well.', '']
        lines += tree_md(root)
    lines += ['', '## When done', '',
              'Reply with: the method you used (hand-written JSON / script), how many import/check rounds you needed,',
              'and anything you were unsure about.', '']
    return '\n'.join(lines)


def make_base(src, dst, cond, three_d):
    if os.path.exists(dst):
        shutil.rmtree(dst)
    shutil.copytree(src, dst, symlinks=True, ignore=shutil.ignore_patterns('enji-host*'))
    kit = f'{dst}/assets/resources/prefabs/ui'
    if cond == 'B':
        for meta in glob.glob(f'{kit}/*.prefab.meta'):
            u = json.load(open(meta))['uuid']
            for f in glob.glob(f'{dst}/library/{u[:2]}/{u}*'):
                os.remove(f)
        shutil.rmtree(kit)
        os.remove(f'{kit}.meta') if os.path.exists(f'{kit}.meta') else None
    elif three_d:
        os.makedirs(f'{dst}/assets/resources/prefabs/samples', exist_ok=True)
        shutil.copy(f'{W}/_spec/Lamp.sample.prefab', f'{dst}/assets/resources/prefabs/samples/Lamp.prefab')
    os.makedirs(f'{dst}/assets/resources/prefabs/test', exist_ok=True)


if __name__ == '__main__':
    reps = int(sys.argv[1]) if len(sys.argv) > 1 else 2
    os.makedirs(f'{W}/runs', exist_ok=True)
    for cond in 'AB':
        for three_d in (False, True):
            tmpl = f'{W}/_tmpl{"3d" if three_d else "2d"}{cond}'
            make_base(f'{W}/_base{"3d" if three_d else "2d"}', tmpl, cond, three_d)
            if cond == 'A' and three_d:
                print(subprocess.run(['enji', 'import', f'{tmpl}/assets/resources/prefabs/samples', '--project', tmpl],
                                     capture_output=True, text=True).stdout[:120].replace('\n', ' '))
    for tier, (name, fn) in tiers.TIERS.items():
        root = fn()
        for cond in 'AB':
            for r in range(1, reps + 1):
                run = f'{W}/runs/{tier}-{cond}-r{r}'
                tmpl = f'{W}/_tmpl{"3d" if tier == "T5" else "2d"}{cond}'
                if os.path.exists(run):
                    shutil.rmtree(run)
                shutil.copytree(tmpl, run, symlinks=True)
                open(f'{run}/TASK.md', 'w').write(task_md(tier, name, root, run, cond))
                print(run)
