import { state } from '../core/state.js';
import { TILE_SIZE, PIXEL_SCALE, LEVEL_PLATFORM, LEVEL_COIN, LEVEL_PLAYER, LEVEL_SPIKE } from './constants.js';
import { LEVELS } from './levels.js';
import { FOOD_TEXTURE_KEYS } from '../core/preload.js';
import { triggerWin, triggerEnd } from '../core/game-lifecycle.js';
import { createPlayer } from '../entities/player.js';
import { damageBoss, destroyBoss, isBossLevel, losePlayerLife, spawnBoss } from '../entities/boss.js';

function ensureSkeletonAnimations(scene) {
  if (!scene.anims.exists('skeleton-idle')) {
    scene.anims.create({
      key: 'skeleton-idle',
      frames: scene.anims.generateFrameNumbers('skeleton_idle', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1,
    });
  }

  if (!scene.anims.exists('skeleton-hurt')) {
    scene.anims.create({
      key: 'skeleton-hurt',
      frames: scene.anims.generateFrameNumbers('skeleton_hurt', { start: 0, end: 1 }),
      frameRate: 10,
      repeat: 0,
    });
  }
}

function spawnSkeletons(scene, level, offsetX, offsetY, cellSize) {
  level.forEach((row, rowIndex) => {
    let segmentStart = -1;

    for (let colIndex = 0; colIndex <= row.length; colIndex += 1) {
      const current = row[colIndex] || ' ';
      const aboveRow = level[rowIndex - 1] || '';
      const isPlatform = current === LEVEL_PLATFORM;
      const hasSpaceAbove = aboveRow[colIndex] !== LEVEL_PLATFORM;

      if (isPlatform && hasSpaceAbove && segmentStart === -1) {
        segmentStart = colIndex;
      }

      const reachedEnd = segmentStart !== -1 && (!isPlatform || !hasSpaceAbove || colIndex === row.length);
      if (!reachedEnd) continue;

      const segmentEnd = colIndex === row.length && isPlatform ? colIndex : colIndex - 1;
      const segmentLength = segmentEnd - segmentStart + 1;

      if (segmentLength >= 2) {
        const middleCol = segmentStart + Math.floor(segmentLength / 2);
        const x = offsetX + middleCol * cellSize + cellSize / 2;
        const platformCenterY = offsetY + rowIndex * cellSize + cellSize / 2;

        const skeleton = state.skeletons.create(x, platformCenterY - cellSize, 'skeleton_idle', 0);
        skeleton.setScale(PIXEL_SCALE / 4);
        skeleton.setImmovable(true);
        skeleton.body.allowGravity = false;
        skeleton.body.setSize(42, 56, true);
        skeleton.setData('isDead', false);
        skeleton.play('skeleton-idle');
      }

      segmentStart = -1;
    }
  });
}

function killSkeleton(scene, skeleton) {
  if (!skeleton || !skeleton.active || skeleton.getData('isDead')) return;

  skeleton.setData('isDead', true);
  skeleton.body.enable = false;
  skeleton.setVelocity(0, 0);
  skeleton.play('skeleton-hurt');

  skeleton.once('animationcomplete-skeleton-hurt', () => {
    if (skeleton && skeleton.active) skeleton.destroy();
  });

  scene.time.delayedCall(500, () => {
    if (skeleton && skeleton.active) skeleton.destroy();
  });
}

function handleSkeletonCollision(scene, player, skeleton) {
  if (!player || !skeleton || state.isGameOver || skeleton.getData('isDead')) return;

  const isFalling = player.body.velocity.y > 0;
  const isAboveNow = player.body.bottom <= skeleton.body.top + 20;
  const wasAboveBefore = player.body.prev.y + player.body.height <= skeleton.body.prev.y + 10;
  const isStomp = isFalling && (isAboveNow || wasAboveBefore);

  if (isStomp) {
    killSkeleton(scene, skeleton);
    player.setVelocityY(-380);
    return;
  }

  losePlayerLife(scene, skeleton.x);
}

export function buildLevel(scene, levelIndex) {
  const level = LEVELS[levelIndex];
  const sceneWidth = scene.scale.width;
  const bossLevel = isBossLevel(levelIndex);

  ensureSkeletonAnimations(scene);

  state.platforms.clear(true, true);
  state.coins.clear(true, true);
  state.spikes.clear(true, true);
  state.skeletons.clear(true, true);
  state.bosses.clear(true, true);
  state.bullets.clear(true, true);
  destroyBoss();

  if (state.player) state.player.destroy();
  if (state.playerPlatformCollider) state.playerPlatformCollider.destroy();
  if (state.coinPlatformCollider) state.coinPlatformCollider.destroy();
  if (state.skeletonPlatformCollider) state.skeletonPlatformCollider.destroy();
  if (state.bulletPlatformCollider) state.bulletPlatformCollider.destroy();
  if (state.playerBossCollider) state.playerBossCollider.destroy();
  if (state.playerCoinOverlap) state.playerCoinOverlap.destroy();
  if (state.playerSpikeOverlap) state.playerSpikeOverlap.destroy();
  if (state.playerSkeletonCollider) state.playerSkeletonCollider.destroy();
  if (state.bulletSkeletonOverlap) state.bulletSkeletonOverlap.destroy();
  if (state.bulletBossOverlap) state.bulletBossOverlap.destroy();

  const cellSize = TILE_SIZE * PIXEL_SCALE;
  const levelWidthPx = level[0].length * cellSize;
  const offsetX = Math.max(0, Math.floor((sceneWidth - levelWidthPx) / 2));
  const offsetY = TILE_SIZE * 3;

  let spawnPoint = { x: offsetX + cellSize * 1.5, y: offsetY + cellSize * 8 };

  level.forEach((row, rowIndex) => {
    row.split('').forEach((cell, colIndex) => {
      const x = offsetX + colIndex * cellSize + cellSize / 2;
      const y = offsetY + rowIndex * cellSize + cellSize / 2;

      if (cell === LEVEL_PLATFORM) {
        const leftIsPlatform  = row[colIndex - 1] === LEVEL_PLATFORM;
        const rightIsPlatform = row[colIndex + 1] === LEVEL_PLATFORM;

        let textureKey = 'platform_single';
        if (!leftIsPlatform && rightIsPlatform)  textureKey = 'platform_left';
        else if (leftIsPlatform && rightIsPlatform) textureKey = 'platform_mid';
        else if (leftIsPlatform && !rightIsPlatform) textureKey = 'platform_right';

        const platform = state.platforms.create(x, y, textureKey).setScale(PIXEL_SCALE);
        platform.refreshBody();
        platform.body.checkCollision.up    = true;
        platform.body.checkCollision.down  = false;
        platform.body.checkCollision.left  = false;
        platform.body.checkCollision.right = false;
      }

      if (cell === LEVEL_COIN) {
        const randomIndex = Phaser.Math.RND.between(0, FOOD_TEXTURE_KEYS.length - 1);
        const randomFoodKey = FOOD_TEXTURE_KEYS[randomIndex];
        const coin = state.coins.create(x, y, randomFoodKey);
        coin.setScale(2);
      }

      if (cell === LEVEL_SPIKE) {
        const spike = state.spikes.create(x, y, 'spike').setScale(PIXEL_SCALE);
        spike.refreshBody();
      }

      if (cell === LEVEL_PLAYER) {
        spawnPoint = { x, y };
      }
    });
  });

  if (!bossLevel) {
    spawnSkeletons(scene, level, offsetX, offsetY, cellSize);
  }

  state.player = createPlayer(scene, spawnPoint, levelIndex);
  state.playerSpawnPoint = { x: spawnPoint.x, y: spawnPoint.y };

  if (bossLevel) {
    spawnBoss(scene, levelIndex);
  } else {
    state.bossHpText.setVisible(false);
  }

  state.coins.children.iterate((child) => {
    child.setBounceY(Phaser.Math.FloatBetween(0.2, 0.4));
  });

  state.playerPlatformCollider = scene.physics.add.collider(state.player, state.platforms);
  state.coinPlatformCollider   = scene.physics.add.collider(state.coins, state.platforms);
  state.skeletonPlatformCollider = scene.physics.add.collider(state.skeletons, state.platforms);
  state.bulletPlatformCollider = scene.physics.add.collider(state.bullets, state.platforms, (bullet) => {
    if (bullet && bullet.active) bullet.destroy();
  });
  state.playerSkeletonCollider = scene.physics.add.collider(
    state.player,
    state.skeletons,
    (player, skeleton) => handleSkeletonCollision(scene, player, skeleton),
  );
  state.playerBossCollider = null;
  state.bulletSkeletonOverlap = scene.physics.add.overlap(state.bullets, state.skeletons, (bullet, skeleton) => {
    if (!bullet || !skeleton || !bullet.active || skeleton.getData('isDead')) return;
    bullet.destroy();
    killSkeleton(scene, skeleton);
  });
  if (bossLevel) {
    state.bulletBossOverlap = scene.physics.add.overlap(state.bullets, state.bosses, (bullet, boss) => {
      if (!bullet || !boss || !bullet.active || boss.getData('isDead') || bullet.getData('bossHitApplied')) return;
      bullet.setData('bossHitApplied', true);
      if (bullet.body) bullet.body.enable = false;
      bullet.destroy();
      damageBoss(scene, boss, 1);
    });
  } else {
    state.bulletBossOverlap = null;
  }

  state.playerSpikeOverlap = scene.physics.add.overlap(state.player, state.spikes, () => {
    if (state.isGameOver) return;
    losePlayerLife(scene, null, { respawnAtSpawn: true });
  });

  state.playerCoinOverlap = scene.physics.add.overlap(state.player, state.coins, (_, coin) => {
    if (state.isGameOver) return;
    coin.disableBody(true, true);
    state.score += 10;
    state.scoreText.setText(`Pontos: ${state.score}`);
    if (state.coins.countActive(true) === 0) {
      goToNextLevel(scene);
    }
  });

  state.levelText.setText(`Level: ${levelIndex + 1}/3`);
}

export function goToNextLevel(scene) {
  if (state.currentLevelIndex < LEVELS.length - 1) {
    state.currentLevelIndex += 1;
    buildLevel(scene, state.currentLevelIndex);
    return;
  }
  triggerWin(scene);
}
