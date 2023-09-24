import * as THREE from "three";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { Mesh } from "./Mesh";
import { PhongMaterial, EmissiveMaterial } from "./Material";
import { Scene } from "./Scene";

function loadShader(filename: string) {
  return new Promise<string>((res, rej) => {
    try {
      const loader = new THREE.FileLoader;
      loader.load(filename, data => {
        res(data as string);
      })
    } catch (error) {
      rej(error);
    }
  })
}

export function loadOBJ(scene: Scene, path: string, name: string) {

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
              let geometry = new Mesh(indices, { name: 'aVertexPosition', array: geo.attributes.position.array },
                { name: 'aNormalPosition', array: geo.attributes.normal.array },
                { name: 'aTextureCoord', array: geo.attributes.uv.array },
              );

              let colorMap: HTMLImageElement = null;
              if (mat.map != null) colorMap = mat.map.image
              let material = new PhongMaterial(mat.color.toArray(), colorMap, mat.specular.toArray(),
                (scene.lights[0].material as EmissiveMaterial).intensity);
              scene.addMesh({ mesh: geometry, material: material });
            }
          });
        }, null, onError);
    });
}


export const LightCubeVertexShader = await loadShader("../shaders/lightShader/vertex.glsl")
export const LightCubeFragmentShader = await loadShader("../shaders/lightShader/fragment.glsl")
export const PhongVertexShader = await loadShader("../shaders/phongShader/vertex.glsl")
export const PhongFragmentShader = await loadShader("../shaders/phongShader/fragment.glsl")