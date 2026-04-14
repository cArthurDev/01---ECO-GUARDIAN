export function createImageButton(scene, textureKey, x, y, targetWidth, onClick) {
  const sourceImage = scene.textures.get(textureKey)?.getSourceImage();
  const sourceWidth = sourceImage?.width || targetWidth || 1;
  const baseScale = targetWidth / sourceWidth;

  const button = scene.add.image(x, y, textureKey)
    .setScale(baseScale)
    .setInteractive({ useHandCursor: true });

  button.baseScale = baseScale;
  button.baseTextureWidth = sourceWidth;
  button.hoverScale = baseScale * 1.05;

  button.setBaseScale = (nextScale) => {
    button.baseScale = nextScale;
    button.hoverScale = nextScale * 1.05;
    button.setScale(nextScale);
  };

  button.on('pointerover', () => button.setScale(button.hoverScale));
  button.on('pointerout', () => button.setScale(button.baseScale));
  button.on('pointerdown', () => onClick(button));

  return button;
}