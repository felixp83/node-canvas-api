const { createCanvas } = require('canvas');

module.exports = async function centerCrop(img) {
  // Zielgröße (kannst du anpassen)
  const targetWidth = 1000;
  const targetHeight = 1500;

  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // Berechne Crop-Startpunkt (zentriert)
  const sx = Math.max(0, (img.width - targetWidth) / 2);
  const sy = Math.max(0, (img.height - targetHeight) / 2);

  ctx.drawImage(
    img,
    sx, sy, targetWidth, targetHeight, // Quelle (Crop-Bereich)
    0, 0, targetWidth, targetHeight    // Ziel (Canvas)
  );

  return canvas;
};
