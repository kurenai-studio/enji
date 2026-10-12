"""Static structural validator for a Cocos 3.8 .prefab file (no engine needed)."""
import json, sys


def validate(path):
    issues = []
    try:
        arr = json.load(open(path))
    except Exception as e:
        return [f'invalid JSON: {e}']
    if not isinstance(arr, list) or not arr or arr[0].get('__type__') != 'cc.Prefab':
        return ['first element is not cc.Prefab']
    n = len(arr)
    refs = {}

    def walk(o, owner):
        if isinstance(o, dict):
            if set(o) == {'__id__'}:
                i = o['__id__']
                if not isinstance(i, int) or not 0 <= i < n:
                    issues.append(f'[{owner}] __id__ {i} out of range')
                else:
                    refs.setdefault(i, []).append(owner)
                return
            for v in o.values():
                walk(v, owner)
        elif isinstance(o, list):
            for v in o:
                walk(v, owner)

    for i, o in enumerate(arr):
        walk(o, i)
    get = lambda r: arr[r['__id__']] if isinstance(r, dict) and '__id__' in r and 0 <= r['__id__'] < n else None
    root = get(arr[0].get('data'))
    if not root or root.get('__type__') != 'cc.Node':
        issues.append('cc.Prefab.data is not a cc.Node')
    if root and root.get('_parent') is not None:
        issues.append('root node has a _parent')
    file_ids = []
    for i, o in enumerate(arr):
        t = o.get('__type__', '')
        if t == 'cc.Node':
            for c in o.get('_children', []):
                ch = get(c)
                if not ch or ch.get('__type__') != 'cc.Node':
                    issues.append(f'node {i} child {c} is not a node')
                elif (ch.get('_parent') or {}).get('__id__') != i:
                    issues.append(f"node {i} child {c['__id__']} _parent mismatch")
            for c in o.get('_components', []):
                co = get(c)
                if not co:
                    issues.append(f'node {i} bad component ref {c}')
                elif (co.get('node') or {}).get('__id__') != i:
                    issues.append(f"component {c['__id__']} .node does not point back to node {i}")
            pi = get(o.get('_prefab'))
            if not pi or pi.get('__type__') != 'cc.PrefabInfo':
                issues.append(f'node {i} has no cc.PrefabInfo')
            else:
                file_ids.append(pi.get('fileId'))
                if (pi.get('root') or {}).get('__id__') != arr[0]['data']['__id__']:
                    issues.append(f'node {i} PrefabInfo.root is not the prefab root')
                if (pi.get('asset') or {}).get('__id__') != 0:
                    issues.append(f'node {i} PrefabInfo.asset is not 0')
            par = get(o.get('_parent')) if o.get('_parent') else None
            if par is not None and {'__id__': i} not in par.get('_children', []):
                issues.append(f'node {i} not listed in its parent _children')
        elif t.startswith('cc.') and 'node' in o and t not in ('cc.PrefabInfo', 'cc.CompPrefabInfo'):
            nd = get(o['node'])
            if not nd or {'__id__': i} not in nd.get('_components', []):
                issues.append(f'component {i} ({t}) not listed in its node _components')
            cp = get(o.get('__prefab'))
            if not cp or cp.get('__type__') != 'cc.CompPrefabInfo':
                issues.append(f'component {i} ({t}) has no CompPrefabInfo')
            else:
                file_ids.append(cp.get('fileId'))
            if not t.startswith('cc.'):
                issues.append(f'component {i} is a script component')
        elif not t.startswith('cc.'):
            issues.append(f'element {i} has non-engine type {t!r}')
    if len(file_ids) != len(set(file_ids)):
        issues.append(f'duplicate fileIds ({len(file_ids) - len(set(file_ids))})')
    if any(not f for f in file_ids):
        issues.append('empty fileId')
    orphans = [i for i in range(1, n) if i not in refs]
    if orphans:
        issues.append(f'unreferenced elements: {orphans[:10]}')
    return issues


if __name__ == '__main__':
    for p in sys.argv[1:]:
        iss = validate(p)
        print(json.dumps({'file': p, 'ok': not iss, 'issues': iss[:20], 'nissues': len(iss)}))
