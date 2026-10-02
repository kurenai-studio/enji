#!/usr/bin/env python3
"""Generate assets/resources/prefabs/test/BattleScreen.prefab from ui/battle/uilayout.json."""
import base64
import json
import os
import uuid

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, 'assets', 'resources')
LAYOUT = os.path.join(RES, 'ui', 'battle', 'uilayout.json')
OUT = os.path.join(RES, 'prefabs', 'test', 'BattleScreen.prefab')

UI_2D = 33554432
ALIGN = {'start': 0, 'middle': 1, 'end': 2}


def num(v):
    v = float(v)
    return int(v) if v.is_integer() else v


def file_id():
    return base64.urlsafe_b64encode(uuid.uuid4().bytes).decode()[:22]


def sprite_frame_uuid(rel_path):
    meta = json.load(open(os.path.join(RES, rel_path) + '.meta'))
    for sub in meta['subMetas'].values():
        if sub['importer'] == 'sprite-frame':
            return sub['uuid']
    raise SystemExit('no sprite-frame sub-asset for ' + rel_path)


def color(rgb, a=255):
    return {'__type__': 'cc.Color', 'r': rgb[0], 'g': rgb[1], 'b': rgb[2], 'a': a}


WHITE = [255, 255, 255]

objs = [{
    '__type__': 'cc.Prefab', '_name': 'BattleScreen', '_objFlags': 0, '_native': '',
    'data': {'__id__': 1}, 'optimizationPolicy': 0, 'asyncLoadAssets': False, 'persistent': False,
}]


def add(o):
    objs.append(o)
    return len(objs) - 1


def ref(i):
    return {'__id__': i}


def make_node(name, parent, x, y, w, h, ax=0.5, ay=0.5):
    idx = add({
        '__type__': 'cc.Node', '_name': name, '_objFlags': 0,
        '_parent': ref(parent) if parent is not None else None,
        '_children': [], '_active': True, '_components': [], '_prefab': None,
        '_lpos': {'__type__': 'cc.Vec3', 'x': num(x), 'y': num(y), 'z': 0},
        '_lrot': {'__type__': 'cc.Quat', 'x': 0, 'y': 0, 'z': 0, 'w': 1},
        '_lscale': {'__type__': 'cc.Vec3', 'x': 1, 'y': 1, 'z': 1},
        '_mobility': 0, '_layer': UI_2D,
        '_euler': {'__type__': 'cc.Vec3', 'x': 0, 'y': 0, 'z': 0},
        '_id': '',
    })
    if parent is not None:
        objs[parent]['_children'].append(ref(idx))
    add_comp(idx, {
        '__type__': 'cc.UITransform',
        '_contentSize': {'__type__': 'cc.Size', 'width': num(w), 'height': num(h)},
        '_anchorPoint': {'__type__': 'cc.Vec2', 'x': ax, 'y': ay},
    })
    return idx


def add_comp(node, fields):
    comp = {'__type__': fields.pop('__type__'), '_name': '', '_objFlags': 0,
            'node': ref(node), '_enabled': True}
    comp.update(fields)
    comp['_id'] = ''
    ci = add(comp)
    comp['__prefab'] = ref(add({'__type__': 'cc.CompPrefabInfo', 'fileId': file_id()}))
    objs[node]['_components'].append(ref(ci))
    return ci


def add_sprite(node, rel_img, sliced, rgb=WHITE):
    add_comp(node, {
        '__type__': 'cc.Sprite', '_srcBlendFactor': 2, '_dstBlendFactor': 4,
        '_color': color(rgb), '_sharedMaterial': None,
        '_spriteFrame': {'__uuid__': sprite_frame_uuid(rel_img), '__expectedType__': 'cc.SpriteFrame'},
        '_type': 1 if sliced else 0, '_fillType': 0, '_sizeMode': 0,
        '_fillCenter': {'__type__': 'cc.Vec2', 'x': 0, 'y': 0}, '_fillStart': 0, '_fillRange': 0,
        '_isTrimmedMode': True, '_useGrayscale': False, '_atlas': None,
    })


def add_label(node, t):
    fs = num(t['fs'])
    add_comp(node, {
        '__type__': 'cc.Label', '_srcBlendFactor': 2, '_dstBlendFactor': 4,
        '_color': color(t['col']), '_sharedMaterial': None, '_useOriginalSize': True,
        '_string': t['s'], '_horizontalAlign': ALIGN[t['align']], '_verticalAlign': 1,
        '_actualFontSize': fs, '_fontSize': fs, '_fontFamily': 'Arial',
        '_lineHeight': int(round(float(t['fs']) * 1.25)), '_overflow': 2, '_enableWrapText': True,
        '_font': None, '_isSystemFontUsed': True, '_isItalic': False, '_isBold': bool(t['bold']),
        '_isUnderline': False, '_cacheMode': 0,
    })


def add_button(node):
    add_comp(node, {
        '__type__': 'cc.Button', 'clickEvents': [], '_interactable': True, '_transition': 3,
        '_normalColor': color(WHITE), '_hoverColor': color([211, 211, 211]),
        '_pressedColor': color(WHITE), '_disabledColor': color([124, 124, 124]),
        '_normalSprite': None, '_hoverSprite': None, '_pressedSprite': None, '_disabledSprite': None,
        '_duration': 0.1, '_zoomScale': 0.95, '_target': ref(node),
    })


layout = json.load(open(LAYOUT))
d = layout['dir']
parts = layout['parts']
by_id = {p['id']: p for p in parts}
order = {p['id']: i for i, p in enumerate(parts)}
kids = {}
for p in parts:
    kids.setdefault(p['parent'], []).append(p)
for lst in kids.values():
    lst.sort(key=lambda p: (float(p['z']), order[p['id']]))


def center(p):
    return float(p['x']) + float(p['w']) / 2, float(p['y']) + float(p['h']) / 2


root = make_node('BattleScreen', None, 0, 0, layout['W'], layout['H'])
bg = make_node('Bg', root, 0, 0, layout['W'], layout['H'])
add_sprite(bg, d + layout['bg'], False)


def build(p, parent_node):
    cx, cy = center(p)
    pp = by_id.get(p['parent'])
    pcx, pcy = center(pp) if pp else (layout['W'] / 2, layout['H'] / 2)
    w, h = float(p['w']), float(p['h'])
    n = make_node(p['id'], parent_node, cx - pcx, pcy - cy, w, h)
    if p.get('img'):
        add_sprite(n, d + p['img']['normal'], p.get('kind') == 'nine_slice')
    if p.get('text'):
        add_label(n, p['text'])
    if p.get('type') == 'button' and p.get('render') == 'program':
        add_button(n)
    for c in kids.get(p['id'], []):
        build(c, n)
    if p.get('bar'):
        track = by_id[p['id'] + '_track']
        f = make_node('Fill', n, -w / 2, 0, w * 0.75, h, ax=0, ay=0.5)
        add_sprite(f, d + track['img']['normal'], True, p['bar']['col'])


for p in kids.get(None, []):
    build(p, root)

# PrefabInfo for every node
for i, o in enumerate(list(objs)):
    if o['__type__'] == 'cc.Node':
        o['_prefab'] = ref(add({'__type__': 'cc.PrefabInfo', 'root': ref(root), 'asset': ref(0),
                                'fileId': file_id()}))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as fh:
    json.dump(objs, fh, ensure_ascii=False, indent=2)
print('wrote', OUT, len(objs), 'objects')
