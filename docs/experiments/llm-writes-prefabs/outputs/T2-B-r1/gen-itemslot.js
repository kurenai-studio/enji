const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets/resources/prefabs/test/ItemSlot.prefab');
const LAYER_UI_2D = 33554432;

const SF = {
  inkWell: '8e6c85ea-f832-4128-b49a-16cb5c528e43@f9941',
  portraitRim: '71e411cb-08b2-4cc8-82c7-cc3a7693629c@f9941',
  crimsonFox: '09760ad1-a326-497a-b38a-1596b7cc4038@f9941',
  lvChip: '1770805b-7c6a-4ebc-bc74-fa08164c683b@f9941',
};

const objs = [];
let fileIdSeq = 0;
const fileId = () => `itemslot${(fileIdSeq++).toString().padStart(4, '0')}`;
const add = (o) => { objs.push(o); return objs.length - 1; };
const ref = (i) => (i == null ? null : { __id__: i });
const color = (r, g, b, a = 255) => ({ __type__: 'cc.Color', r, g, b, a });
const vec3 = (x = 0, y = 0, z = 0) => ({ __type__: 'cc.Vec3', x, y, z });

add({
  __type__: 'cc.Prefab',
  _name: 'ItemSlot',
  _objFlags: 0,
  __editorExtras__: {},
  _native: '',
  data: { __id__: 1 },
  optimizationPolicy: 0,
  persistent: false,
});

const ROOT = 1;

function makeNode(spec, parentIdx) {
  const idx = add(null);
  const node = {
    __type__: 'cc.Node',
    _name: spec.name,
    _objFlags: 0,
    __editorExtras__: {},
    _parent: ref(parentIdx),
    _children: [],
    _active: true,
    _components: [],
    _prefab: null,
    _lpos: vec3(...(spec.pos || [0, 0])),
    _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
    _lscale: vec3(1, 1, 1),
    _mobility: 0,
    _layer: LAYER_UI_2D,
    _euler: vec3(),
    _id: '',
  };
  objs[idx] = node;

  for (const child of spec.children || []) {
    node._children.push(ref(makeNode(child, idx)));
  }

  const comps = [uiTransform(spec.size), ...(spec.components || [])];
  for (const c of comps) {
    const cIdx = add(null);
    const prefabInfo = add({ __type__: 'cc.CompPrefabInfo', fileId: fileId() });
    objs[cIdx] = {
      __type__: c.type,
      _name: '',
      _objFlags: 0,
      __editorExtras__: {},
      node: ref(idx),
      _enabled: true,
      __prefab: ref(prefabInfo),
      ...c.props(idx),
      _id: '',
    };
    node._components.push(ref(cIdx));
  }

  node._prefab = ref(add({
    __type__: 'cc.PrefabInfo',
    root: ref(ROOT),
    asset: ref(0),
    fileId: fileId(),
    instance: null,
    targetOverrides: null,
    nestedPrefabInstanceRoots: null,
  }));
  return idx;
}

function uiTransform([w, h]) {
  return {
    type: 'cc.UITransform',
    props: () => ({
      _contentSize: { __type__: 'cc.Size', width: w, height: h },
      _anchorPoint: { __type__: 'cc.Vec2', x: 0.5, y: 0.5 },
    }),
  };
}

function sprite(uuid, type) {
  return {
    type: 'cc.Sprite',
    props: () => ({
      _customMaterial: null,
      _srcBlendFactor: 2,
      _dstBlendFactor: 4,
      _color: color(255, 255, 255),
      _spriteFrame: { __uuid__: uuid, __expectedType__: 'cc.SpriteFrame' },
      _type: type === 'SLICED' ? 1 : 0,
      _fillType: 0,
      _sizeMode: 0,
      _fillCenter: { __type__: 'cc.Vec2', x: 0, y: 0 },
      _fillStart: 0,
      _fillRange: 0,
      _isTrimmedMode: true,
      _useGrayscale: false,
      _atlas: null,
    }),
  };
}

function label(str, fontSize, lineHeight, c) {
  return {
    type: 'cc.Label',
    props: () => ({
      _customMaterial: null,
      _srcBlendFactor: 2,
      _dstBlendFactor: 4,
      _color: c,
      _string: str,
      _horizontalAlign: 1,
      _verticalAlign: 1,
      _actualFontSize: fontSize,
      _fontSize: fontSize,
      _fontFamily: 'Arial',
      _lineHeight: lineHeight,
      _overflow: 2,
      _enableWrapText: true,
      _font: null,
      _isSystemFontUsed: true,
      _spacingX: 0,
      _isItalic: false,
      _isBold: true,
      _isUnderline: false,
      _underlineHeight: 2,
      _cacheMode: 0,
      _enableOutline: false,
      _outlineColor: color(0, 0, 0),
      _outlineWidth: 2,
      _enableShadow: false,
      _shadowColor: color(0, 0, 0),
      _shadowOffset: { __type__: 'cc.Vec2', x: 2, y: 2 },
      _shadowBlur: 2,
    }),
  };
}

const button = {
  type: 'cc.Button',
  props: (nodeIdx) => ({
    clickEvents: [],
    _interactable: true,
    _transition: 0,
    _normalColor: color(255, 255, 255),
    _hoverColor: color(211, 211, 211),
    _pressedColor: color(255, 255, 255),
    _disabledColor: color(124, 124, 124),
    _normalSprite: null,
    _hoverSprite: null,
    _pressedSprite: null,
    _disabledSprite: null,
    _duration: 0.1,
    _zoomScale: 1.2,
    _target: ref(nodeIdx),
  }),
};

const spec = {
  name: 'ItemSlot',
  size: [200, 240],
  components: [button],
  children: [
    { name: 'Bg', size: [200, 240], components: [sprite(SF.inkWell, 'SLICED')] },
    { name: 'Frame', size: [200, 240], components: [sprite(SF.portraitRim, 'SIMPLE')] },
    { name: 'Icon', size: [120, 120], pos: [0, 24], components: [sprite(SF.crimsonFox, 'SIMPLE')] },
    { name: 'Name', size: [180, 36], pos: [0, -70], components: [label('回复药', 26, 32, color(255, 255, 255))] },
    {
      name: 'CountBadge',
      size: [72, 36],
      pos: [62, 98],
      components: [sprite(SF.lvChip, 'SLICED')],
      children: [
        { name: 'Count', size: [64, 30], components: [label('x3', 22, 28, color(17, 17, 17))] },
      ],
    },
  ],
};

const rootIdx = makeNode(spec, null);
if (rootIdx !== ROOT) throw new Error('root must be object 1');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(objs, null, 2) + '\n');
console.log(`wrote ${objs.length} objects to ${OUT}`);
