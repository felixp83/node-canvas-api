// 03_Graphic.js
const { createCanvas, registerFont } = require('canvas');

// 👉 Wenn du Open Sans als lokale Datei hast, kannst du es hier einbinden:
// registerFont('/pfad/zu/OpenSans-Regular.ttf', { family: 'Open Sans' });

module.exports = async function generateGraphicText(
  rows,
  targetCanvas = null
) {
  const WIDTH = 1000;
  const HEIGHT = 1500;

  // Eingabedaten prüfen
  console.log('=== generateGraphicText gestartet ===');
  console.log('rows Input:', JSON.stringify(rows, null, 2));
  console.log('Hat targetCanvas?', !!targetCanvas);

  // Entweder neues Canvas oder ein bestehendes verwenden
  const canvas = targetCanvas || createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  try {
    // Box für Text (70% Höhe)
    const BOX_W = Math.round(WIDTH * 0.86);
    const BOX_H = Math.round(HEIGHT * 0.70);
    const BOX_Y = Math.round((HEIGHT - BOX_H) / 2);

    const metrics = measureLayout(ctx, rows);
    console.log('Layout-Metrics:', metrics);

    const scaleX = BOX_W / metrics.width;
    const scaleY = BOX_H / metrics.height;
    const scale = Math.min(scaleX, scaleY) * 0.98;

    ctx.save();
    ctx.translate(WIDTH / 2, BOX_Y + BOX_H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-metrics.width / 2, -metrics.height / 2);
    drawRows(ctx, rows, metrics.lineHeights, metrics.width);
    ctx.restore();

    // Ergebnis nur dann zurückgeben, wenn wir selbst ein Canvas erstellt haben
    if (!targetCanvas) {
      try {
        const buffer = canvas.toBuffer('image/png');
        return {
          data: buffer.toString('base64'),
          mimeType: 'image/png',
        };
      } catch (err) {
        console.error('Fehler bei canvas.toBuffer():', err);
        throw new Error('Bildgenerierung fehlgeschlagen: ' + err.message);
      }
    }
  } catch (err) {
    console.error('Fehler in generateGraphicText:', err);
    throw err;
  }
};

// ---- Helpers ----
function measureLayout(ctx, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Ungültige rows übergeben: ' + JSON.stringify(rows));
  }

  let maxWidth = 0;
  const lineHeights = [];
  rows.forEach((spans, lineIdx) => {
    if (!Array.isArray(spans) || spans.length === 0) {
      throw new Error(`Ungültige Zeile an Index ${lineIdx}: ${JSON.stringify(spans)}`);
    }

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

      // Fallback-Font nutzen, falls Open Sans nicht installiert
      ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px "Open Sans", sans-serif`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'alphabetic';

      const lineProgress =
        (x + measureText(ctx, text, letterSpacing) / 2) /
        Math.max(1, layoutWidth);
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
  return (
    spans.reduce((m, s) => Math.max(m, Math.abs(s.curveAmp || 0)), 0) *
    (spans.some(s => s.curveAmp < 0) ? -1 : 1)
  );
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
  for (const ch of text || '') {
    sum += ctx.measureText(ch).width + (letterSpacing || 0);
  }
  return sum;
}
