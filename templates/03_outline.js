const { createCanvas } = require('canvas');

module.exports = async function outlineTemplate(image, overlayText, targetWidth, targetHeight) {
  // Canvas anlegen
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // Bild zeichnen
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  // Passepartout (weiße Linie)
  const outlineWidth = Math.max(targetWidth, targetHeight) * 0.01; // 1% der längsten Seite
  const outlineMargin = Math.max(targetWidth, targetHeight) * 0.02; // 2% Abstand vom Rand

  ctx.strokeStyle = 'white';
  ctx.lineWidth = outlineWidth;
  ctx.strokeRect(
    outlineMargin,
    outlineMargin,
    targetWidth - 2 * outlineMargin,
    targetHeight - 2 * outlineMargin
  );

  // Farbfläche für den Text
  const boxHeight = targetHeight * 0.08;         // 8% der Höhe
  const boxMarginBottom = targetHeight * 0.03;   // 3% Abstand vom unteren Bildrand
  const boxPaddingX = targetWidth * 0.03;        // 3% seitlicher Innenabstand

  ctx.fillStyle = 'black';
  ctx.fillRect(
    boxPaddingX,
    targetHeight - boxHeight - boxMarginBottom,
    targetWidth - 2 * boxPaddingX,
    boxHeight
  );

  // Text
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.floor(boxHeight * 0.4)}px 'Open Sans'`; // 40% der Boxhöhe als Schriftgröße

  ctx.fillText(
    overlayText,
    targetWidth / 2,
    targetHeight - boxHeight / 2 - boxMarginBottom
  );

  return canvas;
};
