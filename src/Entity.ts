import { Material } from "./Material";
import { Mesh } from "./Mesh";

export class Entity {
    public mesh: Mesh
    public material: Material
    constructor(geometry: Mesh, material: Material) {
        this.mesh = geometry
        this.material = material
    }
}