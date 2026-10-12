#!/usr/bin/env python3
import json
import math
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'resources', 'prefabs', 'test', 'LightRig.prefab')

LAYER_DEFAULT = 1 << 30
STD_EXPOSURE = 1.0 / 38400.0
LIGHT_METER_SCALE = 10000.0

objs = []
_fid = [0]


def add(o):
    objs.append(o)
    return len(objs) - 1


def ref(i):
    return {"__id__": i}


def file_id():
    _fid[0] += 1
    return "lightrig%04d" % _fid[0]


def vec3(x, y, z):
    return {"__type__": "cc.Vec3", "x": x, "y": y, "z": z}


def color(r, g, b, a=255):
    return {"__type__": "cc.Color", "r": r, "g": g, "b": b, "a": a}


def quat_from_euler(x, y, z):
    h = math.pi / 360.0
    x, y, z = x * h, y * h, z * h
    sx, cx = math.sin(x), math.cos(x)
    sy, cy = math.sin(y), math.cos(y)
    sz, cz = math.sin(z), math.cos(z)
    q = (
        sx * cy * cz + cx * sy * sz,
        cx * sy * cz + sx * cy * sz,
        cx * cy * sz - sx * sy * cz,
        cx * cy * cz - sx * sy * sz,
    )
    q = tuple(0.0 if abs(v) < 1e-12 else round(v, 12) for v in q)
    return {"__type__": "cc.Quat", "x": q[0], "y": q[1], "z": q[2], "w": q[3]}


prefab_idx = add({
    "__type__": "cc.Prefab",
    "_name": "LightRig",
    "_objFlags": 0,
    "__editorExtras__": {},
    "_native": "",
    "data": None,
    "optimizationPolicy": 0,
    "persistent": False,
})

root_idx = None


def make_node(name, parent, pos=(0, 0, 0), euler=(0, 0, 0)):
    idx = add({
        "__type__": "cc.Node",
        "_name": name,
        "_objFlags": 0,
        "__editorExtras__": {},
        "_parent": ref(parent) if parent is not None else None,
        "_children": [],
        "_active": True,
        "_components": [],
        "_prefab": None,
        "_lpos": vec3(*pos),
        "_lrot": quat_from_euler(*euler),
        "_lscale": vec3(1, 1, 1),
        "_mobility": 0,
        "_layer": LAYER_DEFAULT,
        "_euler": vec3(*euler),
        "_id": "",
    })
    if parent is not None:
        objs[parent]["_children"].append(ref(idx))
    return idx


def finish_node(idx, is_root=False):
    info = {
        "__type__": "cc.PrefabInfo",
        "root": ref(root_idx),
        "asset": ref(prefab_idx),
        "fileId": file_id(),
        "instance": None,
        "targetOverrides": None,
    }
    if is_root:
        info["nestedPrefabInstanceRoots"] = None
    objs[idx]["_prefab"] = ref(add(info))


def add_comp(node, type_name, props):
    comp = {
        "__type__": type_name,
        "_name": "",
        "_objFlags": 0,
        "__editorExtras__": {},
        "node": ref(node),
        "_enabled": True,
        "__prefab": None,
    }
    comp.update(props)
    comp["_id"] = ""
    idx = add(comp)
    comp["__prefab"] = ref(add({"__type__": "cc.CompPrefabInfo", "fileId": file_id()}))
    objs[node]["_components"].append(ref(idx))
    return idx


def static_settings():
    return {"__type__": "cc.StaticLightSettings", "_baked": False, "_editorOnly": False, "_castShadow": False}


def light_base(c):
    return {
        "_color": color(*c),
        "_useColorTemperature": False,
        "_colorTemperature": 6550,
        "_staticSettings": static_settings(),
    }


root_idx = make_node("LightRig", None)
objs[prefab_idx]["data"] = ref(root_idx)

# Sun
sun = make_node("Sun", root_idx, (0, 10, 0), (-50, 30, 0))
p = light_base((255, 244, 214))
p.update({
    "_illuminanceHDR": 80000,
    "_illuminanceLDR": 80000 * STD_EXPOSURE,
    "_shadowEnabled": True,
})
add_comp(sun, "cc.DirectionalLight", p)
finish_node(sun)

# Lamps
lamps = make_node("Lamps", root_idx, (0, 0, -1), (0, 90, 0))

fill = make_node("FillLight", lamps, (3, 2, -2))
p = light_base((120, 160, 255))
p.update({
    "_size": 0.5,
    "_luminanceHDR": 2000,
    "_luminanceLDR": 2000 * STD_EXPOSURE * LIGHT_METER_SCALE,
    "_term": 1,
    "_range": 6,
})
add_comp(fill, "cc.SphereLight", p)
finish_node(fill)

rim = make_node("RimSpot", lamps, (-4, 5, 4), (-35, -45, 0))
p = light_base((255, 120, 80))
p.update({
    "_size": 0.2,
    "_luminanceHDR": 3000,
    "_luminanceLDR": 3000 * STD_EXPOSURE * LIGHT_METER_SCALE,
    "_term": 1,
    "_range": 12,
    "_spotAngle": 40,
})
add_comp(rim, "cc.SpotLight", p)
finish_node(rim)

finish_node(lamps)

# Probes
probes = make_node("Probes", root_idx)
positions = [vec3(x, y, z) for y in (0, 3) for z in (-4, 0, 4) for x in (-4, 0, 4)]
add_comp(probes, "cc.LightProbeGroup", {
    "_probes": positions,
    "_method": 0,
    "_minPos": vec3(-4, 0, -4),
    "_maxPos": vec3(4, 3, 4),
    "_nProbesX": 3,
    "_nProbesY": 2,
    "_nProbesZ": 3,
})
finish_node(probes)

# Reflection
refl = make_node("Reflection", root_idx, (0, 1.5, 0))
add_comp(refl, "cc.ReflectionProbe", {
    "_resolution": 256,
    "_backgroundColor": color(20, 24, 32),
    "_probeType": 0,
    "_size": vec3(5, 1.5, 5),
})
finish_node(refl)

finish_node(root_idx, is_root=True)

with open(OUT, 'w') as f:
    json.dump(objs, f, indent=2)
    f.write('\n')
print("wrote", os.path.normpath(OUT), len(objs), "objects")
