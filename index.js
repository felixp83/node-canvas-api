const express = require('express');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Falls du eigene Schrift brauchst (optional)
// registerFont(path.join(__dirname, 'fonts', 'DeineFont.ttf'), { family: 'DeineFont' });

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

    // Originalmaße
    const origWidth = img.width;
    const origHeight = img.height;
    const origRatio = origWidth / origHeight;

    // Skaliere so wenig wie möglich beschneiden, Bild füllt target Fläche
    let scale;
    if (origRatio > targetRatio) {
      // Bild ist breiter, Höhe passt, Breite skalieren
      scale = targetHeight / origHeight;
    } else {
      // Bild ist schmaler, Breite passt, Höhe skalieren
      scale = targetWidth / origWidth;
    }

    const scaledWidth = Math.ceil(origWidth * scale);
    const scaledHeight = Math.ceil(origHeight * scale);

    // Canvas an Zielgröße
    const canvas = createCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');

    // Bild zentriert croppen
    const cropX = Math.floor((scaledWidth - targetWidth) / 2);
    const cropY = Math.floor((scaledHeight - targetHeight) / 2);

    // Temporärer Canvas zum Skalieren
    const tempCanvas = createCanvas(scaledWidth, scaledHeight);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

    // In Ziel-Canvas das cropte Bild zeichnen
    ctx.drawImage(
      tempCanvas,
      cropX, cropY, targetWidth, targetHeight, // crop Quelle
      0, 0, targetWidth, targetHeight          // Ziel
    );

    // Textbereich max 30% der Höhe
    const maxTextBlockHeight = targetHeight * 0.3;
    const padding = 20;
    const maxTextWidth = targetWidth * 0.8;

    // Dynamische Schriftgröße: Wir probieren 64, 48, 32, 24, 16
    const fontSizes = [64, 48, 32, 24, 16];
    let chosenFontSize = 16;
    let textHeight = 0;

    for (const size of fontSizes) {
      ctx.font = `bold ${size}px Sans`;
      // Text-Messung
      const metrics = ctx.measureText(overlayText);
      // Schätzen der Texthöhe (Canvas bietet keine direkte Höhe)
      // Approx: ascent + descent ca 1.2 * font size (grob)
      const estimatedHeight = size * 1.2;
      if (estimatedHeight + padding * 2 < maxTextBlockHeight) {
        chosenFontSize = size;
        textHeight = estimatedHeight;
        break;
      }
    }

    ctx.font = `bold ${chosenFontSize}px Sans`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Textposition und Hintergrund-Rechteck
    const rectWidth = maxTextWidth + padding * 2;
    const rectHeight = textHeight + padding * 2;
    const rectX = (targetWidth - rectWidth) / 2;
    const rectY = targetHeight - rectHeight - 20;

    // Halbtransparenter hellblauer Hintergrund (#add8e6 mit Alpha 0.6)
    ctx.fillStyle = 'rgba(173, 216, 230, 0.6)';
    ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

    // Textfarbe #333333 (dunkelgrau)
    ctx.fillStyle = '#333333';

    // Text zeichnen
    ctx.fillText(overlayText, targetWidth / 2, rectY + padding);

    // Bild zurückgeben
    res.setHeader('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('Fehler:', error);
    res.status(500).send('Fehler beim Verarbeiten des Bildes');
  }
});

app.listen(port, () => {
  console.log(`Canvas API läuft auf Port ${port}`);
});
