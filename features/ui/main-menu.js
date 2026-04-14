import { createImageButton } from './image-button.js';

export function buildMainMenu(scene, w, h, onStart, onAbout) {
  const handleAbout = typeof onAbout === 'function' ? onAbout : () => {};
  const container = scene.add.container(w / 2, h / 2).setDepth(70).setVisible(true);

  const background = scene.add.image(0, 0, 'main_menu_background')
    .setDisplaySize(w, h);

  const buttonWidth = Math.min(w * 0.22, 280);
  const buttonY = 180;
  const buttonOffset = Math.max(buttonWidth * 0.7, 180);

  const jogarButton = createImageButton(scene, 'button_jogar', -buttonOffset, buttonY, buttonWidth, () => onStart(scene));
  const sobreButton = createImageButton(scene, 'button_sobre', buttonOffset, buttonY, buttonWidth, () => handleAbout(scene));

  container.add([background, jogarButton, sobreButton]);

  return { container, background, jogarButton, sobreButton };
}
