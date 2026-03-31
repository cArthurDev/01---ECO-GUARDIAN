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

  const hint = scene.add.text(0, 35, 'Pressione ESC para continuar', {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: '24px',
    color: '#63d98a',
    align: 'center',
  }).setOrigin(0.5);

  container.add([background, title, hint]);
  return { container, background };
}
