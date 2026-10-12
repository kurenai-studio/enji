"""Tier specs for the "LLM writes Cocos prefab JSON" test.

Each tier is a tree of semantic nodes. From it we derive:
  - expected.json (what the runtime dump must match)
  - an oracle .prefab (proves harness + comparator can reach 100%)
TASK.md files are written by make_tasks.py.
"""
import json, math, os, random, string

BASE2D = os.environ.get('PREFAB_WRITE', '/private/tmp/prefab-write') + '/_base2d'
RES = BASE2D + '/assets/resources'
UI2D, DEFAULT = 33554432, 1073741824
WHITE = [255, 255, 255, 255]
INK = [17, 17, 17, 255]


def sf(rel):
    m = json.load(open(f'{RES}/{rel}.meta'))
    return m['subMetas']['f9941']['uuid']


def N(name, w=None, h=None, pos=(0, 0, 0), euler=(0, 0, 0), comps=(), children=(), layer=UI2D, anchor=(0.5, 0.5)):
    n = dict(name=name, pos=list(pos), euler=list(euler), layer=layer, comps=list(comps), children=list(children))
    if w is not None:
        n['ui'] = dict(w=w, h=h, ax=anchor[0], ay=anchor[1])
    return n


def Sprite(rel, sliced=False, color=WHITE):
    return dict(type='cc.Sprite', frame=sf(rel), spriteType=1 if sliced else 0, sizeMode=0, color=list(color))


def Label(s, fs, color=WHITE, bold=True, h=1, v=1, overflow=2):
    return dict(type='cc.Label', string=s, fontSize=fs, lineHeight=round(fs * 1.25), color=list(color),
                bold=bold, hAlign=h, vAlign=v, overflow=overflow)


def Button(target, transition=0, zoom=1.2):
    c = dict(type='cc.Button', target=target, transition=transition, interactable=True)
    if transition == 3:
        c['zoomScale'] = zoom
    return c


LV = 'ui/battle/lv_chip__248x80__normal.png'
WELL = 'ui/battle/ink_well__408x456__normal.png'
RIM = 'ui/battle/portrait_rim__472x520__normal.png'
PANEL = 'ui/battle/comic_panel__1344x416__normal.png'
TRACK = 'ui/battle/bar_track__500x32__normal.png'
FOX = 'creatures/crimson_fox.png'
RAVEN = 'creatures/ink_raven.png'


def t1():
    return N('Badge', 248, 80, comps=[Sprite(LV)], children=[
        N('Text', 200, 50, comps=[Label('LV 16', 32)]),
    ])


def slot(name, path, w, h, icon_px, icon, label, count, badge_pos):
    return N(name, w, h, comps=[Button(path)], children=[
        N('Bg', w, h, comps=[Sprite(WELL, sliced=True)]),
        N('Frame', w, h, comps=[Sprite(RIM)]),
        N('Icon', icon_px, icon_px, pos=(0, 24, 0), comps=[Sprite(icon)]),
        N('Name', w - 20 if w == 200 else 170, 36, pos=(0, -70, 0), comps=[Label(label, 26)]),
        N('CountBadge', 72, 36, pos=(*badge_pos, 0), comps=[Sprite(LV, sliced=True)], children=[
            N('Count', 64, 30, comps=[Label(count, 22, INK)]),
        ]),
    ])


def t2():
    return slot('ItemSlot', '', 200, 240, 120, FOX, '回复药', 'x3', (62, 98))


ITEMS = [('回复药', 'x3', FOX), ('大回复药', 'x1', RAVEN), ('解毒剂', 'x5', FOX),
         ('怪谈球', 'x12', RAVEN), ('烟雾弹', 'x2', FOX), ('复活草', 'x1', RAVEN)]


def t3():
    slots = []
    for i, (nm, ct, ic) in enumerate(ITEMS):
        s = slot(f'Slot{i}', f'Panel/Grid/Slot{i}', 180, 240, 110, ic, nm, ct, (54, 98))
        s['pos'] = [(-200, 0, 200)[i % 3], (140, -140)[i // 3], 0]
        slots.append(s)
    layout = dict(type='cc.Layout', layoutType=3, resizeMode=0, cellW=180, cellH=240, startAxis=0,
                  spacingX=20, spacingY=40, padding=[0, 0, 0, 0], constraint=2, constraintNum=3, hDir=0, vDir=1)
    return N('BagDialog', 720, 1280, comps=[dict(type='cc.BlockInputEvents')], children=[
        N('Dim', 720, 1280, comps=[Sprite(TRACK, sliced=True, color=[0, 0, 0, 170])]),
        N('Panel', 640, 820, comps=[Sprite(PANEL, sliced=True)], children=[
            N('TitlePlate', 260, 72, pos=(0, 370, 0), comps=[Sprite(LV, sliced=True)], children=[
                N('Title', 240, 56, comps=[Label('道具袋', 36)]),
            ]),
            N('Close', 72, 72, pos=(276, 370, 0), comps=[Sprite(LV, sliced=True), Button('Panel/Close', 3, 0.9)], children=[
                N('X', 60, 60, comps=[Label('×', 40)]),
            ]),
            N('Grid', 580, 520, pos=(0, -10, 0), comps=[layout], children=slots),
        ]),
    ])


ALIGN = {'start': 0, 'middle': 1, 'end': 2}


def t4():
    d = json.load(open(f'{RES}/ui/battle/uilayout.json'))
    parts = d['parts']
    by = {p['id']: p for p in parts}
    kids = {}
    for i, p in enumerate(parts):
        kids.setdefault(p['parent'], []).append((p['z'], i, p))

    def center(p):
        return p['x'] + p['w'] / 2, p['y'] + p['h'] / 2

    def build(p, path):
        cx, cy = center(p)
        if p['parent'] is None:
            pcx, pcy = 360, 640
        else:
            pcx, pcy = center(by[p['parent']])
        comps = []
        if 'img' in p:
            comps.append(Sprite(d['dir'] + p['img']['normal'], sliced=p.get('kind') == 'nine_slice'))
        if 'text' in p:
            t = p['text']
            comps.append(Label(t['s'], int(t['fs']), list(t['col']) + [255], bool(t.get('bold')), ALIGN[t.get('align', 'middle')]))
        if p['type'] == 'button' and p['render'] == 'program':
            comps.append(Button(path, 3, 0.95))
        children = [build(c, f'{path}/{c["id"]}') for _, _, c in sorted(kids.get(p['id'], []), key=lambda k: (k[0], k[1]))]
        if 'bar' in p:
            track = by[p['id'] + '_track']
            children.append(N('Fill', p['w'] * 0.75, p['h'], pos=(-p['w'] / 2, 0, 0), anchor=(0, 0.5),
                              comps=[Sprite(d['dir'] + track['img']['normal'], sliced=True, color=list(p['bar']['col']) + [255])]))
        return N(p['id'], p['w'], p['h'], pos=(cx - pcx, pcy - cy, 0), comps=comps, children=children)

    top = [build(p, p['id']) for _, _, p in sorted(kids[None], key=lambda k: (k[0], k[1]))]
    return N('BattleScreen', 720, 1280, children=[N('Bg', 720, 1280, comps=[Sprite('ui/battle/bg_main.png')])] + top)


def t5():
    probes = [[x, y, z] for y in (0, 3) for z in (-4, 0, 4) for x in (-4, 0, 4)]
    D = DEFAULT
    return N('LightRig', layer=D, children=[
        N('Sun', pos=(0, 10, 0), euler=(-50, 30, 0), layer=D, comps=[
            dict(type='cc.DirectionalLight', color=[255, 244, 214, 255], illuminanceHDR=80000, shadowEnabled=True)]),
        N('Lamps', pos=(0, 0, -1), euler=(0, 90, 0), layer=D, children=[
            N('FillLight', pos=(3, 2, -2), layer=D, comps=[
                dict(type='cc.SphereLight', color=[120, 160, 255, 255], luminanceHDR=2000, size=0.5, range=6)]),
            N('RimSpot', pos=(-4, 5, 4), euler=(-35, -45, 0), layer=D, comps=[
                dict(type='cc.SpotLight', color=[255, 120, 80, 255], luminanceHDR=3000, size=0.2, range=12, spotAngle=40)]),
        ]),
        N('Probes', layer=D, comps=[
            dict(type='cc.LightProbeGroup', method=0, minPos=[-4, 0, -4], maxPos=[4, 3, 4], nProbes=[3, 2, 3], probes=probes)]),
        N('Reflection', pos=(0, 1.5, 0), layer=D, comps=[
            dict(type='cc.ReflectionProbe', probeType=0, resolution=256, size=[5, 1.5, 5], backgroundColor=[20, 24, 32, 255])]),
    ])


def lamp_sample():
    return N('Lamp', pos=(0, 2, 0), layer=DEFAULT, comps=[
        dict(type='cc.SphereLight', color=[255, 255, 255, 255], luminanceHDR=1700, size=0.15, range=1)])


TIERS = {'T1': ('Badge', t1), 'T2': ('ItemSlot', t2), 'T3': ('BagDialog', t3), 'T4': ('BattleScreen', t4), 'T5': ('LightRig', t5)}


def euler_to_quat(x, y, z):
    h = math.pi / 360
    x, y, z = x * h, y * h, z * h
    sx, cx, sy, cy, sz, cz = math.sin(x), math.cos(x), math.sin(y), math.cos(y), math.sin(z), math.cos(z)
    return [sx * cy * cz + cx * sy * sz, cx * sy * cz + sx * cy * sz, cx * cy * sz - sx * sy * cz, cx * cy * cz - sx * sy * sz]


def flatten(root):
    """[(path, node, parentPath)] in depth-first order."""
    out = []

    def walk(n, path, parent):
        out.append((path, n, parent))
        for c in n['children']:
            walk(c, f'{path}/{c["name"]}' if path else c['name'], path)
    walk(root, '', None)
    return out


def expected(root):
    rows = []
    for path, n, parent in flatten(root):
        rows.append(dict(path=path, parent=parent, children=[c['name'] for c in n['children']], pos=n['pos'],
                         quat=euler_to_quat(*n['euler']), euler=n['euler'], layer=n['layer'], ui=n.get('ui'),
                         comps=n['comps']))
    return rows


# ---------------------------------------------------------------- oracle writer

def fid():
    return ''.join(random.choice(string.ascii_letters + string.digits + '+/') for _ in range(22))


def V3(v):
    return {'__type__': 'cc.Vec3', 'x': v[0], 'y': v[1], 'z': v[2]}


def COL(c):
    return {'__type__': 'cc.Color', 'r': c[0], 'g': c[1], 'b': c[2], 'a': c[3]}


def comp_body(c, nid, idmap):
    t = c['type']
    b = {}
    if t == 'cc.Sprite':
        b = {'_srcBlendFactor': 2, '_dstBlendFactor': 4, '_color': COL(c['color']), '_sharedMaterial': None,
             '_spriteFrame': {'__uuid__': c['frame'], '__expectedType__': 'cc.SpriteFrame'},
             '_type': c['spriteType'], '_fillType': 0, '_sizeMode': c['sizeMode'],
             '_fillCenter': {'__type__': 'cc.Vec2', 'x': 0, 'y': 0}, '_fillStart': 0, '_fillRange': 0,
             '_isTrimmedMode': True, '_useGrayscale': False, '_atlas': None}
    elif t == 'cc.Label':
        b = {'_srcBlendFactor': 2, '_dstBlendFactor': 4, '_color': COL(c['color']), '_sharedMaterial': None,
             '_useOriginalSize': True, '_string': c['string'], '_horizontalAlign': c['hAlign'], '_verticalAlign': c['vAlign'],
             '_actualFontSize': c['fontSize'], '_fontSize': c['fontSize'], '_fontFamily': 'Arial', '_lineHeight': c['lineHeight'],
             '_overflow': c['overflow'], '_enableWrapText': True, '_font': None, '_isSystemFontUsed': True,
             '_isItalic': False, '_isBold': c['bold'], '_isUnderline': False, '_cacheMode': 0}
    elif t == 'cc.Button':
        b = {'clickEvents': [], '_interactable': True, '_transition': c['transition'],
             '_normalColor': COL(WHITE), '_hoverColor': COL([211, 211, 211, 255]), '_pressedColor': COL(WHITE),
             '_disabledColor': COL([124, 124, 124, 255]), '_normalSprite': None, '_hoverSprite': None,
             '_pressedSprite': None, '_disabledSprite': None, '_duration': 0.1, '_zoomScale': c.get('zoomScale', 1.2),
             '_target': {'__id__': idmap[c['target']]}}
    elif t == 'cc.Layout':
        b = {'_resizeMode': c['resizeMode'], '_layoutType': c['layoutType'],
             '_cellSize': {'__type__': 'cc.Size', 'width': c['cellW'], 'height': c['cellH']}, '_startAxis': c['startAxis'],
             '_paddingLeft': c['padding'][0], '_paddingRight': c['padding'][1], '_paddingTop': c['padding'][2],
             '_paddingBottom': c['padding'][3], '_spacingX': c['spacingX'], '_spacingY': c['spacingY'],
             '_verticalDirection': c['vDir'], '_horizontalDirection': c['hDir'], '_constraint': c['constraint'],
             '_constraintNum': c['constraintNum'], '_affectedByScale': False, '_isAlign': False}
    elif t == 'cc.BlockInputEvents':
        b = {}
    elif t in ('cc.DirectionalLight', 'cc.SphereLight', 'cc.SpotLight'):
        b = {'_color': COL(c['color']), '_useColorTemperature': False, '_colorTemperature': 6550,
             '_staticSettings': {'__type__': 'cc.StaticLightSettings', '_baked': False, '_editorOnly': False, '_castShadow': False},
             '_visibility': -325058561}
        if t == 'cc.DirectionalLight':
            b.update({'_illuminanceHDR': c['illuminanceHDR'], '_illuminance': c['illuminanceHDR'], '_illuminance': c['illuminanceHDR'], '_illuminanceLDR': c['illuminanceHDR'] / 38400, '_shadowEnabled': c['shadowEnabled']})
        else:
            b.update({'_size': c['size'], '_luminanceHDR': c['luminanceHDR'], '_luminance': c['luminanceHDR'], '_luminanceLDR': c['luminanceHDR'] / 3.84, '_term': 0, '_range': c['range']})
            if t == 'cc.SpotLight':
                b.update({'_spotAngle': c['spotAngle'], '_angleAttenuationStrength': 0, '_shadowEnabled': False})
    elif t == 'cc.LightProbeGroup':
        b = {'_probes': [V3(p) for p in c['probes']], '_method': c['method'], '_minPos': V3(c['minPos']),
             '_maxPos': V3(c['maxPos']), '_nProbesX': c['nProbes'][0], '_nProbesY': c['nProbes'][1], '_nProbesZ': c['nProbes'][2]}
    elif t == 'cc.ReflectionProbe':
        b = {'_resolution': c['resolution'], '_clearFlag': 14, '_backgroundColor': COL(c['backgroundColor']),
             '_visibility': -325058561, '_probeType': c['probeType'], '_cubemap': None, '_size': V3(c['size']),
             '_sourceCamera': None, '_probeId': -1, '_fastBake': False}
    else:
        raise ValueError(t)
    return {'__type__': t, '_name': '', '_objFlags': 0, 'node': {'__id__': nid}, '_enabled': True, '__prefab': None, **b, '_id': ''}


def oracle(root):
    random.seed(7)
    flat = flatten(root)
    arr = [{'__type__': 'cc.Prefab', '_name': root['name'], '_objFlags': 0, '_native': '', 'data': {'__id__': 1},
            'optimizationPolicy': 0, 'asyncLoadAssets': False, 'persistent': False}]
    idmap = {}
    # allocate node ids first so button targets can forward-reference
    order = []
    for path, n, parent in flat:
        idmap[path] = len(arr) + len(order)
        order.append((path, n, parent))
    arr.extend([None] * len(order))
    pending = []
    for path, n, parent in order:
        nid = idmap[path]
        comp_ids = []
        all_comps = ([{'type': 'cc.UITransform', **n['ui']}] if 'ui' in n else []) + n['comps']
        for c in all_comps:
            cid = len(arr)
            if c['type'] == 'cc.UITransform':
                body = {'__type__': 'cc.UITransform', '_name': '', '_objFlags': 0, 'node': {'__id__': nid}, '_enabled': True,
                        '__prefab': None, '_contentSize': {'__type__': 'cc.Size', 'width': c['w'], 'height': c['h']},
                        '_anchorPoint': {'__type__': 'cc.Vec2', 'x': c['ax'], 'y': c['ay']}, '_id': ''}
                body['__prefab'] = {'__id__': cid + 1}
            else:
                body = ('LATER', c, nid)
                pending.append(cid)
            arr.append(body)
            arr.append({'__type__': 'cc.CompPrefabInfo', 'fileId': fid()})
            comp_ids.append(cid)
        pid = len(arr)
        arr.append({'__type__': 'cc.PrefabInfo', 'root': {'__id__': 1}, 'asset': {'__id__': 0}, 'fileId': fid()})
        q = euler_to_quat(*n['euler'])
        arr[nid] = {'__type__': 'cc.Node', '_name': n['name'], '_objFlags': 0,
                    '_parent': {'__id__': idmap[parent]} if parent is not None else None,
                    '_children': [{'__id__': idmap[f'{path}/{c["name"]}' if path else c['name']]} for c in n['children']],
                    '_active': True, '_components': [{'__id__': i} for i in comp_ids], '_prefab': {'__id__': pid},
                    '_lpos': V3(n['pos']), '_lrot': {'__type__': 'cc.Quat', 'x': q[0], 'y': q[1], 'z': q[2], 'w': q[3]},
                    '_lscale': V3([1, 1, 1]), '_mobility': 0, '_layer': n['layer'], '_euler': V3(n['euler']), '_id': ''}
    for cid in pending:
        _, c, nid = arr[cid]
        arr[cid] = comp_body(c, nid, idmap)
        arr[cid]['__prefab'] = {'__id__': cid + 1}
    return arr


if __name__ == '__main__':
    import sys
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for tier, (name, fn) in TIERS.items():
        root = fn()
        exp = expected(root)
        json.dump(exp, open(f'{out}/{tier}-{name}.expected.json', 'w'), ensure_ascii=False, indent=1)
        json.dump(oracle(root), open(f'{out}/{tier}-{name}.oracle.prefab', 'w'), ensure_ascii=False, indent=2)
        ncomp = sum(len(r['comps']) + (1 if r['ui'] else 0) for r in exp)
        print(tier, name, 'nodes', len(exp), 'components', ncomp)
    json.dump(oracle(lamp_sample()), open(f'{out}/Lamp.sample.prefab', 'w'), indent=2)
