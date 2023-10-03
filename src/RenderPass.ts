import { mat4 } from "gl-matrix"
import { Scene, renderResource } from "./Scene"
import { RHIMaterial, RHIMesh, set_shader } from "./RHIData";
import { shadowFragmentShader, shadowVertexShader } from "./loader";

export function reset_gl(gl: WebGLRenderingContext) {

    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}


export class CameraRenderPass {
    uniformLocation: Record<string, WebGLUniformLocation> = {}
    attributeLayout: Record<string, number> = {}
    constructor(private gl: WebGLRenderingContext) {

    }

    setShaderLocations(shaderProgram: WebGLProgram, uniforms: string[], attribs: string[]) {
        if (uniforms.length) {
            for (let i = 0; i < uniforms.length; ++i) {
                Object.assign(this.uniformLocation, {
                    [uniforms[i]]: this.gl.getUniformLocation(shaderProgram, uniforms[i]),
                });
            }
        }
        if (attribs.length) {
            for (let i = 0; i < attribs.length; ++i) {
                Object.assign(this.attributeLayout, {
                    [attribs[i]]: this.gl.getAttribLocation(shaderProgram, attribs[i]),
                });
            }
        }
    }

    draw_forward(scene: Scene, lightPos: [number, number, number]) {

        //TODO:clarify how to reorganize these swap data
        this.gl.viewport(0.0, 0.0, window.screen.width, window.screen.height);
        scene.camera.updateMatrixWorld();
        let ModelMatrix = mat4.create();
        let ViewMatrix = mat4.create();
        let projectionMatrix = mat4.create();
        mat4.invert(ViewMatrix, scene.camera.matrixWorld.elements as [
            number, number, number, number,
            number, number, number, number,
            number, number, number, number,
            number, number, number, number
        ]);
        let dynamicLightMatrix = structuredClone(ModelMatrix);
        mat4.translate(dynamicLightMatrix, dynamicLightMatrix, lightPos);
        let scaledMatrix = structuredClone(ModelMatrix);

        mat4.copy(projectionMatrix, scene.camera.projectionMatrix.elements as unknown as [
            number, number, number, number,
            number, number, number, number,
            number, number, number, number,
            number, number, number, number
        ]);

        const main_camera_mesh_drawcall_batch = new Map<RHIMaterial, RHIMesh[]>();

        for (let entity of scene.entities) {
            const temp = main_camera_mesh_drawcall_batch.get(renderResource.rhiMaterials.get(entity)) || [];
            temp.push(renderResource.rhiMeshes.get(entity));
            main_camera_mesh_drawcall_batch.set(renderResource.rhiMaterials.get(entity), temp);
        }

        for (let [material, meshes] of main_camera_mesh_drawcall_batch) {
            if ('intensity' in scene.RhiMaterial2Material.get(material)) {
                ModelMatrix = dynamicLightMatrix;
            } else {
                ModelMatrix = scaledMatrix;
            }
            this.setShaderLocations(material.shaderProgram, [...Object.keys(scene.RhiMaterial2Material.get(material).uniforms), ...Object.keys(renderResource.shadowStorageBufferObject)], Object.keys(scene.RhiMesh2Mesh.get(meshes[0]).attribs));
            this.gl.useProgram(material.shaderProgram);

            //TODO: consider use phongStorageBufferObject
            for (let shadowUniform in renderResource.shadowStorageBufferObject) {
                if (renderResource.shadowStorageBufferObject[shadowUniform].type == 'matrix4fv') {
                    this.gl.uniformMatrix4fv(this.uniformLocation[shadowUniform], false, renderResource.shadowStorageBufferObject.uLightMVP.value);
                } else if (renderResource.shadowStorageBufferObject[shadowUniform].type == 'texture') {
                    this.gl.activeTexture(this.gl.TEXTURE0);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, renderResource.shadowStorageBufferObject.uShadowMap.value);
                    this.gl.uniform1i(this.uniformLocation[shadowUniform], 0);
                }
            }

            scene.RhiMaterial2Material.get(material).uniforms['uProjectionMatrix'].value = projectionMatrix;
            scene.RhiMaterial2Material.get(material).uniforms['uViewMatrix'].value = ViewMatrix;
            scene.RhiMaterial2Material.get(material).uniforms['uCameraPos'].value = [scene.camera.position.x, scene.camera.position.y, scene.camera.position.z];
            scene.RhiMaterial2Material.get(material).uniforms['uLightPos'].value = lightPos;
            for (let mesh of meshes) {
                scene.RhiMaterial2Material.get(material).uniforms['uModelMatrix'].value = scene.RhiMesh2Entity.get(mesh).transform.elements;
                for (let k in scene.RhiMaterial2Material.get(material).uniforms) {
                    if (scene.RhiMaterial2Material.get(material).uniforms[k].type == 'matrix4fv') {
                        this.gl.uniformMatrix4fv(
                            this.uniformLocation[k],
                            false,
                            scene.RhiMaterial2Material.get(material).uniforms[k].value);
                    } else if (scene.RhiMaterial2Material.get(material).uniforms[k].type == '3fv') {
                        this.gl.uniform3fv(
                            this.uniformLocation[k],
                            scene.RhiMaterial2Material.get(material).uniforms[k].value);
                    } else if (scene.RhiMaterial2Material.get(material).uniforms[k].type == '1f') {
                        this.gl.uniform1f(
                            this.uniformLocation[k],
                            scene.RhiMaterial2Material.get(material).uniforms[k].value);
                    } else if (scene.RhiMaterial2Material.get(material).uniforms[k].type == '1i') {
                        this.gl.uniform1i(
                            this.uniformLocation[k],
                            scene.RhiMaterial2Material.get(material).uniforms[k].value);
                    } else if (scene.RhiMaterial2Material.get(material).uniforms[k].type == 'texture') {
                        this.gl.activeTexture(this.gl.TEXTURE0);
                        this.gl.bindTexture(this.gl.TEXTURE_2D, material.textures[0]);
                        this.gl.uniform1i(this.uniformLocation[k], 0);
                    }
                }
                if (mesh.vertexBuffer) {
                    const numComponents = 3;
                    const type = this.gl.FLOAT;
                    const normalize = false;
                    const stride = 0;
                    const offset = 0;
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.vertexBuffer);
                    this.gl.vertexAttribPointer(
                        this.attributeLayout[scene.RhiMesh2Mesh.get(mesh).verticesName],
                        numComponents,
                        type,
                        normalize,
                        stride,
                        offset);
                    this.gl.enableVertexAttribArray(
                        this.attributeLayout[scene.RhiMesh2Mesh.get(mesh).verticesName]);
                }
                if (mesh.normalBuffer) {
                    const numComponents = 3;
                    const type = this.gl.FLOAT;
                    const normalize = false;
                    const stride = 0;
                    const offset = 0;
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.normalBuffer);
                    this.gl.vertexAttribPointer(
                        this.attributeLayout[scene.RhiMesh2Mesh.get(mesh).normalsName],
                        numComponents,
                        type,
                        normalize,
                        stride,
                        offset);
                    this.gl.enableVertexAttribArray(
                        this.attributeLayout[scene.RhiMesh2Mesh.get(mesh).normalsName]);
                }
                if (mesh.texcoordBuffer) {
                    const numComponents = 2;
                    const type = this.gl.FLOAT;
                    const normalize = false;
                    const stride = 0;
                    const offset = 0;
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.texcoordBuffer);
                    this.gl.vertexAttribPointer(
                        this.attributeLayout[scene.RhiMesh2Mesh.get(mesh).texcoordsName],
                        numComponents,
                        type,
                        normalize,
                        stride,
                        offset);
                    this.gl.enableVertexAttribArray(
                        this.attributeLayout[scene.RhiMesh2Mesh.get(mesh).texcoordsName]);
                }
                this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indicesBuffer);
                const vertexCount = scene.RhiMesh2Mesh.get(mesh).count;
                const type = this.gl.UNSIGNED_SHORT;
                const offset = 0;
                this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
            }
        }
    }
}

export class ShadowRenderPass {
    uniformLocation: Record<string, WebGLUniformLocation> = {}
    attributeLayout: Record<string, number> = {}
    constructor(private gl: WebGLRenderingContext) {
    }

    setup() {
        const vertexShader = shadowVertexShader
        const fragmentShader = shadowFragmentShader
        set_shader(this.gl, vertexShader, fragmentShader);
    }

    setShaderLocations(shaderProgram: WebGLProgram, uniforms: string[], attribs: string[]) {
        if (uniforms.length) {
            for (let i = 0; i < uniforms.length; ++i) {
                Object.assign(this.uniformLocation, {
                    [uniforms[i]]: this.gl.getUniformLocation(shaderProgram, uniforms[i]),
                });
            }
        }
        if (attribs.length) {
            for (let i = 0; i < attribs.length; ++i) {
                Object.assign(this.attributeLayout, {
                    [attribs[i]]: this.gl.getAttribLocation(shaderProgram, attribs[i]),
                });
            }
        }
    }

    draw_forward(scene: Scene, lightPos: [number, number, number]) {
        let textureNum = 0;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, scene.lightFboMap.get(scene.lights[0]).frameBuffer)
        const resolution = 2048;
        this.gl.viewport(0.0, 0.0, resolution, resolution);
        //TODO:clarify how to reorganize these swap data
        scene.camera.updateMatrixWorld();
        let ModelMatrix = mat4.create();
        let ViewMatrix = mat4.create();
        let projectionMatrix = mat4.create();
        mat4.invert(ViewMatrix, scene.camera.matrixWorld.elements as [
            number, number, number, number,
            number, number, number, number,
            number, number, number, number,
            number, number, number, number
        ]);
        let dynamicLightMatrix = structuredClone(ModelMatrix);
        mat4.translate(dynamicLightMatrix, dynamicLightMatrix, lightPos);
        let scaledMatrix = structuredClone(ModelMatrix);

        mat4.copy(projectionMatrix, scene.camera.projectionMatrix.elements as unknown as [
            number, number, number, number,
            number, number, number, number,
            number, number, number, number,
            number, number, number, number
        ]);

        const main_camera_mesh_drawcall_batch = new Map<RHIMaterial, RHIMesh[]>();

        for (let entity of scene.entities) {
            const temp = main_camera_mesh_drawcall_batch.get(renderResource.rhiMaterials.get(entity)) || [];
            temp.push(renderResource.rhiMeshes.get(entity));
            main_camera_mesh_drawcall_batch.set(renderResource.rhiMaterials.get(entity), temp);
        }

        for (let [material, meshes] of main_camera_mesh_drawcall_batch) {
            if ('intensity' in scene.RhiMaterial2Material.get(material)) {
                ModelMatrix = dynamicLightMatrix;
            } else {
                ModelMatrix = scaledMatrix;
            }
            this.setShaderLocations(material.shaderProgram, [...Object.keys(scene.RhiMaterial2Material.get(material).uniforms), ...Object.keys(renderResource.shadowStorageBufferObject)], Object.keys(scene.RhiMesh2Mesh.get(meshes[0]).attribs));
            this.gl.useProgram(material.shaderProgram);

            //TODO: consider use phongStorageBufferObject
            for (let shadowUniform in renderResource.shadowStorageBufferObject) {
                if (renderResource.shadowStorageBufferObject[shadowUniform].type == 'matrix4fv') {
                    this.gl.uniformMatrix4fv(this.uniformLocation[shadowUniform], false, renderResource.shadowStorageBufferObject.uLightMVP.value);
                } else if (renderResource.shadowStorageBufferObject[shadowUniform].type == 'texture') {
                    this.gl.activeTexture(this.gl.TEXTURE0 + textureNum);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, renderResource.shadowStorageBufferObject.uShadowMap.value);
                    this.gl.uniform1i(this.uniformLocation[shadowUniform], textureNum);
                    textureNum += 1;
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
                        this.attributeLayout[scene.RhiMesh2Mesh.get(mesh).verticesName],
                        numComponents,
                        type,
                        normalize,
                        stride,
                        offset);
                    this.gl.enableVertexAttribArray(
                        this.attributeLayout[scene.RhiMesh2Mesh.get(mesh).verticesName]);
                }
                if (mesh.normalBuffer) {
                    const numComponents = 3;
                    const type = this.gl.FLOAT;
                    const normalize = false;
                    const stride = 0;
                    const offset = 0;
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.normalBuffer);
                    this.gl.vertexAttribPointer(
                        this.attributeLayout[scene.RhiMesh2Mesh.get(mesh).normalsName],
                        numComponents,
                        type,
                        normalize,
                        stride,
                        offset);
                    this.gl.enableVertexAttribArray(
                        this.attributeLayout[scene.RhiMesh2Mesh.get(mesh).normalsName]);
                }
                if (mesh.texcoordBuffer) {
                    const numComponents = 2;
                    const type = this.gl.FLOAT;
                    const normalize = false;
                    const stride = 0;
                    const offset = 0;
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.texcoordBuffer);
                    this.gl.vertexAttribPointer(
                        this.attributeLayout[scene.RhiMesh2Mesh.get(mesh).texcoordsName],
                        numComponents,
                        type,
                        normalize,
                        stride,
                        offset);
                    this.gl.enableVertexAttribArray(
                        this.attributeLayout[scene.RhiMesh2Mesh.get(mesh).texcoordsName]);
                }
                this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indicesBuffer);
                const vertexCount = scene.RhiMesh2Mesh.get(mesh).count;
                const type = this.gl.UNSIGNED_SHORT;
                const offset = 0;
                this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
            }
        }
    }
}


