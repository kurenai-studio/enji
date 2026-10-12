// usage: node grade.mjs <projectDir> <outJson> <shotPrefix> <prefabResPath>...
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const [dir, outJson, shotPrefix, ...prefabs] = process.argv.slice(2);
const dump = readFileSync(new URL('./dump.js', import.meta.url), 'utf8');
const enji = (args) => {
    try { return JSON.parse(execFileSync('enji', args, { encoding: 'utf8', timeout: 240000 })); }
    catch (e) { const out = e.stdout?.toString() || ''; try { return JSON.parse(out); } catch { return { ok: false, raw: out.slice(0, 500) }; } }
};

const host = enji(['host', 'start', '--project', dir, '--timeout', '180']);
const result = { dir, results: {} };
if (!host.previewUrl) { result.err = 'host start failed'; result.host = host; writeFileSync(outJson, JSON.stringify(result, null, 1)); process.exit(0); }
const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.HOME + '/Library/Caches/ms-playwright/chromium-1148/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    args: ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
for (const p of prefabs) {
    const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
    page.on('pageerror', (e) => errors.push('pageerror: ' + String(e.message).slice(0, 300)));
    await page.goto(host.previewUrl + '&prefab=' + encodeURIComponent(p));
    const r = await page.evaluate(dump).catch((e) => ({ err: String(e.message).slice(0, 300) }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${shotPrefix}-${p.split('/').pop()}.png` });
    r.errors = errors;
    result.results[p] = r;
    await page.close();
}
await browser.close();
enji(['host', 'stop', '--project', dir]);
writeFileSync(outJson, JSON.stringify(result, null, 1));
console.log(Object.entries(result.results).map(([k, v]) => `${k}: ${v.harness ? JSON.stringify(v.harness) : v.err} rows=${v.rows?.length ?? 0} errors=${v.errors.length}`).join('\n'));
