import dat from "dat.gui";
import { Scene, renderResource } from "./Scene";
import { CameraRenderPass, ShadowRenderPass, reset_gl } from "./RenderPass";

interface GUIParams {
    modelTransX: number;
    modelTransY: number;
    modelTransZ: number;
    modelScaleX: number;
    modelScaleY: number;
    modelScaleZ: number;
}
export class TRSTransform {
    translate: [number, number, number];
    scale: [number, number, number];
    constructor(translate: [number, number, number] = [0, 0, 0], scale: [number, number, number] = [1, 1, 1]) {
        this.translate = translate;
        this.scale = scale;
    }
}


export class RenderPipeline {
    public guiParams: GUIParams = {
        modelTransX: 0,
        modelTransY: 0,
        modelTransZ: 0,
        modelScaleX: 52,
        modelScaleY: 52,
        modelScaleZ: 52,
    }

    constructor() {
        this.createGUI();
    }

    createGUI() {
        const gui = new dat.GUI();
        const panelModel = gui.addFolder('Model properties');
        const panelModelTrans = panelModel.addFolder('Translation');
        const panelModelScale = panelModel.addFolder('Scale');
        panelModelTrans.add(this.guiParams, 'modelTransX').name('X');
        panelModelTrans.add(this.guiParams, 'modelTransY').name('Y');
        panelModelTrans.add(this.guiParams, 'modelTransZ').name('Z');
        panelModelScale.add(this.guiParams, 'modelScaleX').name('X');
        panelModelScale.add(this.guiParams, 'modelScaleY').name('Y');
        panelModelScale.add(this.guiParams, 'modelScaleZ').name('Z');
        panelModel.open();
        panelModelTrans.open();
        panelModelScale.open();
    }

    updatePerFrameBuffer(scene: Scene) {
        renderResource.updatePerFrameBuffer(scene);
    }

    render_forward(gl: WebGLRenderingContext, scene: Scene) {

        reset_gl(gl)

        const shadow_renderpass = new ShadowRenderPass(gl);
        const camera_renderpass = new CameraRenderPass(gl);

        shadow_renderpass.setup();
        camera_renderpass.setup();

        shadow_renderpass.draw_forward(scene, scene.lights[0]);
        camera_renderpass.draw_forward(scene, scene.lights[0].lightPos.elements as [number, number, number]);
    }
}
