const { createCanvas } = require('canvas');

/**
 * Zeichnet Text auf ein vorhandenes Hintergrundbild (Canvas/Image)
 * @param {Canvas|Image} img - Hintergrundbild (wird unverändert übernommen)
 * @param {String} overlayText - Text, der auf das Bild geschrieben wird
 * @param {Number} targetWidth - Canvas-Breite (optional, default 1000)
 * @param {Number} targetHeight - Canvas-Höhe (optional, default 1500)
 * @param {String} website - Website-Text unten (optional)
 * @returns {Canvas} Canvas-Objekt
 */
module.exports = async function generateGraphicText(
  img,
  overlayText,
  targetWidth = 1000,
  targetHeight = 1500,
  website = ''
) {
  const WIDTH = targetWidth;
  const HEIGHT = targetHeight;

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // === 1) Hintergrund übernehmen unverändert ===
  if (img && img.width && img.height) {
    ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
  }

  // === 2) Textlayout – Box nutzt 70% der Höhe, ~86% der Breite ===
  const BOX_H = Math.round(HEIGHT * 0.70);
  const BOX_W = Math.round(WIDTH * 0.86);
  const BOX_X = Math.round((WIDTH - BOX_W) / 2);
  const BOX_Y = Math.round((HEIGHT - BOX_H) / 2);

  // Auto-Fit: größte Schriftgröße finden, die komplett in die Box passt
  const maxLinesCap = 6;
  let best = { size: 0, lines: [], lineHeight: 0, totalHeight: 0 };

  for (let size = 200; size >= 12; size -= 2) {
    ctx.font = `italic 900 ${size}px "Open Sans"`;
    const lineHeight = Math.round(size * 1.18);
    const maxLines = Math.max(1, Math.min(Math.floor(BOX_H / lineHeight), maxLinesCap));

    const lines = wrapTextNoHyphen(ctx, overlayText, BOX_W, maxLines);
    const totalH = lines.length * lineHeight;

    if (lines.length <= maxLines && totalH <= BOX_H) {
      best = { size, lines, lineHeight, totalHeight: totalH };
      break;
    }
  }

  // Fallback
  if (!best.size) {
    const size = 12;
    ctx.font = `italic 900 ${size}px "Open Sans"`;
    const lineHeight = Math.round(size * 1.18);
    const lines = wrapTextNoHyphen(ctx, overlayText, BOX_W, Math.min(maxLinesCap, Math.floor(BOX_H / lineHeight)));
    best = { size, lines, lineHeight, totalHeight: Math.min(lines.length * lineHeight, BOX_H) };
  }

  // === 3) Text zeichnen (zentriert in der Box) ===
  ctx.font = `italic 900 ${best.size}px "Open Sans"`;
  const startY = BOX_Y + Math.round((BOX_H - best.totalHeight) / 2);
  const centerX = Math.round(WIDTH / 2);

  // Shadow + Outline + Gradient
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  const gradient = ctx.createLinearGradient(0, startY, 0, startY + best.totalHeight);
  gradient.addColorStop(0, '#555555'); // dunkelgrau
  gradient.addColorStop(1, '#555555'); // dunkelgrau
  ctx.fillStyle = gradient;

  ctx.strokeStyle = '#333333'; // dunklerer Outline
  ctx.lineWidth = 3;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  best.lines.forEach((line, i) => {
    const y = startY + i * best.lineHeight;
    ctx.strokeText(line, centerX, y);
    ctx.fillText(line, centerX, y);
  });

  // Shadow für Text deaktivieren
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // === 4) Website unten einfügen (dunkelgrau) ===
  const urlText = (website && website.trim() ? website : 'www.montessori-helden.de').toUpperCase();
  const urlFontSize = 42; // Fix
  ctx.font = `bold ${urlFontSize}px "Open Sans"`;
  const urlWidth = ctx.measureText(urlText).width + 160;
  const urlHeight = urlFontSize * 1.6;
  const urlX = (WIDTH - urlWidth) / 2;
  const urlY = HEIGHT - urlHeight - 60; // Fix Abstand

  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  roundRect(ctx, urlX, urlY, urlWidth, urlHeight, urlHeight / 2);
  ctx.fill();

  ctx.fillStyle = '#555555'; // dunkelgrau
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(urlText, WIDTH / 2, urlY + urlHeight / 2);

  return canvas;
};

// --- Text-Wrapping-Helper (ohne Worttrennung) ---
function wrapTextNoHyphen(ctx, text, maxWidth, maxLines) {
  const words = String(text || '').trim().split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const testLine = current ? current + ' ' + word : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      current = testLine;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }

  if (current && lines.length < maxLines) lines.push(current);

  return lines;
}

// === Helper: Runde Rechtecke für Hintergrund der URL ===
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
