export function buildMainMenu(scene, w, h, onStart) {
  const container = scene.add.container(w / 2, h / 2).setDepth(70).setVisible(true);

  const background = scene.add.rectangle(0, 0, w * 0.65, h * 0.65, 0x0f3b2e, 0.9)
    .setStrokeStyle(5, 0x63d98a);

  const logo = scene.add.image(0, -h * 0.16, 'logo')
    .setScale(Math.min(w / 900, h / 700) * 0.7);

  const title = scene.add.text(0, h * 0.02, 'SISTEMAS MULTIMÍDIA', {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: '54px',
    color: '#f4fff8',
    align: 'center',
  }).setOrigin(0.5);

  const button = scene.add.rectangle(0, h * 0.2, 360, 88, 0x63d98a)
    .setStrokeStyle(4, 0xffffff)
    .setInteractive({ useHandCursor: true });

  const buttonText = scene.add.text(0, h * 0.2, 'COMEÇAR JOGO', {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: '34px',
    color: '#0f3b2e',
    align: 'center',
  }).setOrigin(0.5);

  button.on('pointerover', () => button.setFillStyle(0x7de8a1));
  button.on('pointerout',  () => button.setFillStyle(0x63d98a));
  button.on('pointerdown', () => onStart(scene));

  container.add([background, logo, title, button, buttonText]);

  return { container, background, logo };
}
