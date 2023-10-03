import * as THREE from "three";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { Mesh } from "./Mesh";
import { PhongMaterial, EmissiveMaterial } from "./Material";
import { RenderResource, Scene } from "./Scene";
import { Entity, RenderObject } from "./Entity";

export function loadShader(filename: string) {
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

export async function loadOBJ(scene: Scene, renderResource: RenderResource, path: string, name: string) {

  const manager = new THREE.LoadingManager();
  return new Promise<RenderObject>((res, _) => {
    new MTLLoader(manager)
      .setPath(path)
      .load(name + '.mtl', materials => {
        materials.preload();
        new OBJLoader(manager)
          .setMaterials(materials)
          .setPath(path)
          .load(name + '.obj', (object) => {
            const renderObject = new RenderObject();
            object.traverse(child => {
              if (child instanceof THREE.Mesh) {
                let geo = child.geometry;
                let mat: { map: { image: ImageData; }; color: { toArray: () => number[]; }; specular: { toArray: () => number[]; }; };
                if (Array.isArray(child.material)) mat = child.material[0];
                else mat = child.material;

                const indices = Array.from({ length: geo.attributes.position.count }, (_, k) => k);
                let mesh = new Mesh(indices, { name: 'aVertexPosition', array: geo.attributes.position.array },
                  { name: 'aNormalPosition', array: geo.attributes.normal.array },
                  { name: 'aTextureCoord', array: geo.attributes.uv.array },
                );

                let colorMap: ImageData = null;
                if (mat.map != null) colorMap = mat.map.image
                renderResource.phongStorageBufferObject.uKd.value=mat.color.toArray();
                
                let material = new PhongMaterial(mat.color.toArray(), colorMap, mat.specular.toArray(),
                  (scene.lights[0].material as EmissiveMaterial).intensity);
                const entity = new Entity(mesh, material);
                renderObject.entities.push(entity);
                scene.addEntity(entity);
              }
            });
            res(renderObject)
          }, (err) => {
            console.log(err)
          });
      });
  })

}


export const LightCubeVertexShader = await loadShader("../shaders/lightShader/vertex.glsl")
export const LightCubeFragmentShader = await loadShader("../shaders/lightShader/fragment.glsl")
export const PhongVertexShader = await loadShader("../shaders/phongShader/vertex.glsl")
export const PhongFragmentShader = await loadShader("../shaders/phongShader/fragment.glsl")