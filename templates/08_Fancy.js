// 08_Fancy.js
const { createCanvas } = require('canvas');

module.exports = async function generateFancyTextTemplate(
  img,            // ungenutzt
  overlayText,
  targetWidth,    // ungenutzt
  targetHeight,   // ungenutzt
  website         // ungenutzt
) {
  // Exakt 1000x1500 px
  const WIDTH = 1000;
  const HEIGHT = 1500;

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Transparenter Hintergrund – nur Text (keine weiteren Designelemente)

  // Textbox nimmt 70% der Höhe ein
  const TEXTBOX_HEIGHT = Math.round(HEIGHT * 0.7); // 1050px
  const TEXTBOX_WIDTH = Math.round(WIDTH * 0.86);  // großzügige Breite
  const TEXTBOX_X = Math.round((WIDTH - TEXTBOX_WIDTH) / 2);
  const TEXTBOX_Y = Math.round((HEIGHT - TEXTBOX_HEIGHT) / 2);

  // Optional: dezenter Shadow für bessere Lesbarkeit (bleibt reiner Texteffekt)
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  // Bestmögliche Schriftgröße finden, die:
  // - vollständig in die Textbox passt
  // - stabil umbricht (keine abgeschnittenen Wörter)
  // - max. 6 Zeilen nutzt (gute Lesbarkeit)
  const maxLinesCap = 6;
  let best = { size: 0, lines: [], lineHeight: 0, totalHeight: 0 };

  for (let size = 200; size >= 12; size -= 2) {
    ctx.font = `italic 900 ${size}px "Open Sans"`; // stylisch: fett + italic
    const lineHeight = Math.round(size * 1.18);
    const maxLines = Math.max(1, Math.min(Math.floor(TEXTBOX_HEIGHT / lineHeight), maxLinesCap));

    const lines = wrapText(ctx, overlayText, TEXTBOX_WIDTH, maxLines);
    const joined = lines.join('').replace(/[\s-]/g, '');
    const original = overlayText.replace(/[\s-]/g, '');
    const totalH = lines.length * lineHeight;

    const fits =
      lines.length <= maxLines &&
      totalH <= TEXTBOX_HEIGHT &&
      joined === original;

    if (fits) {
      best = { size, lines, lineHeight, totalHeight: totalH };
      break; // größtmögliche passende Größe gefunden
    }
  }

  // Fallback, falls der obige Loop nichts findet (extrem lange Strings)
  if (!best.size) {
    const size = 12;
    ctx.font = `italic 900 ${size}px "Open Sans"`;
    const lineHeight = Math.round(size * 1.18);
    const lines = wrapText(ctx, overlayText, TEXTBOX_WIDTH, Math.min(maxLinesCap, Math.floor(TEXTBOX_HEIGHT / lineHeight)));
    best = { size, lines, lineHeight, totalHeight: Math.min(lines.length * lineHeight, TEXTBOX_HEIGHT) };
  }

  // Zeichnen: zentriert in der Textbox
  ctx.font = `italic 900 ${best.size}px "Open Sans"`;
  ctx.fillStyle = '#FFFFFF'; // neutraler Overlay-Text (gut auf farbigen Flächen)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const startY = TEXTBOX_Y + Math.round((TEXTBOX_HEIGHT - best.totalHeight) / 2);
  const centerX = Math.round(WIDTH / 2);

  best.lines.forEach((line, i) => {
    ctx.fillText(line, centerX, startY + i * best.lineHeight);
  });

  // Shadow wieder deaktivieren (nur der Text sollte ihn haben)
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  return canvas;
};

// --- Hilfsfunktionen ---
function breakLongWord(ctx, word, maxWidth) {
  const parts = [];
  let buf = '';
  for (const ch of word) {
    const next = buf + ch;
    if (ctx.measureText(next).width > maxWidth) {
      if (buf.length > 0) {
        parts.push(buf + '-'); // Silbentrennung andeuten
        buf = ch;
      } else {
        // Edgecase: einzelnes Zeichen > maxWidth
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
    // Wenn ein einzelnes Wort zu breit ist, zerlegen
    if (ctx.measureText(word).width > maxWidth) {
      const segments = breakLongWord(ctx, word, maxWidth);
      for (const seg of segments) {
        if (current.length > 0) {
          lines.push(current);
          current = '';
          if (lines.length === maxLines) return lines;
        }
        if (ctx.measureText(seg).width <= maxWidth) {
          lines.push(seg);
          if (lines.length === maxLines) return lines;
        } else {
          // Extremfall, trotzdem pushen
          lines.push(seg);
          if (lines.length === maxLines) return lines;
        }
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
