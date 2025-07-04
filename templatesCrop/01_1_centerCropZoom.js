const { createCanvas } = require('canvas');

module.exports = async function centerCropWithDynamicZoom(img) {
  const targetWidth = 1000;
  const targetHeight = 1500;
  const targetRatio = targetWidth / targetHeight; // ≈0.6667

  // Dynamischer Zoomfaktor zwischen 1.05 (105%) und 1.15 (115%)
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

  // Zoomed crop Bereich (kleiner als cropWidth/cropHeight)
  const zoomedCropWidth = cropWidth / zoomFactor;
  const zoomedCropHeight = cropHeight / zoomFactor;

  // Zentrierter Startpunkt des Ausschnitts
  const sx = (imgWidth - zoomedCropWidth) / 2;
  const sy = (imgHeight - zoomedCropHeight) / 2;

  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    img,
    sx, sy, zoomedCropWidth, zoomedCropHeight,
    0, 0, targetWidth, targetHeight
  );

  return canvas;
};
