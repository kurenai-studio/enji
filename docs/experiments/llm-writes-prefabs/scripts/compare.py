"""Compare a runtime dump against expected.json. Prints a score and the first failures."""
import json, sys

POS_TOL_2D, POS_TOL_3D = 1.0, 0.01


def close(a, b, tol):
    if isinstance(b, list):
        return isinstance(a, list) and len(a) == len(b) and all(close(x, y, tol) for x, y in zip(a, b))
    if isinstance(b, bool) or isinstance(b, str) or b is None:
        return a == b
    if isinstance(b, (int, float)):
        return isinstance(a, (int, float)) and not isinstance(a, bool) and abs(a - b) <= tol
    return a == b


def quat_close(a, b):
    return close(a, b, 1e-3) or close([-x for x in a], b, 1e-3)


def score(exp_rows, got_rows):
    got = {r['path']: r for r in got_rows}
    passed, total, fails = 0, 0, []

    def check(ok, what):
        nonlocal passed, total
        total += 1
        passed += ok
        if not ok:
            fails.append(what)

    is3d = any(r['ui'] is None for r in exp_rows)
    ptol = POS_TOL_3D if is3d else POS_TOL_2D
    for e in exp_rows:
        g = got.get(e['path'])
        nchecks = 1 + 4 + (2 if e['ui'] else 0) + sum(1 + len(c) - 1 for c in e['comps'])
        if g is None:
            total += nchecks
            fails.append(f"missing node {e['path']!r}")
            continue
        p = e['path'] or '<root>'
        check(True, '')
        check(g['children'] == e['children'], f"{p}: children {g['children']} != {e['children']}")
        check(close(g['pos'], e['pos'], ptol), f"{p}: pos {g['pos']} != {e['pos']}")
        check(quat_close(g['quat'], e['quat']), f"{p}: rot {g['euler']} != {e['euler']}")
        check(g['layer'] == e['layer'], f"{p}: layer {g['layer']} != {e['layer']}")
        if e['ui']:
            gu = g.get('ui')
            check(bool(gu) and close([gu['w'], gu['h']], [e['ui']['w'], e['ui']['h']], 0.5), f"{p}: size {gu and [gu['w'], gu['h']]} != {[e['ui']['w'], e['ui']['h']]}")
            check(bool(gu) and close([gu['ax'], gu['ay']], [e['ui']['ax'], e['ui']['ay']], 0.01), f"{p}: anchor")
        gcomps = list(g['comps'])
        for c in e['comps']:
            m = next((x for x in gcomps if x['type'] == c['type']), None)
            check(m is not None, f"{p}: missing {c['type']}")
            for k, v in c.items():
                if k == 'type':
                    continue
                tol = 1e-3 if k not in ('lineHeight',) else 1.0
                ok = m is not None and close(m.get(k), v, tol)
                check(ok, f"{p}: {c['type']}.{k} {m.get(k) if m else None!r} != {v!r}")
            if m:
                gcomps.remove(m)
        for x in gcomps:
            fails.append(f"{p}: extra component {x['type']} (not scored)")
    exp_paths = {e['path'] for e in exp_rows}
    extra = [r['path'] for r in got_rows if r['path'] not in exp_paths]
    for x in extra:
        fails.append(f'extra node {x!r} (not scored)')
    return passed, total, fails


if __name__ == '__main__':
    exp = json.load(open(sys.argv[1]))
    dump = json.load(open(sys.argv[2]))
    key = sys.argv[3]
    r = dump['results'].get(key, {})
    if not r.get('rows'):
        print(json.dumps({'score': 0, 'harness': r.get('harness'), 'err': r.get('err'), 'errors': r.get('errors')}, ensure_ascii=False))
        sys.exit(0)
    p, t, f = score(exp, r['rows'])
    print(json.dumps({'score': round(p / t, 4), 'passed': p, 'total': t, 'consoleErrors': len(r['errors']), 'fails': f[:40], 'nfails': len(f)}, ensure_ascii=False, indent=1))
