import { Camera } from "three";
import { Mesh } from "./Mesh";

export class Scene{
    public meshes:Mesh[]=[]
    public lights:Mesh[]=[]
    public camera:Camera
    public addMesh(mesh:Mesh){
        this.meshes.push(mesh)
    }
    public addLight(light:Mesh){
        this.lights.push(light)
    }
}
