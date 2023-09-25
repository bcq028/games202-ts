import { mat4 } from "gl-matrix"
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

export interface ShaderContext {
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

export function getShaderContext(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string, shaderLocations: {
    uniforms: string[],
    attribs: string[]
}): ShaderContext {
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
    function addShaderLocations(result: ShaderContext, shaderLocations: {
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

export class CameraRenderPass {
    uniforms: Record<string, WebGLUniformLocation> = {}
    attribs: Record<string, number> = {}
    constructor(private gl: WebGLRenderingContext) {

    }

    setShaderLocations(shaderProgram: WebGLProgram, uniforms: string[], attribs: string[]) {
        if (uniforms.length) {
            for (let i = 0; i < uniforms.length; ++i) {
                Object.assign(this.uniforms, {
                    [uniforms[i]]: this.gl.getUniformLocation(shaderProgram, uniforms[i]),
                });
            }
        }
        if (attribs.length) {
            for (let i = 0; i < attribs.length; ++i) {
                Object.assign(this.attribs, {
                    [attribs[i]]: this.gl.getAttribLocation(shaderProgram, attribs[i]),
                });
            }
        }
    }

    draw_forward(scene: Scene, guiParams: GUIParams, lightPos: [number,number,number]) {

        let modelViewMatrix = mat4.create();
        let projectionMatrix = mat4.create();
        const modelTranslation = [guiParams.modelTransX, guiParams.modelTransY, guiParams.modelTransZ] as [number, number, number];
        const modelScale = [guiParams.modelScaleX, guiParams.modelScaleY, guiParams.modelScaleZ] as [number, number, number];
        let transform = new TRSTransform(modelTranslation, modelScale);
        mat4.invert(modelViewMatrix, scene.camera.matrixWorld.elements as unknown as [
            number, number, number, number,
            number, number, number, number,
            number, number, number, number,
            number, number, number, number
        ]);
        let dynamicLightMatrix=structuredClone(modelViewMatrix);
        mat4.translate(dynamicLightMatrix,dynamicLightMatrix,lightPos);

        mat4.translate(modelViewMatrix, modelViewMatrix, transform.translate);
        mat4.scale(modelViewMatrix, modelViewMatrix, transform.scale);

        let scaledMatrix=structuredClone(modelViewMatrix);
        let t=structuredClone(transform.scale);
        for(let i=0;i<t.length;++i){
            t[i]=1/t[i];
        }
        mat4.scale(modelViewMatrix, scaledMatrix, t);
        mat4.copy(projectionMatrix, scene.camera.projectionMatrix.elements as unknown as [
            number, number, number, number,
            number, number, number, number,
            number, number, number, number,
            number, number, number, number
        ]);

        scene.camera.updateMatrixWorld();
        for (let [material, meshes] of scene.rhiBatchedEntities) {
            if('intensity' in scene.RhiMaterial2Material.get(material)){
                modelViewMatrix=dynamicLightMatrix;
            }else{
                modelViewMatrix=scaledMatrix;
            }
            this.setShaderLocations(material.shaderProgram, scene.RhiMaterial2Material.get(material).uniform_keys, scene.RhiMaterial2Material.get(material).attibute_keys);
            this.gl.useProgram(material.shaderProgram);
            if (lightPos) {
                this.gl.uniform3fv(this.uniforms.uLightPos, lightPos);
            }
            for (let k in scene.RhiMaterial2Material.get(material).uniforms) {
                if (scene.RhiMaterial2Material.get(material).uniforms[k].type == 'matrix4fv') {
                    this.gl.uniformMatrix4fv(
                        this.uniforms[k],
                        false,
                        scene.RhiMaterial2Material.get(material).uniforms[k].value);
                } else if (scene.RhiMaterial2Material.get(material).uniforms[k].type == '3fv') {
                    this.gl.uniform3fv(
                        this.uniforms[k],
                        scene.RhiMaterial2Material.get(material).uniforms[k].value);
                } else if (scene.RhiMaterial2Material.get(material).uniforms[k].type == '1f') {
                    this.gl.uniform1f(
                        this.uniforms[k],
                        scene.RhiMaterial2Material.get(material).uniforms[k].value);
                } else if (scene.RhiMaterial2Material.get(material).uniforms[k].type == '1i') {
                    this.gl.uniform1i(
                        this.uniforms[k],
                        scene.RhiMaterial2Material.get(material).uniforms[k].value);
                } else if (scene.RhiMaterial2Material.get(material).uniforms[k].type == 'texture') {
                    this.gl.activeTexture(this.gl.TEXTURE0);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, createTexture(this.gl, scene.RhiMaterial2Material.get(material).uniforms[k].value));
                    this.gl.uniform1i(this.uniforms[k], 0);
                }
            }
            for (let mesh of meshes) {
                if (mesh.vertexBuffer) {
                    const numComponents = 3;
                    const type = this.gl.FLOAT;
                    const normalize = false;
                    const stride = 0;
                    const offset = 0;
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.vertexBuffer);
                    this.gl.vertexAttribPointer(
                        this.attribs[scene.RhiMesh2Mesh.get(mesh).verticesName],
                        numComponents,
                        type,
                        normalize,
                        stride,
                        offset);
                    this.gl.enableVertexAttribArray(
                        this.attribs[scene.RhiMesh2Mesh.get(mesh).verticesName]);
                }
                if (mesh.normalBuffer) {
                    const numComponents = 3;
                    const type = this.gl.FLOAT;
                    const normalize = false;
                    const stride = 0;
                    const offset = 0;
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.normalBuffer);
                    this.gl.vertexAttribPointer(
                        this.attribs[scene.RhiMesh2Mesh.get(mesh).normalsName],
                        numComponents,
                        type,
                        normalize,
                        stride,
                        offset);
                    this.gl.enableVertexAttribArray(
                        this.attribs[scene.RhiMesh2Mesh.get(mesh).normalsName]);
                }
                if (mesh.texcoordBuffer) {
                    const numComponents = 2;
                    const type = this.gl.FLOAT;
                    const normalize = false;
                    const stride = 0;
                    const offset = 0;
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.texcoordBuffer);
                    this.gl.vertexAttribPointer(
                        this.attribs[scene.RhiMesh2Mesh.get(mesh).texcoordsName],
                        numComponents,
                        type,
                        normalize,
                        stride,
                        offset);
                    this.gl.enableVertexAttribArray(
                        this.attribs[scene.RhiMesh2Mesh.get(mesh).texcoordsName]);
                }
                this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indicesBuffer);
                this.gl.uniformMatrix4fv(
                    this.uniforms.uProjectionMatrix,
                    false,
                    projectionMatrix);
                this.gl.uniformMatrix4fv(
                    this.uniforms.uModelViewMatrix,
                    false,
                    modelViewMatrix);

                this.gl.uniform3fv(
                    this.uniforms.uCameraPos,
                    [scene.camera.position.x, scene.camera.position.y, scene.camera.position.z]);
                const vertexCount = scene.RhiMesh2Mesh.get(mesh).count;
                const type = this.gl.UNSIGNED_SHORT;
                const offset = 0;
                this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
            }
        }
    }
}
