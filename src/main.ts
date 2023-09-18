import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import * as dat from 'dat.gui';
import { PhongMaterial, EmissiveMaterial, Material } from './Material';
import { Mesh, cube } from './Mesh';
import { MeshRenderer, reset_gl } from './webgl';
const cameraPosition = [-20, 180, 250];

// Remain rotatation
class TRSTransform {
  translate: number[];
  scale: number[];
  constructor(translate = [0, 0, 0], scale = [1, 1, 1]) {
    this.translate = translate;
    this.scale = scale;
  }
}



function loadOBJ(renderPipeline: RenderPipeline, path: string, name: string, gl: WebGLRenderingContext) {

  const manager = new THREE.LoadingManager();
  manager.onProgress = function (item, loaded, total) {
    console.log(item, loaded, total);
  };

  function onError() { }

  new MTLLoader(manager)
    .setPath(path)
    .load(name + '.mtl', function (materials) {
      materials.preload();
      new OBJLoader(manager)
        .setMaterials(materials)
        .setPath(path)
        .load(name + '.obj', function (object) {
          object.traverse(function (child: any) {
            if (child.isMesh) {
              let geo = child.geometry;
              let mat;
              if (Array.isArray(child.material)) mat = child.material[0];
              else mat = child.material;

              var indices = Array.from({ length: geo.attributes.position.count }, (_, k) => k);
              let mesh = new Mesh(indices, { name: 'aVertexPosition', array: geo.attributes.position.array },
                { name: 'aNormalPosition', array: geo.attributes.normal.array },
                { name: 'aTextureCoord', array: geo.attributes.uv.array },
              );

              let colorMap: HTMLImageElement = null;
              if (mat.map != null) colorMap = mat.map.image
              let myMaterial = new PhongMaterial(mat.color.toArray(), colorMap, mat.specular.toArray(),
                renderPipeline.lights[0].entity.mat.intensity);

              let meshRender = new MeshRenderer(gl, mesh, myMaterial);
              renderPipeline.addMeshRenderer(meshRender);
            }
          });
        }, null, onError);
    });
}


interface GUIParams {
  modelTransX: number;
  modelTransY: number;
  modelTransZ: number;
  modelScaleX: number;
  modelScaleY: number;
  modelScaleZ: number;
}

class RenderPipeline {
  meshes: MeshRenderer[] = [];
  lights = [];

  addLight(light: { mesh: Mesh, mat: Material }, gl: WebGLRenderingContext) { this.lights.push({ entity: light, meshRender: new MeshRenderer(gl, light.mesh, light.mat) }); }

  addMeshRenderer(meshRenderer: MeshRenderer) { this.meshes.push(meshRenderer); }

  render(guiParams: GUIParams, gl: WebGLRenderingContext, camera: THREE.Camera) {

    reset_gl(gl)

    // Handle light
    const timer = Date.now() * 0.00025;
    let lightPos = [Math.sin(timer * 6) * 100,
    Math.cos(timer * 4) * 150,
    Math.cos(timer * 2) * 100];

    if (this.lights.length != 0) {
      for (let l = 0; l < this.lights.length; l++) {
        let trans = new TRSTransform(lightPos);
        this.lights[l].meshRender.draw(camera, trans);

        for (let i = 0; i < this.meshes.length; i++) {
          const mesh = this.meshes[i];

          const modelTranslation = [guiParams.modelTransX, guiParams.modelTransY, guiParams.modelTransZ];
          const modelScale = [guiParams.modelScaleX, guiParams.modelScaleY, guiParams.modelScaleZ];
          let meshTrans = new TRSTransform(modelTranslation, modelScale);
          mesh.draw(camera, meshTrans, lightPos);
        }
      }
    } else {
      // Handle mesh(no light)
      for (let i = 0; i < this.meshes.length; i++) {
        const mesh = this.meshes[i];
        let trans = new TRSTransform();
        mesh.draw(camera, trans);
      }
    }
  }
}

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
    mesh: cube(),
    mat: new EmissiveMaterial(250, [1, 1, 1])
  };

  const renderPipeline = new RenderPipeline();
  renderPipeline.addLight(pointLight, gl);
  loadOBJ(renderPipeline, 'assets/mary/', 'Marry', gl);

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

    renderPipeline.render(guiParams, gl, camera);
    requestAnimationFrame(mainLoop);
  }
  requestAnimationFrame(mainLoop);


}

main();