const { createCanvas } = require('canvas');

module.exports = async function generateSolidTemplate(
  img,
  overlayText,
  _targetWidth,
  _targetHeight,
  website
) {
  // === Canvas immer 1000x1500 px ===
  const targetWidth = 1000;
  const targetHeight = 1500;

  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // === Hintergrund in kräftiger Farbe ===
  ctx.fillStyle = '#d5aa82';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // === Bild als Kreis (zentriert horizontal, 70 px nach oben) ===
  const radius = Math.min(targetWidth, targetHeight) * 0.54;
  const centerX = targetWidth / 2;

  let centerY;
  if (img && img.height) {
    const minY = 300;
    const maxY = targetHeight - radius - 120;
    centerY = Math.min(Math.max(minY + radius, targetHeight / 2), maxY) - 95; // Kreis 70px nach oben
  } else {
    centerY = targetHeight * 0.42 - 250;
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (img && img.width && img.height) {
    const sSize = Math.min(img.width, img.height);
    const sx = (img.width - sSize) / 2;
    const sy = (img.height - sSize) / 2;

    ctx.drawImage(
      img,
      sx, sy, sSize, sSize,
      centerX - radius, centerY - radius,
      radius * 2, radius * 2
    );
  }
  ctx.restore();

  // Weißer Ring um das Bild
  const ringLineWidth = radius * 0.08;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = ringLineWidth;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.stroke();

  // === CTA-Button (weiß mit roter Schrift), insgesamt 130 px nach oben ===
  const ctaText = 'WEITERLESEN';
  const ctaFontSize = 49.4;
  ctx.font = `bold ${ctaFontSize}px "Open Sans"`;
  const ctaWidth = ctx.measureText(ctaText).width + 80;
  const ctaHeight = ctaFontSize * 1.6;
  const ctaX = (targetWidth - ctaWidth) / 2;
  const ctaY = centerY - radius - ctaHeight - 105; // CTA 130 px nach oben

  ctx.fillStyle = '#fff';
  roundRect(ctx, ctaX, ctaY, ctaWidth, ctaHeight, ctaHeight / 2);
  ctx.fill();

  ctx.fillStyle = '#D32F2F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ctaText, targetWidth / 2, ctaY + ctaHeight / 2);

  // === Website unten (immer fix) ===
  const urlText = (website && website.trim() ? website : 'www.montessori-helden.de').toUpperCase();
  const urlFontSize = 42;
  ctx.font = `bold ${urlFontSize}px "Open Sans"`;
  const urlWidth = ctx.measureText(urlText).width + 160;
  const urlHeight = urlFontSize * 1.6;
  const urlX = (targetWidth - urlWidth) / 2;
  const urlY = targetHeight - urlHeight - 60;

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, urlX, urlY, urlWidth, urlHeight, urlHeight / 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(urlText, targetWidth / 2, urlY + urlHeight / 2);

  // === Overlay-Text (zwischen Kreis und Website) ===
  const maxTextWidth = targetWidth * 0.8;
  const minGapToCircle = 20;
  const gapAboveUrl = 24;
  const outerRadius = radius + ringLineWidth / 2;
  const topLimit = centerY + outerRadius + minGapToCircle;
  const bottomLimit = urlY - gapAboveUrl;
  const availableHeight = Math.max(0, bottomLimit - topLimit);

  let bestConfig = { fontSize: 16, lines: [], lineHeight: 0, totalHeight: Infinity };

  for (let size = 128; size >= 10; size -= 2) {
    ctx.font = `900 ${size}px "Open Sans"`;
    const lineHeight = size * 1.3;
    for (let maxLines of [3, 2]) {
      const testLines = wrapText(ctx, overlayText, maxTextWidth, maxLines);
      const totalTextHeight = testLines.length * lineHeight;
      const joined = testLines.join('').replace(/[-\s]/g,'');
      const original = overlayText.replace(/[-\s]/g,'');
      if (testLines.length <= maxLines && totalTextHeight <= availableHeight && joined === original && size > bestConfig.fontSize) {
        bestConfig = { fontSize: size, lines: testLines, lineHeight, totalHeight: totalTextHeight };
      }
    }
  }

  if (!bestConfig.lines.length) {
    const size = 12;
    ctx.font = `900 ${size}px "Open Sans"`;
    const testLines = wrapText(ctx, overlayText, maxTextWidth, 3);
    const lineHeight = size * 1.3;
    const totalTextHeight = Math.min(testLines.length * lineHeight, availableHeight);
    bestConfig = { fontSize: size, lines: testLines, lineHeight, totalHeight: totalTextHeight };
  }

  let textY = topLimit;
  if (textY + bestConfig.totalHeight > bottomLimit) {
    textY = Math.max(topLimit, bottomLimit - bestConfig.totalHeight);
  }

  ctx.font = `900 ${bestConfig.fontSize}px "Open Sans"`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  bestConfig.lines.forEach((line, index) => {
    ctx.fillText(line, centerX, textY + index * bestConfig.lineHeight);
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
      if (current.length > 0) { parts.push(current + '-'); current = char; } 
      else { parts.push(char); current = ''; }
    } else { current = test; }
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
        if (currentLine.length > 0) { lines.push(currentLine); currentLine = ''; }
        lines.push(part);
        if (lines.length === maxLines) return lines;
      }
      continue;
    }
    const testLine = currentLine ? currentLine + ' ' + word : word;
    if (ctx.measureText(testLine).width <= maxWidth) { currentLine = testLine; }
    else { if(currentLine) lines.push(currentLine); currentLine = word; if(lines.length===maxLines) return lines;}
  }
  if(currentLine && lines.length < maxLines) lines.push(currentLine);
  return lines;
}
