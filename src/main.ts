import { EmissiveMaterial } from './Material';
import { cube } from './Mesh';
import { Scene, renderResource } from './Scene';
import { RenderPipeline } from './RenderPipeline';
import { loadOBJ } from './loader';
import { PointLight } from './Entity';
import { Matrix, Vector, make_scale, make_translation } from './math/Matrix';


async function main() {
  const canvas = document.getElementById("glcanvas") as HTMLCanvasElement;
  canvas.width = window.screen.width;
  canvas.height = window.screen.height;
  const gl = canvas.getContext('webgl')!;
  const pointLight = new PointLight(cube(), new EmissiveMaterial(250, [1, 1, 1]));
  pointLight.focalPoint = new Vector([0, 0, 0]);
  pointLight.lightUp = new Vector([0, 1, 0]);
  pointLight.lightPos = new Vector([0, 80, 80]);
  pointLight.transform = Matrix.make_identity().translate(pointLight.lightPos);

  const scene = new Scene(canvas, gl);
  scene.addLight(pointLight);
  let e1 = await loadOBJ(scene, renderResource, 'assets/mary/', 'Marry');
  e1.entities.forEach(entity => entity.transform.multiply(make_scale(new Vector([52, 52, 52]))));
  e1.entities.forEach(entity => entity.transform.multiply(make_translation(new Vector([-40, 0, 0]))));
  let e2 = await loadOBJ(scene, renderResource, 'assets/mary/', 'Marry');
  e2.entities.forEach(entity => entity.transform.multiply(make_scale(new Vector([26, 26, 26]))));
  e2.entities.forEach(entity => entity.transform.multiply(make_translation(new Vector([40, 0, 0]))));
  let e3 = await loadOBJ(scene, renderResource, 'assets/floor/', 'Floor');
  e3.entities.forEach(entity => entity.transform.multiply(make_scale(new Vector([52, 52, 52]))));
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