#!/usr/bin/env python3
import json
import os
import random
import string

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "assets", "resources")
LAYOUT = os.path.join(RES, "ui", "battle", "uilayout.json")
OUT = os.path.join(RES, "prefabs", "test", "BattleScreen.prefab")

UI_2D = 1 << 25
rng = random.Random(20261002)
used_ids = set()


def file_id():
    while True:
        s = "".join(rng.choice(string.ascii_letters + string.digits + "+/") for _ in range(22))
        if s not in used_ids:
            used_ids.add(s)
            return s


def num(v):
    f = float(v)
    return int(f) if f.is_integer() else f


def sprite_frame_uuid(rel_path):
    with open(os.path.join(RES, rel_path + ".meta")) as fh:
        meta = json.load(fh)
    for sub in meta["subMetas"].values():
        if sub.get("importer") == "sprite-frame":
            return sub["uuid"]
    raise RuntimeError("no sprite-frame sub-asset for " + rel_path)


def color(rgb, a=255):
    r, g, b = rgb
    return {"__type__": "cc.Color", "r": r, "g": g, "b": b, "a": a}


WHITE = [255, 255, 255]
objs = []


def add(obj):
    objs.append(obj)
    return len(objs) - 1


def ref(i):
    return {"__id__": i}


add({
    "__type__": "cc.Prefab",
    "_name": "BattleScreen",
    "_objFlags": 0,
    "__editorExtras__": {},
    "_native": "",
    "data": {"__id__": 1},
    "optimizationPolicy": 0,
    "persistent": False,
})


def comp_base(type_name, node_idx):
    return {
        "__type__": type_name,
        "_name": "",
        "_objFlags": 0,
        "__editorExtras__": {},
        "node": ref(node_idx),
        "_enabled": True,
        "__prefab": None,
    }


def finish_comp(comp):
    idx = add(comp)
    comp["__prefab"] = ref(add({"__type__": "cc.CompPrefabInfo", "fileId": file_id()}))
    return idx


def make_node(name, parent_idx, pos, size, anchor=(0.5, 0.5)):
    node = {
        "__type__": "cc.Node",
        "_name": name,
        "_objFlags": 0,
        "__editorExtras__": {},
        "_parent": ref(parent_idx) if parent_idx is not None else None,
        "_children": [],
        "_active": True,
        "_components": [],
        "_prefab": None,
        "_lpos": {"__type__": "cc.Vec3", "x": num(pos[0]), "y": num(pos[1]), "z": 0},
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
        "_mobility": 0,
        "_layer": UI_2D,
        "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_id": "",
    }
    idx = add(node)
    if parent_idx is not None:
        objs[parent_idx]["_children"].append(ref(idx))
    ut = comp_base("cc.UITransform", idx)
    ut["_contentSize"] = {"__type__": "cc.Size", "width": num(size[0]), "height": num(size[1])}
    ut["_anchorPoint"] = {"__type__": "cc.Vec2", "x": anchor[0], "y": anchor[1]}
    ut["_id"] = ""
    node["_components"].append(ref(finish_comp(ut)))
    return idx


def finish_node(idx):
    objs[idx]["_prefab"] = ref(add({
        "__type__": "cc.PrefabInfo",
        "root": ref(1),
        "asset": ref(0),
        "fileId": file_id(),
        "instance": None,
        "targetOverrides": None,
        "nestedPrefabInstanceRoots": None,
    }))


def add_sprite(node_idx, image_rel, sliced, rgb=WHITE):
    sp = comp_base("cc.Sprite", node_idx)
    sp.update({
        "_customMaterial": None,
        "_srcBlendFactor": 2,
        "_dstBlendFactor": 4,
        "_color": color(rgb),
        "_spriteFrame": {"__uuid__": sprite_frame_uuid(image_rel), "__expectedType__": "cc.SpriteFrame"},
        "_type": 1 if sliced else 0,
        "_fillType": 0,
        "_sizeMode": 0,
        "_fillCenter": {"__type__": "cc.Vec2", "x": 0, "y": 0},
        "_fillStart": 0,
        "_fillRange": 0,
        "_isTrimmedMode": True,
        "_useGrayscale": False,
        "_atlas": None,
        "_id": "",
    })
    objs[node_idx]["_components"].append(ref(finish_comp(sp)))


ALIGN = {"start": 0, "middle": 1, "end": 2}


def add_label(node_idx, text):
    fs = num(text["fs"])
    lb = comp_base("cc.Label", node_idx)
    lb.update({
        "_customMaterial": None,
        "_srcBlendFactor": 2,
        "_dstBlendFactor": 4,
        "_color": color(text["col"]),
        "_string": text["s"],
        "_horizontalAlign": ALIGN[text["align"]],
        "_verticalAlign": 1,
        "_actualFontSize": fs,
        "_fontSize": fs,
        "_fontFamily": "Arial",
        "_lineHeight": int(round(float(text["fs"]) * 1.25)),
        "_overflow": 2,
        "_enableWrapText": True,
        "_font": None,
        "_isSystemFontUsed": True,
        "_spacingX": 0,
        "_isItalic": False,
        "_isBold": bool(text["bold"]),
        "_isUnderline": False,
        "_underlineHeight": 2,
        "_cacheMode": 0,
        "_enableOutline": False,
        "_outlineColor": color([0, 0, 0]),
        "_outlineWidth": 2,
        "_enableShadow": False,
        "_shadowColor": color([0, 0, 0]),
        "_shadowOffset": {"__type__": "cc.Vec2", "x": 2, "y": 2},
        "_shadowBlur": 2,
        "_id": "",
    })
    objs[node_idx]["_components"].append(ref(finish_comp(lb)))


def add_button(node_idx):
    bt = comp_base("cc.Button", node_idx)
    bt.update({
        "clickEvents": [],
        "_interactable": True,
        "_transition": 3,
        "_normalColor": color([214, 214, 214]),
        "_hoverColor": color([211, 211, 211]),
        "_pressedColor": color(WHITE),
        "_disabledColor": color([124, 124, 124]),
        "_normalSprite": None,
        "_hoverSprite": None,
        "_pressedSprite": None,
        "_disabledSprite": None,
        "_duration": 0.1,
        "_zoomScale": 0.95,
        "_target": ref(node_idx),
        "_id": "",
    })
    objs[node_idx]["_components"].append(ref(finish_comp(bt)))


def main():
    with open(LAYOUT) as fh:
        layout = json.load(fh)
    img_dir = layout["dir"]
    parts = layout["parts"]
    by_id = {p["id"]: p for p in parts}
    children = {None: []}
    for p in parts:
        children.setdefault(p["parent"], []).append(p)
    for k in children:
        # sorted() is stable, so equal z keeps parts[] order
        children[k] = sorted(children[k], key=lambda p: float(p["z"]))

    def center(p):
        return float(p["x"]) + float(p["w"]) / 2, float(p["y"]) + float(p["h"]) / 2

    root = make_node("BattleScreen", None, (0, 0), (layout["W"], layout["H"]))
    bg = make_node("Bg", root, (0, 0), (layout["W"], layout["H"]))
    add_sprite(bg, img_dir + layout["bg"], False)
    finish_node(bg)

    def build(p, parent_idx):
        cx, cy = center(p)
        if p["parent"] is None:
            pcx, pcy = layout["W"] / 2, layout["H"] / 2
        else:
            pcx, pcy = center(by_id[p["parent"]])
        w, h = float(p["w"]), float(p["h"])
        idx = make_node(p["id"], parent_idx, (cx - pcx, pcy - cy), (w, h))
        if p.get("img"):
            add_sprite(idx, img_dir + p["img"]["normal"], p.get("kind") == "nine_slice")
        if p.get("text"):
            add_label(idx, p["text"])
        if p.get("type") == "button" and p.get("render") == "program":
            add_button(idx)
        for c in children.get(p["id"], []):
            build(c, idx)
        if p.get("bar"):
            track = by_id[p["id"] + "_track"]
            fill = make_node("Fill", idx, (-w / 2, 0), (w * 0.75, h), anchor=(0, 0.5))
            add_sprite(fill, img_dir + track["img"]["normal"], True, p["bar"]["col"])
            finish_node(fill)
        finish_node(idx)

    for p in children[None]:
        build(p, root)
    finish_node(root)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as fh:
        json.dump(objs, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print("wrote", OUT, len(objs), "objects")


if __name__ == "__main__":
    main()
