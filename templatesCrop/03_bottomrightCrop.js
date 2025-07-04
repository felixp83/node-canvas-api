const { createCanvas } = require('canvas');

module.exports = async function bottomRightCrop(img) {
  const targetWidth = 1000;
  const targetHeight = 1500;
  const targetRatio = targetWidth / targetHeight;

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

  // Startpunkt für den Zuschnitt (unten rechts)
  const sx = imgWidth - cropWidth;
  const sy = imgHeight - cropHeight;

  // Canvas auf Zielgröße 1000x1500 setzen (Hochskalierung hier)
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    img,
    sx, sy, cropWidth, cropHeight,  // Quelle
    0, 0, targetWidth, targetHeight  // Ziel (hochskalieren auf 1000x1500)
  );

  return canvas;
};
