import { state } from '../core/state.js';
import { triggerEnd } from '../core/game-lifecycle.js';

export const BOSS_LEVEL_INDEX = 2;

function heartTextureForLives(lives) {
  if (lives >= 3) return 'heart_full';
  if (lives === 2) return 'heart_two';
  return 'heart_one';
}

export function losePlayerLife(scene, sourceX = null, options = {}) {
  const { respawnAtSpawn = false } = options;
  if (state.isGameOver || state.isLifeTransition) return;

  const now = scene.time.now;
  if (now < state.nextPlayerDamageMs) return;
  state.nextPlayerDamageMs = now + state.playerDamageCooldownMs;

  const nextLives = Math.max(0, state.playerLives - 1);
  const heartSprite = state.heartSprite;

  state.isLifeTransition = true;
  scene.physics.world.pause();

  if (state.player && state.player.body) {
    const knockDirection = sourceX == null ? -1 : (state.player.x >= sourceX ? 1 : -1);
    state.player.setVelocityX(knockDirection * 220);
    state.player.setVelocityY(-180);
  }

  const finishTransition = () => {
    state.playerLives = nextLives;
    state.isLifeTransition = false;

    if (state.playerLives <= 0) {
      triggerEnd(scene, 'GAME OVER\nSem vidas\nPressione R para reiniciar');
      return;
    }

    if (respawnAtSpawn && state.player && state.playerSpawnPoint) {
      state.player.setPosition(state.playerSpawnPoint.x, state.playerSpawnPoint.y);
      state.player.setVelocity(0, 0);
    }

    if (!state.isPaused && !state.isGameOver) {
      scene.physics.world.resume();
    }
  };

  if (!heartSprite) {
    finishTransition();
    return;
  }

  const targetTexture = heartTextureForLives(nextLives);

  scene.tweens.add({
    targets: heartSprite,
    scale: 2.9,
    duration: 120,
    yoyo: true,
    onComplete: () => {
      scene.tweens.add({
        targets: heartSprite,
        alpha: 0.2,
        duration: 120,
        onComplete: () => {
          heartSprite.setTexture(targetTexture);
          scene.tweens.add({
            targets: heartSprite,
            alpha: 1,
            scale: 2.6,
            duration: 150,
            onComplete: finishTransition,
          });
        },
      });
    },
  });
}

function ensureBossAnimations(scene) {
  if (!scene.anims.exists('boss-fly')) {
    scene.anims.create({
      key: 'boss-fly',
      frames: scene.anims.generateFrameNumbers('boss_fly', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });
  }

  if (!scene.anims.exists('boss-attack')) {
    scene.anims.create({
      key: 'boss-attack',
      frames: scene.anims.generateFrameNumbers('boss_attack', { start: 0, end: 11 }),
      frameRate: 16,
      repeat: 0,
    });
  }

  if (!scene.anims.exists('boss-hit')) {
    scene.anims.create({
      key: 'boss-hit',
      frames: scene.anims.generateFrameNumbers('boss_hit', { start: 0, end: 3 }),
      frameRate: 14,
      repeat: 0,
    });
  }

  if (!scene.anims.exists('boss-die')) {
    scene.anims.create({
      key: 'boss-die',
      frames: scene.anims.generateFrameNumbers('boss_die', { start: 0, end: 16 }),
      frameRate: 14,
      repeat: 0,
    });
  }
}

export function isBossLevel(levelIndex) {
  return levelIndex === BOSS_LEVEL_INDEX;
}

export function spawnBoss(scene, levelIndex) {
  ensureBossAnimations(scene);
  if (!state.bosses) return;

  const bossCount = levelIndex === 2 ? 3 : 5;
  const startX = scene.scale.width * 0.22;
  const gapX = (scene.scale.width * 0.56) / (bossCount - 1);
  const startY = scene.scale.height * 0.2;

  state.bosses.clear(true, true);
  for (let i = 0; i < bossCount; i += 1) {
    const boss = state.bosses.create(startX + (gapX * i), startY + ((i % 2) * 24), 'boss_fly', 0);
    boss.setScale(2.2);
    boss.body.allowGravity = false;
    boss.setCollideWorldBounds(true);
    boss.body.setSize(42, 56, true);
    boss.setData('isDead', false);
    boss.setData('hp', 1);
    boss.setData('nextAttackMs', 0);
    boss.setAlpha(1).setVisible(true);
    boss.play('boss-fly');
  }

  state.bossHpText.setText(`Bosses: ${state.bosses.countActive(true)}`).setVisible(true);
}

export function destroyBoss() {
  if (state.bosses) state.bosses.clear(true, true);
  state.boss = null;
  state.bossHealth = 0;
  state.bossHitsTaken = 0;
  if (state.bossHpText) state.bossHpText.setVisible(false);
}

export function damageBoss(scene, boss, amount = 1) {
  if (!boss || !boss.active || boss.getData('isDead')) return;

  boss.setData('hp', Math.max(0, (boss.getData('hp') || 1) - amount));
  boss.setAlpha(1).setVisible(true);
  boss.play('boss-hit');

  if ((boss.getData('hp') || 0) <= 0) {
    boss.setData('isDead', true);
    boss.body.enable = false;
    boss.setVelocity(0, 0);
    boss.play('boss-die');
    boss.once('animationcomplete-boss-die', () => {
      if (boss && boss.active) boss.destroy();
      if (state.bossHpText && state.bosses) {
        state.bossHpText.setText(`Bosses: ${state.bosses.countActive(true)}`);
      }
    });
    scene.time.delayedCall(1400, () => {
      if (boss && boss.active) boss.destroy();
      if (state.bossHpText && state.bosses) {
        state.bossHpText.setText(`Bosses: ${state.bosses.countActive(true)}`);
      }
    });
    return;
  }

  boss.once('animationcomplete-boss-hit', () => {
    if (boss && boss.active && !boss.getData('isDead')) {
      boss.setAlpha(1).setVisible(true);
      boss.play('boss-fly');
    }
  });
}

export function bossAttackPlayer(scene) {
  if (!state.bosses || !state.player || state.isGameOver || state.isLifeTransition) return;

  const now = scene.time.now;
  let playerDamaged = false;

  state.bosses.children.each((boss) => {
    if (!boss || !boss.active || boss.getData('isDead')) return;

    const nextAttackMs = boss.getData('nextAttackMs') || 0;
    if (now < nextAttackMs) return;

    const distance = Phaser.Math.Distance.Between(boss.x, boss.y, state.player.x, state.player.y);
    if (distance > 84) return;

    boss.setData('nextAttackMs', now + 1000);
    boss.play('boss-attack');
    boss.once('animationcomplete-boss-attack', () => {
      if (boss && boss.active && !boss.getData('isDead')) {
        boss.play('boss-fly');
      }
    });

    if (!playerDamaged) {
      playerDamaged = true;
      losePlayerLife(scene, boss.x);
    }
  });
}

export function updateBoss(scene) {
  if (!state.bosses || !state.player) return;

  let idx = 0;
  state.bosses.children.each((boss) => {
    if (!boss || !boss.active || boss.getData('isDead')) return;

    const offsetX = ((idx % 2 === 0) ? 1 : -1) * (50 + (idx * 8));
    const offsetY = -120 + ((idx % 3) * 24);
    const targetX = state.player.x + offsetX;
    const targetY = Phaser.Math.Clamp(state.player.y + offsetY, 60, scene.scale.height * 0.6);
    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, targetX, targetY);

    boss.setAlpha(1).setVisible(true);
    boss.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);
    boss.setFlipX(boss.body.velocity.x > 0);
    idx += 1;
  });
}
