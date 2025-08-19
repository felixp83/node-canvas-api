const { createCanvas } = require('canvas');

module.exports = async function generateSolidTemplate(
  img,
  overlayText,
  targetWidth,
  targetHeight,
  website
) {
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // === Hintergrund in kräftiger Farbe ===
  ctx.fillStyle = '#d5aa82';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // === Bild als Kreis ===
  const radius = Math.min(targetWidth, targetHeight) * 0.4725; // 35% größer
  const centerX = targetWidth / 2;
  const centerY = targetHeight * 0.42; // etwas tiefer gesetzt

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Kein Sepia-Filter
  let sSize, sx, sy;
  if (img.width > img.height) {
    sSize = img.height;
    sx = (img.width - sSize) / 2;
    sy = 0;
  } else {
    sSize = img.width;
    sx = 0;
    sy = (img.height - sSize) / 2;
  }
  ctx.drawImage(
    img,
    sx, sy, sSize, sSize,
    centerX - radius, centerY - radius,
    radius * 2, radius * 2
  );
  ctx.restore();

  // Weißer Ring um das Bild
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = radius * 0.08;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.stroke();

  // === CTA-Button (weiß mit roter Schrift) ===
  const ctaText = 'JETZT BESUCHEN';
  const ctaFontSize = 49.4; // 38 * 1.3
  ctx.font = `bold ${ctaFontSize}px "Open Sans"`;
  const ctaWidth = ctx.measureText(ctaText).width + 80;
  const ctaHeight = ctaFontSize * 1.6;
  const ctaX = (targetWidth - ctaWidth) / 2;
  const ctaY = centerY - radius - ctaHeight - 55; // 55px oberhalb des Kreisrandes

  ctx.fillStyle = '#fff';
  roundRect(ctx, ctaX, ctaY, ctaWidth, ctaHeight, ctaHeight / 2);
  ctx.fill();

  ctx.fillStyle = '#D32F2F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ctaText, targetWidth / 2, ctaY + ctaHeight / 2);

  // === Website unten (immer fix) ===
  const urlText = (website && website.trim() ? website : 'www.montessori-helden.de').toUpperCase();
  const urlFontSize = 42; // Fix
  ctx.font = `bold ${urlFontSize}px "Open Sans"`;
  const urlWidth = ctx.measureText(urlText).width + 160;
  const urlHeight = urlFontSize * 1.6;
  const urlX = (targetWidth - urlWidth) / 2;
  const urlY = targetHeight - urlHeight - 60; // Fix Abstand

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, urlX, urlY, urlWidth, urlHeight, urlHeight / 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(urlText, targetWidth / 2, urlY + urlHeight / 2);

  // === Overlay-Text (dynamisch angepasst) ===
  const maxTextWidth = targetWidth * 0.8;
  const maxLines = 3;

  // Abstände
  const gapAboveText = 24; // Abstand unterhalb Kreis
  const gapAboveUrl = 24;  // Abstand oberhalb Website-Bereich

  // Bereich zwischen Kreisunterkante und Website-Bereich
  const topLimit = centerY + radius + gapAboveText;
  const bottomLimit = urlY - gapAboveUrl;
  const availableHeight = Math.max(0, bottomLimit - topLimit);

  let chosenFontSize = 16;
  let lines = [];
  let lineHeight = 0;

  for (let size = 128; size >= 16; size -= 2) {
    ctx.font = `900 ${size}px "Open Sans"`;
    const testLines = wrapText(ctx, overlayText, maxTextWidth, maxLines);
    const lh = size * 1.2;
    const total = testLines.length * lh;
    if (testLines.length <= maxLines && total <= availableHeight) {
      chosenFontSize = size;
      lines = testLines;
      lineHeight = lh;
      break;
    }
    if (lines.length === 0) {
      lines = testLines;
      lineHeight = lh;
    }
  }

  // Falls nötig: verkleinern, bis es passt
  let totalTextHeight = lines.length * lineHeight;
  if (totalTextHeight > availableHeight && lines.length > 0) {
    for (let size = chosenFontSize; size >= 12; size -= 2) {
      ctx.font = `900 ${size}px "Open Sans"`;
      const testLines = wrapText(ctx, overlayText, maxTextWidth, maxLines);
      const lh = size * 1.2;
      const total = testLines.length * lh;
      if (testLines.length <= maxLines && total <= availableHeight) {
        chosenFontSize = size;
        lines = testLines;
        lineHeight = lh;
        totalTextHeight = total;
        break;
      }
    }
  }

  // Endgültige Y-Position
  let textY = topLimit;
  if (textY + totalTextHeight > bottomLimit) {
    textY = Math.max(topLimit, bottomLimit - totalTextHeight);
  }

  ctx.font = `900 ${chosenFontSize}px "Open Sans"`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((line, index) => {
    ctx.fillText(line, centerX, textY + index * lineHeight);
  });

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
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines) return lines;
    }
  }

  if (currentLine && lines.length < maxLines) lines.push(currentLine);
  return lines;
}
