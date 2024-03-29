import { Material } from "./Material";
import { Mesh } from "./Mesh";
import { Matrix, Vector } from "./math/Matrix";

export class RenderObject {
    public entities:Entity[]=[]
}

export class Entity {
    public mesh: Mesh
    public material: Material
    public transform:Matrix
    constructor(mesh: Mesh, material: Material) {
        this.mesh = mesh
        this.material = material
        this.transform=Matrix.make_identity();
    }
}

export class PointLight extends Entity{
    focalPoint:Vector
    lightUp:Vector
    lightPos:Vector
}