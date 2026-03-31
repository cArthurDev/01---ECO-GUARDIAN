import { state } from './state.js';
import { togglePause } from './game-lifecycle.js';
import { updatePlayer } from '../entities/player.js';
import { bossAttackPlayer, updateBoss } from '../entities/boss.js';

function shootBullet(scene) {
  if (!state.player || !state.bullets) return;

  const nowMs = scene.time.now;
  if (nowMs - state.lastShotMs < state.shotCooldownMs) return;

  const direction = state.playerFacing || 1;
  const bullet = state.bullets.create(
    state.player.x + (direction * 34),
    state.player.y - 8,
    'bullet',
  );

  bullet.setScale(2);
  bullet.setDepth(8);
  bullet.setFlipX(direction < 0);
  bullet.setAngle(direction < 0 ? 180 : 0);
  bullet.body.allowGravity = false;
  bullet.body.setSize(12, 12, true);
  bullet.setVelocityX(direction * 560);

  state.lastShotMs = nowMs;
}

function cullOffscreenBullets(scene) {
  if (!state.bullets) return;

  const margin = 120;
  const width = scene.scale.width;
  const height = scene.scale.height;

  state.bullets.children.each((bullet) => {
    if (!bullet.active) return;
    if (bullet.x < -margin || bullet.x > width + margin || bullet.y < -margin || bullet.y > height + margin) {
      bullet.destroy();
    }
  });
}

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

  if (state.shootKey && Phaser.Input.Keyboard.JustDown(state.shootKey)) {
    shootBullet(this);
  }

  cullOffscreenBullets(this);
  updatePlayer(this);
  updateBoss(this);
  bossAttackPlayer(this);
}
