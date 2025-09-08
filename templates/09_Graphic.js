// 03_Graphic.js
const { createCanvas, loadImage } = require('canvas');

/**
 * Zeichnet Text auf ein Canvas mit Hintergrundbild von URL
 * @param {Array} rows - Textzeilen [{text, size, weight, italic, color, letterSpacing, baseline}]
 * @param {String} bgUrl - URL des Hintergrundbilds
 * @param {Number} targetWidth - gewünschte Breite des Canvas
 * @param {Number} targetHeight - gewünschte Höhe des Canvas
 * @returns {Canvas} Canvas-Objekt
 */
module.exports = async function generateGraphicText(rows, bgUrl, targetWidth = 1000, targetHeight = 1500) {
  // Canvas erstellen
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // Hintergrundbild laden
  let bgImage = null;
  try {
    bgImage = await loadImage(bgUrl);
    ctx.drawImage(bgImage, 0, 0, targetWidth, targetHeight);
  } catch (err) {
    console.error('Hintergrundbild konnte nicht geladen werden:', err);
    // Fallback: weißer Hintergrund
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // Textbereich
  const BOX_W = Math.round(targetWidth * 0.86);
  const BOX_H = Math.round(targetHeight * 0.7);
  const BOX_Y = Math.round((targetHeight - BOX_H) / 2);

  const metrics = measureLayout(ctx, rows);

  const scaleX = BOX_W / metrics.width;
  const scaleY = BOX_H / metrics.height;
  const scale = Math.min(scaleX, scaleY) * 0.98;

  ctx.save();
  ctx.translate(targetWidth / 2, BOX_Y + BOX_H / 2);
  ctx.scale(scale, scale);
  ctx.translate(-metrics.width / 2, -metrics.height / 2);
  drawRows(ctx, rows, metrics.lineHeights, metrics.width);
  ctx.restore();

  return canvas;
};

// ---- Helpers ----
function measureLayout(ctx, rows) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('Ungültige rows');

  let maxWidth = 0;
  const lineHeights = [];

  rows.forEach((spans, i) => {
    const maxSize = Math.max(...spans.map(s => s.size || 40));
    const lh = Math.round(maxSize * 1.18);
    lineHeights[i] = lh;

    const width = measureLineWidth(ctx, spans);
    if (width > maxWidth) maxWidth = width;
  });

  return { width: maxWidth, height: lineHeights.reduce((a,b)=>a+b,0), lineHeights };
}

function drawRows(ctx, rows, lineHeights, layoutWidth) {
  let y = 0;
  rows.forEach((spans, i) => {
    const lh = lineHeights[i];
    const lineWidth = measureLineWidth(ctx, spans);
    let x = (layoutWidth - lineWidth) / 2;

    spans.forEach(span => {
      const { text = '', size = 40, weight = 700, italic = false, color = '#fff', letterSpacing = 0, baseline = 0 } = span;
      ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px "Open Sans", sans-serif`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'alphabetic';

      for (const ch of text) {
        const chW = ctx.measureText(ch).width;
        ctx.fillText(ch, x, y + lh * 0.8 + baseline);
        x += chW + letterSpacing;
      }
    });

    y += lh;
  });
}

function measureLineWidth(ctx, spans) {
  let w = 0;
  spans.forEach(span => {
    const size = span.size || 40;
    const weight = span.weight || 700;
    const italic = span.italic ? 'italic ' : '';
    ctx.font = `${italic}${weight} ${size}px "Open Sans", sans-serif`;
    w += measureText(ctx, span.text || '', span.letterSpacing || 0);
  });
  return w;
}

function measureText(ctx, text, letterSpacing) {
  let sum = 0;
  for (const ch of text || '') sum += ctx.measureText(ch).width + (letterSpacing || 0);
  return sum;
}
