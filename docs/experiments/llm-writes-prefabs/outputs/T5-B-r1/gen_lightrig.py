import json
import math
import os

DEFAULT_LAYER = 1 << 30
OUT = os.path.join(os.path.dirname(__file__), 'assets/resources/prefabs/test/LightRig.prefab')

objs = []
counter = [0]


def add(o):
    objs.append(o)
    return len(objs) - 1


def ref(i):
    return {'__id__': i}


def fid():
    counter[0] += 1
    return 'lightrig%04d' % counter[0]


def vec3(x, y, z):
    return {'__type__': 'cc.Vec3', 'x': x, 'y': y, 'z': z}


def color(r, g, b, a=255):
    return {'__type__': 'cc.Color', 'r': r, 'g': g, 'b': b, 'a': a}


def quat_from_euler(x, y, z):
    h = math.pi / 360
    x, y, z = x * h, y * h, z * h
    sx, cx = math.sin(x), math.cos(x)
    sy, cy = math.sin(y), math.cos(y)
    sz, cz = math.sin(z), math.cos(z)
    return {
        '__type__': 'cc.Quat',
        'x': sx * cy * cz + cx * sy * sz,
        'y': cx * sy * cz + sx * cy * sz,
        'z': cx * cy * sz - sx * sy * cz,
        'w': cx * cy * cz - sx * sy * sz,
    }


prefab_idx = add({
    '__type__': 'cc.Prefab',
    '_name': 'LightRig',
    '_objFlags': 0,
    '__editorExtras__': {},
    '_native': '',
    'data': None,
    'optimizationPolicy': 0,
    'persistent': False,
})

root_idx = None


def node(name, parent, pos=(0, 0, 0), euler=(0, 0, 0), components=(), children=()):
    global root_idx
    idx = add(None)
    if root_idx is None:
        root_idx = idx
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
        '_lpos': vec3(*pos),
        '_lrot': quat_from_euler(*euler),
        '_lscale': vec3(1, 1, 1),
        '_mobility': 0,
        '_layer': DEFAULT_LAYER,
        '_euler': vec3(*euler),
        '_id': '',
    }
    objs[idx] = n
    for build in children:
        n['_children'].append(ref(build(idx)))
    for ctype, props in components:
        cidx = add(None)
        cinfo = add({'__type__': 'cc.CompPrefabInfo', 'fileId': fid()})
        c = {
            '__type__': ctype,
            '_name': '',
            '_objFlags': 0,
            '__editorExtras__': {},
            'node': ref(idx),
            '_enabled': True,
            '__prefab': ref(cinfo),
        }
        c.update(props)
        c['_id'] = ''
        objs[cidx] = c
        n['_components'].append(ref(cidx))
    pinfo = {
        '__type__': 'cc.PrefabInfo',
        'root': ref(root_idx),
        'asset': ref(prefab_idx),
        'fileId': fid(),
        'instance': None,
        'targetOverrides': None,
    }
    if idx == root_idx:
        pinfo['nestedPrefabInstanceRoots'] = None
    n['_prefab'] = ref(add(pinfo))
    return idx


def child(*args, **kwargs):
    return lambda parent: node(*args[:1], parent, *args[1:], **kwargs)


probe_positions = [vec3(x, y, z) for y in (0, 3) for z in (-4, 0, 4) for x in (-4, 0, 4)]

node('LightRig', None, children=[
    child('Sun', pos=(0, 10, 0), euler=(-50, 30, 0), components=[
        ('cc.DirectionalLight', {
            '_color': color(255, 244, 214),
            '_illuminanceHDR': 80000,
            '_shadowEnabled': True,
        }),
    ]),
    child('Lamps', pos=(0, 0, -1), euler=(0, 90, 0), children=[
        child('FillLight', pos=(3, 2, -2), components=[
            ('cc.SphereLight', {
                '_color': color(120, 160, 255),
                '_size': 0.5,
                '_luminanceHDR': 2000,
                '_range': 6,
            }),
        ]),
        child('RimSpot', pos=(-4, 5, 4), euler=(-35, -45, 0), components=[
            ('cc.SpotLight', {
                '_color': color(255, 120, 80),
                '_size': 0.2,
                '_luminanceHDR': 3000,
                '_range': 12,
                '_spotAngle': 40,
            }),
        ]),
    ]),
    child('Probes', components=[
        ('cc.LightProbeGroup', {
            '_probes': probe_positions,
            '_method': 0,
            '_minPos': vec3(-4, 0, -4),
            '_maxPos': vec3(4, 3, 4),
            '_nProbesX': 3,
            '_nProbesY': 2,
            '_nProbesZ': 3,
        }),
    ]),
    child('Reflection', pos=(0, 1.5, 0), components=[
        ('cc.ReflectionProbe', {
            '_resolution': 256,
            '_backgroundColor': color(20, 24, 32),
            '_probeType': 0,
            '_size': vec3(5, 1.5, 5),
        }),
    ]),
])

objs[prefab_idx]['data'] = ref(root_idx)

with open(OUT, 'w') as f:
    json.dump(objs, f, indent=2)
print('wrote', OUT, len(objs), 'objects')
