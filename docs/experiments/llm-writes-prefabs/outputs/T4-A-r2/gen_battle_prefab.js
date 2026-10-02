const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const RES = path.join(ROOT, 'assets/resources');
const L = JSON.parse(fs.readFileSync(path.join(RES, 'ui/battle/uilayout.json'), 'utf8'));
const OUT = path.join(RES, 'prefabs/test/BattleScreen.prefab');

const UI_2D = 33554432;
const usedIds = new Set();
function fileId() {
    let id;
    do { id = crypto.randomBytes(16).toString('base64').replace(/[+/=]/g, '').slice(0, 22); } while (usedIds.has(id));
    usedIds.add(id);
    return id;
}

function spriteFrameUuid(rel) {
    const metaPath = path.join(RES, rel + '.meta');
    if (!fs.existsSync(path.join(RES, rel))) throw new Error('missing image ' + rel);
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    for (const sub of Object.values(meta.subMetas || {})) {
        if (sub.importer === 'sprite-frame') return sub.uuid;
    }
    throw new Error('no sprite-frame sub-asset for ' + rel);
}

const color = (r, g, b, a = 255) => ({ __type__: 'cc.Color', r, g, b, a });

// ---- build a logical tree ----
// node: { name, w, h, x, y, ax, ay, comps: [{type, ...}], children: [] }
const parts = L.parts;
const byId = new Map(parts.map((p) => [p.id, p]));
const center = (p) => [p.x + p.w / 2, p.y + p.h / 2];

function childrenOf(parentId) {
    return parts
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => (p.parent ?? null) === parentId)
        .sort((a, b) => a.p.z - b.p.z || a.i - b.i)
        .map(({ p }) => p);
}

function buildPart(p) {
    const [cx, cy] = center(p);
    const [pcx, pcy] = p.parent ? center(byId.get(p.parent)) : [L.W / 2, L.H / 2];
    const node = { name: p.id, w: p.w, h: p.h, x: cx - pcx, y: pcy - cy, ax: 0.5, ay: 0.5, comps: [], children: [] };
    if (p.img) {
        node.comps.push({ type: 'sprite', frame: spriteFrameUuid(L.dir + p.img.normal), sliced: p.kind === 'nine_slice', col: [255, 255, 255] });
    }
    if (p.text) {
        node.comps.push({ type: 'label', t: p.text });
    }
    if (p.type === 'button' && p.render === 'program') {
        node.comps.push({ type: 'button' });
    }
    node.children = childrenOf(p.id).map(buildPart);
    if (p.bar) {
        const track = byId.get(p.id + '_track');
        if (!track || track.parent !== p.id || !track.img) throw new Error('bar without track child: ' + p.id);
        node.children.push({
            name: 'Fill', w: p.w * 0.75, h: p.h, x: -p.w / 2, y: 0, ax: 0, ay: 0.5,
            comps: [{ type: 'sprite', frame: spriteFrameUuid(L.dir + track.img.normal), sliced: true, col: p.bar.col }],
            children: [],
        });
    }
    return node;
}

const rootNode = {
    name: 'BattleScreen', w: L.W, h: L.H, x: 0, y: 0, ax: 0.5, ay: 0.5, comps: [],
    children: [
        { name: 'Bg', w: 720, h: 1280, x: 0, y: 0, ax: 0.5, ay: 0.5,
          comps: [{ type: 'sprite', frame: spriteFrameUuid('ui/battle/bg_main.png'), sliced: false, col: [255, 255, 255] }],
          children: [] },
        ...childrenOf(null).map(buildPart),
    ],
};

// ---- serialize ----
const objs = [{
    __type__: 'cc.Prefab', _name: 'BattleScreen', _objFlags: 0, __editorExtras__: {}, _native: '',
    data: { __id__: 1 }, optimizationPolicy: 0, persistent: false,
}];

function compBase(type, nodeId) {
    return { __type__: type, _name: '', _objFlags: 0, __editorExtras__: {}, node: { __id__: nodeId }, _enabled: true, __prefab: null, _id: '' };
}

function emitComp(c, nodeId, n) {
    let o;
    if (c.type === 'uitransform') {
        o = Object.assign(compBase('cc.UITransform', nodeId), {
            _contentSize: { __type__: 'cc.Size', width: n.w, height: n.h },
            _anchorPoint: { __type__: 'cc.Vec2', x: n.ax, y: n.ay },
        });
    } else if (c.type === 'sprite') {
        o = Object.assign(compBase('cc.Sprite', nodeId), {
            _customMaterial: null, _srcBlendFactor: 2, _dstBlendFactor: 4,
            _color: color(c.col[0], c.col[1], c.col[2]),
            _spriteFrame: { __uuid__: c.frame, __expectedType__: 'cc.SpriteFrame' },
            _type: c.sliced ? 1 : 0, _fillType: 0, _sizeMode: 0,
            _fillCenter: { __type__: 'cc.Vec2', x: 0, y: 0 }, _fillStart: 0, _fillRange: 0,
            _isTrimmedMode: true, _useGrayscale: false, _atlas: null,
        });
    } else if (c.type === 'label') {
        const t = c.t;
        const align = { start: 0, middle: 1, end: 2 }[t.align];
        if (align === undefined) throw new Error('bad align ' + t.align);
        o = Object.assign(compBase('cc.Label', nodeId), {
            _customMaterial: null, _srcBlendFactor: 2, _dstBlendFactor: 4,
            _color: color(t.col[0], t.col[1], t.col[2]),
            _string: t.s, _horizontalAlign: align, _verticalAlign: 1,
            _actualFontSize: t.fs, _fontSize: t.fs, _fontFamily: 'Arial',
            _lineHeight: Math.round(t.fs * 1.25), _overflow: 2, _enableWrapText: true,
            _font: null, _isSystemFontUsed: true, _spacingX: 0,
            _isItalic: false, _isBold: !!t.bold, _isUnderline: false, _underlineHeight: 2, _cacheMode: 0,
        });
    } else if (c.type === 'button') {
        o = Object.assign(compBase('cc.Button', nodeId), {
            clickEvents: [], _interactable: true, _transition: 3,
            _normalColor: color(214, 214, 214), _hoverColor: color(211, 211, 211),
            _pressedColor: color(255, 255, 255), _disabledColor: color(124, 124, 124),
            _normalSprite: null, _hoverSprite: null, _pressedSprite: null, _disabledSprite: null,
            _duration: 0.1, _zoomScale: 0.95, _target: { __id__: nodeId },
        });
    }
    const id = objs.length;
    objs.push(o);
    o.__prefab = { __id__: objs.length };
    objs.push({ __type__: 'cc.CompPrefabInfo', fileId: fileId() });
    return id;
}

function emitNode(n, parentId) {
    const id = objs.length;
    const o = {
        __type__: 'cc.Node', _name: n.name, _objFlags: 0, __editorExtras__: {},
        _parent: parentId == null ? null : { __id__: parentId },
        _children: [], _active: true, _components: [], _prefab: null,
        _lpos: { __type__: 'cc.Vec3', x: n.x, y: n.y, z: 0 },
        _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
        _lscale: { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 },
        _mobility: 0, _layer: UI_2D,
        _euler: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
        _id: '',
    };
    objs.push(o);
    for (const c of n.children) o._children.push({ __id__: emitNode(c, id) });
    for (const c of [{ type: 'uitransform' }, ...n.comps]) o._components.push({ __id__: emitComp(c, id, n) });
    o._prefab = { __id__: objs.length };
    const info = { __type__: 'cc.PrefabInfo', root: { __id__: 1 }, asset: { __id__: 0 }, fileId: fileId() };
    if (parentId == null) Object.assign(info, { instance: null, targetOverrides: null, nestedPrefabInstanceRoots: null });
    objs.push(info);
    return id;
}

emitNode(rootNode, null);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(objs, null, 2) + '\n');

let count = 0;
(function walk(n) { count++; n.children.forEach(walk); })(rootNode);
console.log('wrote', OUT, 'objects', objs.length, 'nodes', count);
