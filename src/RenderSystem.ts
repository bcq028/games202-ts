import { Matrix } from "./math/Matrix";

export interface GameObjectDesc {
    object_parts:GameObjectPartDesc[]
}

export interface GameObjectMeshDesc {
    mesh_file:string
}

export interface GameObjectMaterialDesc {
    base_color_texture_file?:string;
    metallic_roughness_texture_file?:string;
    normal_texture_file?:string;
    occlusion_texture_file?:string;
}

export interface GameObjectTransformDesc {
    transform_matrix:Matrix;
}

export interface GameObjectPartDesc {
    mesh_desc:GameObjectMeshDesc;
    material_desc:GameObjectMaterialDesc;
    transform_desc:GameObjectTransformDesc;
}

export interface RenderEntity {
    model_matrix:Matrix;
    mesh_asset_id:number;
    material_asset_id:number;
}

export interface RenderMeshData {
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
}

export interface MaterialData {
    base_color_texture:ImageData
}

export interface RHIMesh {
    vertexBuffer?: WebGLBuffer
    normalBuffer?: WebGLBuffer
    texcoordBuffer?: WebGLBuffer
    indicesBuffer: WebGLBuffer
}

export interface RHIMaterial {
    base_color_texture:WebGLTexture
    // program with shader linked
    shaderProgram: WebGLProgram
}


export class RenderResource {
    device_meshes:Map<number,RHIMesh> =new Map();
    device_materials:Map<number,RHIMaterial>=new Map();
}