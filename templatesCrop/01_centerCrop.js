const { createCanvas } = require('canvas');

module.exports = async function centerCrop(img) {
  const targetWidth = 1000;
  const targetHeight = 1500;
  const targetRatio = targetWidth / targetHeight; // ≈0.6667

  const imgWidth = img.width;
  const imgHeight = img.height;
  const imgRatio = imgWidth / imgHeight;

  let cropWidth, cropHeight;

  if (imgWidth >= targetWidth && imgHeight >= targetHeight) {
    // Bild groß genug, 1000x1500 Ausschnitt
    cropWidth = targetWidth;
    cropHeight = targetHeight;
  } else {
    // Bild kleiner als Ziel, größtmöglichen Ausschnitt mit 2:3
    if (imgRatio > targetRatio) {
      cropHeight = imgHeight;
      cropWidth = cropHeight * targetRatio;
    } else {
      cropWidth = imgWidth;
      cropHeight = cropWidth / targetRatio;
    }
  }

  // zentrierter Startpunkt
  const sx = (imgWidth - cropWidth) / 2;
  const sy = (imgHeight - cropHeight) / 2;

  // Canvas immer auf Zielgröße 1000x1500
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // hier wird direkt auf 1000x1500 skaliert
  ctx.drawImage(
    img,
    sx, sy, cropWidth, cropHeight,   // Quellbereich
    0, 0, targetWidth, targetHeight  // Zielgröße
  );

  return canvas;
};
