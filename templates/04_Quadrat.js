const { createCanvas } = require('canvas');

module.exports = async function generateTemplate(img, overlayText, targetWidth, targetHeight, website) {
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // === Beiger Hintergrund ===
  ctx.fillStyle = '#f5f0e6';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // === Quadratiges Bild (1:1), max 2/3 der Höhe ===
  const squareSize = Math.min(targetWidth, targetHeight * 2 / 3);

  // Bild zuschneiden auf Quadrat
  let sx, sy, sSize;
  if (img.width > img.height) {
    sSize = img.height;
    sx = (img.width - sSize) / 2;
    sy = 0;
  } else {
    sSize = img.width;
    sx = 0;
    sy = (img.height - sSize) / 2;
  }

  // Bild zeichnen (oben zentriert)
  const dx = (targetWidth - squareSize) / 2;
  const dy = 0;
  ctx.drawImage(img, sx, sy, sSize, sSize, dx, dy, squareSize, squareSize);

  // === URL-Box auf dem Bild (oben zentriert) ===
  const urlText = website || "Webseite fehlt";

  // Dynamische Schriftgröße für URL
  let urlFontSize = 20;
  const maxUrlWidth = targetWidth * 0.8;
  for (let size = 22; size >= 12; size--) {
    ctx.font = `bold ${size}px "Open Sans"`;
    if (ctx.measureText(urlText).width <= maxUrlWidth) {
      urlFontSize = size;
      break;
    }
  }

  ctx.font = `bold ${urlFontSize}px "Open Sans"`;
  const textWidth = ctx.measureText(urlText).width;
  const urlPaddingX = 14;
  const urlPaddingY = 8;
  const boxWidth = textWidth + urlPaddingX * 2;
  const boxHeight = urlFontSize + urlPaddingY * 2;

  const boxX = (targetWidth - boxWidth) / 2;
  const boxY = dy + 10;

  // Box zeichnen
  ctx.fillStyle = 'white';
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

  // URL-Text zeichnen
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(urlText, targetWidth / 2, boxY + urlPaddingY);

  // === Overlay-Text unten im beigen Bereich ===
  const overlayMaxWidth = targetWidth * 0.9;
  const overlayStartY = squareSize + 20;
  const overlayMaxHeight = targetHeight - overlayStartY - 20;

  let chosenFontSize = 40;
  let lines = [];
  let lineHeight = 0;

  for (let size = 60; size >= 20; size -= 2) {
    ctx.font = `900 ${size}px "Open Sans"`;
    lineHeight = size * 1.2;
    lines = wrapText(ctx, overlayText, overlayMaxWidth, 3);
    if (lines.length * lineHeight <= overlayMaxHeight) {
      chosenFontSize = size;
      break;
    }
  }

  ctx.font = `900 ${chosenFontSize}px "Open Sans"`;
  ctx.fillStyle = '#5b4636';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  lines.forEach((line, i) => {
    ctx.fillText(line, targetWidth / 2, overlayStartY + i * lineHeight);
  });

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
