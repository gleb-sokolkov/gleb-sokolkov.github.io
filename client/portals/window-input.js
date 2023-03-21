import { Vector2 } from "three";
import Game from "./game";

export default class WindowInput {
    static get KEYS() {
        return {
            MOVE_FORWARD: 87,
            MOVE_RIGHT: 68,
            MOVE_BACK: 83,
            MOVE_LEFT: 65,
            MOVE_UP: 82,
            MOVE_DOWN: 70,
        };
    }

    static get EVENTS() {
        return {
            ON_MOUSE_MOVE: 'OnMouseMove',
        };
    }

    static #instance;
    static get instance() {
        return WindowInput.#instance;
    }

    static init() {
        if (WindowInput.#instance) return;

        WindowInput.#instance = new WindowInput();
    }

    #keyInput;

    #mouseInput;
    get mouseInput() {
        return this.#mouseInput;
    }

    #events;
    get events() {
        return this.#events;
    }

    constructor() {
        this.#initKeyInput();
        this.#initMouseInput();
        this.#initEvents();

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        Game.canvasElement.addEventListener('mousemove', this.handleMouseMove);
    }

    #initKeyInput() {
        this.#keyInput = new Array(255).fill(0);
    }

    #initMouseInput() {
        this.#mouseInput = {
            movement: new Vector2(0, 0),
        };
    }

    #initEvents() {
        this.#events = {};
        
        this.#events[WindowInput.EVENTS.ON_MOUSE_MOVE] = new CustomEvent(WindowInput.EVENTS.ON_MOUSE_MOVE);
    }

    handleKeyDown({ keyCode }) {
        this.#keyInput[keyCode] = 1;
    }

    handleKeyUp({ keyCode }) {
        this.#keyInput[keyCode] = 0;
    }
    
    handleMouseMove({ movementX, movementY }) {
        this.mouseInput.movement.x = movementX;
        this.mouseInput.movement.y = movementY;
        
        Game.canvasElement.dispatchEvent(this.#events[WindowInput.EVENTS.ON_MOUSE_MOVE]);
    }
    
    getKeyInputInt(keyCodes) {
        let result = 0;

        for (let i = 0; i < keyCodes.length; i++) {
            result |= this.#keyInput[keyCodes[i]];
        }

        return result;
    }
}
