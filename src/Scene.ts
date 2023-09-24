import * as THREE from 'three'
import { Entity } from "./Entity";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RHIMaterial, RHIMesh, createWebGLMaterial, createWebGLMesh } from './RHIData';

const cameraPosition = [-20, 180, 250];

export class Scene {
    public meshes: Entity[] = []
    public lights: Entity[] = []
    public rhi_meshes:RHIMesh[]=[]
    public rhi_materials:RHIMaterial[]=[]
    public camera: THREE.Camera
    public cameraControls:OrbitControls
    private gl:WebGLRenderingContext
    constructor(canvas:HTMLCanvasElement,gl: WebGLRenderingContext) {
        this.gl=gl
        const { camera, cameraControls } = this.camera_init(canvas)
        this.camera = camera;
        this.cameraControls=cameraControls
    }


    public addEntity(entity: Entity) {
        this.meshes.push(entity)
        this.rhi_meshes.push(createWebGLMesh(this.gl,entity.mesh))
        this.rhi_materials.push(createWebGLMaterial(this.gl,entity.material))
    }
    public addLight(light: Entity) {
        this.lights.push(light)
    }

    public camera_init(canvas: HTMLCanvasElement) {
        const camera = new THREE.PerspectiveCamera(75, (canvas as HTMLCanvasElement).clientWidth / (canvas as HTMLCanvasElement).clientHeight);
        camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);

        const cameraControls = new OrbitControls(camera, canvas);
        cameraControls.enableZoom = true;
        cameraControls.enableRotate = true;
        cameraControls.enablePan = true;
        cameraControls.rotateSpeed = 0.3;
        cameraControls.zoomSpeed = 1.0;
        cameraControls.panSpeed = 2.0;
        cameraControls.target.set(0, 1, 0);
        const setSize = (width: number, height: number) => {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
        setSize(canvas.clientWidth, canvas.clientHeight);
        window.addEventListener('resize', () => setSize(canvas.clientWidth, canvas.clientHeight));
        return { camera, cameraControls };
    }
}
