import * as dat from 'dat.gui';
import { EmissiveMaterial } from './Material';
import { cube } from './Geometry';
import { Scene } from './Scene';
import { RenderPipeline } from './RenderPipeline';
import { loadOBJ } from './loader';


function main() {
  const canvas = document.getElementById("glcanvas") as HTMLCanvasElement;
  canvas.width = window.screen.width;
  canvas.height = window.screen.height;
  const gl = canvas.getContext('webgl')!;
  const pointLight = {
    geometry: cube(),
    material: new EmissiveMaterial(250, [1, 1, 1])
  };

  const scene = new Scene(canvas);
  scene.addLight(pointLight);
  loadOBJ(scene, 'assets/mary/', 'Marry');

  const renderPipeline = new RenderPipeline()

  const guiParams = {
    modelTransX: 0,
    modelTransY: 0,
    modelTransZ: 0,
    modelScaleX: 52,
    modelScaleY: 52,
    modelScaleZ: 52,
  }
  function createGUI() {
    const gui = new dat.GUI();
    const panelModel = gui.addFolder('Model properties');
    const panelModelTrans = panelModel.addFolder('Translation');
    const panelModelScale = panelModel.addFolder('Scale');
    panelModelTrans.add(guiParams, 'modelTransX').name('X');
    panelModelTrans.add(guiParams, 'modelTransY').name('Y');
    panelModelTrans.add(guiParams, 'modelTransZ').name('Z');
    panelModelScale.add(guiParams, 'modelScaleX').name('X');
    panelModelScale.add(guiParams, 'modelScaleY').name('Y');
    panelModelScale.add(guiParams, 'modelScaleZ').name('Z');
    panelModel.open();
    panelModelTrans.open();
    panelModelScale.open();
  }

  createGUI();

  function mainLoop() {
    scene.cameraControls.update();
    renderPipeline.render(guiParams, gl, scene);
    requestAnimationFrame(mainLoop);
  }
  requestAnimationFrame(mainLoop);
}

main();