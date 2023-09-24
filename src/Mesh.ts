import { Material } from "./Material";
import { Geometry } from "./Geometry";

export class Mesh{
    public geometry:Geometry
    public material:Material
    constructor(geometry:Geometry,material:Material){
        this.geometry=geometry
        this.material=material
    }
}