#!/usr/bin/env python3
"""Generate assets/resources/prefabs/test/ItemSlot.prefab (Cocos Creator 3.8 format)."""
import json
import os
import random
import string

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets/resources/prefabs/test/ItemSlot.prefab")

LAYER_UI_2D = 33554432

SF = {
    "ink_well": "8e6c85ea-f832-4128-b49a-16cb5c528e43@f9941",
    "portrait_rim": "71e411cb-08b2-4cc8-82c7-cc3a7693629c@f9941",
    "crimson_fox": "09760ad1-a326-497a-b38a-1596b7cc4038@f9941",
    "lv_chip": "1770805b-7c6a-4ebc-bc74-fa08164c683b@f9941",
}

rng = random.Random(20261002)
ALPHABET = string.ascii_letters + string.digits + "+/"


def file_id():
    return "".join(rng.choice(ALPHABET) for _ in range(22))


objs = []


def add(obj):
    objs.append(obj)
    return len(objs) - 1


def ref(i):
    return {"__id__": i}


def color(r, g, b, a=255):
    return {"__type__": "cc.Color", "r": r, "g": g, "b": b, "a": a}


def comp_base(type_, node_id):
    return {
        "__type__": type_,
        "_name": "",
        "_objFlags": 0,
        "node": ref(node_id),
        "_enabled": True,
    }


def finish_comp(comp):
    comp_id = add(comp)
    comp["_id"] = ""
    comp["__prefab"] = ref(add({"__type__": "cc.CompPrefabInfo", "fileId": file_id()}))
    return comp_id


def ui_transform(node_id, w, h):
    c = comp_base("cc.UITransform", node_id)
    c["_contentSize"] = {"__type__": "cc.Size", "width": w, "height": h}
    c["_anchorPoint"] = {"__type__": "cc.Vec2", "x": 0.5, "y": 0.5}
    return finish_comp(c)


def sprite(node_id, sf_uuid, type_):
    c = comp_base("cc.Sprite", node_id)
    c.update({
        "_customMaterial": None,
        "_srcBlendFactor": 2,
        "_dstBlendFactor": 4,
        "_color": color(255, 255, 255),
        "_spriteFrame": {"__uuid__": sf_uuid, "__expectedType__": "cc.SpriteFrame"},
        "_type": type_,
        "_fillType": 0,
        "_sizeMode": 0,
        "_fillCenter": {"__type__": "cc.Vec2", "x": 0, "y": 0},
        "_fillStart": 0,
        "_fillRange": 0,
        "_isTrimmedMode": True,
        "_useGrayscale": False,
        "_atlas": None,
    })
    return finish_comp(c)


def label(node_id, text, font_size, line_height, col):
    c = comp_base("cc.Label", node_id)
    c.update({
        "_customMaterial": None,
        "_srcBlendFactor": 2,
        "_dstBlendFactor": 4,
        "_color": col,
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
        "_isBold": True,
        "_isUnderline": False,
        "_underlineHeight": 2,
        "_cacheMode": 0,
    })
    return finish_comp(c)


def button(node_id, target_id):
    c = comp_base("cc.Button", node_id)
    c.update({
        "clickEvents": [],
        "_interactable": True,
        "_transition": 0,
        "_normalColor": color(214, 214, 214),
        "_hoverColor": color(211, 211, 211),
        "_pressedColor": color(255, 255, 255),
        "_disabledColor": color(124, 124, 124),
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
        "_parent": ref(parent_id) if parent_id is not None else None,
        "_children": [],
        "_active": True,
        "_components": [],
        "_prefab": None,
        "_lpos": {"__type__": "cc.Vec3", "x": pos[0], "y": pos[1], "z": 0},
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
        "_mobility": 0,
        "_layer": LAYER_UI_2D,
        "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_id": "",
    }
    nid = add(n)
    if parent_id is not None:
        objs[parent_id]["_children"].append(ref(nid))
    return nid


def finish_node(nid, comps):
    objs[nid]["_components"] = [ref(c) for c in comps]
    info = {
        "__type__": "cc.PrefabInfo",
        "root": ref(1),
        "asset": ref(0),
        "fileId": file_id(),
        "instance": None,
        "targetOverrides": None,
    }
    if nid == 1:
        info["nestedPrefabInstanceRoots"] = None
    objs[nid]["_prefab"] = ref(add(info))


add({
    "__type__": "cc.Prefab",
    "_name": "ItemSlot",
    "_objFlags": 0,
    "_native": "",
    "data": ref(1),
    "optimizationPolicy": 0,
    "asyncLoadAssets": False,
    "persistent": False,
})

root = node("ItemSlot", None)

bg = node("Bg", root)
finish_node(bg, [ui_transform(bg, 200, 240), sprite(bg, SF["ink_well"], 1)])

frame = node("Frame", root)
finish_node(frame, [ui_transform(frame, 200, 240), sprite(frame, SF["portrait_rim"], 0)])

icon = node("Icon", root, (0, 24))
finish_node(icon, [ui_transform(icon, 120, 120), sprite(icon, SF["crimson_fox"], 0)])

name_n = node("Name", root, (0, -70))
finish_node(name_n, [ui_transform(name_n, 180, 36),
                     label(name_n, "回复药", 26, 32, color(255, 255, 255))])

badge = node("CountBadge", root, (62, 98))
count = node("Count", badge)
finish_node(count, [ui_transform(count, 64, 30),
                    label(count, "x3", 22, 28, color(17, 17, 17))])
finish_node(badge, [ui_transform(badge, 72, 36), sprite(badge, SF["lv_chip"], 1)])

finish_node(root, [ui_transform(root, 200, 240), button(root, root)])

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(objs, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("wrote", OUT, len(objs), "objects")
