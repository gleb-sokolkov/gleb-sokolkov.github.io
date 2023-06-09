import { Clock, WebGLRenderer } from 'three';

export default class Game {
    static get EVENTS() {
        return {
            ON_PLAY: 'onPlay',
            ON_STOP_PLAYING: 'onStopPlaying',
        };
    }

    static #canvasElement;

    static get canvasElement() {
        return Game.#canvasElement;
    }

    static set canvasElement(value) {
        Game.#canvasElement = value;
    }

    static #renderer;

    /**
     * @returns {WebGLRenderer}
     */
    static get renderer() {
        return Game.#renderer;
    }

    static set renderer(value) {
        Game.#renderer = value;
    }

    static #pScene;

    static get pScene() {
        return Game.#pScene;
    }

    static set pScene(value) {
        Game.#pScene = value;
    }

    static #ui;

    static get ui() {
        return Game.#ui;
    }

    static set ui(value) {
        Game.#ui = value;
    }

    static #clock;

    /**
     * @returns {Clock}
     */
    static get clock() {
        return Game.#clock;
    }

    static set clock(value) {
        Game.#clock = value;
    }

    static #isLocked;

    static get isLocked() {
        return Game.#isLocked;
    }

    static set isLocked(value) {
        Game.#isLocked = value;
    }

    static #events;

    static get events() {
        return Game.#events;
    }

    static set events(value) {
        Game.#events = value;
    }

    static initRenderer(domElementID) {
        Game.canvasElement = document.getElementById(domElementID);

        Game.renderer = new WebGLRenderer({
            canvas: Game.canvasElement,
        });

        Game.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    static initGameEvents() {
        this.#events = {};

        Game.events[Game.EVENTS.ON_PLAY] = new CustomEvent(Game.EVENTS.ON_PLAY);
        Game.events[Game.EVENTS.ON_STOP_PLAYING] = new CustomEvent(Game.EVENTS.ON_STOP_PLAYING);
    }

    static subscribeToBrowserEvents() {
        document.addEventListener('pointerlockchange', Game.handlePointerLockChange);
    }

    static async play() {
        if (document.pointerLockElement) return;

        try {
            await Game.canvasElement.requestPointerLock({
                unadjustedMovement: true,
            });
        } catch (ex) {
            console.error('Mouse acceleration are not supported on this platform!');

            await Game.canvasElement.requestPointerLock();
        }
    }

    static stopPlaying() {
        if (!document.pointerLockElement) {
            document.dispatchEvent(new PointerEvent('pointerlockchange'));
            return;
        }

        document.exitPointerLock();
    }

    static handlePointerLockChange() {
        if (document.pointerLockElement === Game.canvasElement) {
            Game.canvasElement.dispatchEvent(Game.events[Game.EVENTS.ON_PLAY]);

            Game.isLocked = true;
        } else {
            Game.canvasElement.dispatchEvent(Game.events[Game.EVENTS.ON_STOP_PLAYING]);

            Game.isLocked = false;
        }
    }

    static startLoop() {
        Game.clock = new Clock();

        const loop = () => {
            const dTime = Game.clock.getDelta();

            Game.#loop(dTime);

            requestAnimationFrame(loop);
        };

        loop();
    }

    static #loop(dTime) {
        this.#update(dTime);
        this.#render(dTime);
    }

    static #update(dTime) {
        Game.pScene.update(dTime);
        Game.ui.update(dTime);
    }

    static #render(dTime) {
        Game.pScene.render(dTime);
    }
}
