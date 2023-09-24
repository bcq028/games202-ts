import { Scene } from "./Scene";
import { reset_gl, RenderPass } from "./webgl";

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

    render(guiParams: GUIParams, gl: WebGLRenderingContext, scene: Scene) {

        reset_gl(gl)

        // Handle light
        const timer = Date.now() * 0.00025;
        let lightPos = [Math.sin(timer * 6) * 100,
        Math.cos(timer * 4) * 150,
        Math.cos(timer * 2) * 100] as [number, number, number];

        if (scene.lights.length != 0) {
            for (let l = 0; l < scene.lights.length; l++) {
                let trans = new TRSTransform(lightPos);
                const meshRender = new RenderPass(gl, scene.lights[l].geometry, scene.lights[l].material);
                meshRender.draw(scene.camera, trans);

                for (let i = 0; i < scene.meshes.length; i++) {
                    const mesh = scene.meshes[i];

                    const modelTranslation = [guiParams.modelTransX, guiParams.modelTransY, guiParams.modelTransZ] as [number, number, number];
                    const modelScale = [guiParams.modelScaleX, guiParams.modelScaleY, guiParams.modelScaleZ] as [number, number, number];
                    let meshTrans = new TRSTransform(modelTranslation, modelScale);
                    new RenderPass(gl, mesh.geometry, mesh.material).draw(scene.camera, meshTrans, lightPos)
                }
            }
        } else {
            // Handle mesh(no light)
            for (let i = 0; i < scene.meshes.length; i++) {
                const mesh = scene.meshes[i];
                let trans = new TRSTransform();
                new RenderPass(gl, mesh.geometry, mesh.material).draw(scene.camera, trans)
            }
        }
    }
}
