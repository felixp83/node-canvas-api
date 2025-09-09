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

  // === 1) Hintergrund übernehmen ===
  if (img && img.width && img.height) {
    ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
  }

  // === 2) Textbox-Bereich ===
  const BOX_H = Math.round(HEIGHT * 0.70);
  const BOX_W = Math.round(WIDTH * 0.86);
  const BOX_X = Math.round((WIDTH - BOX_W) / 2);
  const BOX_Y = Math.round((HEIGHT - BOX_H) / 2);

  const maxLinesCap = 6;
  let best = { size: 0, lines: [], lineHeight: 0, totalHeight: 0 };

  // Schriftgröße iterativ anpassen
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

  // Fallback falls nichts passt
  if (!best.size) {
    const size = 12;
    ctx.font = `italic 900 ${size}px "Open Sans"`;
    const lineHeight = Math.round(size * 1.18);
    const lines = wrapText(ctx, overlayText, BOX_W, Math.min(maxLinesCap, Math.floor(BOX_H / lineHeight)));
    best = { size, lines, lineHeight, totalHeight: Math.min(lines.length * lineHeight, BOX_H) };
  }

  // === 3) Text zeichnen ===
  ctx.font = `italic 900 ${best.size}px "Open Sans"`;
  const startY = BOX_Y + Math.round((BOX_H - best.totalHeight) / 2);
  const centerX = Math.round(WIDTH / 2);

  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  const gradient = ctx.createLinearGradient(0, startY, 0, startY + best.totalHeight);
  gradient.addColorStop(0, '#555555');
  gradient.addColorStop(1, '#555555');
  ctx.fillStyle = gradient;

  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 3;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  best.lines.forEach((line, i) => {
    const y = startY + i * best.lineHeight;
    ctx.strokeText(line, centerX, y);
    ctx.fillText(line, centerX, y);
  });

  // Shadow deaktivieren
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // === 4) Website einfügen ===
  const urlText = (website && website.trim() ? website : 'www.montessori-helden.de').toUpperCase();
  const urlFontSize = 42;
  ctx.font = `bold ${urlFontSize}px "Open Sans"`;
  const urlWidth = ctx.measureText(urlText).width + 160;
  const urlHeight = urlFontSize * 1.6;
  const urlX = (WIDTH - urlWidth) / 2;
  const urlY = HEIGHT - urlHeight - 60;

  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  roundRect(ctx, urlX, urlY, urlWidth, urlHeight, urlHeight / 2);
  ctx.fill();

  ctx.fillStyle = '#555555';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(urlText, WIDTH / 2, urlY + urlHeight / 2);

  return canvas;
};

// --- Verbesserter Text-Wrap ---
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
        if (current) {
          lines.push(current);
          current = '';
          if (lines.length === maxLines) return lines;
        }
        lines.push(seg);
        if (lines.length === maxLines) return lines;
      }
      continue;
    }

    const testLine = current ? current + ' ' + word : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      current = testLine;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines) return lines;
    }
  }

  if (current) lines.push(current);

  // === Neue Logik: Balancing ===
  if (lines.length > 1) {
    for (let i = 0; i < lines.length - 1; i++) {
      const firstWordNext = lines[i + 1].split(' ')[0];
      if (
        ctx.measureText(lines[i]).width < maxWidth * 0.55 &&
        ctx.measureText(lines[i] + ' ' + firstWordNext).width <= maxWidth
      ) {
        lines[i] = lines[i] + ' ' + firstWordNext;
        lines[i + 1] = lines[i + 1].split(' ').slice(1).join(' ');
      }
    }
  }

  return lines.filter(l => l.trim().length > 0).slice(0, maxLines);
}

// === Helper: Runde Rechtecke für URL ===
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
