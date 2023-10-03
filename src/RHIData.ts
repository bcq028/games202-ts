import { Material } from "./Material";
import { Mesh } from "./Mesh";

export interface RHIMesh {
    vertexBuffer?: WebGLBuffer
    normalBuffer?: WebGLBuffer
    texcoordBuffer?: WebGLBuffer
    indicesBuffer: WebGLBuffer
}

export interface RHIMaterial {
    textures: WebGLTexture[],
    // program with shader linked
    shaderProgram: WebGLProgram,
}
export interface RHIEntity {
    mesh: RHIMesh
    material: RHIMaterial
}

export interface RHIFrameBuffer {
    frameBuffer: WebGLFramebuffer
}

export function createWebGLMesh(gl: WebGLRenderingContext, mesh: Mesh) {
    let ret: RHIMesh = {
        indicesBuffer: gl.createBuffer()
    }

    if (mesh.hasVertices) {
        ret.vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, ret.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
    }

    if (mesh.hasNormals) {
        ret.normalBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, ret.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
    }

    if (mesh.hasTexcoords) {
        ret.texcoordBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, ret.texcoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.texcoords, gl.STATIC_DRAW);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ret.indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);
    return ret
}


export function createWebGLMaterial(gl: WebGLRenderingContext, material: Material) {
    let ret: RHIMaterial = { textures: [], shaderProgram: gl.createProgram() }
    for (let k in material.uniforms) {
        if (material.uniforms[k].type == 'texture') {
            ret.textures.push(createTexture(gl, material.uniforms[k].value));
        }
    }
    const compileShader = (shaderSource: string, shaderType: number) => {
        const shader = gl.createShader(shaderType)!;
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("shader compiler error");
        }
        return shader;
    }

    const vs = compileShader(material.vsSrc, gl.VERTEX_SHADER);
    const fs = compileShader(material.fsSrc, gl.FRAGMENT_SHADER);

    gl.attachShader(ret.shaderProgram, vs);
    gl.attachShader(ret.shaderProgram, fs);
    gl.linkProgram(ret.shaderProgram);

    if (!gl.getProgramParameter(ret.shaderProgram, gl.LINK_STATUS)) {
        alert('shader linker error:\n' + gl.getProgramInfoLog(ret.shaderProgram));
    }
    return ret
}

export function set_shader(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string) {
    const compileShader = (shaderSource: string, shaderType: number) => {
        const shader = gl.createShader(shaderType)!;
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("shader compiler error");
        }
        return shader;
    }

    let ret = gl.createProgram();
    const vs = compileShader(vsSrc, gl.VERTEX_SHADER);
    const fs = compileShader(fsSrc, gl.FRAGMENT_SHADER);
    gl.attachShader(ret, vs);
    gl.attachShader(ret, fs);
    gl.linkProgram(ret);

    if (!gl.getProgramParameter(ret, gl.LINK_STATUS)) {
        alert('shader linker error:\n' + gl.getProgramInfoLog(ret));
    }
    return ret
}

function createTexture(gl: WebGLRenderingContext, img: ImageData) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

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

    gl.bindTexture(gl.TEXTURE_2D, texture);
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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
}

export function createFBO(gl: WebGLRenderingContext): RHIFrameBuffer {
    const resolution = 2048;
    const frameBuffer = gl.createFramebuffer();
    const texture = gl.createTexture();
    const numBytes = resolution * resolution * 4;
    const pixelData = new Uint8Array(numBytes);
    for (let i = 0; i < numBytes; ++i) {
        pixelData[i] = 255;
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, resolution, resolution, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, resolution, resolution);

    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return { frameBuffer };
}


function isPowerOf2(value: number) {
    return (value & (value - 1)) == 0;
}
