import { state } from './state.js';
import { playVideo } from './video-player.js';

const RANKING_STORAGE_KEY = 'eco-guardian-ranking-v1';
const MAX_RANKING_ENTRIES = 10;

function sanitizeNickname(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return 'Jogador';
  return trimmed.slice(0, 18);
}

function askNickname() {
  if (typeof window === 'undefined' || typeof window.prompt !== 'function') {
    return 'Jogador';
  }

  const raw = window.prompt('Digite seu nickname para esta partida:', state.currentNickname || 'Jogador');
  return sanitizeNickname(raw);
}

function loadRanking() {
  if (typeof window === 'undefined' || !window.localStorage) return [];

  try {
    const raw = window.localStorage.getItem(RANKING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry) => entry && typeof entry.nickname === 'string' && Number.isFinite(entry.timeSeconds))
      .map((entry) => ({
        nickname: sanitizeNickname(entry.nickname),
        timeSeconds: Math.max(0, Math.floor(entry.timeSeconds)),
        score: Number.isFinite(entry.score) ? entry.score : 0,
      }));
  } catch {
    return [];
  }
}

function saveRanking(entries) {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    window.localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignora erro de storage sem bloquear o jogo.
  }
}

function buildRankingLines(entries) {
  if (!entries.length) {
    return 'Nenhum tempo salvo ainda.';
  }

  return entries
    .slice(0, 5)
    .map((entry, idx) => `${idx + 1}. ${entry.nickname} - ${formatElapsedTime(entry.timeSeconds)}`)
    .join('\n');
}

export function startGame(scene, buildLevelFn) {
  startGameAtLevel(scene, buildLevelFn, 0);
}

export async function startGameAtLevel(scene, buildLevelFn, levelIndex) {
  // Se é o primeiro level (0), reproduz vídeo inicial
  if (levelIndex === 0) {
    await playVideo('Story/Inicial.mp4');
  }

  state.currentNickname = askNickname();

  state.hasGameStarted = true;
  state.isGameOver = false;
  state.isPaused = false;
  state.currentLevelIndex = Math.max(0, Math.min(levelIndex, 2));
  state.score = 0;
  state.playerLives = 3;
  state.isLifeTransition = false;
  state.elapsedTimeSeconds = 0;
  state.lastTickMs = scene.time.now;

  state.mainMenu.container.setVisible(false);
  state.winScreen.container.setVisible(false);
  state.pauseOverlay.container.setVisible(false);
  state.gameOverText.setVisible(false);
  scene.physics.world.resume();

  state.scoreText.setText('Pontos: 0').setVisible(true);
  state.levelText.setText(`Level: ${state.currentLevelIndex + 1}/3`).setVisible(true);
  if (state.heartSprite) {
    state.heartSprite.setTexture('heart_full').setAlpha(1).setScale(2.6).setVisible(true);
  }
  state.bossHpText.setVisible(false);

  buildLevelFn(scene, state.currentLevelIndex);
}

export function togglePause(scene) {
  state.isPaused = !state.isPaused;

  if (state.isPaused) {
    if (state.player) state.player.setVelocity(0, 0);
    scene.physics.world.pause();
    state.pauseOverlay.container.setVisible(true);
    return;
  }

  scene.physics.world.resume();
  state.pauseOverlay.container.setVisible(false);
  state.lastTickMs = scene.time.now;
}

export function triggerEnd(scene, message) {
  state.isGameOver = true;
  state.isPaused = false;
  scene.physics.world.resume();
  state.pauseOverlay.container.setVisible(false);
  state.player.setVelocity(0, 0);
  state.player.body.enable = false;
  state.gameOverText.setText(message);
  state.gameOverText.setVisible(true);
}

export async function triggerWin(scene) {
  state.isGameOver = true;
  state.player.setVelocity(0, 0);
  state.player.body.enable = false;

  // Reproduz vídeo final se chegou na última fase
  if (state.currentLevelIndex === 2) {
    await playVideo('Story/Final.mp4');
  }

  const ranking = loadRanking();
  ranking.push({
    nickname: sanitizeNickname(state.currentNickname),
    timeSeconds: Math.floor(state.elapsedTimeSeconds),
    score: state.score,
  });

  ranking.sort((a, b) => a.timeSeconds - b.timeSeconds);
  const trimmedRanking = ranking.slice(0, MAX_RANKING_ENTRIES);
  state.ranking = trimmedRanking;
  saveRanking(trimmedRanking);

  state.winScreen.pointsText.setText(`Pontuação final: ${state.score}`);
  state.winScreen.timeText.setText(`Tempo total: ${formatElapsedTime(state.elapsedTimeSeconds)}`);
  state.winScreen.rankingText.setText(buildRankingLines(trimmedRanking));
  state.winScreen.container.setVisible(true);

  const starColors = [0xffd700, 0xff6b6b, 0x63d98a, 0x87ceeb, 0xffa500];
  for (let i = 0; i < 60; i++) {
    scene.time.delayedCall(i * 60, () => {
      const sx = Phaser.Math.Between(0, scene.scale.width);
      const sy = Phaser.Math.Between(0, scene.scale.height * 0.6);
      const star = scene.add.rectangle(
        sx, sy, 8, 8,
        starColors[Phaser.Math.Between(0, starColors.length - 1)],
      ).setDepth(49);

      scene.tweens.add({
        targets: star,
        y: sy + Phaser.Math.Between(60, 180),
        alpha: 0,
        duration: Phaser.Math.Between(600, 1200),
        ease: 'Power2',
        onComplete: () => star.destroy(),
      });
    });
  }
}

export function formatElapsedTime(totalSeconds) {
  const total = Math.floor(totalSeconds);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
