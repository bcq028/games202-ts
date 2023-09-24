import { Material } from "./Material";
import { Mesh } from "./Mesh";

export interface RHIMesh {
    vertexBuffer: WebGLBuffer
    normalBuffer: WebGLBuffer
    texcoordBuffer: WebGLBuffer
    indicesBuffer: WebGLBuffer
}

export interface RHIMaterial {
    textures: WebGLTexture[]
}


export function createWebGLMesh(gl: WebGLRenderingContext, mesh: Mesh) {
    let ret: RHIMesh = {
        vertexBuffer: gl.createBuffer(),
        normalBuffer: gl.createBuffer(),
        texcoordBuffer: gl.createBuffer(),
        indicesBuffer: gl.createBuffer()
    }

    if (mesh.hasVertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, ret.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
    }

    if (mesh.hasNormals) {
        gl.bindBuffer(gl.ARRAY_BUFFER, ret.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
    }

    if (mesh.hasTexcoords) {
        gl.bindBuffer(gl.ARRAY_BUFFER, ret.texcoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.texcoords, gl.STATIC_DRAW);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ret.indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);
    return ret
}


export function createWebGLMaterial(gl: WebGLRenderingContext, material: Material) {
    let ret: RHIMaterial = { textures: [] }
    for (let k in material.uniforms) {
        if (material.uniforms[k].type == 'texture') {
            ret.textures.push(createTexture(gl, this.material.uniforms[k].value));
        }
    }
    return ret
}

export function createTexture(gl: WebGLRenderingContext, img: HTMLImageElement) {
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

function isPowerOf2(value: number) {
    return (value & (value - 1)) == 0;
}
