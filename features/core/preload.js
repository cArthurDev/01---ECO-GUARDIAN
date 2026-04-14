export const FOOD_TEXTURE_KEYS = Array.from({ length: 54 }, (_, index) => `food_${index + 21}`);

export function preload() {
  this.load.image('main_menu_background', 'images/PaginaInicial/paginicial.png');
  this.load.image('button_jogar', 'images/botões/BOTAO_JOGAR.png');
  this.load.image('button_pular', 'images/botões/BOTAO_PULAR.png');
  this.load.image('button_sobre', 'images/botões/BOTAO_SOBRE.png');
  this.load.image('button_voltar', 'images/botões/BOTAO_VOLTAR.png');
  this.load.image('about_background', 'images/PaginaSobre/sobre.png');

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
  this.load.image('heart_zero', 'images/Heart/Zero_Heart.png');
  this.load.image('phase_one',  'images/phase/One_Phase1.png');
  this.load.image('phase_two',  'images/phase/Two_Phase2.png');
  this.load.image('phase_three', 'images/phase/three_Phase3.png');
  this.load.image('points_1', 'images/Points/1_Points.png');
  this.load.image('points_2', 'images/Points/2_Points.png');
  this.load.image('points_3', 'images/Points/3_Points.png');
  this.load.image('points_4', 'images/Points/4_Points.png');
  this.load.image('points_5', 'images/Points/5_Points.png');
  this.load.image('points_6', 'images/Points/6_Points.png');
  this.load.image('points_7', 'images/Points/7_Points.png');
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
