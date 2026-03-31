import { state } from '../core/state.js';
import { PLAYER_SPEED, PLAYER_JUMP, TILE_SIZE, PIXEL_SCALE } from '../world/constants.js';
import { PLAYER_TEXTURES } from '../world/levels.js';
import { triggerEnd } from '../core/game-lifecycle.js';

export function createPlayer(scene, spawnPoint, levelIndex) {
  const playerTexture = PLAYER_TEXTURES[Math.min(levelIndex, PLAYER_TEXTURES.length - 1)];
  const player = scene.physics.add.sprite(spawnPoint.x, spawnPoint.y, playerTexture);

  player.setCollideWorldBounds(false);
  player.setBounce(0.02);

  const platformVisualSize = TILE_SIZE * PIXEL_SCALE;
  player.setScale(platformVisualSize / player.height);
  player.body.setSize(player.width, player.height, true);

  return player;
}

export function updatePlayer(scene) {
  if (!state.player || !state.cursors) return;

  const moveLeft = state.cursors.left.isDown || state.wasdKeys.left.isDown;
  const moveRight = state.cursors.right.isDown || state.wasdKeys.right.isDown;
  const jumpPressed = state.cursors.up.isDown || state.jumpKey.isDown || state.wasdKeys.up.isDown;

  if (moveLeft) {
    state.player.setVelocityX(-PLAYER_SPEED);
    state.playerFacing = -1;
  } else if (moveRight) {
    state.player.setVelocityX(PLAYER_SPEED);
    state.playerFacing = 1;
  } else {
    state.player.setVelocityX(0);
  }

  const touchingGround = state.player.body.blocked.down || state.player.body.touching.down;
  if (jumpPressed && touchingGround) {
    state.player.setVelocityY(PLAYER_JUMP);
  }

  if (state.player.y > scene.scale.height + state.player.displayHeight) {
    triggerEnd(scene, 'GAME OVER\nPressione R para reiniciar');
  }
}
