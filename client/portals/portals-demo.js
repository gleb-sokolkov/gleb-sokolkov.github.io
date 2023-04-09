import {
    AmbientLight, AxesHelper, BoxGeometry, Camera, CameraHelper, Color,
    DirectionalLight, DirectionalLightHelper, Euler, Fog, Group, Matrix4, Mesh,
    MeshBasicMaterial,
    MeshLambertMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, Plane, PlaneGeometry, Ray, Scene, TetrahedronGeometry, Vector3, Vector4,
} from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import MathUtils from './math/utils';
import FPSControls from './fps-controls';
import Game from './game';
import GameObject from './game-object';

export default class PortalsDemo extends GameObject {
    static get COLORS() {
        const colors = {
            default: new Color('rgb(255, 255, 255)'),
            sky: new Color('rgb(175, 175, 175)'),
            bluePortal: new Color('#8ac8ff'),
            orangePortal: new Color('#f7cc54'),
            grass: new Color('rgb(50, 50, 50)'),
            gray: new Color('rgb(50, 50, 50)'),
        };

        return colors;
    }

    constructor() {
        super();

        this.portalDataArray = [];
        this.maxRecursionCount = 16;
        this.recursionCount = 0;
        this.sourcePortal = null;
        this.destinationPortal = null;

        this.sourcePortalRotation = new Euler();
        this.destinationPortalRotation = new Euler();

        this.initScene();
        this.initCamera();
        this.environment();
        this.initGUI();
    }

    initScene() {
        this.scene = new Scene();
    }

    initCamera() {
        this.camera = new PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 500);

        this.fpsControls = new FPSControls({
            camera: this.camera,
            position: new Vector3(0, 1, 0),
            rotation: new Euler(0, 0, 0),
        });
    }

    generatePillars() {
        const count = 30;
        const pillarLength = 200;
        const pillarThickness = 10;
        const maxXZ = 210;
        const minXZ = 10;

        const pillars = new Group();

        for (let i = 0; i < count; i++) {
            const pillar = new Mesh(
                new BoxGeometry(pillarThickness, pillarLength, pillarThickness),
                new MeshStandardMaterial({ color: PortalsDemo.COLORS.gray }),
            );

            const rx = MathUtils.getPillarRandValue(minXZ, maxXZ, pillarThickness);
            const rz = MathUtils.getPillarRandValue(minXZ, maxXZ, pillarThickness);

            pillar.matrixAutoUpdate = false;
            pillar.matrix.setPosition(rx, pillarLength * 0.5, rz);

            pillars.add(pillar);
        }

        return pillars;
    }

    environment() {
        Game.renderer.setClearColor(PortalsDemo.COLORS.sky);
        Game.renderer.autoClear = false;
        Game.renderer.shadowMap.enabled = true;

        this.scene.fog = new Fog(PortalsDemo.COLORS.sky, this.camera.near, this.camera.far);

        const dirLight = new DirectionalLight(PortalsDemo.COLORS.default, 1);
        dirLight.position.set(-30, 4, -36);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 512;
        dirLight.shadow.mapSize.height = 512;
        dirLight.shadow.bias = 0.01;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 500;

        const ambientLight = new AmbientLight(PortalsDemo.COLORS.sky, 0.5);

        // Axes, Arrows and other debug stuff
        const axes = new AxesHelper(10);
        axes.renderOrder = 999;
        axes.material.depthTest = false;

        const lightDir = new DirectionalLightHelper(dirLight);

        this.scene.add(dirLight, ambientLight);
        // this.scene.add(axes, lightDir);

        // Adding virtual cameras
        this.virtualCameraDP = this.camera.clone();
        this.virtualCameraDP.matrixAutoUpdate = false;
        // this.virtualCameraDPHelper = new CameraHelper(this.virtualCameraDP);
        // this.virtualCameraDPHelper.matrixAutoUpdate = false;
        // this.virtualCameraDPHelper.renderOrder = 800;
        // this.virtualCameraDPHelper.material.depthTest = false;

        // this.scene.add(this.virtualCameraDPHelper);

        this.virtualCameraSP = this.camera.clone();
        this.virtualCameraSP.matrixAutoUpdate = false;
        // this.virtualCameraSPHelper = new CameraHelper(this.virtualCameraSP);
        // this.virtualCameraSPHelper.matrixAutoUpdate = false;
        // this.virtualCameraSPHelper.renderOrder = 800;
        // this.virtualCameraSPHelper.material.depthTest = false;

        // this.scene.add(this.virtualCameraSPHelper);

        // -------------------------------------------------------------------------------------
        //
        //
        // Floor and ceilings
        // -------------------------------------------------------------------------------------
        this.plane = new Mesh(
            new PlaneGeometry(5000, 5000),
            new MeshStandardMaterial({ color: PortalsDemo.COLORS.grass }),
        );
        this.plane.receiveShadow = true;
        this.plane.material.dithering = true;
        this.plane.position.set(0, 0, 0);
        this.plane.rotation.set(-Math.PI * 0.5, 0, 0);

        this.ceilings = new Mesh(
            new PlaneGeometry(5000, 5000),
            new MeshStandardMaterial({ color: PortalsDemo.COLORS.grass }),
        );
        this.ceilings.receiveShadow = true;
        this.ceilings.material.dithering = true;
        this.ceilings.position.set(0, 300, 0);
        this.ceilings.rotation.set(Math.PI * 0.5, 0, 0);

        // -------------------------------------------------------------------------------------
        //
        //
        // Pillars
        // -------------------------------------------------------------------------------------
        this.pillars = this.generatePillars();

        // -------------------------------------------------------------------------------------
        //
        //
        // Random boxes
        // -------------------------------------------------------------------------------------
        this.box = new Mesh(
            new BoxGeometry(1, 1, 1),
            new MeshStandardMaterial({ color: PortalsDemo.COLORS.gray }),
        );
        this.box.castShadow = true;
        this.box.position.set(-2, 0.5, -5);

        this.box2 = new Mesh(
            new BoxGeometry(0.5, 0.5, 0.5),
            new MeshStandardMaterial({ color: PortalsDemo.COLORS.gray }),
        );
        this.box2.castShadow = true;
        this.box2.position.set(0, 0.25, -4);
        // this.box.matrixAutoUpdate = false;

        // -------------------------------------------------------------------------------------
        //
        //
        // Source portal
        // -------------------------------------------------------------------------------------
        this.sourcePortalFrame = new Mesh(
            new BoxGeometry(0.5, 9, 9),
            new MeshStandardMaterial({ color: PortalsDemo.COLORS.bluePortal }),
        );
        this.sourcePortalFrame.castShadow = true;
        this.sourcePortalFrame.position.set(-5.3, 7, -3);

        this.sourcePortal = new Mesh(
            new PlaneGeometry(8, 8),
            new MeshBasicMaterial({ color: PortalsDemo.COLORS.bluePortal }),
        );
        this.sourcePortal.position.set(-5, 7, -3);
        this.sourcePortal.rotation.set(0, Math.PI * 0.5, 0);
        this.sourcePortal.material.colorWrite = false;

        // -------------------------------------------------------------------------------------
        //
        //
        // Destination portal
        // -------------------------------------------------------------------------------------
        this.destinationPortalFrame = new Mesh(
            new BoxGeometry(0.5, 9, 9),
            new MeshStandardMaterial({ color: PortalsDemo.COLORS.orangePortal }),
        );
        this.destinationPortalFrame.castShadow = true;
        this.destinationPortalFrame.position.set(2.3, 7, -3);

        this.destinationPortal = new Mesh(
            new PlaneGeometry(8, 8),
            new MeshBasicMaterial({ color: PortalsDemo.COLORS.orangePortal }),
        );
        this.destinationPortal.material.colorWrite = false;
        this.destinationPortal.position.set(2.0, 7, -3.0);
        this.destinationPortal.rotation.set(0, Math.PI * 1.5, 0);

        this.scene.add(
            this.box,
            this.box2,
            this.pillars,
            this.plane,
            this.ceilings,
            this.sourcePortalFrame,
            this.destinationPortalFrame,
        );
    }

    initGUI() {
        this.gui = new GUI();

        this.gui.add(this, 'maxRecursionCount', 0, 255).step(1).name('Recursion count');

        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);
    }

    /**
     * @deprecated
     */
    calculateRecursionCount() {
        const spWorldDir = new Vector3();
        this.sourcePortal.getWorldDirection(spWorldDir);

        const dpWorldDir = new Vector3();
        this.destinationPortal.getWorldDirection(dpWorldDir);

        const spPlane = new Plane();
        spPlane.setFromNormalAndCoplanarPoint(spWorldDir, this.sourcePortal.position);

        const ray = new Ray(this.destinationPortal.position, dpWorldDir);
        const intersectFactor = Number(ray.intersectsPlane(spPlane));

        const dotSign = Math.sign(spWorldDir.dot(dpWorldDir));
        const recursionMult = intersectFactor * MathUtils.clamp(dotSign * -1, 0, 1);

        this.recursionCount = this.maxRecursionCount * recursionMult;
    }

    /**
     * @param {Object3D} sourcePortal
     * @param {Object3D} destinationPortal
     */
    calculatePortalMat4Array(sourcePortal, destinationPortal) {
        // clear the array
        this.preCalcMat4Array = [];

        const initModel = MathUtils.calculateVirtualCameraMatrix(
            destinationPortal.matrix,
            sourcePortal.matrix,
            this.camera.matrix,
        );
        const initView = this.camera.matrixWorldInverse;
        const initProj = MathUtils.calculateObliqueMatrix(
            sourcePortal,
            initView,
            this.camera.projectionMatrix,
        );

        // always have initial matrices to draw portal frame
        this.preCalcMat4Array.push({ model: initModel, view: initView, proj: initProj });

        // matrices for recursion
        for (let i = 1; i <= this.maxRecursionCount; i++) {
            const prevElem = this.preCalcMat4Array[i - 1];

            const model = MathUtils.calculateVirtualCameraMatrix(
                destinationPortal.matrix,
                sourcePortal.matrix,
                prevElem.model,
            );
            const view = prevElem.model.clone().invert();
            const proj = MathUtils.calculateObliqueMatrix(
                sourcePortal,
                view,
                this.camera.projectionMatrix,
            );

            this.preCalcMat4Array.push({ model, view, proj });
        }

        return this.preCalcMat4Array;
    }

    updateCameraDataForRecursive() {
        const srcPortalMat4Array = this.calculatePortalMat4Array(this.sourcePortal, this.destinationPortal);
        const dstPortalMat4Array = this.calculatePortalMat4Array(this.destinationPortal, this.sourcePortal);

        this.portalDataArray = [
            {
                object3d: this.sourcePortal,
                mat4Array: srcPortalMat4Array,
            },
            {
                object3d: this.destinationPortal,
                mat4Array: dstPortalMat4Array,
            },
        ];
    }

    onUpdate(dTime) {
        this.fpsControls.update(dTime);
        this.stats.update();

        this.destinationPortal.rotation.z += 0.001;
        this.destinationPortalFrame.rotation.x = -this.destinationPortal.rotation.z;

        // this.calculateRecursionCount();

        this.updateCameraDataForRecursive();
    }

    /**
     * @deprecated
     */
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
