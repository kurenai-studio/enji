import {
    _decorator, Camera, Color, Component, director, DirectionalLight, Layers, Material, MeshRenderer, Node,
    primitives, renderer, resources, utils, Vec3,
} from 'cc';
import type { IView } from '../enji/IView';
import { addLabel } from '../enji/helpers';

const { ccclass } = _decorator;

/** Loads `assets/resources/materials/<name>.mtl`. */
function loadMaterial(name: string): Promise<Material> {
    return new Promise((resolve, reject) =>
        resources.load(`materials/${name}`, Material, (err, mat) => (err ? reject(err) : resolve(mat))));
}

@ccclass('MainView')
export class MainView extends Component implements IView {
    private box: Node | null = null;

    bind(root: Node): void {
        const scene = director.getScene()!;
        // The template Canvas camera draws the UI on top of the 3D camera.
        for (const cam of scene.getComponentsInChildren(Camera)) {
            cam.clearFlags = Camera.ClearFlag.DEPTH_ONLY;
            cam.priority = 1 << 30;
        }
        addLabel(root, 'Hello Enji 3D', { name: 'Title', fontSize: 32, y: 300 });

        const world = new Node('World');
        scene.addChild(world);

        const cameraNode = new Node('MainCamera');
        world.addChild(cameraNode);
        cameraNode.setPosition(0, 3, 7);
        cameraNode.lookAt(new Vec3(0, 0.5, 0));
        const camera = cameraNode.addComponent(Camera);
        camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
        camera.clearColor = new Color(38, 42, 52, 255);
        camera.visibility = Layers.Enum.DEFAULT;
        camera.priority = 0;

        const sun = new Node('Sun');
        world.addChild(sun);
        sun.setRotationFromEuler(-50, 35, 0);
        const light = sun.addComponent(DirectionalLight);
        light.shadowEnabled = true;
        light.shadowPcf = 2;
        light.shadowFixedArea = false;
        light.shadowDistance = 20;
        light.shadowSaturation = 0.6;
        const shadows = scene.globals.shadows;
        shadows.enabled = true;
        shadows.type = renderer.scene.ShadowType.ShadowMap;
        shadows.shadowMapSize = 2048;
        // The template scene's HDR ambient is black, which leaves unlit faces pitch black.
        scene.globals.ambient.skyLightingColor = new Color(110, 130, 160, 255);
        scene.globals.ambient.groundLightingColor = new Color(50, 50, 55, 255);

        void loadMaterial('standard').then((base) => {
            this.addShape(world, 'Ground', primitives.plane({ width: 10, length: 10 }), base, new Color(90, 96, 110), 0);
            this.box = this.addShape(world, 'Box', primitives.box(), base, new Color(220, 110, 60), 0.5);
        });
    }

    private addShape(parent: Node, name: string, geometry: primitives.IGeometry, base: Material, color: Color, y: number): Node {
        const node = new Node(name);
        parent.addChild(node);
        node.setPosition(0, y, 0);
        const renderer = node.addComponent(MeshRenderer);
        renderer.mesh = utils.MeshUtils.createMesh(geometry);
        renderer.setSharedMaterial(base, 0);
        renderer.material!.setProperty('mainColor', color);
        renderer.shadowCastingMode = MeshRenderer.ShadowCastingMode.ON;
        renderer.receiveShadow = MeshRenderer.ShadowReceivingMode.ON;
        return node;
    }

    update(dt: number): void {
        if (this.box) {
            const e = this.box.eulerAngles;
            this.box.setRotationFromEuler(e.x, e.y + 40 * dt, e.z);
        }
    }
}
