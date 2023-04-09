import Game from './game';
import Updatable from './updatable';

export default class GameObject extends Updatable {
    constructor() {
        super();

        this.onUpdate = this.onUpdate.bind(this);
        this.onIdleUpdate = this.onIdleUpdate.bind(this);
        this.update = this.onUpdate;

        this.onPlay = this.onPlay.bind(this);
        Game.canvasElement.addEventListener(Game.EVENTS.ON_PLAY, this.onPlay);

        this.onStopPlaying = this.onStopPlaying.bind(this);
        Game.canvasElement.addEventListener(Game.EVENTS.ON_STOP_PLAYING, this.onStopPlaying);

        this.onRender = this.onRender.bind(this);
        this.onIdleRender = this.onIdleRender.bind(this);
        this.render = this.onRender;
    }

    onPlay() {
        this.update = this.onUpdate;
        this.render = this.onRender;
    }

    onStopPlaying() {
        this.update = this.onIdleUpdate;
        this.render = this.onIdleRender;
    }

    onUpdate(dTime) {}

    onIdleUpdate(dTime) {}

    onRender(dTime) {}

    onIdleRender(dTime) {}
}
