import json, os, random, string

OUT = os.path.join(os.path.dirname(__file__), "assets/resources/prefabs/test/ItemSlot.prefab")
UI_2D = 33554432

SF = {
    "ink_well": "8e6c85ea-f832-4128-b49a-16cb5c528e43@f9941",
    "portrait_rim": "71e411cb-08b2-4cc8-82c7-cc3a7693629c@f9941",
    "crimson_fox": "09760ad1-a326-497a-b38a-1596b7cc4038@f9941",
    "lv_chip": "1770805b-7c6a-4ebc-bc74-fa08164c683b@f9941",
}

objs = []
rnd = random.Random(42)


def fid():
    chars = string.ascii_letters + string.digits + "+/"
    return "".join(rnd.choice(chars) for _ in range(22))


def add(o):
    objs.append(o)
    return len(objs) - 1


def ref(i):
    return {"__id__": i}


def color(r, g, b, a=255):
    return {"__type__": "cc.Color", "r": r, "g": g, "b": b, "a": a}


objs.append({
    "__type__": "cc.Prefab", "_name": "ItemSlot", "_objFlags": 0, "_native": "",
    "data": {"__id__": 1}, "optimizationPolicy": 0, "asyncLoadAssets": False, "persistent": False,
})
ROOT = 1


def comp_prefab():
    return ref(add({"__type__": "cc.CompPrefabInfo", "fileId": fid()}))


def node(name, parent, size, pos=(0, 0), comps=(), children=()):
    n = add({
        "__type__": "cc.Node", "_name": name, "_objFlags": 0,
        "_parent": ref(parent) if parent is not None else None,
        "_children": [], "_active": True, "_components": [], "_prefab": None,
        "_lpos": {"__type__": "cc.Vec3", "x": pos[0], "y": pos[1], "z": 0},
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
        "_layer": UI_2D,
        "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_id": "",
    })
    cs = []
    ut = add({
        "__type__": "cc.UITransform", "_name": "", "_objFlags": 0, "node": ref(n), "_enabled": True,
        "_contentSize": {"__type__": "cc.Size", "width": size[0], "height": size[1]},
        "_anchorPoint": {"__type__": "cc.Vec2", "x": 0.5, "y": 0.5},
        "_id": "",
    })
    objs[ut]["__prefab"] = comp_prefab()
    cs.append(ref(ut))
    for make in comps:
        c = add(make(n))
        objs[c]["__prefab"] = comp_prefab()
        cs.append(ref(c))
    objs[n]["_components"] = cs
    kids = [ref(make(n)) for make in children]
    objs[n]["_children"] = kids
    objs[n]["_prefab"] = ref(add({
        "__type__": "cc.PrefabInfo", "root": ref(ROOT), "asset": ref(0), "fileId": fid(),
    }))
    return n


def sprite(uuid, typ):
    def make(n):
        return {
            "__type__": "cc.Sprite", "_name": "", "_objFlags": 0, "node": ref(n), "_enabled": True,
            "_customMaterial": None, "_srcBlendFactor": 2, "_dstBlendFactor": 4,
            "_color": color(255, 255, 255),
            "_spriteFrame": {"__uuid__": uuid, "__expectedType__": "cc.SpriteFrame"},
            "_type": typ, "_fillType": 0, "_sizeMode": 0,
            "_fillCenter": {"__type__": "cc.Vec2", "x": 0, "y": 0},
            "_fillStart": 0, "_fillRange": 0, "_isTrimmedMode": True, "_useGrayscale": False,
            "_atlas": None, "_id": "",
        }
    return make


def label(text, size, lh, col):
    def make(n):
        return {
            "__type__": "cc.Label", "_name": "", "_objFlags": 0, "node": ref(n), "_enabled": True,
            "_customMaterial": None, "_srcBlendFactor": 2, "_dstBlendFactor": 4,
            "_color": col, "_string": text,
            "_horizontalAlign": 1, "_verticalAlign": 1,
            "_actualFontSize": size, "_fontSize": size, "_fontFamily": "Arial",
            "_lineHeight": lh, "_overflow": 2, "_enableWrapText": True, "_font": None,
            "_isSystemFontUsed": True, "_spacingX": 0,
            "_isItalic": False, "_isBold": True, "_isUnderline": False, "_underlineHeight": 2,
            "_cacheMode": 0, "_id": "",
        }
    return make


def button(n):
    return {
        "__type__": "cc.Button", "_name": "", "_objFlags": 0, "node": ref(n), "_enabled": True,
        "clickEvents": [], "_interactable": True, "_transition": 0,
        "_normalColor": color(255, 255, 255), "_hoverColor": color(211, 211, 211),
        "_pressedColor": color(255, 255, 255), "_disabledColor": color(124, 124, 124),
        "_normalSprite": None, "_hoverSprite": None, "_pressedSprite": None, "_disabledSprite": None,
        "_duration": 0.1, "_zoomScale": 1.2, "_target": ref(n), "_id": "",
    }


root = node(
    "ItemSlot", None, (200, 240), comps=[button],
    children=[
        lambda p: node("Bg", p, (200, 240), comps=[sprite(SF["ink_well"], 1)]),
        lambda p: node("Frame", p, (200, 240), comps=[sprite(SF["portrait_rim"], 0)]),
        lambda p: node("Icon", p, (120, 120), (0, 24), comps=[sprite(SF["crimson_fox"], 0)]),
        lambda p: node("Name", p, (180, 36), (0, -70),
                       comps=[label("回复药", 26, 32, color(255, 255, 255))]),
        lambda p: node("CountBadge", p, (72, 36), (62, 98), comps=[sprite(SF["lv_chip"], 1)],
                       children=[lambda q: node("Count", q, (64, 30),
                                                comps=[label("x3", 22, 28, color(17, 17, 17))])]),
    ],
)
assert root == ROOT

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(objs, f, ensure_ascii=False, indent=2)
print("wrote", OUT, len(objs), "objects")
