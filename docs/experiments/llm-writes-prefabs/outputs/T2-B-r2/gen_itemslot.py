#!/usr/bin/env python3
import json
import os
import random
import string

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "assets/resources/prefabs/test/ItemSlot.prefab")

UI_2D = 1 << 25
random.seed(20261002)


def file_id():
    alphabet = string.ascii_letters + string.digits + "+/"
    return "".join(random.choice(alphabet) for _ in range(22))


def sprite_frame_uuid(rel_png):
    with open(os.path.join(ROOT, rel_png + ".meta"), encoding="utf-8") as f:
        meta = json.load(f)
    for sub in meta["subMetas"].values():
        if sub["importer"] == "sprite-frame":
            return sub["uuid"]
    raise RuntimeError("no sprite-frame sub-asset in " + rel_png)


def vec3(x=0, y=0, z=0):
    return {"__type__": "cc.Vec3", "x": x, "y": y, "z": z}


def color(r, g, b, a=255):
    return {"__type__": "cc.Color", "r": r, "g": g, "b": b, "a": a}


objs = []


def add(obj):
    objs.append(obj)
    return len(objs) - 1


def ref(i):
    return {"__id__": i}


add({
    "__type__": "cc.Prefab",
    "_name": "ItemSlot",
    "_objFlags": 0,
    "__editorExtras__": {},
    "_native": "",
    "data": ref(1),
    "optimizationPolicy": 0,
    "persistent": False,
})


def comp_base(type_name, node_id):
    return {
        "__type__": type_name,
        "_name": "",
        "_objFlags": 0,
        "__editorExtras__": {},
        "node": ref(node_id),
        "_enabled": True,
        "__prefab": None,
    }


def finish_comp(comp):
    idx = add(comp)
    comp["__prefab"] = ref(add({"__type__": "cc.CompPrefabInfo", "fileId": file_id()}))
    comp["_id"] = ""
    return idx


def ui_transform(node_id, w, h, ax=0.5, ay=0.5):
    c = comp_base("cc.UITransform", node_id)
    c["_contentSize"] = {"__type__": "cc.Size", "width": w, "height": h}
    c["_anchorPoint"] = {"__type__": "cc.Vec2", "x": ax, "y": ay}
    return finish_comp(c)


def sprite(node_id, png, sprite_type, size_mode=0, col=(255, 255, 255, 255)):
    c = comp_base("cc.Sprite", node_id)
    c.update({
        "_customMaterial": None,
        "_srcBlendFactor": 2,
        "_dstBlendFactor": 4,
        "_color": color(*col),
        "_spriteFrame": {"__uuid__": sprite_frame_uuid(png), "__expectedType__": "cc.SpriteFrame"},
        "_type": sprite_type,
        "_fillType": 0,
        "_sizeMode": size_mode,
        "_fillCenter": {"__type__": "cc.Vec2", "x": 0, "y": 0},
        "_fillStart": 0,
        "_fillRange": 0,
        "_isTrimmedMode": True,
        "_useGrayscale": False,
        "_atlas": None,
    })
    return finish_comp(c)


def label(node_id, text, font_size, line_height, col, bold=True):
    c = comp_base("cc.Label", node_id)
    c.update({
        "_customMaterial": None,
        "_srcBlendFactor": 2,
        "_dstBlendFactor": 4,
        "_color": color(*col),
        "_string": text,
        "_horizontalAlign": 1,
        "_verticalAlign": 1,
        "_actualFontSize": font_size,
        "_fontSize": font_size,
        "_fontFamily": "Arial",
        "_lineHeight": line_height,
        "_overflow": 2,
        "_enableWrapText": True,
        "_font": None,
        "_isSystemFontUsed": True,
        "_spacingX": 0,
        "_isItalic": False,
        "_isBold": bold,
        "_isUnderline": False,
        "_underlineHeight": 2,
        "_cacheMode": 0,
        "_enableOutline": False,
        "_outlineColor": color(0, 0, 0, 255),
        "_outlineWidth": 2,
        "_enableShadow": False,
        "_shadowColor": color(0, 0, 0, 255),
        "_shadowOffset": {"__type__": "cc.Vec2", "x": 2, "y": 2},
        "_shadowBlur": 2,
    })
    return finish_comp(c)


def button(node_id, target_id):
    c = comp_base("cc.Button", node_id)
    c.update({
        "clickEvents": [],
        "_interactable": True,
        "_transition": 0,
        "_normalColor": color(214, 214, 214, 255),
        "_hoverColor": color(211, 211, 211, 255),
        "_pressedColor": color(255, 255, 255, 255),
        "_disabledColor": color(124, 124, 124, 255),
        "_normalSprite": None,
        "_hoverSprite": None,
        "_pressedSprite": None,
        "_disabledSprite": None,
        "_duration": 0.1,
        "_zoomScale": 1.2,
        "_target": ref(target_id),
    })
    return finish_comp(c)


def node(name, parent_id, pos=(0, 0)):
    n = {
        "__type__": "cc.Node",
        "_name": name,
        "_objFlags": 0,
        "__editorExtras__": {},
        "_parent": ref(parent_id) if parent_id is not None else None,
        "_children": [],
        "_active": True,
        "_components": [],
        "_prefab": None,
        "_lpos": vec3(pos[0], pos[1], 0),
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": vec3(1, 1, 1),
        "_mobility": 0,
        "_layer": UI_2D,
        "_euler": vec3(),
        "_id": "",
    }
    idx = add(n)
    if parent_id is not None:
        objs[parent_id]["_children"].append(ref(idx))
    return idx


def finish_node(idx, is_root=False):
    info = {
        "__type__": "cc.PrefabInfo",
        "root": ref(1),
        "asset": ref(0),
        "fileId": file_id(),
        "instance": None,
        "targetOverrides": None,
    }
    if is_root:
        info["nestedPrefabInstanceRoots"] = None
    objs[idx]["_prefab"] = ref(add(info))


def add_comps(node_id, *comp_ids):
    objs[node_id]["_components"].extend(ref(c) for c in comp_ids)


BATTLE = "assets/resources/ui/battle/"

root = node("ItemSlot", None)

bg = node("Bg", root)
add_comps(bg, ui_transform(bg, 200, 240), sprite(bg, BATTLE + "ink_well__408x456__normal.png", 1))
finish_node(bg)

frame = node("Frame", root)
add_comps(frame, ui_transform(frame, 200, 240), sprite(frame, BATTLE + "portrait_rim__472x520__normal.png", 0))
finish_node(frame)

icon = node("Icon", root, (0, 24))
add_comps(icon, ui_transform(icon, 120, 120), sprite(icon, "assets/resources/creatures/crimson_fox.png", 0))
finish_node(icon)

name_n = node("Name", root, (0, -70))
add_comps(name_n, ui_transform(name_n, 180, 36), label(name_n, "回复药", 26, 32, (255, 255, 255, 255)))
finish_node(name_n)

badge = node("CountBadge", root, (62, 98))
add_comps(badge, ui_transform(badge, 72, 36), sprite(badge, BATTLE + "lv_chip__248x80__normal.png", 1))

count = node("Count", badge)
add_comps(count, ui_transform(count, 64, 30), label(count, "x3", 22, 28, (17, 17, 17, 255)))
finish_node(count)
finish_node(badge)

add_comps(root, ui_transform(root, 200, 240), button(root, root))
finish_node(root, is_root=True)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(objs, f, ensure_ascii=False, indent=2)
print("wrote", OUT, len(objs), "objects")
