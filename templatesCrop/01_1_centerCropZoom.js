const { createCanvas } = require('canvas');

function applySepia(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Sepia Formel
    data[i]     = Math.min(0.393 * r + 0.769 * g + 0.189 * b, 255); // Rot
    data[i + 1] = Math.min(0.349 * r + 0.686 * g + 0.168 * b, 255); // Grün
    data[i + 2] = Math.min(0.272 * r + 0.534 * g + 0.131 * b, 255); // Blau
    // data[i+3] = alpha bleibt gleich
  }

  ctx.putImageData(imageData, 0, 0);
}

module.exports = async function centerCropWithDynamicZoom(img) {
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

  // Sepia-Filter anwenden
  applySepia(ctx, targetWidth, targetHeight);

  return canvas;
};
