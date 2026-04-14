import { createImageButton } from '../ui/image-button.js';

export class AboutScene extends Phaser.Scene {
  constructor() {
    super('about-scene');
    this.returnSceneKey = 'main-scene';
  }

  init(data) {
    this.returnSceneKey = data?.returnSceneKey || 'main-scene';
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.background = this.add.image(w / 2, h / 2, 'about_background')
      .setDisplaySize(w, h);

    const backWidth = Math.min(w * 0.18, 240);
    this.backButton = createImageButton(this, 'button_voltar', w / 2, h * 0.9, backWidth, () => {
      this.scene.stop('about-scene');
      this.scene.resume(this.returnSceneKey);
    });

    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
    });

    this.handleResize(this.scale.gameSize);
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    this.background.setPosition(width / 2, height / 2).setDisplaySize(width, height);
    this.backButton.setPosition(width / 2, height * 0.9);
    this.backButton.setBaseScale(Math.min(width * 0.18, 240) / this.backButton.baseTextureWidth);
  }
}