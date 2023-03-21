import WebGL from 'three/examples/jsm/capabilities/WebGL';
import config from './config';
import Game from './game';
import PortalsDemo from './portals-demo';
import Menu from './menu';

// TODO: renderer update

if (!WebGL.isWebGL2Available) {
    document.body.insertBefore(
        WebGL.getWebGL2ErrorMessage(),
        document.body.firstChild,
    );
} else {
    Game.initRenderer(config.canvasID);
    Game.initGameEvents();
    Game.subscribeToBrowserEvents();

    Game.pScene = new PortalsDemo();
    Game.ui = new Menu();

    Game.stopPlaying();

    Game.startLoop();
}
