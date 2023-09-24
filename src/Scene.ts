import * as THREE from 'three'
import { Entity } from "./Entity";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RHIEntity, createWebGLMaterial, createWebGLMesh } from './RHIData';

const cameraPosition = [-20, 180, 250];

export class Scene {
    public entities: Entity[] = []
    public lights: Entity[] = []
    public rhiEntities: RHIEntity[] = []
    public camera: THREE.Camera
    public cameraControls: OrbitControls
    private gl: WebGLRenderingContext
    constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
        this.gl = gl
        const { camera, cameraControls } = this.camera_init(canvas)
        this.camera = camera;
        this.cameraControls = cameraControls
    }


    public addEntity(entity: Entity) {
        this.entities.push(entity)
        this.rhiEntities.push({ mesh: createWebGLMesh(this.gl, entity.mesh), material: createWebGLMaterial(this.gl, entity.material) })
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
