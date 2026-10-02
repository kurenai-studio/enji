#!/usr/bin/env python3
import json
import os
import random
import string

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets/resources/prefabs/test/BagDialog.prefab")
LAYER_UI_2D = 33554432

SF = {
    "bar_track": "368d1a6f-889b-4f22-a503-a43b521bae45@f9941",
    "comic_panel": "5f891261-50c3-44a8-9a51-b3631db45a09@f9941",
    "lv_chip": "1770805b-7c6a-4ebc-bc74-fa08164c683b@f9941",
    "ink_well": "8e6c85ea-f832-4128-b49a-16cb5c528e43@f9941",
    "portrait_rim": "71e411cb-08b2-4cc8-82c7-cc3a7693629c@f9941",
    "crimson_fox": "09760ad1-a326-497a-b38a-1596b7cc4038@f9941",
    "ink_raven": "81d3f036-8c39-4b1a-a067-970878f6fb6b@f9941",
}

objs = []
rng = random.Random(1234)


def file_id():
    chars = string.ascii_letters + string.digits + "+/"
    return "".join(rng.choice(chars) for _ in range(22))


def add(o):
    objs.append(o)
    return len(objs) - 1


def ref(i):
    return {"__id__": i}


def vec3(x=0, y=0, z=0):
    return {"__type__": "cc.Vec3", "x": x, "y": y, "z": z}


def color(r, g, b, a=255):
    return {"__type__": "cc.Color", "r": r, "g": g, "b": b, "a": a}


objs.append({
    "__type__": "cc.Prefab",
    "_name": "BagDialog",
    "_objFlags": 0,
    "__editorExtras__": {},
    "_native": "",
    "data": {"__id__": 1},
    "optimizationPolicy": 0,
    "persistent": False,
})

ROOT_NODE = 1
nested_roots_placeholder = []


def comp_base(type_name, node_idx):
    return {
        "__type__": type_name,
        "_name": "",
        "_objFlags": 0,
        "__editorExtras__": {},
        "node": ref(node_idx),
        "_enabled": True,
        "__prefab": None,
        "_id": "",
    }


def finish_comp(c):
    idx = add(c)
    c["__prefab"] = ref(add({"__type__": "cc.CompPrefabInfo", "fileId": file_id()}))
    return idx


def ui_transform(node_idx, w, h, ax=0.5, ay=0.5):
    c = comp_base("cc.UITransform", node_idx)
    c["_contentSize"] = {"__type__": "cc.Size", "width": w, "height": h}
    c["_anchorPoint"] = {"__type__": "cc.Vec2", "x": ax, "y": ay}
    return finish_comp(c)


def sprite(node_idx, sf, sliced, col=(255, 255, 255, 255)):
    c = comp_base("cc.Sprite", node_idx)
    c.update({
        "_customMaterial": None,
        "_srcBlendFactor": 2,
        "_dstBlendFactor": 4,
        "_color": color(*col),
        "_spriteFrame": {"__uuid__": SF[sf], "__expectedType__": "cc.SpriteFrame"},
        "_type": 1 if sliced else 0,
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


def label(node_idx, text, size, line_h, col=(255, 255, 255, 255)):
    c = comp_base("cc.Label", node_idx)
    c.update({
        "_customMaterial": None,
        "_srcBlendFactor": 2,
        "_dstBlendFactor": 4,
        "_color": color(*col),
        "_string": text,
        "_horizontalAlign": 1,
        "_verticalAlign": 1,
        "_actualFontSize": size,
        "_fontSize": size,
        "_fontFamily": "Arial",
        "_lineHeight": line_h,
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
        "_enableOutline": False,
        "_outlineColor": color(0, 0, 0, 255),
        "_outlineWidth": 2,
        "_enableShadow": False,
        "_shadowColor": color(0, 0, 0, 255),
        "_shadowOffset": {"__type__": "cc.Vec2", "x": 2, "y": 2},
        "_shadowBlur": 2,
    })
    return finish_comp(c)


def button(node_idx, transition, zoom=1.2):
    c = comp_base("cc.Button", node_idx)
    c.update({
        "clickEvents": [],
        "_interactable": True,
        "_transition": transition,
        "_normalColor": color(214, 214, 214, 255),
        "_hoverColor": color(211, 211, 211, 255),
        "_pressedColor": color(255, 255, 255, 255),
        "_disabledColor": color(124, 124, 124, 255),
        "_normalSprite": None,
        "_hoverSprite": None,
        "_pressedSprite": None,
        "_disabledSprite": None,
        "_duration": 0.1,
        "_zoomScale": zoom,
        "_target": ref(node_idx),
    })
    return finish_comp(c)


def block_input(node_idx):
    return finish_comp(comp_base("cc.BlockInputEvents", node_idx))


def grid_layout(node_idx):
    c = comp_base("cc.Layout", node_idx)
    c.update({
        "_resizeMode": 0,
        "_layoutType": 3,
        "_cellSize": {"__type__": "cc.Size", "width": 180, "height": 240},
        "_startAxis": 0,
        "_paddingLeft": 0,
        "_paddingRight": 0,
        "_paddingTop": 0,
        "_paddingBottom": 0,
        "_spacingX": 20,
        "_spacingY": 40,
        "_verticalDirection": 1,
        "_horizontalDirection": 0,
        "_constraint": 2,
        "_constraintNum": 3,
        "_affectedByScale": False,
        "_isAlign": True,
    })
    return finish_comp(c)


def node(name, parent, w, h, pos=(0, 0), comps=()):
    n = {
        "__type__": "cc.Node",
        "_name": name,
        "_objFlags": 0,
        "__editorExtras__": {},
        "_parent": ref(parent) if parent is not None else None,
        "_children": [],
        "_active": True,
        "_components": [],
        "_prefab": None,
        "_lpos": vec3(pos[0], pos[1], 0),
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": vec3(1, 1, 1),
        "_mobility": 0,
        "_layer": LAYER_UI_2D,
        "_euler": vec3(),
        "_id": "",
    }
    idx = add(n)
    if parent is not None:
        objs[parent]["_children"].append(ref(idx))
    n["_components"].append(ref(ui_transform(idx, w, h)))
    for make in comps:
        n["_components"].append(ref(make(idx)))
    return idx


def close_node(idx):
    info = {
        "__type__": "cc.PrefabInfo",
        "root": ref(ROOT_NODE),
        "asset": ref(0),
        "fileId": file_id(),
        "instance": None,
        "targetOverrides": None,
    }
    if idx == ROOT_NODE:
        info["nestedPrefabInstanceRoots"] = None
    objs[idx]["_prefab"] = ref(add(info))


# Children must be fully built (incl. their PrefabInfo) before closing a parent
# only for readability; ids are arbitrary, so close nodes as we go.
created = []


def mk(name, parent, w, h, pos=(0, 0), comps=()):
    idx = node(name, parent, w, h, pos, comps)
    created.append(idx)
    return idx


root = mk("BagDialog", None, 720, 1280, comps=[block_input])
assert root == ROOT_NODE

mk("Dim", root, 720, 1280, comps=[lambda i: sprite(i, "bar_track", True, (0, 0, 0, 170))])
panel = mk("Panel", root, 640, 820, comps=[lambda i: sprite(i, "comic_panel", True)])

title_plate = mk("TitlePlate", panel, 260, 72, (0, 370), comps=[lambda i: sprite(i, "lv_chip", True)])
mk("Title", title_plate, 240, 56, comps=[lambda i: label(i, "道具袋", 36, 45)])

close = mk("Close", panel, 72, 72, (276, 370),
           comps=[lambda i: sprite(i, "lv_chip", True), lambda i: button(i, 3, 0.9)])
mk("X", close, 60, 60, comps=[lambda i: label(i, "×", 40, 50)])

grid = mk("Grid", panel, 580, 520, (0, -10), comps=[grid_layout])

slots = [
    ("crimson_fox", "回复药", "x3"),
    ("ink_raven", "大回复药", "x1"),
    ("crimson_fox", "解毒剂", "x5"),
    ("ink_raven", "怪谈球", "x12"),
    ("crimson_fox", "烟雾弹", "x2"),
    ("ink_raven", "复活草", "x1"),
]
slot_pos = [(-200, 140), (0, 140), (200, 140), (-200, -140), (0, -140), (200, -140)]

for k, (icon, name, count) in enumerate(slots):
    s = mk(f"Slot{k}", grid, 180, 240, slot_pos[k], comps=[lambda i: button(i, 0)])
    mk("Bg", s, 180, 240, comps=[lambda i: sprite(i, "ink_well", True)])
    mk("Frame", s, 180, 240, comps=[lambda i: sprite(i, "portrait_rim", False)])
    mk("Icon", s, 110, 110, (0, 24), comps=[lambda i, icon=icon: sprite(i, icon, False)])
    mk("Name", s, 170, 36, (0, -70), comps=[lambda i, name=name: label(i, name, 26, 32)])
    badge = mk("CountBadge", s, 72, 36, (54, 98), comps=[lambda i: sprite(i, "lv_chip", True)])
    mk("Count", badge, 64, 30, comps=[lambda i, count=count: label(i, count, 22, 28, (17, 17, 17, 255))])

for idx in created:
    close_node(idx)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(objs, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(f"wrote {OUT}: {len(objs)} objects, {len(created)} nodes")
