#!/usr/bin/env python3
"""Generates assets/resources/prefabs/test/BagDialog.prefab (Cocos Creator 3.8 format)."""
import json
import os
import uuid

ROOT = os.path.dirname(os.path.abspath(__file__))
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

SIMPLE, SLICED = 0, 1

objs = []


def add(o):
    objs.append(o)
    return len(objs) - 1


def ref(i):
    return {"__id__": i}


def file_id():
    return uuid.uuid4().hex[:22]


def vec3(x=0, y=0, z=0):
    return {"__type__": "cc.Vec3", "x": x, "y": y, "z": z}


def color(r, g, b, a=255):
    return {"__type__": "cc.Color", "r": r, "g": g, "b": b, "a": a}


def sprite(frame, type_, col=(255, 255, 255, 255)):
    return ("cc.Sprite", {
        "_customMaterial": None,
        "_srcBlendFactor": 2,
        "_dstBlendFactor": 4,
        "_color": color(*col),
        "_spriteFrame": {"__uuid__": SF[frame], "__expectedType__": "cc.SpriteFrame"},
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


def label(text, size, line_height, col=(255, 255, 255, 255)):
    return ("cc.Label", {
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
        "_enableOutline": False,
        "_outlineColor": color(0, 0, 0, 255),
        "_outlineWidth": 2,
        "_enableShadow": False,
        "_shadowColor": color(0, 0, 0, 255),
        "_shadowOffset": {"__type__": "cc.Vec2", "x": 2, "y": 2},
        "_shadowBlur": 2,
    })


def button(transition, zoom=1.2):
    # "_target" is filled in with the owning node's id.
    return ("cc.Button", {
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
        "_target": "SELF",
    })


def block_input():
    return ("cc.BlockInputEvents", {})


def grid_layout():
    return ("cc.Layout", {
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
        "_isAlign": False,
    })


def N(name, size, pos=(0, 0), comps=(), children=()):
    return {"name": name, "size": size, "pos": pos, "comps": list(comps), "children": list(children)}


ROOT_ID = 1


def emit(spec, parent_id):
    node = {
        "__type__": "cc.Node",
        "_name": spec["name"],
        "_objFlags": 0,
        "__editorExtras__": {},
        "_parent": ref(parent_id) if parent_id is not None else None,
        "_children": [],
        "_active": True,
        "_components": [],
        "_prefab": None,
        "_lpos": vec3(spec["pos"][0], spec["pos"][1], 0),
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": vec3(1, 1, 1),
        "_mobility": 0,
        "_layer": LAYER_UI_2D,
        "_euler": vec3(),
        "_id": "",
    }
    nid = add(node)
    for child in spec["children"]:
        node["_children"].append(ref(emit(child, nid)))

    w, h = spec["size"]
    comps = [("cc.UITransform", {
        "_contentSize": {"__type__": "cc.Size", "width": w, "height": h},
        "_anchorPoint": {"__type__": "cc.Vec2", "x": 0.5, "y": 0.5},
    })] + spec["comps"]
    for ctype, props in comps:
        comp = {
            "__type__": ctype,
            "_name": "",
            "_objFlags": 0,
            "__editorExtras__": {},
            "node": ref(nid),
            "_enabled": True,
            "__prefab": None,
        }
        for k, v in props.items():
            comp[k] = ref(nid) if v == "SELF" else v
        comp["_id"] = ""
        cid = add(comp)
        comp["__prefab"] = ref(add({"__type__": "cc.CompPrefabInfo", "fileId": file_id()}))
        node["_components"].append(ref(cid))

    info = {
        "__type__": "cc.PrefabInfo",
        "root": ref(ROOT_ID),
        "asset": ref(0),
        "fileId": file_id(),
        "instance": None,
        "targetOverrides": None,
    }
    if parent_id is None:
        info["nestedPrefabInstanceRoots"] = None
    node["_prefab"] = ref(add(info))
    return nid


ITEMS = [
    ("crimson_fox", "回复药", "x3", (-200, 140)),
    ("ink_raven", "大回复药", "x1", (0, 140)),
    ("crimson_fox", "解毒剂", "x5", (200, 140)),
    ("ink_raven", "怪谈球", "x12", (-200, -140)),
    ("crimson_fox", "烟雾弹", "x2", (0, -140)),
    ("ink_raven", "复活草", "x1", (200, -140)),
]


def slot(i, icon, name, count, pos):
    return N(f"Slot{i}", (180, 240), pos, [button(0)], [
        N("Bg", (180, 240), comps=[sprite("ink_well", SLICED)]),
        N("Frame", (180, 240), comps=[sprite("portrait_rim", SIMPLE)]),
        N("Icon", (110, 110), (0, 24), [sprite(icon, SIMPLE)]),
        N("Name", (170, 36), (0, -70), [label(name, 26, 32)]),
        N("CountBadge", (72, 36), (54, 98), [sprite("lv_chip", SLICED)], [
            N("Count", (64, 30), comps=[label(count, 22, 28, (17, 17, 17, 255))]),
        ]),
    ])


TREE = N("BagDialog", (720, 1280), comps=[block_input()], children=[
    N("Dim", (720, 1280), comps=[sprite("bar_track", SLICED, (0, 0, 0, 170))]),
    N("Panel", (640, 820), comps=[sprite("comic_panel", SLICED)], children=[
        N("TitlePlate", (260, 72), (0, 370), [sprite("lv_chip", SLICED)], [
            N("Title", (240, 56), comps=[label("道具袋", 36, 45)]),
        ]),
        N("Close", (72, 72), (276, 370), [sprite("lv_chip", SLICED), button(3, 0.9)], [
            N("X", (60, 60), comps=[label("×", 40, 50)]),
        ]),
        N("Grid", (580, 520), (0, -10), [grid_layout()],
          [slot(i, *item) for i, item in enumerate(ITEMS)]),
    ]),
])


def main():
    add({
        "__type__": "cc.Prefab",
        "_name": "BagDialog",
        "_objFlags": 0,
        "__editorExtras__": {},
        "_native": "",
        "data": ref(ROOT_ID),
        "optimizationPolicy": 0,
        "persistent": False,
    })
    emit(TREE, None)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(objs, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"wrote {len(objs)} objects to {OUT}")


if __name__ == "__main__":
    main()
