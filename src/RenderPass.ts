import { mat4 } from "gl-matrix"
import { Mesh } from "./Mesh"
import { Material } from "./Material"
import { TRSTransform } from "./RenderPipeline"
import { createTexture } from "./RHIData"
import { Scene } from "./Scene"

interface GUIParams {
    modelTransX: number;
    modelTransY: number;
    modelTransZ: number;
    modelScaleX: number;
    modelScaleY: number;
    modelScaleZ: number;
}

export interface WebGLContext {
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

export function get_rhi_program(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string, shaderLocations: {
    uniforms: string[],
    attribs: string[]
}): WebGLContext {
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


    /**
     * get location of shader parameter and bind them to uniform/attribute keys
     * we can refer to the location to set variable 
     */
    function addShaderLocations(result: WebGLContext, shaderLocations: {
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

export class RenderPass {

    private vertexBuffer: WebGLBuffer;
    private normalBuffer: WebGLBuffer;
    private texcoordBuffer: WebGLBuffer;
    private indicesBuffer: WebGLBuffer;
    gl: WebGLRenderingContext;
    mesh: Mesh;
    material: Material;
    program: WebGLContext;

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
        }

        if (mesh.hasNormals) {
            extraAttribs.push(mesh.normalsName);
        }

        if (mesh.hasTexcoords) {
            extraAttribs.push(mesh.texcoordsName);
        }

        this.material.setMeshAttribs(extraAttribs);
        this.program = get_rhi_program(gl, this.material.vsSrc, this.material.fsSrc, { uniforms: this.material.uniform_keys, attribs: this.material.attibute_keys })

        if (mesh.hasVertices) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
        }

        if (mesh.hasNormals) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
        }

        if (mesh.hasTexcoords) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, mesh.texcoords, gl.STATIC_DRAW);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);

    }

    draw(camera: THREE.Camera, transform: TRSTransform, lightPos?: number[]) {
        const gl = this.gl;
        if (lightPos) {
            this.gl.useProgram(this.program.glShaderProgram);
            this.gl.uniform3fv(this.program.uniforms.uLightPos, lightPos);
        }
        let modelViewMatrix = mat4.create();
        let projectionMatrix = mat4.create();

        camera.updateMatrixWorld();
        mat4.invert(modelViewMatrix, camera.matrixWorld.elements as unknown as [
            number, number, number, number,
            number, number, number, number,
            number, number, number, number,
            number, number, number, number
        ]);
        mat4.translate(modelViewMatrix, modelViewMatrix, transform.translate);
        mat4.scale(modelViewMatrix, modelViewMatrix, transform.scale);

        mat4.copy(projectionMatrix, camera.projectionMatrix.elements as unknown as [
            number, number, number, number,
            number, number, number, number,
            number, number, number, number,
            number, number, number, number
        ]);

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
                gl.bindTexture(gl.TEXTURE_2D, createTexture(gl, this.material.uniforms[k].value));
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


export class CameraRenderPass {
    constructor(private gl: WebGLRenderingContext, private program: WebGLContext) {

    }
    draw(scene: Scene, lightPos: number[], guiParams: GUIParams) {
        const gl = this.gl;
        if (lightPos) {
            this.gl.useProgram(this.program.glShaderProgram);
            this.gl.uniform3fv(this.program.uniforms.uLightPos, lightPos);
        }
        let modelViewMatrix = mat4.create();
        let projectionMatrix = mat4.create();

        scene.camera.updateMatrixWorld();


        for (let i = 0; i < scene.rhiEntities.length; i++) {
            const entity = scene.rhiEntities[i];

            const modelTranslation = [guiParams.modelTransX, guiParams.modelTransY, guiParams.modelTransZ] as [number, number, number];
            const modelScale = [guiParams.modelScaleX, guiParams.modelScaleY, guiParams.modelScaleZ] as [number, number, number];
            let transform = new TRSTransform(modelTranslation, modelScale);
            mat4.invert(modelViewMatrix, scene.camera.matrixWorld.elements as unknown as [
                number, number, number, number,
                number, number, number, number,
                number, number, number, number,
                number, number, number, number
            ]);
            mat4.translate(modelViewMatrix, modelViewMatrix, transform.translate);
            mat4.scale(modelViewMatrix, modelViewMatrix, transform.scale);

            mat4.copy(projectionMatrix, scene.camera.projectionMatrix.elements as unknown as [
                number, number, number, number,
                number, number, number, number,
                number, number, number, number,
                number, number, number, number
            ]);
            if (entity.mesh.vertexBuffer) {
                const numComponents = 3;
                const type = gl.FLOAT;
                const normalize = false;
                const stride = 0;
                const offset = 0;
                gl.bindBuffer(gl.ARRAY_BUFFER, entity.mesh.vertexBuffer);
                gl.vertexAttribPointer(
                    this.program.attribs[scene.entities[i].mesh.verticesName],
                    numComponents,
                    type,
                    normalize,
                    stride,
                    offset);
                gl.enableVertexAttribArray(
                    this.program.attribs[scene.entities[i].mesh.verticesName]);
            }


            if (entity.mesh.normalBuffer) {
                const numComponents = 3;
                const type = gl.FLOAT;
                const normalize = false;
                const stride = 0;
                const offset = 0;
                gl.bindBuffer(gl.ARRAY_BUFFER, entity.mesh.normalBuffer);
                gl.vertexAttribPointer(
                    this.program.attribs[scene.entities[i].mesh.normalsName],
                    numComponents,
                    type,
                    normalize,
                    stride,
                    offset);
                gl.enableVertexAttribArray(
                    this.program.attribs[scene.entities[i].mesh.normalsName]);
            }

            if (entity.mesh.texcoordBuffer) {
                const numComponents = 2;
                const type = gl.FLOAT;
                const normalize = false;
                const stride = 0;
                const offset = 0;
                gl.bindBuffer(gl.ARRAY_BUFFER, entity.mesh.normalBuffer);
                gl.vertexAttribPointer(
                    this.program.attribs[scene.entities[i].mesh.texcoordsName],
                    numComponents,
                    type,
                    normalize,
                    stride,
                    offset);
                gl.enableVertexAttribArray(
                    this.program.attribs[scene.entities[i].mesh.texcoordsName]);
            }

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, entity.mesh.indicesBuffer);

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
                [scene.camera.position.x, scene.camera.position.y, scene.camera.position.z]);

            for (let k in scene.entities[i].material.uniforms) {
                if (scene.entities[i].material.uniforms[k].type == 'matrix4fv') {
                    gl.uniformMatrix4fv(
                        this.program.uniforms[k],
                        false,
                        scene.entities[i].material.uniforms[k].value);
                } else if (scene.entities[i].material.uniforms[k].type == '3fv') {
                    gl.uniform3fv(
                        this.program.uniforms[k],
                        scene.entities[i].material.uniforms[k].value);
                } else if (scene.entities[i].material.uniforms[k].type == '1f') {
                    gl.uniform1f(
                        this.program.uniforms[k],
                        scene.entities[i].material.uniforms[k].value);
                } else if (scene.entities[i].material.uniforms[k].type == '1i') {
                    gl.uniform1i(
                        this.program.uniforms[k],
                        scene.entities[i].material.uniforms[k].value);
                } else if (scene.entities[i].material.uniforms[k].type == 'texture') {
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, entity.material.textures[0]);
                    gl.uniform1i(this.program.uniforms[k], 0);
                }
            }

            {
                const vertexCount = scene.entities[i].mesh.count;
                const type = gl.UNSIGNED_SHORT;
                const offset = 0;
                gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
            }
        }

    }
}
