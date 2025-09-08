const { createCanvas } = require('canvas');

/**
 * Zeichnet Text auf ein vorhandenes Hintergrundbild (Canvas/Image)
 * @param {Canvas|Image} img - Hintergrundbild
 * @param {String} overlayText - Text, der auf das Bild geschrieben wird
 * @param {Number} targetWidth - Canvas-Breite (optional, default 1000)
 * @param {Number} targetHeight - Canvas-Höhe (optional, default 1500)
 * @param {String} website - Website-Text unten (optional)
 * @returns {Canvas} Canvas-Objekt
 */
module.exports = async function generateGraphicText(img, overlayText, targetWidth = 1000, targetHeight = 1500, website = '') {
  const WIDTH = targetWidth;
  const HEIGHT = targetHeight;

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // === 1) Hintergrund übernehmen (cover-fit & zentriert) ===
  if (img && img.width && img.height) {
    const { sx, sy, sSize } = squareCoverCrop(img.width, img.height);
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, WIDTH, HEIGHT);
  }

  // === 2) Textlayout – Box nutzt 70% der Höhe, ~86% der Breite ===
  const BOX_H = Math.round(HEIGHT * 0.70);
  const BOX_W = Math.round(WIDTH * 0.86);
  const BOX_X = Math.round((WIDTH - BOX_W) / 2);
  const BOX_Y = Math.round((HEIGHT - BOX_H) / 2);

  // dezenter Shadow nur für Text
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  // Auto-Fit: größte Schriftgröße finden, die komplett in die Box passt
  const maxLinesCap = 6;
  let best = { size: 0, lines: [], lineHeight: 0, totalHeight: 0 };

  for (let size = 200; size >= 12; size -= 2) {
    ctx.font = `italic 900 ${size}px "Open Sans"`;
    const lineHeight = Math.round(size * 1.18);
    const maxLines = Math.max(1, Math.min(Math.floor(BOX_H / lineHeight), maxLinesCap));

    const lines = wrapText(ctx, overlayText, BOX_W, maxLines);
    const joined = lines.join('').replace(/[\s-]/g, '');
    const original = String(overlayText || '').replace(/[\s-]/g, '');
    const totalH = lines.length * lineHeight;

    if (lines.length <= maxLines && totalH <= BOX_H && joined === original) {
      best = { size, lines, lineHeight, totalHeight: totalH };
      break;
    }
  }

  // Fallback
  if (!best.size) {
    const size = 12;
    ctx.font = `italic 900 ${size}px "Open Sans"`;
    const lineHeight = Math.round(size * 1.18);
    const lines = wrapText(ctx, overlayText, BOX_W, Math.min(maxLinesCap, Math.floor(BOX_H / lineHeight)));
    best = { size, lines, lineHeight, totalHeight: Math.min(lines.length * lineHeight, BOX_H) };
  }

  // === 3) Text zeichnen (zentriert in der Box) ===
  ctx.font = `italic 900 ${best.size}px "Open Sans"`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const startY = BOX_Y + Math.round((BOX_H - best.totalHeight) / 2);
  const centerX = Math.round(WIDTH / 2);

  best.lines.forEach((line, i) => {
    ctx.fillText(line, centerX, startY + i * best.lineHeight);
  });

  // Shadow nur für Text -> danach deaktivieren
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // === 4) Website unten einfügen (wie Solid-Template) ===
  const urlText = (website && website.trim() ? website : 'www.montessori-helden.de').toUpperCase();
  const urlFontSize = 42; // Fix
  ctx.font = `bold ${urlFontSize}px "Open Sans"`;
  const urlWidth = ctx.measureText(urlText).width + 160;
  const urlHeight = urlFontSize * 1.6;
  const urlX = (WIDTH - urlWidth) / 2;
  const urlY = HEIGHT - urlHeight - 60; // Fix Abstand

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, urlX, urlY, urlWidth, urlHeight, urlHeight / 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(urlText, WIDTH / 2, urlY + urlHeight / 2);

  return canvas;
};

// === Helper: quadratischer Cover-Crop (zentriert) ===
function squareCoverCrop(w, h) {
  let sSize, sx, sy;
  if (w > h) {
    sSize = h;
    sx = (w - sSize) / 2;
    sy = 0;
  } else {
    sSize = w;
    sx = 0;
    sy = (h - sSize) / 2;
  }
  return { sx, sy, sSize };
}

// --- Text-Wrapping-Helpers ---
function breakLongWord(ctx, word, maxWidth) {
  const parts = [];
  let buf = '';
  for (const ch of word) {
    const next = buf + ch;
    if (ctx.measureText(next).width > maxWidth) {
      if (buf.length > 0) {
        parts.push(buf + '-');
        buf = ch;
      } else {
        parts.push(ch);
        buf = '';
      }
    } else {
      buf = next;
    }
  }
  if (buf) parts.push(buf);
  return parts;
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = String(text || '').trim().split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    if (ctx.measureText(word).width > maxWidth) {
      const segments = breakLongWord(ctx, word, maxWidth);
      for (const seg of segments) {
        if (current.length > 0) {
          lines.push(current);
          current = '';
          if (lines.length === maxLines) return lines;
        }
        lines.push(seg);
        if (lines.length === maxLines) return lines;
      }
      continue;
    }

    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines) return lines;
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
