const { createCanvas } = require('canvas');

module.exports = async function bottomLeftCrop(img) {
  const targetWidth = 1000;
  const targetHeight = 1500;
  const targetRatio = targetWidth / targetHeight; // ≈0.6667

  const imgWidth = img.width;
  const imgHeight = img.height;
  const imgRatio = imgWidth / imgHeight;

  let cropWidth, cropHeight;

  if (imgWidth >= targetWidth && imgHeight >= targetHeight) {
    cropWidth = targetWidth;
    cropHeight = targetHeight;
  } else {
    if (imgRatio > targetRatio) {
      cropHeight = imgHeight;
      cropWidth = cropHeight * targetRatio;
    } else {
      cropWidth = imgWidth;
      cropHeight = cropWidth / targetRatio;
    }
  }

  // Startpunkt für den Zuschnitt (unten links)
  const sx = 0;
  const sy = imgHeight - cropHeight;

  // Canvas auf Zielgröße 1000x1500 setzen
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // Zeichne das Bild mit Skalierung auf 1000x1500
  ctx.drawImage(
    img,
    sx, sy, cropWidth, cropHeight,  // Quelle
    0, 0, targetWidth, targetHeight  // Ziel (Hochskalierung)
  );

  return canvas;
};
