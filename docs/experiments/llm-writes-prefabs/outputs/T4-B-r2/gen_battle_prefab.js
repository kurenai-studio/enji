#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const RES = path.join(ROOT, 'assets/resources');
const layout = JSON.parse(fs.readFileSync(path.join(RES, 'ui/battle/uilayout.json'), 'utf8'));
const OUT = path.join(RES, 'prefabs/test/BattleScreen.prefab');

const LAYER_UI_2D = 1 << 25;
const H_ALIGN = { start: 0, middle: 1, end: 2 };
const SPRITE_SIMPLE = 0;
const SPRITE_SLICED = 1;
const SIZE_CUSTOM = 0;
const OVERFLOW_SHRINK = 2;
const BUTTON_SCALE = 3;

function spriteFrameUuid(relPath) {
  const meta = JSON.parse(fs.readFileSync(path.join(RES, relPath) + '.meta', 'utf8'));
  const sub = Object.values(meta.subMetas).find((s) => s.importer === 'sprite-frame');
  if (!sub) throw new Error('no sprite-frame sub-asset for ' + relPath);
  return sub.uuid;
}

const objs = [];
const add = (o) => (objs.push(o), objs.length - 1);
const ref = (i) => ({ __id__: i });
let fileIdSeq = 0;
const fileId = () => crypto.createHash('md5').update('BattleScreen:' + fileIdSeq++).digest('base64').replace(/[+/=]/g, '').slice(0, 22);
const color = (r, g, b, a = 255) => ({ __type__: 'cc.Color', r, g, b, a });

add({ __type__: 'cc.Prefab', _name: 'BattleScreen', _objFlags: 0, __editorExtras__: {}, _native: '', data: ref(1), optimizationPolicy: 0, persistent: false });

function makeNode(name, parentIdx, x, y) {
  const idx = add({
    __type__: 'cc.Node', _name: name, _objFlags: 0, __editorExtras__: {},
    _parent: parentIdx == null ? null : ref(parentIdx),
    _children: [], _active: true, _components: [], _prefab: null,
    _lpos: { __type__: 'cc.Vec3', x, y, z: 0 },
    _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
    _lscale: { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 },
    _mobility: 0, _layer: LAYER_UI_2D,
    _euler: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
    _id: '',
  });
  if (parentIdx != null) objs[parentIdx]._children.push(ref(idx));
  return idx;
}

function finishNode(idx, isRoot) {
  const info = { __type__: 'cc.PrefabInfo', root: ref(1), asset: ref(0), fileId: fileId(), instance: null };
  if (isRoot) Object.assign(info, { targetOverrides: null, nestedPrefabInstanceRoots: null });
  objs[idx]._prefab = ref(add(info));
}

function addComp(nodeIdx, type, props) {
  const idx = add(Object.assign({ __type__: type, _name: '', _objFlags: 0, __editorExtras__: {}, node: ref(nodeIdx), _enabled: true, __prefab: null }, props, { _id: '' }));
  objs[idx].__prefab = ref(add({ __type__: 'cc.CompPrefabInfo', fileId: fileId() }));
  objs[nodeIdx]._components.push(ref(idx));
  return idx;
}

function addTransform(nodeIdx, w, h, ax = 0.5, ay = 0.5) {
  addComp(nodeIdx, 'cc.UITransform', {
    _contentSize: { __type__: 'cc.Size', width: w, height: h },
    _anchorPoint: { __type__: 'cc.Vec2', x: ax, y: ay },
  });
}

function addSprite(nodeIdx, relPath, type, col = color(255, 255, 255)) {
  addComp(nodeIdx, 'cc.Sprite', {
    _customMaterial: null, _srcBlendFactor: 2, _dstBlendFactor: 4, _color: col,
    _spriteFrame: { __uuid__: spriteFrameUuid(relPath), __expectedType__: 'cc.SpriteFrame' },
    _type: type, _fillType: 0, _sizeMode: SIZE_CUSTOM, _fillCenter: { __type__: 'cc.Vec2', x: 0, y: 0 },
    _fillStart: 0, _fillRange: 0, _isTrimmedMode: true, _useGrayscale: false, _atlas: null,
  });
}

function addLabel(nodeIdx, t) {
  addComp(nodeIdx, 'cc.Label', {
    _customMaterial: null, _srcBlendFactor: 2, _dstBlendFactor: 4,
    _color: color(t.col[0], t.col[1], t.col[2], 255),
    _string: t.s, _horizontalAlign: H_ALIGN[t.align], _verticalAlign: 1,
    _actualFontSize: t.fs, _fontSize: t.fs, _fontFamily: 'Arial', _lineHeight: Math.round(t.fs * 1.25),
    _overflow: OVERFLOW_SHRINK, _enableWrapText: true, _font: null, _isSystemFontUsed: true,
    _spacingX: 0, _isItalic: false, _isBold: !!t.bold, _isUnderline: false, _underlineHeight: 2, _cacheMode: 0,
  });
}

function addButton(nodeIdx) {
  addComp(nodeIdx, 'cc.Button', {
    clickEvents: [], _interactable: true, _transition: BUTTON_SCALE,
    _normalColor: color(214, 214, 214), _hoverColor: color(211, 211, 211), _pressedColor: color(255, 255, 255), _disabledColor: color(124, 124, 124),
    _normalSprite: null, _hoverSprite: null, _pressedSprite: null, _disabledSprite: null,
    _duration: 0.1, _zoomScale: 0.95, _target: ref(nodeIdx),
  });
}

const parts = layout.parts;
const byId = new Map(parts.map((p) => [p.id, p]));
const center = (p) => (p ? [p.x + p.w / 2, p.y + p.h / 2] : [layout.W / 2, layout.H / 2]);
const childrenOf = (id) => parts
  .map((p, i) => ({ p, i }))
  .filter(({ p }) => p.parent === id)
  .sort((a, b) => a.p.z - b.p.z || a.i - b.i)
  .map(({ p }) => p);

const root = makeNode('BattleScreen', null, 0, 0);
addTransform(root, layout.W, layout.H);

const bg = makeNode('Bg', root, 0, 0);
addTransform(bg, layout.W, layout.H);
addSprite(bg, layout.dir + layout.bg, SPRITE_SIMPLE);
finishNode(bg);

function build(part, parentIdx) {
  const [cx, cy] = center(part);
  const [pcx, pcy] = center(part.parent ? byId.get(part.parent) : null);
  const idx = makeNode(part.id, parentIdx, cx - pcx, pcy - cy);
  addTransform(idx, part.w, part.h);
  if (part.img) addSprite(idx, layout.dir + part.img.normal, part.kind === 'nine_slice' ? SPRITE_SLICED : SPRITE_SIMPLE);
  if (part.text) addLabel(idx, part.text);
  if (part.type === 'button' && part.render === 'program') addButton(idx);

  for (const child of childrenOf(part.id)) build(child, idx);

  if (part.bar) {
    const track = byId.get(part.id + '_track');
    if (!track || track.parent !== part.id || !track.img) throw new Error('missing track child for ' + part.id);
    const fill = makeNode('Fill', idx, -part.w / 2, 0);
    addTransform(fill, part.w * 0.75, part.h, 0, 0.5);
    addSprite(fill, layout.dir + track.img.normal, SPRITE_SLICED, color(part.bar.col[0], part.bar.col[1], part.bar.col[2], 255));
    finishNode(fill);
  }
  finishNode(idx);
}

for (const part of childrenOf(null)) build(part, root);
finishNode(root, true);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(objs, null, 2) + '\n');
console.log('wrote', path.relative(ROOT, OUT), 'objects:', objs.length);
