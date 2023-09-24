import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';
import { EmissiveMaterial } from './Material';
import {  cube } from './Geometry';
import { Scene } from './Scene';
import { RenderPipeline } from './RenderPipeline';
import { loadOBJ } from './loader';
const cameraPosition = [-20, 180, 250];


function main() {
  const canvas = document.getElementById("glcanvas") as HTMLCanvasElement;
  canvas.width = window.screen.width;
  canvas.height = window.screen.height;
  const gl = canvas.getContext('webgl')!;

  const camera_init = () => {
    const camera = new THREE.PerspectiveCamera(75, (gl.canvas as HTMLCanvasElement).clientWidth / (gl.canvas as HTMLCanvasElement).clientHeight);
    camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);

    const cameraControls = new OrbitControls(camera, canvas);
    cameraControls.enableZoom = true;
    cameraControls.enableRotate = true;
    cameraControls.enablePan = true;
    cameraControls.rotateSpeed = 0.3;
    cameraControls.zoomSpeed = 1.0;
    cameraControls.panSpeed = 2.0;
    cameraControls.target.set(0, 1, 0);
    const setSize = (width: number, height: number) => {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    setSize(canvas.clientWidth, canvas.clientHeight);
    window.addEventListener('resize', () => setSize(canvas.clientWidth, canvas.clientHeight));
    return { camera, cameraControls };
  }

  const { camera, cameraControls } = camera_init()


  const pointLight = {
    geometry: cube(),
    material: new EmissiveMaterial(250, [1, 1, 1])
  };
  const scene = new Scene();
  scene.camera = camera;
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
    cameraControls.update();

    renderPipeline.render(guiParams, gl, scene);
    requestAnimationFrame(mainLoop);
  }
  requestAnimationFrame(mainLoop);


}

main();