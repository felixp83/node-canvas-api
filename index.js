const express = require('express');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
app.use('/public', express.static(publicDir));

// Fette Schriftart registrieren (z.B. OpenSans-Bold.ttf)
registerFont(path.join(__dirname, 'fonts', 'OpenSans-Bold.ttf'), {
  family: 'Open Sans',
  weight: 'bold'
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

// Hilfsfunktion: Wort umbrechen, auch wenn es zu lang ist
function breakLongWord(ctx, word, maxWidth) {
  let parts = [];
  let current = '';
  for (let char of word) {
    const test = current + char;
    if (ctx.measureText(test).width > maxWidth) {
      if (current.length > 0) {
        parts.push(current + '-');
        current = char;
      } else {
        parts.push(char);
        current = '';
      }
    } else {
      current = test;
    }
  }
  if (current.length > 0) parts.push(current);
  return parts;
}

// Textumbruch: maximal 2 Zeilen, lange Wörter werden getrennt, KEIN Abschneiden
function wrapText(ctx, text, maxWidth, maxLines) {
  const words = text.split(' ');
  let lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    let word = words[i];
    // Wort umbrechen, falls zu lang
    if (ctx.measureText(word).width > maxWidth) {
      const broken = breakLongWord(ctx, word, maxWidth);
      for (let j = 0; j < broken.length; j++) {
        if (currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = '';
        }
        lines.push(broken[j]);
        if (lines.length === maxLines) return lines;
      }
      continue;
    }
    const testLine = currentLine.length > 0 ? currentLine + ' ' + word : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines) return lines;
    }
    if (lines.length === maxLines) return lines;
  }
  if (currentLine.length > 0 && lines.length < maxLines) lines.push(currentLine);
  return lines;
}

app.post('/', async (req, res) => {
  const imageUrl = req.body.url;
  let overlayText = req.body.overlay || 'Hello, World!';
  overlayText = overlayText.toUpperCase();

  if (!imageUrl) {
    return res.status(400).send('Missing \"url\" in request body');
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

    // Text vorbereiten
    const maxTextBlockHeight = targetHeight * 0.3;
    const padding = 20;
    const maxTextWidth = targetWidth * 0.8;
    const maxLines = 2;

    // Suche die größtmögliche Schriftgröße, bei der der Text komplett in 2 Zeilen passt
    let chosenFontSize = 16;
    let lines = [];
    let lineHeight = 0;
    for (let size = 128; size >= 16; size -= 2) {
      ctx.font = `900 ${size}px \"Open Sans\"`;
      lineHeight = size * 1.3;
      const testLines = wrapText(ctx, overlayText, maxTextWidth, maxLines);
      const totalTextHeight = testLines.length * lineHeight;
      // Prüfe, ob der gesamte Text untergebracht wurde
      const joined = testLines.join('').replace(/-/g, '').replace(/\s/g, '');
      const original = overlayText.replace(/-/g, '').replace(/\s/g, '');
      if (
        testLines.length <= maxLines &&
        totalTextHeight <= maxTextBlockHeight &&
        joined === original
      ) {
        chosenFontSize = size;
        lines = testLines;
        break;
      }
    }

    // Falls keine passende Größe gefunden wurde, nimm die kleinste
    if (lines.length === 0) {
      ctx.font = `900 16px \"Open Sans\"`;
      lineHeight = 16 * 1.3;
      lines = wrapText(ctx, overlayText, maxTextWidth, maxLines);
    }

    ctx.font = `900 ${chosenFontSize}px \"Open Sans\"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const totalTextHeight = lines.length * lineHeight;
    const rectWidth = maxTextWidth + padding * 2;
    const rectHeight = totalTextHeight + padding * 2;
    const rectX = (targetWidth - rectWidth) / 2;
    const rectY = targetHeight - rectHeight - 20;

    // Rechteck hinter Text mit abgerundeten Ecken und Schatten
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    ctx.shadowBlur = 8;
    roundRect(ctx, rectX, rectY, rectWidth, rectHeight, 25);
    ctx.fillStyle = 'rgba(173, 216, 230, 0.7)';
    ctx.fill();
    ctx.restore();

    // Text zeichnen mit Schatten und fetter Schrift
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#333333';
    lines.forEach((line, index) => {
      const y = rectY + padding + index * lineHeight;
      ctx.fillText(line, targetWidth / 2, y);
    });
    ctx.restore();

    // Bild speichern
    const now = new Date();
    const filename = `img-${now.getTime()}.png`;
    const savePath = path.join(publicDir, filename);

    const out = fs.createWriteStream(savePath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on('finish', () => {
      const imgUrl = `${req.protocol}://${req.get('host')}/public/${filename}`;
      res.json({ imgUrl });
    });

  } catch (error) {
    console.error('Fehler:', error);
    res.status(500).send('Fehler beim Verarbeiten des Bildes');
  }
});

app.listen(port, () => {
  console.log(`✅ Canvas API läuft auf http://localhost:${port}`);
});
