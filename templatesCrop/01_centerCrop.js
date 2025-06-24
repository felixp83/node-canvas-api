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
    // Bild groß genug, 1000x1500 zuschneiden
    cropWidth = targetWidth;
    cropHeight = targetHeight;
  } else {
    // Bild kleiner als 1000x1500, größtmöglichen Bereich mit Seitenverhältnis 2:3 zuschneiden
    if (imgRatio > targetRatio) {
      // Bild ist breiter: Höhe behalten, Breite anpassen
      cropHeight = imgHeight;
      cropWidth = cropHeight * targetRatio;
    } else {
      // Bild ist schmaler oder gleich: Breite behalten, Höhe anpassen
      cropWidth = imgWidth;
      cropHeight = cropWidth / targetRatio;
    }
  }

  // Startpunkt für den Zuschnitt (zentriert)
  const sx = (imgWidth - cropWidth) / 2;
  const sy = (imgHeight - cropHeight) / 2;

  // Canvas in der Größe des Crop-Bereichs erzeugen (ohne Hochskalieren)
  const canvas = createCanvas(cropWidth, cropHeight);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    img,
    sx, sy, cropWidth, cropHeight, // Quelle: zugeschnittener Bereich
    0, 0, cropWidth, cropHeight    // Ziel: ganze Canvas
  );

  return canvas;
};
