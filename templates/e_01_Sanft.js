const { createCanvas } = require('canvas');

/**
 * Vinyara-Style Pinterest Template — Variante 2
 *
 * Gleiche Markensprache wie Variante 1, aber invertiertes Layout:
 * - Text-/Overlay-Block sitzt OBEN, Bild nimmt die untere Fläche ein
 * - Tiefer Waldgrün-Ton statt Salbeigrün als Hauptfläche
 * - Bogen öffnet sich nach unten ins Bild (statt nach oben)
 * - Deko-Element: zwei kurze Creme-Linien + Terrakotta-Rautenpunkt
 * - CTA als Outline-Pill (Creme-Rahmen auf Waldgrün) statt gefüllte Pill
 * - URL in Terrakotta statt dunklem Salbeigrün
 *
 * Technische Logik identisch zu Variante 1:
 * - Auto-Font-Sizing mit Zeilenumbruch (max. 2 Zeilen)
 * - Lange Wörter werden mit Bindestrich umbrochen
 * - Gleiche Funktionssignatur
 */
module.exports = async function generateTemplate(
  img,
  overlayText,
  _targetWidth,
  _targetHeight,
  website
) {
  // Immer Pinterest-Größe
  const targetWidth = 1000;
  const targetHeight = 1500;

  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // === Farbpalette (Vinyara Wellness — Variante 2) ===
  const COLOR_CREAM    = '#F7F1E8'; // Creme (Hintergrund, Textfarbe auf Dunkel)
  const COLOR_FOREST   = '#3D4D38'; // tiefer Waldgrün-Ton (Hauptfläche oben)
  const COLOR_FOREST_LT= '#536349'; // etwas heller für Outline-Details
  const COLOR_TERRA    = '#C97A53'; // Terrakotta (URL, Rautenpunkt)
  const COLOR_CREAM_DIM= 'rgba(247,241,232,0.55)'; // gedimmtes Creme für Outline-Pill

  // === Hintergrund (Creme, als Basis) ===
  ctx.fillStyle = COLOR_CREAM;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // === Bild im UNTEREN Bereich des Canvas (object-fit: cover) ===
  const imageStartY = targetHeight * 0.38;
  const imageAreaHeight = targetHeight - imageStartY;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, imageStartY, targetWidth, imageAreaHeight);
  ctx.clip();
  drawImageCover(ctx, img, 0, imageStartY, targetWidth, imageAreaHeight);
  ctx.restore();

  // === Dunkler Waldgrün-Block im OBEREN Bereich — gerade Kante, kein Bogen ===
  const forestBlockHeight = targetHeight * 0.43;
  ctx.fillStyle = COLOR_FOREST;
  ctx.fillRect(0, 0, targetWidth, forestBlockHeight);

  // === Deko-Element: zwei kurze Creme-Linien + Terrakotta-Rautenpunkt ===
  const decoY = targetHeight * 0.1;
  const lineLength = targetWidth * 0.1;
  const gap = targetWidth * 0.045;
  const lineThickness = Math.max(targetWidth, targetHeight) * 0.003;

  ctx.save();
  ctx.strokeStyle = COLOR_CREAM;
  ctx.lineWidth = lineThickness;
  ctx.lineCap = 'round';

  // linke Linie
  ctx.beginPath();
  ctx.moveTo(targetWidth / 2 - gap - lineLength, decoY);
  ctx.lineTo(targetWidth / 2 - gap, decoY);
  ctx.stroke();

  // rechte Linie
  ctx.beginPath();
  ctx.moveTo(targetWidth / 2 + gap, decoY);
  ctx.lineTo(targetWidth / 2 + gap + lineLength, decoY);
  ctx.stroke();
  ctx.restore();

  // Terrakotta-Rautenpunkt in der Mitte
  const diamondSize = Math.max(targetWidth, targetHeight) * 0.009;
  ctx.save();
  ctx.fillStyle = COLOR_TERRA;
  ctx.translate(targetWidth / 2, decoY);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-diamondSize / 2, -diamondSize / 2, diamondSize, diamondSize);
  ctx.restore();

  // === Textbereich (obere Waldgrün-Fläche) ===
  const textZoneTop    = decoY + targetHeight * 0.04;
  const textZoneBottom = targetHeight * 0.355;
  const maxTextWidth      = targetWidth * 0.82;
  const maxLines          = 2;
  const maxTextBlockHeight = textZoneBottom - textZoneTop;

  let chosenFontSize = 16;
  let lines = [];
  let lineHeight = 0;

  for (let size = 120; size >= 16; size -= 2) {
    ctx.font = `700 ${size}px "Open Sans"`;
    lineHeight = size * 1.28;
    const testLines = wrapText(ctx, overlayText, maxTextWidth, maxLines);
    const totalTextHeight = testLines.length * lineHeight;

    const joined   = testLines.join('').replace(/-/g, '').replace(/\s/g, '');
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

  if (lines.length === 0) {
    ctx.font = `700 16px "Open Sans"`;
    lineHeight = 16 * 1.28;
    lines = wrapText(ctx, overlayText, maxTextWidth, maxLines);
  }

  // === Headline zeichnen (Creme auf Waldgrün) ===
  ctx.fillStyle = COLOR_CREAM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${chosenFontSize}px "Open Sans"`;

  const totalBlockHeight = lines.length * lineHeight;
  const blockStartY = textZoneTop + (maxTextBlockHeight - totalBlockHeight) / 2 + lineHeight / 2;

  lines.forEach((line, index) => {
    const y = blockStartY + index * lineHeight;
    ctx.fillText(line, targetWidth / 2, y);
  });

  // === Call-to-Action — Outline-Pill (Creme-Rahmen auf Waldgrün) ===
  const ctaText = 'READ THE FULL STORY';
  const ctaFontSize = Math.max(targetWidth, targetHeight) * 0.022;
  const ctaY = textZoneBottom - ctaFontSize * 1.1;

  ctx.font = `700 ${ctaFontSize}px "Open Sans"`;
  const ctaTextSpaced = addLetterSpacingHint(ctaText);
  const ctaTextWidth  = ctx.measureText(ctaTextSpaced).width;
  const ctaPaddingX   = ctaFontSize * 0.95;
  const ctaPaddingY   = ctaFontSize * 0.5;
  const ctaPillWidth  = ctaTextWidth + ctaPaddingX * 2;
  const ctaPillHeight = ctaFontSize + ctaPaddingY * 1.1;
  const ctaPillX = targetWidth / 2 - ctaPillWidth / 2;
  const ctaPillY = ctaY - ctaPillHeight / 2;

  // Outline (kein Fill)
  ctx.save();
  ctx.strokeStyle = COLOR_CREAM_DIM;
  ctx.lineWidth = lineThickness * 1.2;
  roundRectPath(ctx, ctaPillX, ctaPillY, ctaPillWidth, ctaPillHeight, ctaPillHeight / 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = COLOR_CREAM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${ctaFontSize}px "Open Sans"`;
  ctx.fillText(ctaTextSpaced, targetWidth / 2, ctaY + ctaFontSize * 0.04);

  // === URL unten im Creme-Bereich, in Terrakotta ===
  const urlText = (website || 'www.vinyara.com').toLowerCase();
  const urlFontSize = Math.max(targetWidth, targetHeight) * 0.026;

  ctx.fillStyle = COLOR_TERRA;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${urlFontSize}px "Open Sans"`;
  ctx.fillText(addLetterSpacingHint(urlText), targetWidth / 2, targetHeight * 0.975);

  return canvas;
};

// === Hilfsfunktionen (identisch zu Variante 1) ===

function roundRectPath(ctx, x, y, w, h, r) {
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

function drawImageCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let drawWidth, drawHeight, offsetX, offsetY;

  if (imgRatio > boxRatio) {
    drawHeight = h;
    drawWidth  = h * imgRatio;
    offsetX    = x - (drawWidth - w) / 2;
    offsetY    = y;
  } else {
    drawWidth  = w;
    drawHeight = w / imgRatio;
    offsetX    = x;
    offsetY    = y - (drawHeight - h) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

function addLetterSpacingHint(text) {
  return text.split('').join('\u200a\u200a');
}

function breakLongWord(ctx, word, maxWidth) {
  let parts = [], current = '';
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

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = text.trim().split(/\s+/);
  let lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    if (ctx.measureText(word).width > maxWidth) {
      const broken = breakLongWord(ctx, word, maxWidth);
      for (let part of broken) {
        if (currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = '';
        }
        lines.push(part);
        if (lines.length === maxLines) return lines;
      }
      continue;
    }

    const testLine = currentLine ? currentLine + ' ' + word : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines) return lines;
    }
  }

  if (currentLine && lines.length < maxLines) lines.push(currentLine);
  return lines;
}
