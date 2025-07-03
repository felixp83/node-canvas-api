const { createCanvas } = require('canvas');

module.exports = async function toprightCrop(img) {
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

  // Startpunkt für den Zuschnitt (oben rechts)
  const sx = imgWidth - cropWidth;
  const sy = 0;

  const canvas = createCanvas(cropWidth, cropHeight);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    img,
    sx, sy, cropWidth, cropHeight, // Quelle
    0, 0, cropWidth, cropHeight    // Ziel
  );

  return canvas;
};
