// 03_Graphic.js
const { createCanvas } = require('canvas');

/**
 * rows: Array von Zeilen; jede Zeile ist ein Array von Spans:
 *   { text, size, weight, italic, color, letterSpacing, baseline, curveAmp }
 * - letterSpacing in px (kann auch negativ sein)
 * - baseline in px (verschiebt Span nach oben/unten)
 * - curveAmp in px (wölbt die Grundlinie der gesamten Zeile sanft)
 *
 * Beispiel siehe unten.
 */
module.exports = async function generateGraphicText(
  rows,
  targetWidth,    // ignoriert – feste Größe 1000x1500
  targetHeight    // ignoriert – feste Größe 1000x1500
) {
  const WIDTH = 1000;
  const HEIGHT = 1500;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Transparenter Hintergrund – ausschließlich Typo
  // Textbox: 70% der Höhe, 86% der Breite
  const BOX_W = Math.round(WIDTH * 0.86);
  const BOX_H = Math.round(HEIGHT * 0.70);
  const BOX_X = Math.round((WIDTH - BOX_W) / 2);
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
  return canvas;
};

// ---- Layout / Draw helpers ----
function measureLayout(ctx, rows) {
  let maxWidth = 0;
  const lineHeights = [];
  rows.forEach((spans, lineIdx) => {
    // lineHeight = max(size)*1.18 (inkl. Italic-Reserve)
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
    // Gesamte Zeile zentriert auf layoutWidth setzen
    const lineWidth = measureLineWidth(ctx, spans);
    let x = (layoutWidth - lineWidth) / 2;

    // optionale Kurve für die Zeile (ein sanfter Bogen)
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

      // Zeilen-Kurve: verschiebt Baseline leicht entlang x
      // yCurve = sin( 0..π ) * curveAmp  (sieht natürlicher aus als volle Periode)
      const lineProgress = (x + measureText(ctx, text, letterSpacing) / 2) / Math.max(1, layoutWidth);
      const yCurve = Math.sin(lineProgress * Math.PI) * curveAmp;

      // Buchstaben mit LetterSpacing manuell setzen
      for (const ch of text) {
        const chW = ctx.measureText(ch).width;
        ctx.fillText(ch, x, y + lh * 0.8 + baseline + yCurve); // 0.8 ≈ baseline-Faktor
        x += chW + letterSpacing;
      }
    });

    y += lh;
  });
}

function getLineCurveAmp(spans) {
  // wenn irgendein Span curveAmp hat, nimm den größten
  return spans.reduce((m, s) => Math.max(m, Math.abs(s.curveAmp || 0)), 0) * (spans.some(s => s.curveAmp < 0) ? -1 : 1);
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

/* =========================
   Beispiel-Aufruf:

const rows = [
  // Zeile 1
  [{ text: "You gotta", size: 72, italic: true, weight: 800, letterSpacing: 0.5, color: "#ffffff", curveAmp: 0 }],
  // Zeile 2 (leicht gebogen)
  [{ text: "Step into", size: 120, weight: 900, italic: true, letterSpacing: 0.5, color: "#ffffff", curveAmp: 10 }],
  // Zeile 3 – ein Wort stark betonen
  [
    { text: "Day", size: 180, weight: 900, letterSpacing: 0.5, color: "#ffffff" },
    { text: "light", size: 180, weight: 900, italic: true, baseline: -6, letterSpacing: 0.5, color: "#ffffff" },
  ],
  // Zeile 4
  [{ text: "& let it go", size: 110, italic: true, weight: 800, letterSpacing: 0.5, color: "#ffffff" }],
];

const canvas = await generateGraphicText(rows);
require('fs').writeFileSync('typo.png', canvas.toBuffer('image/png'));

   ========================= */
