// 03_Graphic.js
const { createCanvas } = require('canvas');

/**
 * rows: Array von Zeilen; jede Zeile ist ein Array von Spans:
 *   { text, size, weight, italic, color, letterSpacing, baseline, curveAmp }
 */
module.exports = async function generateGraphicText(
  rows,
  _targetWidth,   // ignoriert – feste Größe
  _targetHeight   // ignoriert – feste Größe
) {
  const WIDTH = 1000;
  const HEIGHT = 1500;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Transparenter Hintergrund – ausschließlich Typo
  const BOX_W = Math.round(WIDTH * 0.86);
  const BOX_H = Math.round(HEIGHT * 0.70);
  const BOX_Y = Math.round((HEIGHT - BOX_H) / 2);

  // 1) Messen in "natürlicher" Größe
  const metrics = measureLayout(ctx, rows);
  // 2) Skalieren, sodass es in BOX passt (mit etwas Puffer)
  const scaleX = BOX_W / metrics.width;
  const scaleY = BOX_H / metrics.height;
  const scale = Math.min(scaleX, scaleY) * 0.98; // 2% Luft

  ctx.save();
  ctx.translate(WIDTH / 2, BOX_Y + BOX_H / 2);
  ctx.scale(scale, scale);
  ctx.translate(-metrics.width / 2, -metrics.height / 2);

  // 3) Zeichnen
  drawRows(ctx, rows, metrics.lineHeights, metrics.width);

  ctx.restore();

  // Wichtig: als Buffer zurückgeben, nicht Canvas-Objekt!
  return canvas.toBuffer('image/png');
};

// ---- Layout / Draw helpers ----
function measureLayout(ctx, rows) {
  let maxWidth = 0;
  const lineHeights = [];
  rows.forEach((spans, lineIdx) => {
    const maxSize = Math.max(...spans.map(s => s.size || 40));
    const lh = Math.round(maxSize * 1.18);
    lineHeights[lineIdx] = lh;

    const width = measureLineWidth(ctx, spans);
    if (width > maxWidth) maxWidth = width;
  });

  const totalHeight = lineHeights.reduce((a, b) => a + b, 0);
  return { width: maxWidth, height: totalHeight, lineHeights };
}

function drawRows(ctx, rows, lineHeights, layoutWidth) {
  let y = 0;
  rows.forEach((spans, i) => {
    const lh = lineHeights[i];
    const lineWidth = measureLineWidth(ctx, spans);
    let x = (layoutWidth - lineWidth) / 2;

    const curveAmp = getLineCurveAmp(spans);

    spans.forEach(span => {
      const {
        text = '',
        size = 40,
        weight = 700,
        italic = false,
        color = '#fff',
        letterSpacing = 0,
        baseline = 0,
      } = span;

      ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px "Open Sans"`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'alphabetic';

      const lineProgress = (x + measureText(ctx, text, letterSpacing) / 2) / Math.max(1, layoutWidth);
      const yCurve = Math.sin(lineProgress * Math.PI) * curveAmp;

      for (const ch of text) {
        const chW = ctx.measureText(ch).width;
        ctx.fillText(ch, x, y + lh * 0.8 + baseline + yCurve);
        x += chW + letterSpacing;
      }
    });

    y += lh;
  });
}

function getLineCurveAmp(spans) {
  return spans.reduce((m, s) => Math.max(m, Math.abs(s.curveAmp || 0)), 0) *
         (spans.some(s => s.curveAmp < 0) ? -1 : 1);
}

function measureLineWidth(ctx, spans) {
  let w = 0;
  spans.forEach(span => {
    const size = span.size || 40;
    const weight = span.weight || 700;
    const italic = span.italic ? 'italic ' : '';
    ctx.font = `${italic}${weight} ${size}px "Open Sans"`;
    w += measureText(ctx, span.text || '', span.letterSpacing || 0);
  });
  return w;
}

function measureText(ctx, text, letterSpacing) {
  let sum = 0;
  for (const ch of (text || '')) {
    sum += ctx.measureText(ch).width + (letterSpacing || 0);
  }
  return sum;
}
