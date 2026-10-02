"""Grade run copies: static validation, enji import, runtime dump, spec comparison.
usage: python3 grade_all.py [run-name ...]   (default: every run that has a prefab)"""
import glob, json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
import tiers, validate, compare

W = os.environ.get('PREFAB_WRITE', '/private/tmp/prefab-write')
os.makedirs(f'{W}/_results', exist_ok=True)
os.makedirs(f'{W}/_shots', exist_ok=True)
names = sys.argv[1:] or sorted(os.path.basename(p) for p in glob.glob(f'{W}/runs/*'))
summary_path = f'{W}/_results/summary.json'
summary = json.load(open(summary_path)) if os.path.exists(summary_path) else {}

for run in names:
    tier = run.split('-')[0]
    name, _ = tiers.TIERS[tier]
    proj = f'{W}/runs/{run}'
    pf = f'{proj}/assets/resources/prefabs/test/{name}.prefab'
    row = {'run': run}
    if not os.path.exists(pf):
        row['err'] = 'no prefab'
        summary[run] = row
        print(run, 'no prefab')
        continue
    iss = validate.validate(pf)
    row['static'] = {'ok': not iss, 'n': len(iss), 'issues': iss[:8]}
    imp = subprocess.run(['enji', 'import', pf, '--project', proj], capture_output=True, text=True)
    try:
        row['import_ok'] = json.loads(imp.stdout).get('ok')
    except Exception:
        row['import_ok'] = False
    out = f'{W}/_results/{run}.dump.json'
    subprocess.run(['node', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'grade.mjs'), proj, out, f'{W}/_shots/{run}', f'prefabs/test/{name}'],
                   capture_output=True, text=True, timeout=600)
    exp = json.load(open(glob.glob(f'{W}/_spec/{tier}-*.expected.json')[0]))
    r = json.load(open(out))['results'].get(f'prefabs/test/{name}', {}) if os.path.exists(out) else {}
    errs = [e for e in r.get('errors', []) if 'status of 404' not in e]
    row['consoleErrors'] = errs[:5]
    if r.get('rows'):
        p, t, f = compare.score(exp, r['rows'])
        row.update(score=round(p / t, 4), passed=p, total=t, fails=f[:30], nfails=len(f))
    else:
        row.update(score=0, harness=r.get('harness'), err=r.get('err'))
    summary[run] = row
    print(run, 'static', 'ok' if not iss else len(iss), 'import', row['import_ok'], 'score', row.get('score'), 'errs', len(errs))
    json.dump(summary, open(summary_path, 'w'), ensure_ascii=False, indent=1)
