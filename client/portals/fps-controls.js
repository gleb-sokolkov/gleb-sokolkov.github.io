import { Camera, Euler, Matrix3, Vector3 } from 'three';
import MathUtils from './math/utils';
import Game from './game';
import WindowInput from './window-input';

export default class FPSControls {
    get defaultParams() {
        return {
            moveSpeed: 4,
            position: new Vector3(0, 0, 0),
            rotation: new Euler(0, 0, 0),
            sensitivity: 0.002,
            keyActions: [
                [this.actions.moveForward, WindowInput.KEYS.MOVE_FORWARD],
                [this.actions.moveBack, WindowInput.KEYS.MOVE_BACK],
                [this.actions.moveRight, WindowInput.KEYS.MOVE_RIGHT],
                [this.actions.moveLeft, WindowInput.KEYS.MOVE_LEFT],
                [this.actions.moveUp, WindowInput.KEYS.MOVE_UP],
                [this.actions.moveDown, WindowInput.KEYS.MOVE_DOWN],
            ],
        };
    }

    get actions() {
        return {
            moveForward: this.moveForward.bind(this),
            moveBack: this.moveBack.bind(this),
            moveRight: this.moveRight.bind(this),
            moveLeft: this.moveLeft.bind(this),
            moveUp: this.moveUp.bind(this),
            moveDown: this.moveDown.bind(this),
            mouseLook: this.mouseLook.bind(this),
        };
    }

    /**
     * @param {object} params
     * @param {Camera} params.camera
     * @param {Array} params.keyActions
     * @param {Number} params.moveSpeed
     * @param {Vector3} params.position
     * @param {Number} params.sensitivity
     * @param {Euler} params.rotation
     */
    constructor(params) {
        this.camera = params.camera;
        this.camera.matrixAutoUpdate = false;

        this.keyActions = params.keyActions || this.defaultParams.keyActions;
        this.moveSpeed = params.moveSpeed || this.defaultParams.moveSpeed;
        this.position = params.position || this.defaultParams.position;
        this.camera.position.copy(this.position);

        Game.canvasElement.addEventListener(
            WindowInput.EVENTS.ON_MOUSE_MOVE,
            this.actions.mouseLook,
        );
        this.sensitivity = params.sensitivity || this.defaultParams.sensitivity;
        this.rotation = params.rotation || this.defaultParams.rotation;
        this.rotation.reorder('YXZ');
        this.camera.setRotationFromEuler(this.rotation);

        this.camera.updateMatrix();

        this.computeDirections();
    }

    update(dTime) {
        const velocity = new Vector3(0, 0, 0);

        // movement
        for (let i = 0; i < this.keyActions.length; i++) {
            const [keyAction, ...keys] = this.keyActions[i];
            const keyPressedMult = WindowInput.instance.getKeyInputInt(keys);
            const vel = keyAction(keyPressedMult);
            velocity.add(vel);
        }

        velocity.normalize().multiplyScalar(this.moveSpeed * dTime);

        this.position.add(velocity);

        this.camera.position.copy(this.position);
        this.camera.updateMatrix();
        this.camera.matrixWorldInverse.copy(this.camera.matrix).invert();
    }

    moveForward(mult) {
        const vel = this.directionXZ.clone().multiplyScalar(mult);
        return vel;
    }

    moveBack(mult) {
        const vel = this.directionXZ.clone().multiplyScalar(-mult);
        return vel;
    }

    moveRight(mult) {
        const rightDir = this.direction.clone().cross(this.camera.up);
        const vel = rightDir.multiplyScalar(mult);
        return vel;
    }

    moveLeft(mult) {
        const rightDir = this.direction.clone().cross(this.camera.up);
        const vel = rightDir.multiplyScalar(-mult);
        return vel;
    }

    moveUp(mult) {
        const vel = this.camera.up.clone().multiplyScalar(mult);
        return vel;
    }

    moveDown(mult) {
        const vel = this.camera.up.clone().multiplyScalar(-mult);
        return vel;
    }

    mouseLook() {
        const { movement } = WindowInput.instance.mouseInput;

        this.rotation.setFromQuaternion(this.camera.quaternion);

        this.rotation.x -= movement.y * this.sensitivity;
        this.rotation.y -= movement.x * this.sensitivity;

        this.rotation.x = MathUtils.clamp(
            this.rotation.x,
            -Math.PI * 0.5,
            Math.PI * 0.5,
        );

        this.camera.setRotationFromEuler(this.rotation);

        this.computeDirections();
    }

    computeDirections() {
        this.direction = new Vector3(0, 0, 0);
        this.camera.getWorldDirection(this.direction);

        this.directionXZ = this.direction.clone().applyMatrix3(MathUtils.mat3ProjXZ);
    }
}
