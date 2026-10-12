import { _decorator, Component, instantiate, Node, Prefab, ResolutionPolicy, resources, view } from 'cc';
import type { IView } from '../enji/IView';

const { ccclass } = _decorator;

/** Test harness: instantiates resources/<?prefab=...> under the root. Do not edit. */
@ccclass('MainView')
export class MainView extends Component implements IView {
    bind(root: Node): void {
        view.setDesignResolutionSize(720, 1280, ResolutionPolicy.SHOW_ALL);
        const w = window as any;
        const path = new URLSearchParams(location.search).get('prefab');
        if (!path) {
            w.__harness = { idle: true };
            console.log('[Harness] idle');
            return;
        }
        resources.load(path, Prefab, (err, prefab) => {
            if (err || !prefab) {
                w.__harness = { err: `load: ${err?.message ?? 'missing'}` };
                console.error('[Harness] load failed', err?.message);
                return;
            }
            try {
                const node = instantiate(prefab);
                root.addChild(node);
                w.__harnessRoot = node;
                w.__harness = { ok: true, name: node.name };
                console.log('[Harness] ready', node.name);
            } catch (e) {
                w.__harness = { err: `instantiate: ${(e as Error).message}` };
                console.error('[Harness] instantiate failed', (e as Error).message);
            }
        });
    }
}
