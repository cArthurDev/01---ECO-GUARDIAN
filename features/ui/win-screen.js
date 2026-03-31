export function buildWinScreen(scene, w, h) {
  const container = scene.add.container(w / 2, h / 2).setDepth(60).setVisible(false);

  const bg = scene.add.rectangle(0, 0, w * 0.72, h * 0.72, 0x0f3b2e, 0.93)
    .setStrokeStyle(4, 0x63d98a);

  const title = scene.add.text(0, -h * 0.18, '🎉 PARABÉNS! 🎉', {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: '46px',
    color: '#ffd700',
    align: 'center',
  }).setOrigin(0.5);

  const subtitle = scene.add.text(0, -h * 0.06, 'Você completou todos os 3 levels!', {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: '24px',
    color: '#f4fff8',
    align: 'center',
  }).setOrigin(0.5);

  const pointsText = scene.add.text(0, h * 0.06, 'Pontuação final: 0', {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: '28px',
    color: '#63d98a',
    align: 'center',
  }).setOrigin(0.5);

  const timeText = scene.add.text(0, h * 0.12, 'Tempo total: 00:00', {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: '24px',
    color: '#87ceeb',
    align: 'center',
  }).setOrigin(0.5);

  const rankingTitle = scene.add.text(0, h * 0.2, 'Ranking (menor tempo)', {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: '22px',
    color: '#f4fff8',
    align: 'center',
  }).setOrigin(0.5);

  const rankingText = scene.add.text(0, h * 0.31, '1. --- 00:00', {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: '18px',
    color: '#d8f8e5',
    align: 'center',
    lineSpacing: 6,
  }).setOrigin(0.5);

  const hint = scene.add.text(0, h * 0.4, 'Pressione R para jogar novamente', {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: '18px',
    color: '#ffffffaa',
    align: 'center',
  }).setOrigin(0.5);

  container.add([bg, title, subtitle, pointsText, timeText, rankingTitle, rankingText, hint]);

  container.setScale(0);
  scene.tweens.add({
    targets: container,
    scale: 1,
    duration: 400,
    ease: 'Back.Out',
  });

  return { container, pointsText, timeText, rankingText };
}
