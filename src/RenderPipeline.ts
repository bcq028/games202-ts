import dat from "dat.gui";
import { Scene } from "./Scene";
import { CameraRenderPass } from "./RenderPass";


function reset_gl(gl: WebGLRenderingContext) {

    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

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

        lightPos = [0, 100, 200];

        const camera_renderpass = new CameraRenderPass(gl);
        // const shadow_renderpass = new ShadowRenderPass(gl);

        // for (let l = 0; l < scene.lights.length; l++) {
        //     shadow_renderpass.draw_forward(scene, lightPos);
        // }
        for (let l = 0; l < scene.lights.length; l++) {
            camera_renderpass.draw_forward(scene, lightPos);
        }
    }
}
