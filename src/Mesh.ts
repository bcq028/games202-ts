export class Mesh {
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
    attribs: {[key: string]: Float32Array }={}
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
            this.attribs[this.verticesName]=this.vertices
        }
        if (normalsAttrib != null) {
            this.hasNormals = true;
            this.normals = normalsAttrib.array;
            this.normalsName = normalsAttrib.name;
            this.attribs[this.normalsName]=this.normals
        }
        if (texcoordsAttrib != null) {
            this.hasTexcoords = true;
            this.texcoords = texcoordsAttrib.array;
            this.texcoordsName = texcoordsAttrib.name;
            this.attribs[this.texcoordsName]=this.texcoords
        }
    }
}

export function cube() {
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