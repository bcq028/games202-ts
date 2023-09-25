import dat from "dat.gui";
import { Scene } from "./Scene";
import { CameraRenderPass, RenderPass, reset_gl } from "./RenderPass";

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
    render_forward(gl: WebGLRenderingContext, scene: Scene) {

        reset_gl(gl)

        // Handle light
        const timer = Date.now() * 0.00025;
        let lightPos = [Math.sin(timer * 6) * 100,
        Math.cos(timer * 4) * 150,
        Math.cos(timer * 2) * 100] as [number, number, number];

        for (let l = 0; l < scene.lights.length; l++) {
            let trans = new TRSTransform(lightPos);
            const meshRender = new RenderPass(gl, scene.lights[l].mesh, scene.lights[l].material);
            meshRender.draw(scene.camera, trans);
            const camera_renderpass = new CameraRenderPass(gl);
            camera_renderpass.draw_forward(scene, lightPos, this.guiParams);
        }

    }
    render(gl: WebGLRenderingContext, scene: Scene) {
        reset_gl(gl)

        // Handle light
        const timer = Date.now() * 0.00025;
        let lightPos = [Math.sin(timer * 6) * 100,
        Math.cos(timer * 4) * 150,
        Math.cos(timer * 2) * 100] as [number, number, number];

        for (let l = 0; l < scene.lights.length; l++) {
            let trans = new TRSTransform(lightPos);
            const meshRender = new RenderPass(gl, scene.lights[l].mesh, scene.lights[l].material);
            meshRender.draw(scene.camera, trans);

            for (let i = 0; i < scene.entities.length; i++) {
                const mesh = scene.entities[i];

                const modelTranslation = [this.guiParams.modelTransX, this.guiParams.modelTransY, this.guiParams.modelTransZ] as [number, number, number];
                const modelScale = [this.guiParams.modelScaleX, this.guiParams.modelScaleY, this.guiParams.modelScaleZ] as [number, number, number];
                let meshTrans = new TRSTransform(modelTranslation, modelScale);
                new RenderPass(gl, mesh.mesh, mesh.material).draw(scene.camera, meshTrans, lightPos)
            }
        }
    }
}
