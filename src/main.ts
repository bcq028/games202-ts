import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { mat4 } from 'gl-matrix'
import * as dat from 'dat.gui';
const cameraPosition = [-20, 180, 250];

const LightCubeVertexShader = `
attribute vec3 aVertexPosition;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;


void main(void) {

  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aVertexPosition, 1.0);

}
`;

const LightCubeFragmentShader = `
#ifdef GL_ES
precision mediump float;
#endif

uniform float uLigIntensity;
uniform vec3 uLightRadiance;

void main(void) {

  gl_FragColor = vec4(uLightRadiance, 1.0);
}
`;

const PhongVertexShader = `
attribute vec3 aVertexPosition;
attribute vec3 aNormalPosition;
attribute vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying highp vec2 vTextureCoord;
varying highp vec3 vFragPos;
varying highp vec3 vNormal;


void main(void) {

  vFragPos = aVertexPosition;
  vNormal = aNormalPosition;

  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);

  vTextureCoord = aTextureCoord;

}
`;


const PhongFragmentShader = `
#ifdef GL_ES
precision mediump float;
#endif
uniform sampler2D uSampler;
uniform vec3 uKd;
uniform vec3 uKs;
uniform vec3 uLightPos;
uniform vec3 uCameraPos;
uniform float uLightIntensity;
uniform int uTextureSample;

varying highp vec2 vTextureCoord;
varying highp vec3 vFragPos;
varying highp vec3 vNormal;

void main(void) {
  vec3 color;
  if (uTextureSample == 1) {
    color = pow(texture2D(uSampler, vTextureCoord).rgb, vec3(2.2));
  } else {
    color = uKd;
  }
  
  vec3 ambient = 0.05 * color;

  vec3 lightDir = normalize(uLightPos - vFragPos);
  vec3 normal = normalize(vNormal);
  float diff = max(dot(lightDir, normal), 0.0);
  float light_atten_coff = uLightIntensity / length(uLightPos - vFragPos);
  vec3 diffuse =  diff * light_atten_coff * color;

  vec3 viewDir = normalize(uCameraPos - vFragPos);
  float spec = 0.0;
  vec3 reflectDir = reflect(-lightDir, normal);
  spec = pow (max(dot(viewDir, reflectDir), 0.0), 35.0);
  vec3 specular = uKs * light_atten_coff * spec;  
  
  gl_FragColor = vec4(pow((ambient + diffuse + specular), vec3(1.0/2.2)), 1.0);

}
`;

interface ShaderLocations {
  uniforms: string[],
  attribs: string[]
}
class Material {
  flatten_uniforms: string[] = []
  flatten_attribs: string[] = []
  uniforms: { [key: string]: ShaderVar }
  attribs: string[]
  vsSrc: string = ""
  fsSrc: string = ""
  constructor(uniforms: { [key: string]: ShaderVar }, attribs: string[], vsSrc: string, fsSrc: string) {
    this.flatten_uniforms = ['uModelViewMatrix', 'uProjectionMatrix', 'uCameraPos', 'uLightPos'];
    this.flatten_uniforms.push(...Object.keys(uniforms));
    this.flatten_attribs.push(...Object.keys(attribs));
    this.uniforms = uniforms;
    this.attribs = attribs;
    this.fsSrc = fsSrc;
    this.vsSrc = vsSrc;
  }
  setMeshAttribs(attribs: string[]) {
    this.flatten_attribs.push(...attribs)
  }
  compile(gl: WebGLRenderingContext) {
    return new RHIShader(gl, this.vsSrc, this.fsSrc, {
      uniforms: this.flatten_uniforms,
      attribs: this.flatten_attribs
    })
  }
}

class PhongMaterial extends Material {

  /**
  * Creates an instance of PhongMaterial.
  * @param {vec3f} color The material color
  * @param {Texture} colorMap The texture object of the material
  * @param {vec3f} specular The material specular coefficient
  * @param {float} intensity The light intensity
  * @memberof PhongMaterial
  */
  constructor(color: number[], colorMap: string, specular: number[], intensity: number) {
    let textureSample = 0;

    if (colorMap != null) {
      textureSample = 1;
      super({
        'uTextureSample': { type: '1i', value: textureSample },
        'uSampler': { type: 'texture', value: colorMap },
        'uKd': { type: '3fv', value: color },
        'uKs': { type: '3fv', value: specular },
        'uLightIntensity': { type: '1f', value: intensity }
      }, [], PhongVertexShader, PhongFragmentShader);
    } else {
      //console.log(color);
      super({
        'uTextureSample': { type: '1i', value: textureSample },
        'uKd': { type: '3fv', value: color },
        'uKs': { type: '3fv', value: specular },
        'uLightIntensity': { type: '1f', value: intensity }
      }, [], PhongVertexShader, PhongFragmentShader);
    }

  }
}

class EmissiveMaterial extends Material {
  intensity: number
  color: number[]
  constructor(lightIntensity: number, lightColor: number[]) {
    super({
      'uLigIntensity': { type: '1f', value: lightIntensity },
      'uLightColor': { type: '3fv', value: lightColor }
    }, [], LightCubeVertexShader, LightCubeFragmentShader);

    this.intensity = lightIntensity;
    this.color = lightColor;
  }
}

class Mesh {
  indices: number[];
  count: number;
  hasVertices: boolean;
  hasNormals: boolean;
  hasTexcoords: boolean;
  vertices?: Float32Array;
  verticesName?: string;
  normals?: Float32Array;
  normalsName?: string;
  texcoords?: Float32Array;
  texcoordsName?: string;
  constructor(indices: number[], verticesAttrib?: { name: string; array: Float32Array; }, normalsAttrib?: { name: string; array: Float32Array; }, texcoordsAttrib?: { name: string; array: Float32Array; }) {
    this.indices = indices;
    this.count = indices.length;
    this.hasVertices = false;
    this.hasNormals = false;
    this.hasTexcoords = false;

    if (verticesAttrib != null) {
      this.hasVertices = true;
      this.vertices = verticesAttrib.array;
      this.verticesName = verticesAttrib.name;
    }
    if (normalsAttrib != null) {
      this.hasNormals = true;
      this.normals = normalsAttrib.array;
      this.normalsName = normalsAttrib.name;
    }
    if (texcoordsAttrib != null) {
      this.hasTexcoords = true;
      this.texcoords = texcoordsAttrib.array;
      this.texcoordsName = texcoordsAttrib.name;
    }
  }

  static cube() {
    const positions = [
      // Front face
      -1.0, -1.0, 1.0,
      1.0, -1.0, 1.0,
      1.0, 1.0, 1.0,
      -1.0, 1.0, 1.0,

      // Back face
      -1.0, -1.0, -1.0,
      -1.0, 1.0, -1.0,
      1.0, 1.0, -1.0,
      1.0, -1.0, -1.0,

      // Top face
      -1.0, 1.0, -1.0,
      -1.0, 1.0, 1.0,
      1.0, 1.0, 1.0,
      1.0, 1.0, -1.0,

      // Bottom face
      -1.0, -1.0, -1.0,
      1.0, -1.0, -1.0,
      1.0, -1.0, 1.0,
      -1.0, -1.0, 1.0,

      // Right face
      1.0, -1.0, -1.0,
      1.0, 1.0, -1.0,
      1.0, 1.0, 1.0,
      1.0, -1.0, 1.0,

      // Left face
      -1.0, -1.0, -1.0,
      -1.0, -1.0, 1.0,
      -1.0, 1.0, 1.0,
      -1.0, 1.0, -1.0,
    ];
    const indices = [
      0, 1, 2, 0, 2, 3,    // front
      4, 5, 6, 4, 6, 7,    // back
      8, 9, 10, 8, 10, 11,   // top
      12, 13, 14, 12, 14, 15,   // bottom
      16, 17, 18, 16, 18, 19,   // right
      20, 21, 22, 20, 22, 23,   // left
    ];
    return new Mesh(indices, { name: 'aVertexPosition', array: new Float32Array(positions) });
  }
}

class PointLight {

  constructor(lightIntensity: number, lightColor: number[]) {
    mesh: Mesh.cube();
    mat: new EmissiveMaterial(lightIntensity, lightColor);
  }
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

interface ShaderVar {
  type: string,
  value: any
}

class RHIShader {
  gl: WebGLRenderingContext;
  program: RHI_Program;
  constructor(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string, shaderLocations: ShaderLocations) {
    this.gl = gl;
    const vs = this.compileShader(vsSrc, this.gl.VERTEX_SHADER);
    const fs = this.compileShader(fsSrc, this.gl.FRAGMENT_SHADER);

    this.program = this.addShaderLocations({ glShaderProgram: this.getProgramLinked(vs, fs) }, shaderLocations);
  }

  compileShader(shaderSource: string, shaderType: number) {
    const shader = this.gl.createShader(shaderType)!;
    this.gl.shaderSource(shader, shaderSource);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error("shader compiler error");
    }
    return shader;
  }

  getProgramLinked(vs: WebGLShader, fs: WebGLShader) {
    const gl = this.gl;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      alert('shader linker error:\n' + gl.getProgramInfoLog(prog));
    }
    return prog;
  };

  addShaderLocations(result: RHI_Program, shaderLocations: ShaderLocations) {
    const gl = this.gl;
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
    return result;
  }
}



class RHI_Renderer {

  private vertexBuffer: WebGLBuffer;
  private normalBuffer: WebGLBuffer;
  private texcoordBuffer: WebGLBuffer;
  private indicesBuffer: WebGLBuffer;
  gl: WebGLRenderingContext;
  mesh: Mesh;
  material: Material;
  shader: RHIShader;

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
    this.shader = this.material.compile(gl);
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
        this.shader.program.attribs[this.mesh.verticesName],
        numComponents,
        type,
        normalize,
        stride,
        offset);
      gl.enableVertexAttribArray(
        this.shader.program.attribs[this.mesh.verticesName]);
    }

    if (this.mesh.hasNormals) {
      const numComponents = 3;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.vertexAttribPointer(
        this.shader.program.attribs[this.mesh.normalsName],
        numComponents,
        type,
        normalize,
        stride,
        offset);
      gl.enableVertexAttribArray(
        this.shader.program.attribs[this.mesh.normalsName]);
    }

    if (this.mesh.hasTexcoords) {
      const numComponents = 2;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
      gl.vertexAttribPointer(
        this.shader.program.attribs[this.mesh.texcoordsName],
        numComponents,
        type,
        normalize,
        stride,
        offset);
      gl.enableVertexAttribArray(
        this.shader.program.attribs[this.mesh.texcoordsName]);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);

    gl.useProgram(this.shader.program.glShaderProgram);

    gl.uniformMatrix4fv(
      this.shader.program.uniforms.uProjectionMatrix,
      false,
      projectionMatrix);
    gl.uniformMatrix4fv(
      this.shader.program.uniforms.uModelViewMatrix,
      false,
      modelViewMatrix);

    // Specific the camera uniforms
    gl.uniform3fv(
      this.shader.program.uniforms.uCameraPos,
      [camera.position.x, camera.position.y, camera.position.z]);

    for (let k in this.material.uniforms) {
      if (this.material.uniforms[k].type == 'matrix4fv') {
        gl.uniformMatrix4fv(
          this.shader.program.uniforms[k],
          false,
          this.material.uniforms[k].value);
      } else if (this.material.uniforms[k].type == '3fv') {
        gl.uniform3fv(
          this.shader.program.uniforms[k],
          this.material.uniforms[k].value);
      } else if (this.material.uniforms[k].type == '1f') {
        gl.uniform1f(
          this.shader.program.uniforms[k],
          this.material.uniforms[k].value);
      } else if (this.material.uniforms[k].type == '1i') {
        gl.uniform1i(
          this.shader.program.uniforms[k],
          this.material.uniforms[k].value);
      } else if (this.material.uniforms[k].type == 'texture') {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.material.uniforms[k].value.texture);
        gl.uniform1i(this.shader.program.uniforms[k], 0);
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

              var indices = Array.from({ length: geo.attributes.position.count }, (v, k) => k);
              let mesh = new Mesh(indices, { name: 'aVertexPosition', array: geo.attributes.position.array },
                { name: 'aNormalPosition', array: geo.attributes.normal.array },
                { name: 'aTextureCoord', array: geo.attributes.uv.array },
              );

              let colorMap = null;
              if (mat.map != null) colorMap = new Texture(renderer.gl, mat.map.image);
              // MARK: You can change the myMaterial object to your own Material instance

              // let textureSample = 0;
              // let myMaterial;
              // if (colorMap != null) {
              // 	textureSample = 1;
              // 	myMaterial = new Material({
              // 		'uSampler': { type: 'texture', value: colorMap },
              // 		'uTextureSample': { type: '1i', value: textureSample },
              // 		'uKd': { type: '3fv', value: mat.color.toArray() }
              // 	},[],VertexShader, FragmentShader);
              // }else{
              // 	myMaterial = new Material({
              // 		'uTextureSample': { type: '1i', value: textureSample },
              // 		'uKd': { type: '3fv', value: mat.color.toArray() }
              // 	},[],VertexShader, FragmentShader);
              // }

              // let myMaterial =new PhongMaterial(mat.color.toArray(),colorMaop,mat.specular.toArray(),
              // renderer.lights[0].entity.mat.intensity);

              let myMaterial = new PhongMaterial(mat.color.toArray(), colorMap, mat.specular.toArray(),
                renderer.lights[0].entity.mat.intensity);

              let meshRender = new RHI_Renderer(renderer.gl, mesh, myMaterial);
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

  addLight(light) { this.lights.push({ entity: light, meshRender: new RHI_Renderer(this.gl, light.mesh, light.mat) }); }

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

          this.gl.useProgram(mesh.shader.program.glShaderProgram);
          this.gl.uniform3fv(mesh.shader.program.uniforms.uLightPos, lightPos);
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

  {
    const setSize = (width: number, height: number) => {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    setSize(canvas.clientWidth, canvas.clientHeight);
    window.addEventListener('resize', () => setSize(canvas.clientWidth, canvas.clientHeight));
  }

  const pointLight = new PointLight(250, [1, 1, 1]);

  const renderer = new WebGLRenderer(gl, camera);
  renderer.addLight(pointLight);
  loadOBJ(renderer, 'assets/mary/', 'Marry');

  var guiParams = {
    modelTransX: 0,
    modelTransY: 0,
    modelTransZ: 0,
    modelScaleX: 52,
    modelScaleY: 52,
    modelScaleZ: 52,
  }
  function createGUI() {
    const gui = new dat.gui.GUI();
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

  function mainLoop(now) {
    cameraControls.update();

    renderer.render(guiParams);
    requestAnimationFrame(mainLoop);
  }
  requestAnimationFrame(mainLoop);


}

main();