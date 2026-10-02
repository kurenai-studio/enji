#!/usr/bin/env python3
import base64
import json
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "assets/resources/prefabs/test/BagDialog.prefab")
UI_2D = 33554432


def sf_uuid(rel):
    with open(os.path.join(ROOT, rel + ".meta"), encoding="utf-8") as f:
        meta = json.load(f)
    for sub in meta["subMetas"].values():
        if sub["importer"] == "sprite-frame":
            return sub["uuid"]
    raise RuntimeError("no sprite-frame in " + rel)


objs = []
_fid = [0]


def file_id():
    _fid[0] += 1
    return base64.urlsafe_b64encode(f"bagdialog-{_fid[0]:06d}".encode()).decode()[:22]


def add(o):
    objs.append(o)
    return len(objs) - 1


def ref(i):
    return {"__id__": i}


def color(r, g, b, a=255):
    return {"__type__": "cc.Color", "r": r, "g": g, "b": b, "a": a}


add({
    "__type__": "cc.Prefab",
    "_name": "BagDialog",
    "_objFlags": 0,
    "_native": "",
    "data": ref(1),
    "optimizationPolicy": 0,
    "asyncLoadAssets": False,
    "persistent": False,
})


def comp_base(type_, node_id):
    return {"__type__": type_, "_name": "", "_objFlags": 0, "node": ref(node_id), "_enabled": True}


def finish_comp(c):
    c["_id"] = ""
    idx = add(c)
    c["__prefab"] = ref(add({"__type__": "cc.CompPrefabInfo", "fileId": file_id()}))
    return idx


def uitransform(node_id, w, h):
    c = comp_base("cc.UITransform", node_id)
    c["_contentSize"] = {"__type__": "cc.Size", "width": w, "height": h}
    c["_anchorPoint"] = {"__type__": "cc.Vec2", "x": 0.5, "y": 0.5}
    return finish_comp(c)


def sprite(node_id, img, type_, col):
    c = comp_base("cc.Sprite", node_id)
    c.update({
        "_customMaterial": None,
        "_srcBlendFactor": 2,
        "_dstBlendFactor": 4,
        "_color": color(*col),
        "_spriteFrame": {"__uuid__": sf_uuid(img), "__expectedType__": "cc.SpriteFrame"},
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


def label(node_id, text, size, lh, col=(255, 255, 255, 255)):
    c = comp_base("cc.Label", node_id)
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
        "_lineHeight": lh,
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


def button(node_id, transition, zoom=1.2):
    c = comp_base("cc.Button", node_id)
    c.update({
        "clickEvents": [],
        "_interactable": True,
        "_transition": transition,
        "_normalColor": color(214, 214, 214),
        "_hoverColor": color(211, 211, 211),
        "_pressedColor": color(255, 255, 255),
        "_disabledColor": color(124, 124, 124),
        "_normalSprite": None,
        "_hoverSprite": None,
        "_pressedSprite": None,
        "_disabledSprite": None,
        "_duration": 0.1,
        "_zoomScale": zoom,
        "_target": ref(node_id),
    })
    return finish_comp(c)


def block_input(node_id):
    return finish_comp(comp_base("cc.BlockInputEvents", node_id))


def layout(node_id):
    c = comp_base("cc.Layout", node_id)
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
        "_isAlign": False,
    })
    return finish_comp(c)


def node(name, parent, size, pos=(0, 0), comps=(), children=()):
    """comps: list of callables taking node_id; children: list of callables taking parent id."""
    n = {
        "__type__": "cc.Node",
        "_name": name,
        "_objFlags": 0,
        "_parent": ref(parent) if parent is not None else None,
        "_children": [],
        "_active": True,
        "_components": [],
        "_prefab": None,
        "_lpos": {"__type__": "cc.Vec3", "x": pos[0], "y": pos[1], "z": 0},
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
        "_mobility": 0,
        "_layer": UI_2D,
        "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_id": "",
    }
    nid = add(n)
    for ch in children:
        n["_children"].append(ref(ch(nid)))
    n["_components"].append(ref(uitransform(nid, *size)))
    for c in comps:
        n["_components"].append(ref(c(nid)))
    n["_prefab"] = ref(add({
        "__type__": "cc.PrefabInfo",
        "root": ref(1),
        "asset": ref(0),
        "fileId": file_id(),
        "instance": None,
        "targetOverrides": None,
        "nestedPrefabInstanceRoots": None,
    }))
    return nid


def N(name, size, pos=(0, 0), comps=(), children=()):
    return lambda parent: node(name, parent, size, pos, comps, children)


BATTLE = "assets/resources/ui/battle/"
DIM = BATTLE + "bar_track__500x32__normal.png"
PANEL = BATTLE + "comic_panel__1344x416__normal.png"
CHIP = BATTLE + "lv_chip__248x80__normal.png"
INK = BATTLE + "ink_well__408x456__normal.png"
RIM = BATTLE + "portrait_rim__472x520__normal.png"
FOX = "assets/resources/creatures/crimson_fox.png"
RAVEN = "assets/resources/creatures/ink_raven.png"
WHITE = (255, 255, 255, 255)

SLOTS = [
    ((-200, 140), FOX, "回复药", "x3"),
    ((0, 140), RAVEN, "大回复药", "x1"),
    ((200, 140), FOX, "解毒剂", "x5"),
    ((-200, -140), RAVEN, "怪谈球", "x12"),
    ((0, -140), FOX, "烟雾弹", "x2"),
    ((200, -140), RAVEN, "复活草", "x1"),
]


def slot(i, pos, icon, name, count):
    return N(f"Slot{i}", (180, 240), pos, [lambda n: button(n, 0)], [
        N("Bg", (180, 240), comps=[lambda n: sprite(n, INK, 1, WHITE)]),
        N("Frame", (180, 240), comps=[lambda n: sprite(n, RIM, 0, WHITE)]),
        N("Icon", (110, 110), (0, 24), [lambda n: sprite(n, icon, 0, WHITE)]),
        N("Name", (170, 36), (0, -70), [lambda n: label(n, name, 26, 32)]),
        N("CountBadge", (72, 36), (54, 98), [lambda n: sprite(n, CHIP, 1, WHITE)], [
            N("Count", (64, 30), comps=[lambda n: label(n, count, 22, 28, (17, 17, 17, 255))]),
        ]),
    ])


tree = N("BagDialog", (720, 1280), comps=[block_input], children=[
    N("Dim", (720, 1280), comps=[lambda n: sprite(n, DIM, 1, (0, 0, 0, 170))]),
    N("Panel", (640, 820), comps=[lambda n: sprite(n, PANEL, 1, WHITE)], children=[
        N("TitlePlate", (260, 72), (0, 370), [lambda n: sprite(n, CHIP, 1, WHITE)], [
            N("Title", (240, 56), comps=[lambda n: label(n, "道具袋", 36, 45)]),
        ]),
        N("Close", (72, 72), (276, 370),
          [lambda n: sprite(n, CHIP, 1, WHITE), lambda n: button(n, 3, 0.9)], [
            N("X", (60, 60), comps=[lambda n: label(n, "×", 40, 50)]),
        ]),
        N("Grid", (580, 520), (0, -10), [layout],
          [slot(i, *s) for i, s in enumerate(SLOTS)]),
    ]),
])

root_id = tree(None)
assert root_id == 1

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(objs, f, ensure_ascii=False, indent=2)
print(f"wrote {OUT} ({len(objs)} objects)")
