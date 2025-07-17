const { createCanvas } = require('canvas');

module.exports = async function generateTemplate(
  img,
  overlayText,
  targetWidth,
  targetHeight,
  website
) {
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // === Hintergrund und Bild ===
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0);

  // === Vignettierung ===
  drawVignette(ctx, targetWidth, targetHeight);

  // === Text vorbereiten ===
  const padding = 20;
  const maxTextWidth = targetWidth * 0.8;
  const maxTextBlockHeight = targetHeight * 0.25;
  const maxLines = 2;

  let chosenFontSize = 16;
  let lines = [];
  let lineHeight = 0;

  for (let size = 128; size >= 16; size -= 2) {
    ctx.font = `900 ${size}px "Open Sans"`;
    lineHeight = size * 1.3;
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
    ctx.font = `900 16px "Open Sans"`;
    lineHeight = 16 * 1.3;
    lines = wrapText(ctx, overlayText, maxTextWidth, maxLines);
  }

  // === URL (fester Text, fixe Größe) ===
  const urlText = website || "www.montessori-helden.de";
  const urlFontSize = 48; // 1.5x größer als vorher
  const urlLineHeight = urlFontSize * 1.3;

  // === Box-Berechnung ===
  ctx.font = `900 ${chosenFontSize}px "Open Sans"`; // zurück für Messung
  const totalTextHeight = lines.length * lineHeight;
  const urlPaddingTop = padding * 0.6;

  const rectWidth = maxTextWidth + padding * 2;
  const rectHeight = totalTextHeight + padding * 2 + urlLineHeight + urlPaddingTop;

  const verticalPositionFactor = 0.8;
  let rectY = targetHeight * verticalPositionFactor - rectHeight / 2;
  rectY -= 720; // <<< VERSCHIEBUNG NACH OBEN
  const rectX = (targetWidth - rectWidth) / 2;

  // === Hintergrundbox ===
  const cornerRadius = 36;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 8;
  roundRect(ctx, rectX, rectY, rectWidth, rectHeight, cornerRadius);
  ctx.fillStyle = 'rgba(173, 216, 230, 0.9)';
  ctx.fill();
  ctx.restore();

  // === Haupttext zeichnen (weiß) ===
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((line, index) => {
    const y = rectY + padding + index * lineHeight;
    ctx.fillText(line, targetWidth / 2, y);
  });
  ctx.restore();

  // === URL zeichnen (weiß) ===
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${urlFontSize}px "Open Sans"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(
    urlText,
    targetWidth / 2,
    rectY + padding + totalTextHeight + urlPaddingTop
  );
  ctx.restore();

  return canvas;
};

// === Hilfsfunktionen ===
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
  const words = text.split(' ');
  let lines = [], currentLine = '';

  for (let word of words) {
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

function drawVignette(ctx, width, height) {
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.35,
    width / 2, height / 2, Math.max(width, height) * 0.5
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.save();
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const corners = [
    { x: 0, y: 0 }, { x: width, y: 0 },
    { x: 0, y: height }, { x: width, y: height }
  ];
  const radius = Math.min(width, height) * 0.35;

  for (const corner of corners) {
    const grad = ctx.createRadialGradient(corner.x, corner.y, 0, corner.x, corner.y, radius);
    grad.addColorStop(0, 'rgba(0,0,0,0.18)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(corner.x, corner.y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }
}
