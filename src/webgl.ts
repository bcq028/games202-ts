import { mat4 } from "gl-matrix"
import { Mesh } from "./Mesh"
import { Material } from "./Material"

export interface RHI_Program {
    glShaderProgram: WebGLProgram,
    uniforms?: {
        [key: string]: WebGLUniformLocation
    }
    attribs?: {
        [key: string]: number
    }
}

export function reset_gl(gl: WebGLRenderingContext) {

    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

export function compile(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string, uniform_keys: string[], attibute_keys: string[]) {
    return get_rhi_program(gl, vsSrc, fsSrc, {
        uniforms: uniform_keys,
        attribs: attibute_keys
    })
}


export function get_rhi_program(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string, shaderLocations: {
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

export class MeshRenderer {

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
        this.program = compile(gl, this.material.vsSrc, this.material.fsSrc, this.material.uniform_keys, this.material.attibute_keys)
    }

    draw(camera, transform, lightPos?: number[]) {
        const gl = this.gl;
        if (lightPos) {
            this.gl.useProgram(this.program.glShaderProgram);
            this.gl.uniform3fv(this.program.uniforms.uLightPos, lightPos);
        }
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
                gl.bindTexture(gl.TEXTURE_2D, createTexture(gl,this.material.uniforms[k].value));
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

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

function createTexture(gl:WebGLRenderingContext, img:HTMLImageElement) {
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

