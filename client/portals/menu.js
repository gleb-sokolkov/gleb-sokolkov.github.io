import Game from "./game";
import GameObject from "./game-object";

export default class Menu extends GameObject {
    root;
    startBtn;

    constructor() {
        super();

        this.root = document.querySelector('.menu');
        this.startBtn = this.root.querySelector('.start__btn');

        this.handleStartBtnClick = this.handleStartBtnClick.bind(this);
        this.startBtn.addEventListener('click', this.handleStartBtnClick);
    }

    handleStartBtnClick() {
        Game.play();
    }

    onPlay() {
        super.onPlay();

        this.root.classList.add('menu_disabled');
    }

    onStopPlaying() {
        super.onStopPlaying();

        this.root.classList.remove('menu_disabled');
    }

    onUpdate(dTime) {}

    onIdleUpdate(dTime) {}
}
