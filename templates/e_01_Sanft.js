const { createCanvas } = require('canvas');

/**
 * Vinyara-Style Pinterest Template
 * Ruhiges Wellness-/Yoga-Design: Creme-Hintergrund, Salbeigrün-Akzentbogen,
 * Terrakotta-Linie, weiches organisches Layout statt harter Banner-Kante.
 *
 * Behält die technische Logik der Vorlage bei:
 * - Auto-Font-Sizing mit Zeilenumbruch (max. 2 Zeilen)
 * - Lange Wörter werden mit Bindestrich umbrochen
 * - Gleiche Funktionssignatur, damit deine API nichts anpassen muss
 */
module.exports = async function generateTemplate(img, overlayText, targetWidth, targetHeight, website) {
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // === Farbpalette (Vinyara Wellness) ===
  const COLOR_CREAM   = '#F7F1E8'; // Hintergrund
  const COLOR_SAGE    = '#8A9A82'; // Hauptakzent (Bogen / Banner)
  const COLOR_SAGE_DK = '#5F6E58'; // dunkles Salbeigrün für URL/Linie
  const COLOR_TERRA   = '#C97A53'; // Terrakotta-Akzent (dünne Linie/Punkt)
  const COLOR_TEXT    = '#3B3A33'; // warmes Anthrazit für Headline

  // === Hintergrund ===
  ctx.fillStyle = COLOR_CREAM;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // === Bild einzeichnen (exakt wie Vorlage: volle Canvas-Fläche, gestreckt) ===
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // === Bildbereich für den Bogen-Übergang (rein optisch, ändert nichts am Bild selbst) ===
  const imageAreaHeight = targetHeight * 0.62;

  // === Sanfter Verlauf am unteren Bildrand, damit der Übergang weich wirkt ===
  const fadeHeight = imageAreaHeight * 0.18;
  const fadeGrad = ctx.createLinearGradient(0, imageAreaHeight - fadeHeight, 0, imageAreaHeight);
  fadeGrad.addColorStop(0, 'rgba(247,241,232,0)');
  fadeGrad.addColorStop(1, COLOR_CREAM);
  ctx.fillStyle = fadeGrad;
  ctx.fillRect(0, imageAreaHeight - fadeHeight, targetWidth, fadeHeight);

  // === Organischer Salbeigrün-Bogen als Trenner ===
  const arcY = imageAreaHeight - targetHeight * 0.05;
  ctx.save();
  ctx.fillStyle = COLOR_SAGE;
  ctx.beginPath();
  ctx.moveTo(0, arcY + targetHeight * 0.06);
  ctx.quadraticCurveTo(targetWidth / 2, arcY - targetHeight * 0.07, targetWidth, arcY + targetHeight * 0.06);
  ctx.lineTo(targetWidth, targetHeight);
  ctx.lineTo(0, targetHeight);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // === Dünner Terrakotta-Strich als Schmuckelement über der Headline ===
  const dividerY = arcY + targetHeight * 0.135;
  const dividerWidth = targetWidth * 0.12;
  ctx.save();
  ctx.strokeStyle = COLOR_TERRA;
  ctx.lineWidth = Math.max(targetWidth, targetHeight) * 0.004;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(targetWidth / 2 - dividerWidth / 2, dividerY);
  ctx.lineTo(targetWidth / 2 + dividerWidth / 2, dividerY);
  ctx.stroke();
  ctx.restore();

  // === Textbereich (innerhalb des Salbeigrün-Bogens) ===
  const textZoneTop = dividerY + targetHeight * 0.025;
  const textZoneBottom = targetHeight * 0.80;
  const maxTextWidth = targetWidth * 0.82;
  const maxLines = 2;
  const maxTextBlockHeight = textZoneBottom - textZoneTop;

  let chosenFontSize = 16;
  let lines = [];
  let lineHeight = 0;

  for (let size = 120; size >= 16; size -= 2) {
    ctx.font = `700 ${size}px "Open Sans"`;
    lineHeight = size * 1.28;
    const testLines = wrapText(ctx, overlayText, maxTextWidth, maxLines);
    const totalTextHeight = testLines.length * lineHeight;

    const joined = testLines.join('').replace(/-/g, '').replace(/\s/g, '');
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

  // === Headline zeichnen (warmes Creme auf Salbeigrün) ===
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

  // === Call-to-Action Pill ("Read the Full Story") direkt über der URL ===
  const ctaText = 'READ THE FULL STORY';
  const ctaFontSize = Math.max(targetWidth, targetHeight) * 0.026;
  const ctaY = targetHeight * 0.885;

  ctx.font = `700 ${ctaFontSize}px "Open Sans"`;
  const ctaTextSpaced = addLetterSpacingHint(ctaText);
  const ctaTextWidth = ctx.measureText(ctaTextSpaced).width;
  const ctaPaddingX = ctaFontSize * 1.1;
  const ctaPaddingY = ctaFontSize * 0.75;
  const ctaPillWidth = ctaTextWidth + ctaPaddingX * 2;
  const ctaPillHeight = ctaFontSize + ctaPaddingY * 1.1;
  const ctaPillX = targetWidth / 2 - ctaPillWidth / 2;
  const ctaPillY = ctaY - ctaPillHeight / 2;

  ctx.save();
  ctx.fillStyle = COLOR_TERRA;
  roundRectPath(ctx, ctaPillX, ctaPillY, ctaPillWidth, ctaPillHeight, ctaPillHeight / 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = COLOR_CREAM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${ctaFontSize}px "Open Sans"`;
  ctx.fillText(ctaTextSpaced, targetWidth / 2, ctaY + ctaFontSize * 0.04);

  // === URL / Website unten, dezent in dunklem Salbeigrün ===
  const urlText = (website || 'www.vinyara.com').toLowerCase();
  const urlFontSize = Math.max(targetWidth, targetHeight) * 0.028;

  ctx.fillStyle = COLOR_SAGE_DK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${urlFontSize}px "Open Sans"`;
  ctx.fillText(addLetterSpacingHint(urlText), targetWidth / 2, targetHeight * 0.96);

  return canvas;
};

// === Hilfsfunktionen ===

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

// Leichtes "Letter-Spacing"-Gefühl für die URL (Canvas kennt kein echtes letter-spacing)
function addLetterSpacingHint(text) {
  return text.split('').join('\u200a\u200a'); // hairspaces zwischen Buchstaben
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
