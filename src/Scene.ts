import * as THREE from 'three'
import { Entity, PointLight } from "./Entity";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RHIFrameBuffer, RHIMaterial, RHIMesh, createFBO, createWebGLMaterial, createWebGLMesh } from './RHIData';
import { Material } from './Material';
import { Mesh } from './Mesh';
import { Matrix } from './math/Matrix';

const cameraPosition = [-20, 180, 250];


export interface PhongStorageBufferObject {
    uModelMatrix: { type: 'matrix4fv', value: any },
    uViewMatrix: { type: 'matrix4fv', value: any },
    uCameraPos: { type: '3fv', value: any },
    uLightPos: { type: '3fv', value: any },
    uProjectionMatrix: { type: 'matrix4fv', value: any },
    uTextureSample: { type: '1i', value: any },
    uSampler: { type: 'texture', value: any },
    uKd: { type: '3fv', value: any },
    uKs: { type: '3fv', value: any },
    uLightIntensity: { type: '1f', value: any }
}

export interface ShadowStorageBufferObject {
    uLightMVP: { type: 'matrix4fv', value: number[] },
    uShadowMap: { type: 'texture', value: WebGLTexture }
}

export class RenderResource {
    rhiMeshes: Map<Entity, RHIMesh> = new Map()
    rhiMaterials: Map<Entity, RHIMaterial> = new Map()
    phongStorageBufferObject: PhongStorageBufferObject
    shadowStorageBufferObject: ShadowStorageBufferObject
    constructor() {
        this.phongStorageBufferObject = {
            uModelMatrix: { type: 'matrix4fv', value: undefined },
            uViewMatrix: { type: 'matrix4fv', value: undefined },
            uCameraPos: { type: '3fv', value: undefined },
            uLightPos: { type: '3fv', value: undefined },
            uProjectionMatrix: { type: 'matrix4fv', value: undefined },
            uTextureSample: { type: '1i', value: undefined },
            uSampler: { type: 'texture', value: undefined },
            uKd: { type: '3fv', value: undefined },
            uKs: { type: '3fv', value: undefined },
            uLightIntensity: { type: '1f', value: undefined }
        }
        this.shadowStorageBufferObject = {
            uLightMVP: { type: 'matrix4fv', value: undefined },
            uShadowMap: { type: 'texture', value: undefined }
        }
    }
    updatePerFrameBuffer(scene:Scene){
        this.shadowStorageBufferObject.uLightMVP.value=Matrix.makePerspectiveByFov(0.1,10,90,1).elements;
        this.shadowStorageBufferObject.uShadowMap.value=scene.lightFboMap.get(scene.lights[0]).texture;
    }
}

export const renderResource = new RenderResource()

export class Scene {
    public entities: Entity[] = [];
    public lights: PointLight[] = []
    public rhiBatchedEntities: Map<RHIMaterial, RHIMesh[]> = new Map();
    public RhiMaterial2Material: Map<RHIMaterial, Material> = new Map();
    public RhiMesh2Mesh: Map<RHIMesh, Mesh> = new Map();
    public RhiMesh2Entity: Map<RHIMesh, Entity> = new Map();
    public lightFboMap: Map<Entity, RHIFrameBuffer> = new Map();
    public camera: THREE.Camera
    public cameraControls: OrbitControls
    private gl: WebGLRenderingContext
    constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
        this.gl = gl
        const { camera, cameraControls } = this.camera_init(canvas)
        this.camera = camera;
        this.cameraControls = cameraControls;
    }


    public addEntity(entity: Entity) {
        this.entities.push(entity);
        const rhiMesh = createWebGLMesh(this.gl, entity.mesh);
        const rhiMaterial = createWebGLMaterial(this.gl, entity.material);
        renderResource.rhiMeshes.set(entity, rhiMesh);
        renderResource.rhiMaterials.set(entity, rhiMaterial);
        this.RhiMaterial2Material.set(rhiMaterial, entity.material);
        this.RhiMesh2Mesh.set(rhiMesh, entity.mesh);
        this.RhiMesh2Entity.set(rhiMesh, entity);
        let entry = this.rhiBatchedEntities.get(rhiMaterial) || [];
        entry.push(rhiMesh);
        this.rhiBatchedEntities.set(rhiMaterial, entry);
    }
    public addLight(light: PointLight) {
        this.lights.push(light);
        this.addEntity(light);
        this.lightFboMap.set(light, createFBO(this.gl));
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
