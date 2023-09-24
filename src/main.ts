import { EmissiveMaterial } from './Material';
import { cube } from './Mesh';
import { Scene } from './Scene';
import { RenderPipeline } from './RenderPipeline';
import { loadOBJ } from './loader';


function main() {
  const canvas = document.getElementById("glcanvas") as HTMLCanvasElement;
  canvas.width = window.screen.width;
  canvas.height = window.screen.height;
  const gl = canvas.getContext('webgl')!;
  const pointLight = {
    mesh: cube(),
    material: new EmissiveMaterial(250, [1, 1, 1])
  };

  const scene = new Scene(canvas,gl);
  scene.addLight(pointLight);
  loadOBJ(scene, 'assets/mary/', 'Marry');

  const renderPipeline = new RenderPipeline()

  function mainLoop() {
    scene.cameraControls.update();
    renderPipeline.render(gl, scene);
    requestAnimationFrame(mainLoop);
  }
  requestAnimationFrame(mainLoop);
}

main();