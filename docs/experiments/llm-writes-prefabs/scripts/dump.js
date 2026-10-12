(async () => {
    for (let i = 0; i < 80 && !window.__harness; i++) await new Promise((r) => setTimeout(r, 250));
    const h = window.__harness;
    if (!h || !h.ok) return { harness: h || null };
    await new Promise((r) => setTimeout(r, 800));
    const root = window.__harnessRoot;
    const col = (c) => (c ? [c.r, c.g, c.b, c.a] : null);
    const v3 = (v) => [v.x, v.y, v.z];
    const pathOf = (n) => {
        const parts = [];
        while (n && n !== root) { parts.unshift(n.name); n = n.parent; }
        return n === root ? parts.join('/') : null;
    };
    const rows = [];
    const walk = (n) => {
        const q = n.rotation;
        const r = { path: pathOf(n), children: n.children.map((c) => c.name), pos: v3(n.position), quat: [q.x, q.y, q.z, q.w],
            euler: v3(n.eulerAngles), scale: v3(n.scale), layer: n.layer, active: n.active, comps: [] };
        for (const c of n.components) {
            const t = cc.js.getClassName(c);
            const o = { type: t };
            if (t === 'cc.UITransform') { r.ui = { w: c.contentSize.width, h: c.contentSize.height, ax: c.anchorX, ay: c.anchorY }; continue; }
            if (t === 'cc.Sprite') Object.assign(o, { frame: c.spriteFrame ? c.spriteFrame._uuid : null, spriteType: c.type, sizeMode: c.sizeMode, color: col(c.color) });
            else if (t === 'cc.Label') Object.assign(o, { string: c.string, fontSize: c.fontSize, lineHeight: c.lineHeight, color: col(c.color), bold: c.isBold,
                hAlign: c.horizontalAlign, vAlign: c.verticalAlign, overflow: c.overflow });
            else if (t === 'cc.Button') Object.assign(o, { target: c.target ? pathOf(c.target) : null, transition: c.transition, zoomScale: c.zoomScale, interactable: c.interactable });
            else if (t === 'cc.Layout') Object.assign(o, { layoutType: c.type, resizeMode: c.resizeMode, cellW: c.cellSize.width, cellH: c.cellSize.height,
                startAxis: c.startAxis, spacingX: c.spacingX, spacingY: c.spacingY, padding: [c.paddingLeft, c.paddingRight, c.paddingTop, c.paddingBottom],
                constraint: c.constraint, constraintNum: c.constraintNum, hDir: c.horizontalDirection, vDir: c.verticalDirection });
            else if (t === 'cc.DirectionalLight') Object.assign(o, { color: col(c.color), illuminanceHDR: c._illuminanceHDR, shadowEnabled: c.shadowEnabled });
            else if (t === 'cc.SphereLight' || t === 'cc.SpotLight') {
                Object.assign(o, { color: col(c.color), luminanceHDR: c._luminanceHDR, size: c.size, range: c.range });
                if (t === 'cc.SpotLight') o.spotAngle = c._spotAngle;
            }
            else if (t === 'cc.LightProbeGroup') Object.assign(o, { method: c.method, minPos: v3(c.minPos), maxPos: v3(c.maxPos),
                nProbes: [c.nProbesX, c.nProbesY, c.nProbesZ], probes: (c.probes || []).map(v3) });
            else if (t === 'cc.ReflectionProbe') Object.assign(o, { probeType: c.probeType, resolution: c.resolution, size: v3(c.size), backgroundColor: col(c.backgroundColor) });
            r.comps.push(o);
        }
        rows.push(r);
        n.children.forEach(walk);
    };
    walk(root);
    return { harness: h, rows };
})()
