import { state } from './state.js';
import { togglePause } from './game-lifecycle.js';
import { updatePlayer } from '../entities/player.js';
import { bossAttackPlayer, updateBoss, updateBossSurvival } from '../entities/boss.js';
import { updateSkeletonPatrol } from '../world/level-builder.js';

export function update() {
  if (!state.hasGameStarted) return;

  if (state.pauseKey && Phaser.Input.Keyboard.JustDown(state.pauseKey) && !state.isGameOver) {
    togglePause(this);
  }

  if (state.isGameOver) {
    if (state.restartKey && Phaser.Input.Keyboard.JustDown(state.restartKey)) {
      this.scene.restart();
    }
    return;
  }

  if (state.isPaused) return;
  if (!state.player || !state.cursors) return;

  const nowMs = this.time.now;
  const deltaSeconds = (nowMs - state.lastTickMs) / 1000;
  state.lastTickMs = nowMs;
  state.elapsedTimeSeconds += deltaSeconds;

  updateBossSurvival(this, deltaSeconds);
  if (state.isGameOver) return;

  updateSkeletonPatrol(this);
  updatePlayer(this);
  updateBoss(this);
  bossAttackPlayer(this);
}
