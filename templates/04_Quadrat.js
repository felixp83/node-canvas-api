const { createCanvas, loadImage } = require('canvas');

module.exports = async function generateTemplate(img, overlayText, targetWidth, targetHeight) {
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // === Beiger Hintergrund ===
  ctx.fillStyle = '#f5f0e6';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // === Quadratige Bildgröße berechnen (1:1), max Breite = targetWidth, max Höhe = 2/3 von targetHeight ===
  const squareSize = Math.min(targetWidth, targetHeight * (2 / 3));

  // Bild proportional zuschneiden für 1:1 (square crop)
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

  // Bild positionieren: horizontal zentriert, oben ausgerichtet
  const dx = (targetWidth - squareSize) / 2;
  const dy = 0;

  ctx.drawImage(img, sx, sy, sSize, sSize, dx, dy, squareSize, squareSize);

  // === Weiße URL-Box oben mittig auf dem Bild ===
  const urlText = "Webseite fehlt";
  
  // Dynamische Schriftgröße für URL-Text (max 22px, min 12px)
  let urlFontSize = 20;
  const maxUrlWidth = targetWidth * 0.8;
  for (let size = 22; size >= 12; size--) {
    ctx.font = `bold ${size}px "Open Sans"`;
    if (ctx.measureText(urlText).width <= maxUrlWidth) {
      urlFontSize = size;
      break;
    }
  }

  const urlPaddingX = 12;
  const urlPaddingY = 6;
  ctx.font = `bold ${urlFontSize}px "Open Sans"`;
  const textWidth = ctx.measureText(urlText).width;
  const boxWidth = textWidth + urlPaddingX * 2;
  const boxHeight = urlFontSize + urlPaddingY * 2;

  const boxX = targetWidth / 2 - boxWidth / 2;
  const boxY = dy + 10; // 10px Abstand vom oberen Rand

  // URL-Box zeichnen
  ctx.fillStyle = 'white';
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

  // URL-Text zeichnen
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(urlText, targetWidth / 2, boxY + urlPaddingY);

  // === Overlay-Text unten im beigen Bereich ===
  const overlayMaxWidth = targetWidth * 0.9;
  const overlayMaxHeight = targetHeight - (squareSize + dy) - 30; // 30px Abstand unten zusätzlich

  // Dynamische Schriftgröße für Overlay-Text, max 3 Zeilen
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
  ctx.fillStyle = '#5b4636'; // dunkleres Beige/Braun passend zum Stil
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const startY = squareSize + 20; // 20px Abstand vom Bild unten

  lines.forEach((line, i) => {
    ctx.fillText(line, targetWidth / 2, startY + i * lineHeight);
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
