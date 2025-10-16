const { createCanvas } = require('canvas');

/**
 * Schneidet ein Bild quadratisch zu und zoomt hinein.
 * @param {Image} img - Das Input-Bild
 * @param {number} zoomPercent - Zoom in Prozent (Standard = 15)
 */
module.exports = async function centerCropSquare(img, zoomPercent = 50) {
  const targetSize = 1000; // quadratisches Ziel
  const targetWidth = targetSize;
  const targetHeight = targetSize;

  const imgWidth = img.width;
  const imgHeight = img.height;

  // Ursprünglicher quadratischer Ausschnitt
  let cropHeight = imgHeight;
  let cropWidth = imgHeight;

  if (imgWidth < imgHeight) {
    cropWidth = imgWidth;
    cropHeight = imgWidth;
  }

  // Zentrierter Startpunkt
  let sx = (imgWidth - cropWidth) / 2;
  let sy = (imgHeight - cropHeight) / 2;

  // Zoom anwenden
  const zoomFactor = 1 + zoomPercent / 100; // z.B. 15% => 1.15
  const zoomedWidth = cropWidth / zoomFactor;
  const zoomedHeight = cropHeight / zoomFactor;

  // Neue Startpunkte für den Zoom (zentriert)
  sx += (cropWidth - zoomedWidth) / 2;
  sy += (cropHeight - zoomedHeight) / 2;

  // Canvas erstellen
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // Zuschneiden + auf Zielgröße skalieren
  ctx.drawImage(
    img,
    sx, sy, zoomedWidth, zoomedHeight,  // Quellbereich
    0, 0, targetWidth, targetHeight     // Zielgröße
  );

  return canvas;
};
