const { createCanvas, loadImage } = require('canvas');

async function centerCropImage(imageUrl) {
  const targetWidth = 1000;
  const targetHeight = 1500;
  const targetAspect = targetWidth / targetHeight;

  const img = await loadImage(imageUrl);

  const sourceWidth = img.width;
  const sourceHeight = img.height;
  const sourceAspect = sourceWidth / sourceHeight;

  let sx, sy, sWidth, sHeight;

  if (sourceAspect > targetAspect) {
    // Bild ist breiter als Ziel → höhe bleibt, breite zuschneiden
    sHeight = sourceHeight;
    sWidth = sHeight * targetAspect;
    sx = (sourceWidth - sWidth) / 2;
    sy = 0;
  } else {
    // Bild ist höher als Ziel → breite bleibt, höhe zuschneiden
    sWidth = sourceWidth;
    sHeight = sWidth / targetAspect;
    sx = 0;
    sy = (sourceHeight - sHeight) / 2;
  }

  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

  // Hier kannst du z.B. das Bild als Buffer zurückgeben
  return canvas.toBuffer();
}

// Beispiel-Aufruf
centerCropImage('https://example.com/deinbild.jpg').then(buffer => {
  // Buffer kann gespeichert oder weiterverarbeitet werden
  require('fs').writeFileSync('output-cropped.png', buffer);
});

