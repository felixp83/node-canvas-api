// 01_11_centerCropBlur.js
const { createCanvas } = require('canvas');

module.exports = async function centerCropWithDynamicZoomAndBlur(img) {
  const targetWidth = 1000;
  const targetHeight = 1500;
  const targetRatio = targetWidth / targetHeight; // ≈0.6667

  // Dynamischer Zoomfaktor zwischen 1.10 (110%) und 1.20 (120%)
  const minZoom = 1.10;
  const maxZoom = 1.20;
  const zoomFactor = Math.random() * (maxZoom - minZoom) + minZoom;

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

  // Gezoomter Crop-Bereich (kleiner als cropWidth/-Height)
  const zoomedCropWidth = cropWidth / zoomFactor;
  const zoomedCropHeight = cropHeight / zoomFactor;

  // Zentrierter Startpunkt des Ausschnitts
  const sx = (imgWidth - zoomedCropWidth) / 2;
  const sy = (imgHeight - zoomedCropHeight) / 2;

  // Canvas in Zielgröße
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // --- Blur einstellen ---
  // "35%" praxisnah interpretiert als ~3,5% der kürzeren Zielseite -> ~35px bei 1000x1500
  const blurPx = Math.round(Math.min(targetWidth, targetHeight) * 0.035);
  // node-canvas unterstützt context.filter (ähnlich CSS)
  ctx.filter = `blur(${blurPx}px)`;

  // Bild mit Blur rendern
  ctx.drawImage(
    img,
    sx, sy, zoomedCropWidth, zoomedCropHeight,
    0, 0, targetWidth, targetHeight
  );

  // Filter zurücksetzen (falls später noch gezeichnet würde)
  ctx.filter = 'none';

  return canvas;
};
