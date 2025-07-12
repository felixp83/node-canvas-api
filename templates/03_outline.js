const { createCanvas } = require('canvas');

module.exports = async function generateTemplate(img, overlayText, targetWidth, targetHeight, website) {
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // === Weißer Hintergrund ===
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // === Bild einzeichnen ===
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // === Passepartout-Rahmen (weiße Linie eingerückt) ===
  const passepartoutInset = Math.min(targetWidth, targetHeight) * 0.04;
  ctx.save();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = Math.max(targetWidth, targetHeight) * 0.005;
  ctx.strokeRect(
    passepartoutInset,
    passepartoutInset,
    targetWidth - passepartoutInset * 2,
    targetHeight - passepartoutInset * 2
  );
  ctx.restore();

  // === Farbfläche (z.B. orange) über gesamte Breite ===
  const bannerHeight = targetHeight * 0.18;
  const bannerY = targetHeight * 0.3;
  ctx.save();
  ctx.fillStyle = '#f5a623';
  ctx.fillRect(0, bannerY, targetWidth, bannerHeight);
  ctx.restore();

  // === Text innerhalb der Farbfläche ===
  const maxTextWidth = targetWidth * 0.9;
  let chosenFontSize = 16;
  let lines = [];
  let lineHeight = 0;

  for (let size = 128; size >= 16; size -= 2) {
    ctx.font = `900 ${size}px "Open Sans"`;
    lineHeight = size * 1.2;
    const testLines = wrapText(ctx, overlayText, maxTextWidth, 2);
    const totalTextHeight = testLines.length * lineHeight;
    if (totalTextHeight <= bannerHeight * 0.8) {
      chosenFontSize = size;
      lines = testLines;
      break;
    }
  }

  if (lines.length === 0) {
    ctx.font = `900 16px "Open Sans"`;
    lineHeight = 16 * 1.2;
    lines = wrapText(ctx, overlayText, maxTextWidth, 2);
  }

  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${chosenFontSize}px "Open Sans"`;

  lines.forEach((line, index) => {
    const y = bannerY + bannerHeight * 0.25 + index * lineHeight;
    ctx.fillText(line, targetWidth / 2, y);
  });

  // === URL innerhalb der Farbfläche ===
  const urlText = website || "www.montessori-helden.de!";
  const urlFontSize = Math.min(22, chosenFontSize * 0.4);
  ctx.font = `bold ${urlFontSize}px "Open Sans"`;

  const urlY = bannerY + bannerHeight - bannerHeight * 0.15;
  ctx.fillText(urlText, targetWidth / 2, urlY);

  return canvas;
};

// === Hilfsfunktionen ===
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
