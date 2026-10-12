#!/usr/bin/env python3
import hashlib
import json
import math
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   'assets/resources/prefabs/test/LightRig.prefab')
LAYER_DEFAULT = 1 << 30
VISIBILITY = -325058561

objs = []


def add(o):
    objs.append(o)
    return len(objs) - 1


def ref(i):
    return {'__id__': i}


def file_id(seed):
    alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    h = hashlib.sha1(('LightRig/' + seed).encode()).digest()
    return ''.join(alphabet[b % 64] for b in h[:22])


def vec3(x=0, y=0, z=0):
    return {'__type__': 'cc.Vec3', 'x': x, 'y': y, 'z': z}


def color(r, g, b, a=255):
    return {'__type__': 'cc.Color', 'r': r, 'g': g, 'b': b, 'a': a}


def quat_from_euler(x, y, z):
    h = 0.5 * math.pi / 180
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


def node(name, parent, pos=(0, 0, 0), euler=(0, 0, 0)):
    n = {
        '__type__': 'cc.Node',
        '_name': name,
        '_objFlags': 0,
        '_parent': ref(parent) if parent is not None else None,
        '_children': [],
        '_active': True,
        '_components': [],
        '_prefab': None,
        '_lpos': vec3(*pos),
        '_lrot': quat_from_euler(*euler),
        '_lscale': vec3(1, 1, 1),
        '_mobility': 0,
        '_layer': LAYER_DEFAULT,
        '_euler': vec3(*euler),
        '_id': '',
    }
    i = add(n)
    if parent is not None:
        objs[parent]['_children'].append(ref(i))
    return i


def finish_node(i, root):
    info = {
        '__type__': 'cc.PrefabInfo',
        'root': ref(root),
        'asset': ref(0),
        'fileId': file_id('node/' + objs[i]['_name']),
    }
    if i == root:
        info['instance'] = None
        info['targetOverrides'] = None
    objs[i]['_prefab'] = ref(add(info))


def component(node_i, type_name, props):
    c = {
        '__type__': type_name,
        '_name': '',
        '_objFlags': 0,
        'node': ref(node_i),
        '_enabled': True,
        '__prefab': None,
    }
    c.update(props)
    c['_id'] = ''
    i = add(c)
    objs[node_i]['_components'].append(ref(i))
    c['__prefab'] = ref(add({
        '__type__': 'cc.CompPrefabInfo',
        'fileId': file_id('comp/' + objs[node_i]['_name'] + '/' + type_name),
    }))
    return i


def light_base(rgb):
    return {
        '_color': color(*rgb),
        '_useColorTemperature': False,
        '_colorTemperature': 6550,
        '_staticSettings': {
            '__type__': 'cc.StaticLightSettings',
            '_baked': False,
            '_editorOnly': False,
            '_castShadow': False,
        },
        '_visibility': VISIBILITY,
    }


add({
    '__type__': 'cc.Prefab',
    '_name': 'LightRig',
    '_objFlags': 0,
    '_native': '',
    'data': ref(1),
    'optimizationPolicy': 0,
    'asyncLoadAssets': False,
    'persistent': False,
})

root = node('LightRig', None)

sun = node('Sun', root, (0, 10, 0), (-50, 30, 0))
component(sun, 'cc.DirectionalLight', {
    **light_base((255, 244, 214)),
    '_illuminanceHDR': 80000,
    '_illuminance': 80000,
    '_illuminanceLDR': 80000 / 65000,
    '_shadowEnabled': True,
    '_shadowPcf': 0,
    '_shadowBias': 0.00001,
    '_shadowNormalBias': 0,
    '_shadowSaturation': 1,
    '_shadowDistance': 50,
    '_shadowInvisibleOcclusionRange': 200,
    '_csmLevel': 4,
    '_csmLayerLambda': 0.75,
    '_csmOptimizationMode': 2,
    '_csmAdvancedOptions': False,
    '_csmLayersTransition': False,
    '_csmTransitionRange': 0.05,
    '_shadowFixedArea': False,
    '_shadowNear': 0.1,
    '_shadowFar': 10,
    '_shadowOrthoSize': 5,
})
finish_node(sun, root)

LDR_RATIO = 442.70833333333337 / 1700

lamps = node('Lamps', root, (0, 0, -1), (0, 90, 0))

fill = node('FillLight', lamps, (3, 2, -2))
component(fill, 'cc.SphereLight', {
    **light_base((120, 160, 255)),
    '_size': 0.5,
    '_luminanceHDR': 2000,
    '_luminance': 2000,
    '_luminanceLDR': 2000 * LDR_RATIO,
    '_term': 1,
    '_range': 6,
})
finish_node(fill, root)

rim = node('RimSpot', lamps, (-4, 5, 4), (-35, -45, 0))
component(rim, 'cc.SpotLight', {
    **light_base((255, 120, 80)),
    '_size': 0.2,
    '_luminanceHDR': 3000,
    '_luminance': 3000,
    '_luminanceLDR': 3000 * LDR_RATIO,
    '_term': 1,
    '_range': 12,
    '_spotAngle': 40,
    '_angleAttenuationStrength': 0,
    '_shadowEnabled': False,
    '_shadowPcf': 0,
    '_shadowBias': 0.00001,
    '_shadowNormalBias': 0,
})
finish_node(rim, root)
finish_node(lamps, root)

probes = node('Probes', root)
probe_positions = [vec3(x, y, z) for y in (0, 3) for z in (-4, 0, 4) for x in (-4, 0, 4)]
component(probes, 'cc.LightProbeGroup', {
    '_probes': probe_positions,
    '_method': 0,
    '_minPos': vec3(-4, 0, -4),
    '_maxPos': vec3(4, 3, 4),
    '_nProbesX': 3,
    '_nProbesY': 2,
    '_nProbesZ': 3,
})
finish_node(probes, root)

refl = node('Reflection', root, (0, 1.5, 0))
component(refl, 'cc.ReflectionProbe', {
    '_resolution': 256,
    '_clearFlag': 14,
    '_backgroundColor': color(20, 24, 32),
    '_visibility': VISIBILITY,
    '_probeType': 0,
    '_cubemap': None,
    '_size': vec3(5, 1.5, 5),
    '_sourceCamera': None,
    '_probeId': -1,
    '_fastBake': False,
})
finish_node(refl, root)

finish_node(root, root)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w') as f:
    json.dump(objs, f, indent=2)
    f.write('\n')
print('wrote', OUT, len(objs), 'objects')
