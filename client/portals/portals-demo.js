import {
    AmbientLight, AxesHelper, BoxGeometry, Camera, CameraHelper, Color,
    DirectionalLight, DirectionalLightHelper, Euler, Fog, Matrix4, Mesh,
    MeshBasicMaterial,
    MeshLambertMaterial, Object3D, PerspectiveCamera, PlaneGeometry, Scene, Vector3, Vector4,
} from 'three';
import MathUtils from './math/utils';
import FPSControls from './fps-controls';
import Game from './game';
import GameObject from './game-object';

export default class PortalsDemo extends GameObject {
    static get COLORS() {
        const colors = {
            default: new Color('rgb(255, 255, 255)'),
            sky: new Color('rgb(132, 205, 255)'),
            bluePortal: new Color('#8ac8ff'),
            orangePortal: new Color('#f7cc54'),
            grass: new Color('rgb(140, 177, 112)'),
            redish: new Color('rgb(156, 111, 87)'),
        };

        return colors;
    }

    scene;
    camera;

    constructor() {
        super();

        this.initScene();
        this.initCamera();
        this.environment();
    }

    initScene() {
        this.scene = new Scene();
    }

    initCamera() {
        this.camera = new PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 500);

        this.fpsControls = new FPSControls({
            camera: this.camera,
            position: new Vector3(0, 1, 0),
        });
    }

    environment() {
        Game.renderer.setClearColor(PortalsDemo.COLORS.sky);
        Game.renderer.autoClear = false;

        this.scene.fog = new Fog(PortalsDemo.COLORS.sky, this.camera.near, this.camera.far);

        const dirLight = new DirectionalLight(PortalsDemo.COLORS.default, 1);
        dirLight.position.set(0, 7, 10);

        const ambientLight = new AmbientLight(PortalsDemo.COLORS.sky, 0.5);

        // Axes, Arrows and other debug stuff
        const axes = new AxesHelper(10);
        axes.renderOrder = 999;
        axes.material.depthTest = false;

        const lightDir = new DirectionalLightHelper(dirLight);

        this.scene.add(dirLight, ambientLight);
        this.scene.add(axes, lightDir);

        // Adding virtual cameras
        this.virtualCameraDP = this.camera.clone();
        this.virtualCameraDP.matrixAutoUpdate = false;
        this.virtualCameraDPHelper = new CameraHelper(this.virtualCameraDP);
        this.virtualCameraDPHelper.matrixAutoUpdate = false;
        this.virtualCameraDPHelper.renderOrder = 800;
        this.virtualCameraDPHelper.material.depthTest = false;

        this.scene.add(this.virtualCameraDPHelper);

        this.virtualCameraSP = this.camera.clone();
        this.virtualCameraSP.matrixAutoUpdate = false;
        this.virtualCameraSPHelper = new CameraHelper(this.virtualCameraSP);
        this.virtualCameraSPHelper.matrixAutoUpdate = false;
        this.virtualCameraSPHelper.renderOrder = 800;
        this.virtualCameraSPHelper.material.depthTest = false;

        this.scene.add(this.virtualCameraSPHelper);

        // Adding some environment
        this.plane = new Mesh(
            new PlaneGeometry(1000, 1000),
            new MeshLambertMaterial({ color: PortalsDemo.COLORS.grass }),
        );
        this.plane.position.set(0, 0, 0);
        this.plane.rotation.set(-Math.PI * 0.5, 0, 0);

        this.box = new Mesh(
            new BoxGeometry(1, 1, 1),
            new MeshLambertMaterial({ color: PortalsDemo.COLORS.redish }),
        );
        this.box.position.set(2, 0.5, -2);
        // this.box.matrixAutoUpdate = false;

        this.wall1 = new Mesh(
            new BoxGeometry(200, 30, 2),
            new MeshLambertMaterial({ color: PortalsDemo.COLORS.redish }),
        );
        this.wall1.position.set(0, 15, -7.55);

        this.sourcePortal = new Mesh(
            new PlaneGeometry(1, 2),
            new MeshBasicMaterial({ color: PortalsDemo.COLORS.bluePortal }),
        );
        this.sourcePortal.material.colorWrite = false;
        this.sourcePortal.position.set(0, 1, -5);
        // this.sourcePortal.rotation.set(0, Math.PI * 0.5, 0);

        this.destinationPortal = new Mesh(
            new PlaneGeometry(1, 2),
            new MeshBasicMaterial({ color: PortalsDemo.COLORS.orangePortal }),
        );
        this.destinationPortal.material.colorWrite = false;
        this.destinationPortal.position.set(2, 1, -1);
        // this.destinationPortal.rotation.set(0, Math.PI, 0);

        this.scene.add(this.box, this.plane, this.wall1, this.sourcePortal, this.destinationPortal);
    }

    onPlay() {
        super.onPlay();
    }

    onStopPlaying() {
        super.onStopPlaying();
    }

    calculateVirtualCameraMatrix(destinationPortal, sourcePortal) {
        let dp = destinationPortal.matrix;
        
        let isp = sourcePortal.matrix.clone().invert();
        
        let c = this.camera.matrix.clone();

        let r = MathUtils.matRot180Y;

        return c.premultiply(isp).premultiply(r).premultiply(dp);
    }

    updateVirtualCameraMatrix(virtualCamera, virtualCameraHelper, destinationPortal, sourcePortal) {
        const m = this.calculateVirtualCameraMatrix(destinationPortal, sourcePortal);
        
        virtualCamera.matrix.copy(m);
        virtualCameraHelper.matrix.copy(m);

        virtualCameraHelper.update();
    }

    /**
     * 
     * @param {Mesh} object3d
     * @param {PerspectiveCamera} camera
     * @returns {Vector4} 
     */
    calculateClipPlaneOf(object3d, camera) {
        let worldDir = new Vector3();
        object3d.getWorldDirection(worldDir);
        // worldDir.negate();
        const worldDistance = -worldDir.dot(object3d.position);
        const worldPlane = new Vector4(worldDir.x, worldDir.y, worldDir.z, worldDistance);

        const v = camera.matrixWorldInverse.clone();
        const p = camera.projectionMatrix;

        const worldToCameraNormal = v.premultiply(p).invert().transpose();

        const clipPlane = worldPlane.applyMatrix4(worldToCameraNormal);

        return clipPlane;
        // return worldPlane;
    }

    /**
     * @param {Object3D} object3d 
     * @param {PerspectiveCamera} camera 
     */
    updateVirtualCameraProjectionMatrix(object3d, camera) {
        const t = this.calculateClipPlaneOf(this.sourcePortal, this.camera);

        const m = MathUtils.calculateObliqueMatrix(t, this.camera.projectionMatrix);
        
        camera.projectionMatrix.copy(m);
    }

    onUpdate(dTime) {
        this.updateVirtualCameraMatrix(
            this.virtualCameraDP,
            this.virtualCameraDPHelper,
            this.destinationPortal,
            this.sourcePortal
        );

        this.updateVirtualCameraMatrix(
            this.virtualCameraSP,
            this.virtualCameraSPHelper,
            this.sourcePortal,
            this.destinationPortal,
        );

        this.updateVirtualCameraProjectionMatrix(this.destinationPortal, this.virtualCameraDP);
        // this.updateVirtualCameraProjectionMatrix(this.destinationPortal, this.virtualCameraSP);


        // this.virtualCamera.rotation.y += 1 * dTime;

        this.fpsControls.update(dTime);
    }

    onIdleUpdate(dTime) {}

    onRender(dTime) {
        const gl = Game.renderer.getContext();

        // gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

        gl.enable(gl.CULL_FACE);

        gl.enable(gl.STENCIL_TEST);
        gl.enable(gl.DEPTH_TEST);


        // 1. render source portal to stencil buffer only

        gl.colorMask(false, false, false, false);

        gl.depthMask(false);

        gl.stencilMask(0xFF);
        gl.stencilFunc(gl.NEVER, 0, 0xFF);
        gl.stencilOp(gl.INCR, gl.KEEP, gl.KEEP);

        Game.renderer.render(this.sourcePortal, this.camera);

        
        // 2. render scene from destination point of view using stencil buffer
        
        gl.stencilMask(0x00);
        gl.stencilFunc(gl.LEQUAL, 1, 0xFF);

        gl.colorMask(true, true, true, true);

        gl.depthMask(true);

        Game.renderer.render(this.scene, this.virtualCameraDP);


        // 3. render destination portal to stencil buffer only

        gl.colorMask(false, false, false, false);

        gl.depthMask(false);

        gl.stencilMask(0xFF);
        gl.stencilFunc(gl.NEVER, 0, 0xFF);
        gl.stencilOp(gl.INCR, gl.KEEP, gl.KEEP);

        // render source portal twice to be sure that its value equals 2 
        Game.renderer.render(this.sourcePortal, this.camera);
        Game.renderer.render(this.destinationPortal, this.camera);

        
        // 4. render scene from source point of view using stencil buffer
        
        gl.stencilMask(0x00);
        gl.stencilFunc(gl.EQUAL, 1, 0xFF);

        gl.colorMask(true, true, true, true);

        gl.depthMask(true);

        Game.renderer.render(this.scene, this.virtualCameraSP);


        // 5. at this moment we don't need stencil test

        gl.disable(gl.STENCIL_TEST);
        

        // 6. render depth of portals

        gl.colorMask(false, false, false, true);

        gl.clear(gl.DEPTH_BUFFER_BIT);

        Game.renderer.render(this.sourcePortal, this.camera);
        Game.renderer.render(this.destinationPortal, this.camera);


        // 7. render everything else

        gl.colorMask(true, true, true, true);

        Game.renderer.render(this.scene, this.camera);
    }

    onIdleRender(dTime) {}
}

/*
    0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    0 0 0 0 0 0 1 1 1 0 0 0 0 0 0
    0 0 0 0 0 0 1 1 1 0 0 0 0 0 0
    0 0 0 0 0 0 1 1 1 0 0 0 0 0 0
    0 0 0 0 0 0 1 1 1 0 0 0 0 0 0
    0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    0 0 0 0 0 0 2 2 2 0 0 0 0 0 0
    0 0 0 0 0 0 2 2 2 0 0 0 0 0 0
    0 0 0 0 0 0 2 2 2 0 0 0 0 0 0
    0 0 0 0 0 0 2 2 2 0 0 0 0 0 0

    

*/