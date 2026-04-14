import { state } from '../core/state.js';
import { triggerEnd } from '../core/game-lifecycle.js';
import { triggerWin } from '../core/game-lifecycle.js';

export const BOSS_LEVEL_INDEX = 2;
const FINAL_BOSS_COUNT = 2;
const BOSS_SURVIVAL_SECONDS = 30;
const BOSS_ATTACK_TRIGGER_DISTANCE = 52;
const BOSS_ATTACK_HIT_DISTANCE = 46;
const BOSS_ATTACK_INTERVAL_MS = 1650;
const BOSS_ENTRY_STAGGER_MS = 320;
const BOSS_ENTRY_DURATION_MS = 980;

function aliveBossesCount() {
  if (!state.bosses) return 0;

  let count = 0;
  state.bosses.children.each((boss) => {
    if (!boss || !boss.active || boss.getData('isDead')) return;
    count += 1;
  });
  return count;
}

function updateSurvivalLabel() {
  if (!state.bossHpText) return;

  const remainingBosses = aliveBossesCount();
  const remainingSeconds = Math.ceil(state.bossSurvivalRemainingSeconds);
  state.bossHpText.setText(`Bosses: ${remainingBosses} | Proximo em: ${remainingSeconds}s`).setVisible(true);
}

function eliminateOneBoss(scene) {
  if (!state.bosses) return;

  let targetBoss = null;
  state.bosses.children.each((boss) => {
    if (targetBoss || !boss || !boss.active || boss.getData('isDead')) return;
    targetBoss = boss;
  });

  if (!targetBoss) return;

  targetBoss.setData('isDead', true);
  targetBoss.body.enable = false;
  targetBoss.setVelocity(0, 0);
  targetBoss.play('boss-die');
  targetBoss.once('animationcomplete-boss-die', () => {
    if (targetBoss && targetBoss.active) targetBoss.destroy();
  });
  scene.time.delayedCall(1400, () => {
    if (targetBoss && targetBoss.active) targetBoss.destroy();
  });
}

function heartTextureForLives(lives) {
  if (lives >= 3) return 'heart_full';
  if (lives === 2) return 'heart_two';
  if (lives === 1) return 'heart_one';
  return 'heart_zero';
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

  if (!scene.anims.exists('boss-spawn')) {
    scene.anims.create({
      key: 'boss-spawn',
      frames: scene.anims.generateFrameNumbers('boss_spawn', { start: 0, end: 7 }),
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

  const bossCount = levelIndex === BOSS_LEVEL_INDEX ? FINAL_BOSS_COUNT : 5;
  const startX = scene.scale.width * 0.22;
  const gapX = (scene.scale.width * 0.56) / (bossCount - 1);
  const startY = scene.scale.height * 0.2;
  const entryY = scene.scale.height + 72;

  state.bosses.clear(true, true);
  for (let i = 0; i < bossCount; i += 1) {
    const targetX = startX + (gapX * i);
    const targetY = startY + ((i % 2) * 24);
    const boss = state.bosses.create(targetX, entryY, 'boss_spawn', 0);
    boss.setScale(2.2);
    boss.body.allowGravity = false;
    boss.setCollideWorldBounds(true);
    boss.body.setSize(42, 56, true);
    boss.body.enable = false;
    boss.setData('isDead', false);
    boss.setData('isSpawning', true);
    boss.setData('isAttacking', false);
    boss.setData('hp', 1);
    boss.setData('nextAttackMs', 0);
    boss.setAlpha(1).setVisible(true);
    boss.play('boss-spawn');

    scene.tweens.add({
      targets: boss,
      y: targetY,
      delay: i * BOSS_ENTRY_STAGGER_MS,
      duration: BOSS_ENTRY_DURATION_MS,
      ease: 'Back.Out',
      onStart: () => {
        if (boss && boss.active && !boss.getData('isDead')) {
          boss.play('boss-spawn', true);
        }
      },
      onComplete: () => {
        if (!boss || !boss.active || boss.getData('isDead')) return;
        boss.setData('isSpawning', false);
        if (boss.body) boss.body.enable = true;
        boss.play('boss-fly');
      },
    });
  }

  if (levelIndex === BOSS_LEVEL_INDEX) {
    state.bossSurvivalActive = true;
    state.bossSurvivalRemainingSeconds = BOSS_SURVIVAL_SECONDS;
    updateSurvivalLabel();
    return;
  }

  state.bossSurvivalActive = false;
  state.bossSurvivalRemainingSeconds = 0;
  state.bossHpText.setText(`Bosses: ${state.bosses.countActive(true)}`).setVisible(true);
}

export function destroyBoss() {
  if (state.bosses) state.bosses.clear(true, true);
  state.boss = null;
  state.bossHealth = 0;
  state.bossHitsTaken = 0;
  state.bossSurvivalActive = false;
  state.bossSurvivalRemainingSeconds = 0;
  if (state.bossHpText) state.bossHpText.setVisible(false);
}

export function updateBossSurvival(scene, deltaSeconds) {
  if (!state.bossSurvivalActive || state.currentLevelIndex !== BOSS_LEVEL_INDEX || state.isGameOver) return;

  state.bossSurvivalRemainingSeconds = Math.max(0, state.bossSurvivalRemainingSeconds - deltaSeconds);
  updateSurvivalLabel();

  if (state.bossSurvivalRemainingSeconds > 0) return;

  eliminateOneBoss(scene);
  const remainingBosses = aliveBossesCount();

  if (remainingBosses <= 0) {
    state.bossSurvivalActive = false;
    if (state.bosses) state.bosses.clear(true, true);
    triggerWin(scene);
    return;
  }

  state.bossSurvivalRemainingSeconds = BOSS_SURVIVAL_SECONDS;
  updateSurvivalLabel();
}

export function damageBoss(scene, boss, amount = 1) {
  if (!boss || !boss.active || boss.getData('isDead') || boss.getData('isSpawning')) return;

  boss.setData('hp', Math.max(0, (boss.getData('hp') || 1) - amount));
  boss.setData('isAttacking', false);
  boss.setAlpha(1).setVisible(true);
  boss.play('boss-hit');

  if ((boss.getData('hp') || 0) <= 0) {
    boss.setData('isDead', true);
    boss.body.enable = false;
    boss.setVelocity(0, 0);
    boss.play('boss-die');

    const onBossRemoved = () => {
      if (state.bossHpText && state.bosses) {
        state.bossHpText.setText(`Bosses: ${state.bosses.countActive(true)}`);
      }

      if (state.currentLevelIndex === BOSS_LEVEL_INDEX && aliveBossesCount() <= 0) {
        state.bossSurvivalActive = false;
        triggerWin(scene);
      }
    };

    boss.once('animationcomplete-boss-die', () => {
      if (boss && boss.active) boss.destroy();
      onBossRemoved();
    });
    scene.time.delayedCall(1400, () => {
      if (boss && boss.active) boss.destroy();
      onBossRemoved();
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
  let appliedDamageThisTick = false;

  state.bosses.children.each((boss) => {
    if (!boss || !boss.active || boss.getData('isDead') || boss.getData('isSpawning')) return;
    if (boss.getData('isAttacking')) return;

    const nextAttackMs = boss.getData('nextAttackMs') || 0;
    if (now < nextAttackMs) return;

    const distance = Phaser.Math.Distance.Between(boss.x, boss.y, state.player.x, state.player.y);
    if (distance > BOSS_ATTACK_TRIGGER_DISTANCE) return;

    boss.setData('nextAttackMs', now + BOSS_ATTACK_INTERVAL_MS);
    boss.setData('isAttacking', true);
    boss.play('boss-attack');

    if (!appliedDamageThisTick && distance <= BOSS_ATTACK_HIT_DISTANCE) {
      appliedDamageThisTick = true;
      losePlayerLife(scene, boss.x);
    }

    boss.once('animationcomplete-boss-attack', () => {
      if (boss && boss.active && !boss.getData('isDead')) {
        boss.setData('isAttacking', false);
        boss.play('boss-fly');
      }
    });
  });
}

export function updateBoss(scene) {
  if (!state.bosses || !state.player) return;

  let idx = 0;
  state.bosses.children.each((boss) => {
    if (!boss || !boss.active || boss.getData('isDead') || boss.getData('isSpawning')) return;
    if (boss.getData('isAttacking')) {
      if (boss.body) boss.setVelocity(0, 0);
      return;
    }

    const offsetX = ((idx % 2 === 0) ? 1 : -1) * (50 + (idx * 8));
    const baseOffsetY = idx % 2 === 0 ? -28 : 34;
    const verticalWave = Math.sin((scene.time.now / 260) + idx) * 92;
    const targetX = state.player.x + offsetX;
    const targetY = Phaser.Math.Clamp(state.player.y + baseOffsetY + verticalWave, 40, scene.scale.height - 40);
    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, targetX, targetY);

    boss.setAlpha(1).setVisible(true);
    boss.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);
    boss.setFlipX(boss.body.velocity.x > 0);
    idx += 1;
  });
}
