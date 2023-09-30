import { EmissiveMaterial } from './Material';
import { cube } from './Mesh';
import { Scene } from './Scene';
import { RenderPipeline } from './RenderPipeline';
import { loadOBJ } from './loader';
import { Entity } from './Entity';
import { Vector, make_translation, multiply } from './math/Matrix';


async function main() {
  const canvas = document.getElementById("glcanvas") as HTMLCanvasElement;
  canvas.width = window.screen.width;
  canvas.height = window.screen.height;
  const gl = canvas.getContext('webgl')!;
  const pointLight = new Entity(cube(), new EmissiveMaterial(250, [1, 1, 1]));

  const scene = new Scene(canvas, gl);
  scene.addLight(pointLight);
  let e1 = await loadOBJ(scene, 'assets/mary/', 'Marry');
  e1.transform = multiply(make_translation(new Vector([10, 0, 0])), e1.transform);
  let e2 = await loadOBJ(scene, 'assets/mary/', 'Marry');
  e2.transform = multiply(make_translation(new Vector([-10, 0, 0])), e1.transform);
  loadOBJ(scene, 'assets/floor/', 'Floor');
  window.scene=scene;
  const renderPipeline = new RenderPipeline()

  function mainLoop() {
    renderPipeline.render_forward(gl, scene);
    requestAnimationFrame(mainLoop);
  }
  requestAnimationFrame(mainLoop);
}

main();