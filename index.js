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

// Hilfsfunktion für abgerundete Rechtecke
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

app.post('/', async (req, res) => {
  const imageUrl = req.body.url;
  let overlayText = req.body.overlay || 'Hello, World!';
  overlayText = overlayText.toUpperCase();

  if (!imageUrl) {
    return res.status(400).send('Missing "url" in request body');
  }

  try {
    const img = await loadImage(imageUrl);

    const targetWidth = 1000;
    const targetHeight = 1500;
    const targetRatio = targetWidth / targetHeight;

    const origWidth = img.width;
    const origHeight = img.height;
    const origRatio = origWidth / origHeight;

    let scale = origRatio > targetRatio
      ? targetHeight / origHeight
      : targetWidth / origWidth;

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

    // 📦 Text vorbereiten
    const maxTextBlockHeight = targetHeight * 0.3;
    const padding = 20;
    const maxTextWidth = targetWidth * 0.8;
    const fontSizes = [64, 48, 32, 24, 16];
    let chosenFontSize = 32;
    let lineHeight = 0;

    for (const size of fontSizes) {
      ctx.font = `900 ${size}px "Open Sans"`;
      lineHeight = size * 1.3;
      const testWidth = ctx.measureText(overlayText).width;
      if (testWidth <= maxTextWidth) {
        chosenFontSize = size;
        break;
      }
    }

    ctx.font = `900 ${chosenFontSize}px "Open Sans"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // 🧠 Funktion zum Umbruch
    function wrapText(ctx, text, maxWidth) {
      const words = text.split(' ');
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    }

    const lines = wrapText(ctx, overlayText, maxTextWidth);
    const totalTextHeight = lines.length * lineHeight;
    const rectWidth = maxTextWidth + padding * 2;
    const rectHeight = totalTextHeight + padding * 2;
    const rectX = (targetWidth - rectWidth) / 2;
    const rectY = targetHeight - rectHeight - 20;

    // 🟦 Rechteck hinter Text mit abgerundeten Ecken und Schatten
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    ctx.shadowBlur = 8;
    roundRect(ctx, rectX, rectY, rectWidth, rectHeight, 15);
    ctx.fillStyle = 'rgba(173, 216, 230, 0.7)';
    ctx.fill();
    ctx.restore();

    // 🖋 Text zeichnen mit Schatten und fetter Schrift
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#333333';
    lines.forEach((line, index) => {
      const y = rectY + padding + index * lineHeight;
      ctx.fillText(line, targetWidth / 2, y);
    });
    ctx.restore();

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
