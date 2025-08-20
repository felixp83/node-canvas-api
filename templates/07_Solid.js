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
  const radius = Math.min(targetWidth, targetHeight) * 0.41; // Anpassung des Durchmessers
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
  const ringLineWidth = radius * 0.08;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = ringLineWidth;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.stroke();

  // === CTA-Button (weiß mit roter Schrift) ===
  const ctaText = 'WEITERLESEN';
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

  // === Overlay-Text (stabiler Umbruch wie im Referenz-Template) ===
  const maxTextWidth = targetWidth * 0.8;

  // Abstände
  const minGapToCircle = 20;  // mindestens 20 px Abstand zum äußeren Kreisrand
  const gapAboveUrl = 24;     // Abstand oberhalb Website-Bereich

  // Außenradius inkl. halber Ringbreite
  const outerRadius = radius + ringLineWidth / 2;

  // Vertikaler Bereich zwischen Kreis und Website-Bereich
  const topLimit = centerY + outerRadius + minGapToCircle;
  const bottomLimit = urlY - gapAboveUrl;
  const availableHeight = Math.max(0, bottomLimit - topLimit);

  // Suche die größte Schriftgröße, die vollständig passt (inkl. Content-Vollständigkeit)
  let bestConfig = {
    fontSize: 16,
    lines: [],
    lineHeight: 0,
    totalHeight: Infinity
  };

  for (let size = 128; size >= 10; size -= 2) {
    ctx.font = `900 ${size}px "Open Sans"`;
    const lineHeight = size * 1.3;

    // Bevorzuge 3 Zeilen, dann 2 (wie dein Referenzcode testet mehrere Varianten)
    for (let maxLines of [3, 2]) {
      const testLines = wrapText(ctx, overlayText, maxTextWidth, maxLines);
      const totalTextHeight = testLines.length * lineHeight;

      const joined = testLines.join('').replace(/-/g, '').replace(/\s/g, '');
      const original = overlayText.replace(/-/g, '').replace(/\s/g, '');

      if (
        testLines.length <= maxLines &&
        totalTextHeight <= availableHeight &&
        joined === original &&
        size > bestConfig.fontSize
      ) {
        bestConfig = {
          fontSize: size,
          lines: testLines,
          lineHeight,
          totalHeight: totalTextHeight
        };
      }
    }
  }

  // Fallback, falls nichts „perfekt“ passt: kleinste sinnvolle Größe nehmen und bestmöglich umbrechen
  if (!bestConfig.lines.length) {
    const size = 12;
    ctx.font = `900 ${size}px "Open Sans"`;
    const testLines = wrapText(ctx, overlayText, maxTextWidth, 3);
    const lineHeight = size * 1.3;
    const totalTextHeight = Math.min(testLines.length * lineHeight, availableHeight);

    bestConfig = {
      fontSize: size,
      lines: testLines,
      lineHeight,
      totalHeight: totalTextHeight
    };
  }

  // Endgültige Y-Position (Start am oberen Limit, damit Mindestabstand gewahrt bleibt)
  let textY = topLimit;
  if (textY + bestConfig.totalHeight > bottomLimit) {
    textY = Math.max(topLimit, bottomLimit - bestConfig.totalHeight);
  }

  // Zeichnen
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
        if (lines.length === maxLines) return lines; // harte Kappung, aber oben prüfen wir Content-Vollständigkeit
      }
      continue;
    }

    const testLine = currentLine ? currentLine + ' ' + word : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines) return lines; // harte Kappung
    }
  }

  if (currentLine && lines.length < maxLines) lines.push(currentLine);
  return lines;
}
