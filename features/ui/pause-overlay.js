import { createImageButton } from './image-button.js';
import { togglePause } from '../core/game-lifecycle.js';

export function buildPauseOverlay(scene, w, h) {
  const container = scene.add.container(w / 2, h / 2).setDepth(65).setVisible(false);

  const background = scene.add.rectangle(0, 0, w * 0.55, h * 0.4, 0x000000, 0.75)
    .setStrokeStyle(4, 0x63d98a);

  const title = scene.add.text(0, -30, 'JOGO PAUSADO', {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: '46px',
    color: '#f4fff8',
    align: 'center',
  }).setOrigin(0.5);

  const voltarButtonWidth = Math.min(w * 0.18, 240);
  const voltarButton = createImageButton(scene, 'button_voltar', 0, 50, voltarButtonWidth, () => togglePause(scene));

  container.add([background, title, voltarButton]);
  return { container, background, voltarButton };
}
