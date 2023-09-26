import * as THREE from 'three'
import { Entity } from "./Entity";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RHIMaterial, RHIMesh, createWebGLMaterial, createWebGLMesh } from './RHIData';
import { Material } from './Material';
import { Mesh } from './Mesh';

const cameraPosition = [-20, 180, 250];

export class Scene {
    public entities: Entity[] = []
    public lights: Entity[] = []
    public rhiBatchedEntities: Map<RHIMaterial, RHIMesh[]> = new Map();
    public RhiMaterial2Material: Map<RHIMaterial, Material> = new Map();
    public RhiMesh2Mesh: Map<RHIMesh, Mesh> = new Map();
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
        this.entities.push(entity);
        const rhiMesh = createWebGLMesh(this.gl, entity.mesh);
        const rhiMaterial = createWebGLMaterial(this.gl, entity.material);
        this.RhiMaterial2Material.set(rhiMaterial, entity.material);
        this.RhiMesh2Mesh.set(rhiMesh, entity.mesh);
        let entry = this.rhiBatchedEntities.get(rhiMaterial) || [];
        entry.push(rhiMesh);
        this.rhiBatchedEntities.set(rhiMaterial, entry);
    }
    public addLight(light: Entity) {
        this.lights.push(light);
        this.addEntity(light);
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
