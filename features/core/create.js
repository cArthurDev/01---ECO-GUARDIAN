import { state } from './state.js';
import { buildMainMenu } from '../ui/main-menu.js';
import { buildWinScreen } from '../ui/win-screen.js';
import { buildPauseOverlay } from '../ui/pause-overlay.js';
import { startGame, startGameAtLevel } from './game-lifecycle.js';
import { buildLevel } from '../world/level-builder.js';

/* global Phaser */

export function create() {
  const sceneWidth  = this.scale.width;
  const sceneHeight = this.scale.height;

  this.cameras.main.roundPixels = true;
  this.physics.world.setBounds(0, 0, sceneWidth, sceneHeight);

  state.score              = 0;
  state.playerLives        = 3;
  state.isGameOver         = false;
  state.hasGameStarted     = false;
  state.currentLevelIndex  = 0;
  state.elapsedTimeSeconds = 0;
  state.lastTickMs         = this.time.now;
  state.lastShotMs         = 0;

  if (this.textures.exists('background')) {
    state.backgroundImage = this.add.image(sceneWidth / 2, sceneHeight / 2, 'background')
      .setDisplaySize(sceneWidth, sceneHeight)
      .setDepth(-10);
  } else if (this.textures.exists('background_alt')) {
    state.backgroundImage = this.add.image(sceneWidth / 2, sceneHeight / 2, 'background_alt')
      .setDisplaySize(sceneWidth, sceneHeight)
      .setDepth(-10);
  } else {
    this.cameras.main.setBackgroundColor('#87ceeb');
  }

  if (this.textures.exists('clouds')) {
    state.cloudsImage = this.add.image(sceneWidth / 2, sceneHeight / 2, 'clouds')
      .setDisplaySize(sceneWidth, sceneHeight)
      .setDepth(-9)
      .setAlpha(0.75);
  }

  state.platforms = this.physics.add.staticGroup();
  state.coins     = this.physics.add.group();
  state.spikes    = this.physics.add.staticGroup();
  state.skeletons = this.physics.add.group();
  state.bosses    = this.physics.add.group();
  state.bullets   = this.physics.add.group();

  state.cursors  = this.input.keyboard.createCursorKeys();
  state.jumpKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  state.wasdKeys = this.input.keyboard.addKeys({
    up:    Phaser.Input.Keyboard.KeyCodes.W,
    left:  Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
  });
  state.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  state.pauseKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  state.shootKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

  state.scoreText = this.add.text(20, 20, 'Pontos: 0', {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: '22px',
    color: '#0f3b2e',
    backgroundColor: '#ffffffaa',
    padding: { x: 10, y: 6 },
  }).setVisible(false);

  state.levelText = this.add.text(20, 58, 'Level: 1/3', {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: '22px',
    color: '#0f3b2e',
    backgroundColor: '#ffffffaa',
    padding: { x: 10, y: 6 },
  }).setVisible(false);

  state.heartSprite = this.add.image(72, 124, 'heart_full')
    .setScale(2.6)
    .setDepth(20)
    .setVisible(false);

  state.bossHpText = this.add.text(20, 134, 'Boss HP: 0/20', {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: '22px',
    color: '#4a1c1c',
    backgroundColor: '#ffd9d9dd',
    padding: { x: 10, y: 6 },
  }).setVisible(false);

  state.gameOverText = this.add.text(sceneWidth / 2, sceneHeight / 2, '', {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: '44px',
    color: '#ffffff',
    backgroundColor: '#000000bb',
    align: 'center',
    padding: { x: 16, y: 12 },
  }).setOrigin(0.5).setDepth(50).setVisible(false);

  state.winScreen    = buildWinScreen(this, sceneWidth, sceneHeight);
  state.mainMenu     = buildMainMenu(this, sceneWidth, sceneHeight, (scene) => startGame(scene, buildLevel));
  state.pauseOverlay = buildPauseOverlay(this, sceneWidth, sceneHeight);

  let scoreTapCount = 0;
  let lastScoreTapMs = 0;
  const secretTapWindowMs = 1300;

  const debugMenu = this.add.container(sceneWidth / 2, sceneHeight / 2).setDepth(90).setVisible(false);
  const debugBackdrop = this.add.rectangle(0, 0, sceneWidth, sceneHeight, 0x000000, 0.45)
    .setInteractive({ useHandCursor: true });
  const debugPanel = this.add.rectangle(0, 0, 420, 320, 0x0f3b2e, 0.95)
    .setStrokeStyle(4, 0x63d98a);
  const debugTitle = this.add.text(0, -112, 'MENU SECRETO', {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: '34px',
    color: '#f4fff8',
    align: 'center',
  }).setOrigin(0.5);
  const debugHint = this.add.text(0, 116, 'Clique fora para fechar', {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: '18px',
    color: '#b7f2cd',
    align: 'center',
  }).setOrigin(0.5);

  const buildJumpButton = (y, label, levelIndex) => {
    const button = this.add.rectangle(0, y, 290, 56, 0x63d98a)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });

    const text = this.add.text(0, y, label, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '26px',
      color: '#0f3b2e',
      align: 'center',
    }).setOrigin(0.5);

    button.on('pointerover', () => button.setFillStyle(0x79eaa1));
    button.on('pointerout', () => button.setFillStyle(0x63d98a));
    button.on('pointerdown', () => {
      debugMenu.setVisible(false);
      startGameAtLevel(this, buildLevel, levelIndex);
    });

    return [button, text];
  };

  const [phase1Btn, phase1Txt] = buildJumpButton(-40, 'IR PARA FASE 1', 0);
  const [phase2Btn, phase2Txt] = buildJumpButton(30, 'IR PARA FASE 2', 1);
  const [phase3Btn, phase3Txt] = buildJumpButton(100, 'IR PARA FASE 3', 2);

  debugBackdrop.on('pointerdown', () => debugMenu.setVisible(false));
  debugMenu.add([
    debugBackdrop,
    debugPanel,
    debugTitle,
    phase1Btn,
    phase1Txt,
    phase2Btn,
    phase2Txt,
    phase3Btn,
    phase3Txt,
    debugHint,
  ]);

  state.scoreText
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      if (!state.hasGameStarted || !state.scoreText.visible) return;

      const now = this.time.now;
      if (now - lastScoreTapMs > secretTapWindowMs) {
        scoreTapCount = 0;
      }

      scoreTapCount += 1;
      lastScoreTapMs = now;

      if (scoreTapCount >= 4) {
        scoreTapCount = 0;
        debugMenu.setVisible(true);
      }
    });

  this.scale.on('resize', (gameSize) => {
    const { width, height } = gameSize;
    this.physics.world.setBounds(0, 0, width, height);

    if (state.backgroundImage) {
      state.backgroundImage.setPosition(width / 2, height / 2);
      state.backgroundImage.setDisplaySize(width, height);
    }

    if (state.cloudsImage) {
      state.cloudsImage.setPosition(width / 2, height / 2);
      state.cloudsImage.setDisplaySize(width, height);
    }

    state.gameOverText.setPosition(width / 2, height / 2);
    state.winScreen.container.setPosition(width / 2, height / 2);
    state.mainMenu.container.setPosition(width / 2, height / 2);
    state.mainMenu.background.setSize(width * 0.65, height * 0.65);
    state.mainMenu.logo.setScale(Math.min(width / 900, height / 700) * 0.7);
    state.pauseOverlay.container.setPosition(width / 2, height / 2);
    state.pauseOverlay.background.setSize(width * 0.55, height * 0.4);

    debugMenu.setPosition(width / 2, height / 2);
    debugBackdrop.setSize(width, height);
  });
}
