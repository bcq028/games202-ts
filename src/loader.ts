import * as THREE from "three";

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
  
  export const LightCubeVertexShader = await loadShader("../shaders/lightShader/vertex.glsl")
  export const LightCubeFragmentShader = await loadShader("../shaders/lightShader/fragment.glsl")
  export const PhongVertexShader = await loadShader("../shaders/phongShader/vertex.glsl")
  export const PhongFragmentShader = await loadShader("../shaders/phongShader/fragment.glsl")