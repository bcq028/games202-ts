import { EmissiveMaterial } from './Material';
import { cube } from './Mesh';
import { Scene, renderResource } from './Scene';
import { RenderPipeline } from './RenderPipeline';
import { loadOBJ } from './loader';
import { Entity } from './Entity';
import { Vector, make_scale, make_translation, multiply } from './math/Matrix';


async function main() {
  const canvas = document.getElementById("glcanvas") as HTMLCanvasElement;
  canvas.width = window.screen.width;
  canvas.height = window.screen.height;
  const gl = canvas.getContext('webgl')!;
  const pointLight = new Entity(cube(), new EmissiveMaterial(250, [1, 1, 1]));

  const scene = new Scene(canvas, gl);
  scene.addLight(pointLight);
  let e1 = await loadOBJ(scene, renderResource, 'assets/mary/', 'Marry');
  e1.entities.forEach(entity => entity.transform = multiply(make_scale(new Vector([52, 52, 52])), entity.transform));
  e1.entities.forEach(entity => entity.transform = multiply(make_translation(new Vector([-40, 0, 0])), entity.transform));
  let e2 = await loadOBJ(scene, renderResource, 'assets/mary/', 'Marry');
  e2.entities.forEach(entity => entity.transform = multiply(make_scale(new Vector([26, 26, 26])), entity.transform));
  e2.entities.forEach(entity => entity.transform = multiply(make_translation(new Vector([40, 0, 0])), entity.transform));
  let e3 = await loadOBJ(scene, renderResource, 'assets/floor/', 'Floor');
  e3.entities.forEach(entity => entity.transform = multiply(make_scale(new Vector([52, 52, 52])), entity.transform));
  window.scene = scene;
  const renderPipeline = new RenderPipeline()

  function mainLoop() {
    renderPipeline.updatePerFrameBuffer(scene);
    renderPipeline.render_forward(gl, scene);
    requestAnimationFrame(mainLoop);
  }
  requestAnimationFrame(mainLoop);
}

main();