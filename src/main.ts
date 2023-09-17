import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { mat4 } from 'gl-matrix'
import * as dat from 'dat.gui';
import { Material, PhongMaterial, EmissiveMaterial } from './Material';
import { Mesh, cube } from './Mesh';
const cameraPosition = [-20, 180, 250];



function compile(gl: WebGLRenderingContext, m: Material) {
  return get_rhi_program(gl, m.vsSrc, m.fsSrc, {
    uniforms: m.uniform_keys,
    attribs: m.attibute_keys
  })
}

interface RHI_Program {
  glShaderProgram: WebGLProgram,
  uniforms?: {
    [key: string]: WebGLUniformLocation
  }
  attribs?: {
    [key: string]: number
  }
}

function get_rhi_program(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string, shaderLocations: {
  uniforms: string[],
  attribs: string[]
}): RHI_Program {
  function compileShader(shaderSource: string, shaderType: number) {
    const shader = gl.createShader(shaderType)!;
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("shader compiler error");
    }
    return shader;
  }
  function getProgramLinked(vs: WebGLShader, fs: WebGLShader) {
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      alert('shader linker error:\n' + gl.getProgramInfoLog(prog));
    }
    return prog;
  };


  function addShaderLocations(result: RHI_Program, shaderLocations: {
    uniforms: string[],
    attribs: string[]
  }) {
    result.uniforms = {};
    result.attribs = {};

    if (shaderLocations && shaderLocations.uniforms && shaderLocations.uniforms.length) {
      for (let i = 0; i < shaderLocations.uniforms.length; ++i) {
        Object.assign(result.uniforms, {
          [shaderLocations.uniforms[i]]: gl.getUniformLocation(result.glShaderProgram, shaderLocations.uniforms[i]),
        });
      }
    }
    if (shaderLocations && shaderLocations.attribs && shaderLocations.attribs.length) {
      for (let i = 0; i < shaderLocations.attribs.length; ++i) {
        Object.assign(result.attribs, {
          [shaderLocations.attribs[i]]: gl.getAttribLocation(result.glShaderProgram, shaderLocations.attribs[i]),
        });
      }
    }
  }

  const vs = compileShader(vsSrc, gl.VERTEX_SHADER);
  const fs = compileShader(fsSrc, gl.FRAGMENT_SHADER);
  let rhi_program = { glShaderProgram: getProgramLinked(vs, fs) }
  addShaderLocations(rhi_program, shaderLocations);
  return rhi_program;
}



class MeshRenderer {

  private vertexBuffer: WebGLBuffer;
  private normalBuffer: WebGLBuffer;
  private texcoordBuffer: WebGLBuffer;
  private indicesBuffer: WebGLBuffer;
  gl: WebGLRenderingContext;
  mesh: Mesh;
  material: Material;
  program: RHI_Program;

  constructor(gl: WebGLRenderingContext, mesh: Mesh, material: Material) {
    this.gl = gl;
    this.mesh = mesh;
    this.material = material;

    this.vertexBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();
    this.texcoordBuffer = gl.createBuffer();
    this.indicesBuffer = gl.createBuffer();

    let extraAttribs = []
    if (mesh.hasVertices) {
      extraAttribs.push(mesh.verticesName);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    if (mesh.hasNormals) {
      extraAttribs.push(mesh.normalsName);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    if (mesh.hasTexcoords) {
      extraAttribs.push(mesh.texcoordsName);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.texcoords, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    this.material.setMeshAttribs(extraAttribs);
    this.program = compile(gl, this.material)
  }

  draw(camera, transform) {
    const gl = this.gl;

    let modelViewMatrix = mat4.create();
    let projectionMatrix = mat4.create();

    camera.updateMatrixWorld();
    mat4.invert(modelViewMatrix, camera.matrixWorld.elements);
    mat4.translate(modelViewMatrix, modelViewMatrix, transform.translate);
    mat4.scale(modelViewMatrix, modelViewMatrix, transform.scale);
    mat4.copy(projectionMatrix, camera.projectionMatrix.elements);

    if (this.mesh.hasVertices) {
      const numComponents = 3;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.vertexAttribPointer(
        this.program.attribs[this.mesh.verticesName],
        numComponents,
        type,
        normalize,
        stride,
        offset);
      gl.enableVertexAttribArray(
        this.program.attribs[this.mesh.verticesName]);
    }

    if (this.mesh.hasNormals) {
      const numComponents = 3;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.vertexAttribPointer(
        this.program.attribs[this.mesh.normalsName],
        numComponents,
        type,
        normalize,
        stride,
        offset);
      gl.enableVertexAttribArray(
        this.program.attribs[this.mesh.normalsName]);
    }

    if (this.mesh.hasTexcoords) {
      const numComponents = 2;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
      gl.vertexAttribPointer(
        this.program.attribs[this.mesh.texcoordsName],
        numComponents,
        type,
        normalize,
        stride,
        offset);
      gl.enableVertexAttribArray(
        this.program.attribs[this.mesh.texcoordsName]);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);

    gl.useProgram(this.program.glShaderProgram);

    gl.uniformMatrix4fv(
      this.program.uniforms.uProjectionMatrix,
      false,
      projectionMatrix);
    gl.uniformMatrix4fv(
      this.program.uniforms.uModelViewMatrix,
      false,
      modelViewMatrix);

    // Specific the camera uniforms
    gl.uniform3fv(
      this.program.uniforms.uCameraPos,
      [camera.position.x, camera.position.y, camera.position.z]);

    for (let k in this.material.uniforms) {
      if (this.material.uniforms[k].type == 'matrix4fv') {
        gl.uniformMatrix4fv(
          this.program.uniforms[k],
          false,
          this.material.uniforms[k].value);
      } else if (this.material.uniforms[k].type == '3fv') {
        gl.uniform3fv(
          this.program.uniforms[k],
          this.material.uniforms[k].value);
      } else if (this.material.uniforms[k].type == '1f') {
        gl.uniform1f(
          this.program.uniforms[k],
          this.material.uniforms[k].value);
      } else if (this.material.uniforms[k].type == '1i') {
        gl.uniform1i(
          this.program.uniforms[k],
          this.material.uniforms[k].value);
      } else if (this.material.uniforms[k].type == 'texture') {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.material.uniforms[k].value.texture);
        gl.uniform1i(this.program.uniforms[k], 0);
      }
    }

    {
      const vertexCount = this.mesh.count;
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
  }
}

// Remain rotatation
class TRSTransform {
  translate: number[];
  scale: number[];
  constructor(translate = [0, 0, 0], scale = [1, 1, 1]) {
    this.translate = translate;
    this.scale = scale;
  }
}

class Texture {
  texture: any;
  constructor(gl, img) {
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
      width, height, border, srcFormat, srcType,
      pixel);

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
      srcFormat, srcType, img);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn of mips and set
      // wrapping to clamp to edge
      //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEATE);
      //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEATE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}


function loadOBJ(renderer, path, name) {

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

              let colorMap = null;
              if (mat.map != null) colorMap = new Texture(renderer.gl, mat.map.image);
              let myMaterial = new PhongMaterial(mat.color.toArray(), colorMap, mat.specular.toArray(),
                renderer.lights[0].entity.mat.intensity);

              let meshRender = new MeshRenderer(renderer.gl, mesh, myMaterial);
              renderer.addMesh(meshRender);
            }
          });
        }, null, onError);
    });
}


class WebGLRenderer {
  meshes = [];
  lights = [];
  gl: any;
  camera: any;

  constructor(gl, camera) {
    this.gl = gl;
    this.camera = camera;
  }

  addLight(light) { this.lights.push({ entity: light, meshRender: new MeshRenderer(this.gl, light.mesh, light.mat) }); }

  addMesh(mesh) { this.meshes.push(mesh); }

  render(guiParams) {
    const gl = this.gl;

    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Handle light
    const timer = Date.now() * 0.00025;
    let lightPos = [Math.sin(timer * 6) * 100,
    Math.cos(timer * 4) * 150,
    Math.cos(timer * 2) * 100];

    if (this.lights.length != 0) {
      for (let l = 0; l < this.lights.length; l++) {
        let trans = new TRSTransform(lightPos);
        this.lights[l].meshRender.draw(this.camera, trans);

        for (let i = 0; i < this.meshes.length; i++) {
          const mesh = this.meshes[i];

          const modelTranslation = [guiParams.modelTransX, guiParams.modelTransY, guiParams.modelTransZ];
          const modelScale = [guiParams.modelScaleX, guiParams.modelScaleY, guiParams.modelScaleZ];
          let meshTrans = new TRSTransform(modelTranslation, modelScale);

          this.gl.useProgram(mesh.program.glShaderProgram);
          this.gl.uniform3fv(mesh.program.uniforms.uLightPos, lightPos);
          mesh.draw(this.camera, meshTrans);
        }
      }
    } else {
      // Handle mesh(no light)
      for (let i = 0; i < this.meshes.length; i++) {
        const mesh = this.meshes[i];
        let trans = new TRSTransform();
        mesh.draw(this.camera, trans);
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

  const renderer = new WebGLRenderer(gl, camera);
  renderer.addLight(pointLight);
  loadOBJ(renderer, 'assets/mary/', 'Marry');

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

    renderer.render(guiParams);
    requestAnimationFrame(mainLoop);
  }
  requestAnimationFrame(mainLoop);


}

main();