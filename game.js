import { preload } from './features/core/preload.js';
import { create }  from './features/core/create.js';
import { update }  from './features/core/update.js';
import { AboutScene } from './features/scenes/about-scene.js';

class MainScene extends Phaser.Scene {
  constructor() {
    super('main-scene');
  }

  preload() {
    preload.call(this);
  }

  create() {
    create.call(this);
  }

  update() {
    update.call(this);
  }
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game',
  pixelArt: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 900 },
      debug: false,
    },
  },
  scene: [MainScene, AboutScene],
};

new Phaser.Game(config);
