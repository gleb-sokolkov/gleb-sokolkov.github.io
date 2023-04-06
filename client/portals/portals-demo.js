import {
    AmbientLight, AxesHelper, BoxGeometry, Camera, CameraHelper, Color,
    DirectionalLight, DirectionalLightHelper, Euler, Fog, Matrix4, Mesh,
    MeshBasicMaterial,
    MeshLambertMaterial, Object3D, PerspectiveCamera, Plane, PlaneGeometry, Scene, Vector3, Vector4,
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
        this.camera = new PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 150);

        this.fpsControls = new FPSControls({
            camera: this.camera,
            position: new Vector3(0, 1, 0),
            rotation: new Euler(0, 0, 0),
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

        // this.scene.add(this.virtualCameraDPHelper);

        this.virtualCameraSP = this.camera.clone();
        this.virtualCameraSP.matrixAutoUpdate = false;
        this.virtualCameraSPHelper = new CameraHelper(this.virtualCameraSP);
        this.virtualCameraSPHelper.matrixAutoUpdate = false;
        this.virtualCameraSPHelper.renderOrder = 800;
        this.virtualCameraSPHelper.material.depthTest = false;

        // this.scene.add(this.virtualCameraSPHelper);

        // Adding some environment
        this.plane = new Mesh(
            new PlaneGeometry(1000, 1000),
            new MeshLambertMaterial({ color: PortalsDemo.COLORS.grass }),
        );
        this.plane.position.set(0, 0, 0);
        this.plane.rotation.set(-Math.PI * 0.5, 0, 0);

        this.box = new Mesh(
            new BoxGeometry(8, 0.1, 0.1),
            new MeshLambertMaterial({ color: PortalsDemo.COLORS.redish }),
        );
        this.box.position.set(0, 0.5, -3);

        this.box2 = new Mesh(
            new BoxGeometry(0.5, 0.5, 0.5),
            new MeshLambertMaterial({ color: PortalsDemo.COLORS.bluePortal }),
        );
        this.box2.position.set(0, 0.25, -4);
        // this.box.matrixAutoUpdate = false;

        this.wall1 = new Mesh(
            new BoxGeometry(200, 30, 2),
            new MeshLambertMaterial({ color: PortalsDemo.COLORS.redish }),
        );
        this.wall1.position.set(0, 15, -7.55);

        this.wall2 = new Mesh(
            new BoxGeometry(0.5, 6, 7),
            new MeshLambertMaterial({ color: PortalsDemo.COLORS.redish }),
        );
        this.wall2.position.set(4.3, 2, -3);

        this.wall3 = new Mesh(
            new BoxGeometry(0.5, 6, 7),
            new MeshLambertMaterial({ color: PortalsDemo.COLORS.redish }),
        );
        this.wall3.position.set(-1.3, 2, -3);

        this.sourcePortal = new Mesh(
            new PlaneGeometry(4, 4),
            new MeshBasicMaterial({ color: PortalsDemo.COLORS.bluePortal }),
        );
        this.sourcePortal.material.colorWrite = false;
        this.sourcePortal.position.set(-1, 2, -3);
        this.sourcePortal.rotation.set(0, Math.PI * 0.5, 0);

        this.destinationPortal = new Mesh(
            new PlaneGeometry(4, 4),
            new MeshBasicMaterial({ color: PortalsDemo.COLORS.orangePortal }),
        );
        this.destinationPortal.material.colorWrite = false;
        this.destinationPortal.position.set(1.5, 2, -6.5);
        this.destinationPortal.rotation.set(0, Math.PI * 0.0, 0);

        this.scene.add(
            this.box,
            this.box2,
            this.plane,
            this.wall1,
            this.wall2,
            this.wall3,
            // this.sourcePortal,
            // this.destinationPortal,
        );
    }

    /**
     *
     * @param {Matrix4} destinationMatrix
     * @param {Matrix4} sourceMatrix
     * @param {Matrix4} cameraMatrix
     * @returns {Matrix4}
     */
    calculateVirtualCameraMatrix(destinationMatrix, sourceMatrix, cameraMatrix) {
        const dp = destinationMatrix;

        const isp = sourceMatrix.clone().invert();

        const c = cameraMatrix.clone();

        const r = MathUtils.matRot180Y;

        return c.premultiply(isp).premultiply(r).premultiply(dp);
    }

    /**
     *
     * @param {Mesh} object3d
     * @param {Matrix4} cameraMatrixInverse
     * @returns {Plane}
     */
    calculateClipPlaneOf(object3d, cameraMatrixInverse) {
        const worldDir = new Vector3();
        object3d.getWorldDirection(worldDir);

        const clipPlane = new Plane();

        clipPlane.setFromNormalAndCoplanarPoint(worldDir.negate(), object3d.position);

        clipPlane.applyMatrix4(cameraMatrixInverse);

        return new Vector4(
            clipPlane.normal.x,
            clipPlane.normal.y,
            clipPlane.normal.z,
            clipPlane.constant,
        );
    }

    /**
     * Only for `main` camera
     * @param {Object3D} object3d
     * @param {Matrix4} cameraLocalMat
     * @param {Matrix4} cameraProjMat
     */
    calculateObliqueMatrix(object3d, cameraLocalMat, cameraProjMat) {
        const t = this.calculateClipPlaneOf(object3d, cameraLocalMat);

        const m = MathUtils.calculateObliqueMatrix(t, cameraProjMat);

        return m;
    }

    /**
     * @param {Object3D} sourcePortal
     * @param {Object3D} destinationPortal
     */
    calculatePortalMat4Array(sourcePortal, destinationPortal) {
        // clear the array
        this.preCalcMat4Array = [];

        const initModel = this.calculateVirtualCameraMatrix(
            destinationPortal.matrix,
            sourcePortal.matrix,
            this.camera.matrix,
        );
        const initView = this.camera.matrixWorldInverse;
        const initProj = this.calculateObliqueMatrix(
            sourcePortal,
            initView,
            this.camera.projectionMatrix,
        );

        // always have initial matrices to draw portal frame
        this.preCalcMat4Array.push({ model: initModel, view: initView, proj: initProj });

        const recursionCount = 16;

        // matrices for recursion
        for (let i = 1; i <= recursionCount; i++) {
            const prevElem = this.preCalcMat4Array[i - 1];

            const model = this.calculateVirtualCameraMatrix(
                destinationPortal.matrix,
                sourcePortal.matrix,
                prevElem.model,
            );
            const view = prevElem.model.clone().invert();
            const proj = this.calculateObliqueMatrix(
                sourcePortal,
                view,
                this.camera.projectionMatrix,
            );

            this.preCalcMat4Array.push({ model, view, proj });
        }

        return this.preCalcMat4Array;
    }

    updateCameraDataForRecursive() {
        // eslint-disable-next-line max-len
        const srcPortalMat4Array = this.calculatePortalMat4Array(this.sourcePortal, this.destinationPortal);
        // eslint-disable-next-line max-len
        const dstPortalMat4Array = this.calculatePortalMat4Array(this.destinationPortal, this.sourcePortal);

        this.portalDataArray = [
            {
                object3d: this.destinationPortal,
                mat4Array: dstPortalMat4Array,
            },
            {
                object3d: this.sourcePortal,
                mat4Array: srcPortalMat4Array,
            },
        ];
    }

    onUpdate(dTime) {
        this.fpsControls.update(dTime);

        // this.destinationPortal.rotation.y += 0.01;

        this.updateCameraDataForRecursive();
    }

    renderNonRecursive() {
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

        // render source portal twice to be sure its value equals 2
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

    renderRecursive() {
        const gl = Game.renderer.getContext();

        // gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1.0);
        gl.clearStencil(0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        gl.enable(gl.DEPTH_TEST);

        gl.enable(gl.STENCIL_TEST);

        //
        //
        // For each portal
        // -----------------------------------------------------------------------------------------

        for (let i = 0; i < this.portalDataArray.length; i++) {
            const data = this.portalDataArray[i];

            // -----------------------------------------------------------------------------------------
            //
            //
            //
            //
            // 1. render initial portal frame to stencil including depth test to avoid overlapping
            // -----------------------------------------------------------------------------------------

            gl.enable(gl.STENCIL_TEST);
            gl.enable(gl.DEPTH_TEST);

            gl.stencilMask(0xFF);
            gl.stencilFunc(gl.EQUAL, 0, 0xFF);
            gl.stencilOp(gl.ZERO, gl.ZERO, gl.INCR);

            gl.depthMask(false);

            gl.colorMask(false, false, false, false);

            Game.renderer.render(data.object3d, this.camera);

            gl.disable(gl.DEPTH_TEST);

            // -----------------------------------------------------------------------------------------
            //
            //
            //
            //
            // 2. fill up recursion levels
            // -----------------------------------------------------------------------------------------

            for (let k = 0; k < data.mat4Array.length - 1; k++) {
                const mat4Obj = data.mat4Array[k];

                gl.stencilMask(0xFF);
                gl.stencilFunc(gl.NOTEQUAL, k + 1, 0xFF);
                gl.stencilOp(gl.INCR, gl.KEEP, gl.KEEP);

                gl.depthMask(false);

                gl.colorMask(false, false, false, false);

                this.virtualCameraDP.matrixWorld.elements = mat4Obj.model.elements;
                this.virtualCameraDP.matrixWorldInverse.elements = mat4Obj.view.elements;
                this.virtualCameraDP.projectionMatrix.elements = mat4Obj.proj.elements;

                Game.renderer.render(data.object3d, this.virtualCameraDP);
            }

            gl.enable(gl.DEPTH_TEST);

            // -----------------------------------------------------------------------------------------
            //
            //
            //
            //
            // 3. render recursions from the deepest to initial level
            // -----------------------------------------------------------------------------------------

            for (let k = data.mat4Array.length - 1; k > 0; k--) {
                // -----------------------------------------------------------------------------------------
                //
                //
                //
                //
                // 4. render content from perspective of virtual camera
                // -----------------------------------------------------------------------------------------

                gl.stencilMask(0x00);
                gl.stencilFunc(gl.EQUAL, k + 1, 0xFF);

                gl.colorMask(true, true, true, true);

                gl.depthMask(true);

                // gl.clear(gl.DEPTH_BUFFER_BIT);

                this.virtualCameraDP.matrixWorld.elements = data.mat4Array[k].model.elements;
                this.virtualCameraDP.matrixWorldInverse.elements = data.mat4Array[k].view.elements;
                this.virtualCameraDP.projectionMatrix.elements = data.mat4Array[k].proj.elements;

                Game.renderer.render(this.scene, this.virtualCameraDP);

                // -----------------------------------------------------------------------------------------
                //
                //
                //
                //
                // 5. render portal frame to depth buffer for depth test on the next iterations
                // -----------------------------------------------------------------------------------------

                gl.stencilMask(0x00);
                gl.stencilFunc(gl.EQUAL, k + 1, 0xFF);

                gl.colorMask(false, false, false, false);

                gl.depthMask(true);

                gl.clear(gl.DEPTH_BUFFER_BIT);

                this.virtualCameraDP.matrixWorld.elements = data.mat4Array[k - 1].model.elements;
                this.virtualCameraDP.matrixWorldInverse.elements = data.mat4Array[k - 1].view.elements;
                this.virtualCameraDP.projectionMatrix.elements = data.mat4Array[k - 1].proj.elements;

                Game.renderer.render(data.object3d, this.virtualCameraDP);

                // -----------------------------------------------------------------------------------------
                //
                //
                //
                //
                // 6. clear portal frame from stencil buffer for the next iterations
                // -----------------------------------------------------------------------------------------

                gl.stencilMask(0xFF);
                gl.stencilFunc(gl.NOTEQUAL, k + 1, 0xFF);
                gl.stencilOp(gl.DECR, gl.KEEP, gl.KEEP);

                gl.colorMask(false, false, false, false);

                gl.depthMask(false);

                this.virtualCameraDP.matrixWorld.elements = data.mat4Array[k - 1].model.elements;
                this.virtualCameraDP.matrixWorldInverse.elements = data.mat4Array[k - 1].view.elements;
                this.virtualCameraDP.projectionMatrix.elements = data.mat4Array[k - 1].proj.elements;

                Game.renderer.render(data.object3d, this.virtualCameraDP);
            }

            // -----------------------------------------------------------------------------------------
            //
            //
            //
            //
            // 7. do the previous steps from 3 for initial frame
            // -----------------------------------------------------------------------------------------

            gl.stencilMask(0x00);
            gl.stencilFunc(gl.EQUAL, 1, 0xFF);

            gl.colorMask(true, true, true, true);

            gl.depthMask(true);

            // gl.clear(gl.DEPTH_BUFFER_BIT);

            this.virtualCameraDP.matrixWorld.elements = data.mat4Array[0].model.elements;
            this.virtualCameraDP.matrixWorldInverse.elements = data.mat4Array[0].view.elements;
            this.virtualCameraDP.projectionMatrix.elements = data.mat4Array[0].proj.elements;

            Game.renderer.render(this.scene, this.virtualCameraDP);

            gl.stencilMask(0x00);
            gl.stencilFunc(gl.EQUAL, 1, 0xFF);

            gl.colorMask(false, false, false, false);

            gl.depthMask(true);
            gl.depthFunc(gl.ALWAYS);

            gl.clear(gl.DEPTH_BUFFER_BIT);

            Game.renderer.render(data.object3d, this.camera);

            gl.depthFunc(gl.LESS);

            gl.stencilMask(0xFF);
            gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF);
            gl.stencilOp(gl.DECR, gl.KEEP, gl.KEEP);

            gl.colorMask(false, false, false, false);

            gl.depthMask(false);

            Game.renderer.render(data.object3d, this.camera);
        }

        // -----------------------------------------------------------------------------------------
        //
        //
        //
        //
        // 8. at this moment we don't need stencil test
        // -----------------------------------------------------------------------------------------

        gl.disable(gl.STENCIL_TEST);
        gl.stencilMask(0x00);

        // -----------------------------------------------------------------------------------------
        //
        //
        //
        //
        // 9. render depth of portals
        // -----------------------------------------------------------------------------------------

        gl.clear(gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.DEPTH_TEST);

        gl.depthFunc(gl.LESS);

        gl.depthMask(true);

        gl.colorMask(false, false, false, false);

        for (let i = 0; i < this.portalDataArray.length; i++) {
            const data = this.portalDataArray[i];

            Game.renderer.render(data.object3d, this.camera);
        }

        // -----------------------------------------------------------------------------------------
        //
        //
        //
        //
        // 10. render everything else
        // -----------------------------------------------------------------------------------------

        gl.colorMask(true, true, true, true);

        Game.renderer.render(this.scene, this.camera);
    }

    onRender(dTime) {
        // this.renderNonRecursive();
        this.renderRecursive();
    }
}
