export const FOOD_TEXTURE_KEYS = Array.from({ length: 54 }, (_, index) => `food_${index + 21}`);

export function preload() {
  this.load.image('logo', 'images/Logo/logo.png');

  this.load.image('platform_left',   'images/Sprites/plataforma_esquerda.png');
  this.load.image('platform_mid',    'images/Sprites/plataforma_meio.png');
  this.load.image('platform_right',  'images/Sprites/plataforma_direita.png');
  this.load.image('platform_single', 'images/Sprites/plataforma_unica.png');

  FOOD_TEXTURE_KEYS.forEach((textureKey, index) => {
    const fileNumber = index + 21;
    this.load.image(textureKey, `images/Foods/${fileNumber}.png`);
  });
  this.load.image('spike',      'images/Sprites/espinhos.png');
  this.load.image('bullet',     'images/Sprites/bullet.png');
  this.load.image('heart_full', 'images/Heart/Full_Heart.png');
  this.load.image('heart_two',  'images/Heart/Two_Heart.png');
  this.load.image('heart_one',  'images/Heart/One_Heart.png');
  this.load.image('background', 'images/Sprites/background.jpg');
  this.load.image('clouds',     'images/Sprites/cloud.png');

  this.load.spritesheet('skeleton_idle', 'images/Skeleton/skeleton_Idle.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
  this.load.spritesheet('skeleton_hurt', 'images/Skeleton/skeleton_Hurt.png', {
    frameWidth: 64,
    frameHeight: 64,
  });

  this.load.spritesheet('boss_fly', 'images/Enemy3/Enemy3-Movement-In-Animation/Enemy3-Fly.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
  this.load.spritesheet('boss_attack', 'images/Enemy3/Enemy3-Movement-In-Animation/Enemy3-AttackSmashStart.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
  this.load.spritesheet('boss_hit', 'images/Enemy3/Enemy3-Movement-In-Animation/Enemy3-Hit-NoVFX.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
  this.load.spritesheet('boss_die', 'images/Enemy3/Enemy3-Movement-In-Animation/Enemy3-Die.png', {
    frameWidth: 64,
    frameHeight: 64,
  });

  this.load.image('player',  'images/Player/player.png');
  this.load.image('player2', 'images/Player/player2.png');
  this.load.image('player3', 'images/Player/player3.png');
}
