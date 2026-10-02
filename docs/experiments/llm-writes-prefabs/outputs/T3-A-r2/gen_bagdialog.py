#!/usr/bin/env python3
import json
import os
import random
import string

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   'assets/resources/prefabs/test/BagDialog.prefab')

UI_2D = 33554432

SF = {
    'bar_track': '368d1a6f-889b-4f22-a503-a43b521bae45@f9941',
    'comic_panel': '5f891261-50c3-44a8-9a51-b3631db45a09@f9941',
    'lv_chip': '1770805b-7c6a-4ebc-bc74-fa08164c683b@f9941',
    'ink_well': '8e6c85ea-f832-4128-b49a-16cb5c528e43@f9941',
    'portrait_rim': '71e411cb-08b2-4cc8-82c7-cc3a7693629c@f9941',
    'crimson_fox': '09760ad1-a326-497a-b38a-1596b7cc4038@f9941',
    'ink_raven': '81d3f036-8c39-4b1a-a067-970878f6fb6b@f9941',
}

SIMPLE, SLICED = 0, 1
CUSTOM = 0

rng = random.Random(20261002)
_used = set()


def file_id():
    alphabet = string.ascii_letters + string.digits + '+/'
    while True:
        s = ''.join(rng.choice(alphabet) for _ in range(22))
        if s not in _used:
            _used.add(s)
            return s


def color(r, g, b, a=255):
    return {'__type__': 'cc.Color', 'r': r, 'g': g, 'b': b, 'a': a}


def vec3(x=0, y=0, z=0):
    return {'__type__': 'cc.Vec3', 'x': x, 'y': y, 'z': z}


def ref(i):
    return {'__id__': i}


objs = []


def add(o):
    objs.append(o)
    return len(objs) - 1


add({
    '__type__': 'cc.Prefab',
    '_name': 'BagDialog',
    '_objFlags': 0,
    '__editorExtras__': {},
    '_native': '',
    'data': ref(1),
    'optimizationPolicy': 0,
    'persistent': False,
})

ROOT = 1


def node(name, parent, size, pos=(0, 0), comps=(), children=()):
    """comps: list of callables(node_id) -> component dict; children: list of node specs."""
    nid = add(None)
    n = {
        '__type__': 'cc.Node',
        '_name': name,
        '_objFlags': 0,
        '__editorExtras__': {},
        '_parent': ref(parent) if parent is not None else None,
        '_children': [],
        '_active': True,
        '_components': [],
        '_prefab': None,
        '_lpos': vec3(pos[0], pos[1], 0),
        '_lrot': {'__type__': 'cc.Quat', 'x': 0, 'y': 0, 'z': 0, 'w': 1},
        '_lscale': vec3(1, 1, 1),
        '_mobility': 0,
        '_layer': UI_2D,
        '_euler': vec3(),
        '_id': '',
    }
    objs[nid] = n

    for spec in children:
        cid = spec(nid)
        n['_children'].append(ref(cid))

    def attach(comp):
        comp_fields = {
            '_name': '',
            '_objFlags': 0,
            '__editorExtras__': {},
            'node': ref(nid),
            '_enabled': True,
            '__prefab': None,
        }
        full = {'__type__': comp.pop('__type__')}
        full.update(comp_fields)
        full.update(comp)
        cid = add(full)
        pid = add({'__type__': 'cc.CompPrefabInfo', 'fileId': file_id()})
        full['__prefab'] = ref(pid)
        full['_id'] = ''
        n['_components'].append(ref(cid))

    attach({
        '__type__': 'cc.UITransform',
        '_contentSize': {'__type__': 'cc.Size', 'width': size[0], 'height': size[1]},
        '_anchorPoint': {'__type__': 'cc.Vec2', 'x': 0.5, 'y': 0.5},
    })
    for c in comps:
        attach(c(nid))

    pinfo = {
        '__type__': 'cc.PrefabInfo',
        'root': ref(ROOT),
        'asset': ref(0),
        'fileId': file_id(),
        'instance': None,
        'targetOverrides': None,
    }
    if nid == ROOT:
        pinfo['nestedPrefabInstanceRoots'] = None
    n['_prefab'] = ref(add(pinfo))
    return nid


def N(name, size, pos=(0, 0), comps=(), children=()):
    return lambda parent: node(name, parent, size, pos, comps, children)


def sprite(sf, typ, col=(255, 255, 255, 255)):
    return lambda nid: {
        '__type__': 'cc.Sprite',
        '_customMaterial': None,
        '_srcBlendFactor': 2,
        '_dstBlendFactor': 4,
        '_color': color(*col),
        '_spriteFrame': {'__uuid__': SF[sf], '__expectedType__': 'cc.SpriteFrame'},
        '_type': typ,
        '_fillType': 0,
        '_sizeMode': CUSTOM,
        '_fillCenter': {'__type__': 'cc.Vec2', 'x': 0, 'y': 0},
        '_fillStart': 0,
        '_fillRange': 0,
        '_isTrimmedMode': True,
        '_useGrayscale': False,
        '_atlas': None,
    }


def label(text, font_size, line_height, col=(255, 255, 255, 255)):
    return lambda nid: {
        '__type__': 'cc.Label',
        '_customMaterial': None,
        '_srcBlendFactor': 2,
        '_dstBlendFactor': 4,
        '_color': color(*col),
        '_string': text,
        '_horizontalAlign': 1,
        '_verticalAlign': 1,
        '_actualFontSize': font_size,
        '_fontSize': font_size,
        '_fontFamily': 'Arial',
        '_lineHeight': line_height,
        '_overflow': 2,
        '_enableWrapText': True,
        '_font': None,
        '_isSystemFontUsed': True,
        '_spacingX': 0,
        '_isItalic': False,
        '_isBold': True,
        '_isUnderline': False,
        '_underlineHeight': 2,
        '_cacheMode': 0,
        '_enableOutline': False,
        '_outlineColor': color(0, 0, 0, 255),
        '_outlineWidth': 2,
        '_enableShadow': False,
        '_shadowColor': color(0, 0, 0, 255),
        '_shadowOffset': {'__type__': 'cc.Vec2', 'x': 2, 'y': 2},
        '_shadowBlur': 2,
    }


def button(transition, zoom=1.2):
    return lambda nid: {
        '__type__': 'cc.Button',
        'clickEvents': [],
        '_interactable': True,
        '_transition': transition,
        '_normalColor': color(214, 214, 214, 255),
        '_hoverColor': color(211, 211, 211, 255),
        '_pressedColor': color(255, 255, 255, 255),
        '_disabledColor': color(124, 124, 124, 255),
        '_normalSprite': None,
        '_hoverSprite': None,
        '_pressedSprite': None,
        '_disabledSprite': None,
        '_duration': 0.1,
        '_zoomScale': zoom,
        '_target': ref(nid),
    }


def block_input():
    return lambda nid: {'__type__': 'cc.BlockInputEvents'}


def grid_layout():
    return lambda nid: {
        '__type__': 'cc.Layout',
        '_resizeMode': 0,
        '_layoutType': 3,
        '_cellSize': {'__type__': 'cc.Size', 'width': 180, 'height': 240},
        '_startAxis': 0,
        '_paddingLeft': 0,
        '_paddingRight': 0,
        '_paddingTop': 0,
        '_paddingBottom': 0,
        '_spacingX': 20,
        '_spacingY': 40,
        '_verticalDirection': 1,
        '_horizontalDirection': 0,
        '_constraint': 2,
        '_constraintNum': 3,
        '_affectedByScale': False,
        '_isAlign': False,
    }


SLOTS = [
    ('crimson_fox', '回复药', 'x3', (-200, 140)),
    ('ink_raven', '大回复药', 'x1', (0, 140)),
    ('crimson_fox', '解毒剂', 'x5', (200, 140)),
    ('ink_raven', '怪谈球', 'x12', (-200, -140)),
    ('crimson_fox', '烟雾弹', 'x2', (0, -140)),
    ('ink_raven', '复活草', 'x1', (200, -140)),
]


def slot(i, icon, name, count, pos):
    return N(f'Slot{i}', (180, 240), pos, comps=[button(0)], children=[
        N('Bg', (180, 240), comps=[sprite('ink_well', SLICED)]),
        N('Frame', (180, 240), comps=[sprite('portrait_rim', SIMPLE)]),
        N('Icon', (110, 110), (0, 24), comps=[sprite(icon, SIMPLE)]),
        N('Name', (170, 36), (0, -70), comps=[label(name, 26, 32)]),
        N('CountBadge', (72, 36), (54, 98), comps=[sprite('lv_chip', SLICED)], children=[
            N('Count', (64, 30), comps=[label(count, 22, 28, (17, 17, 17, 255))]),
        ]),
    ])


tree = N('BagDialog', (720, 1280), comps=[block_input()], children=[
    N('Dim', (720, 1280), comps=[sprite('bar_track', SLICED, (0, 0, 0, 170))]),
    N('Panel', (640, 820), comps=[sprite('comic_panel', SLICED)], children=[
        N('TitlePlate', (260, 72), (0, 370), comps=[sprite('lv_chip', SLICED)], children=[
            N('Title', (240, 56), comps=[label('道具袋', 36, 45)]),
        ]),
        N('Close', (72, 72), (276, 370), comps=[sprite('lv_chip', SLICED), button(3, 0.9)], children=[
            N('X', (60, 60), comps=[label('×', 40, 50)]),
        ]),
        N('Grid', (580, 520), (0, -10), comps=[grid_layout()],
          children=[slot(i, *s) for i, s in enumerate(SLOTS)]),
    ]),
])

root_id = tree(None)
assert root_id == ROOT, root_id

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(objs, f, ensure_ascii=False, indent=2)
    f.write('\n')
print(f'wrote {OUT} ({len(objs)} objects)')
