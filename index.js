const express = require('express');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 🆕 Font registrieren
registerFont(path.join(__dirname, 'fonts', 'OpenSans-Regular.ttf'), {
  family: 'Open Sans'
});

app.post('/', async (req, res) => {
  const imageUrl = req.body.url;
  let overlayText = req.body.overlay || 'Hello, World!';
  overlayText = overlayText.toUpperCase();

  if (!imageUrl) {
    return res.status(400).send('Missing "url" in request body');
  }

  try {
    const img = await loadImage(imageUrl);

    // Zielmaße 2:3 Verhältnis (Pinterest)
    const targetWidth = 1000;
    const targetHeight = 1500;
    const targetRatio = targetWidth / targetHeight;

    const origWidth = img.width;
    const origHeight = img.height;
    const origRatio = origWidth / origHeight;

    let scale;
    if (origRatio > targetRatio) {
      scale = targetHeight / origHeight;
    } else {
      scale = targetWidth / origWidth;
    }

    const scaledWidth = Math.ceil(origWidth * scale);
    const scaledHeight = Math.ceil(origHeight * scale);

    const canvas = createCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');

    const cropX = Math.floor((scaledWidth - targetWidth) / 2);
    const cropY = Math.floor((scaledHeight - targetHeight) / 2);

    const tempCanvas = createCanvas(scaledWidth, scaledHeight);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

    ctx.drawImage(
      tempCanvas,
      cropX, cropY, targetWidth, targetHeight,
      0, 0, targetWidth, targetHeight
    );

    const maxTextBlockHeight = targetHeight * 0.3;
    const padding = 20;
    const maxTextWidth = targetWidth * 0.8;

    const fontSizes = [64, 48, 32, 24, 16];
    let chosenFontSize = 16;
    let textHeight = 0;

    for (const size of fontSizes) {
      ctx.font = `bold ${size}px "Open Sans"`;
      const estimatedHeight = size * 1.2;
      if (estimatedHeight + padding * 2 < maxTextBlockHeight) {
        chosenFontSize = size;
        textHeight = estimatedHeight;
        break;
      }
    }

    ctx.font = `bold ${chosenFontSize}px "Open Sans"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const rectWidth = maxTextWidth + padding * 2;
    const rectHeight = textHeight + padding * 2;
    const rectX = (targetWidth - rectWidth) / 2;
    const rectY = targetHeight - rectHeight - 20;

    ctx.fillStyle = 'rgba(173, 216, 230, 0.6)';
    ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

    ctx.fillStyle = '#333333';
    ctx.fillText(overlayText, targetWidth / 2, rectY + padding);

    res.setHeader('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('Fehler:', error);
    res.status(500).send('Fehler beim Verarbeiten des Bildes');
  }
});

app.listen(port, () => {
  console.log(`✅ Canvas API läuft auf http://localhost:${port}`);
});
