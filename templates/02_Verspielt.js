const { createCanvas } = require('canvas');

module.exports = async function generateTemplate(img, overlayText, targetWidth, targetHeight) {
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

  // === URL dynamisch vorbereiten ===
  const urlText = "www.montessori-helden.de";
  let urlFontSize = 16;
  let urlLineHeight = 0;
  const maxUrlWidth = maxTextWidth;
  const maxUrlFontSize = Math.min(22, chosenFontSize - 1);

  for (let size = maxUrlFontSize; size >= 12; size -= 1) {
    ctx.font = `bold ${size}px "Open Sans"`;
    const metrics = ctx.measureText(urlText);
    if (metrics.width <= maxUrlWidth) {
      urlFontSize = size;
      urlLineHeight = size * 1.3;
      break;
    }
  }
  if (urlLineHeight === 0) urlLineHeight = urlFontSize * 1.3;

  // === Box-Berechnung ===
  ctx.font = `900 ${chosenFontSize}px "Open Sans"`; // zurück für Messung
  const totalTextHeight = lines.length * lineHeight;
  // URL Abstand nach oben wird 40% weniger, deshalb padding wird 60% von vorher für URL-Abstand genutzt
  const urlPaddingTop = padding * 0.6;

  const rectWidth = maxTextWidth + padding * 2;
  const rectHeight = totalTextHeight + padding * 2 + urlLineHeight + urlPaddingTop;
  const verticalPositionFactor = 0.8;
  const rectY = targetHeight * verticalPositionFactor - rectHeight / 2;
  const rectX = (targetWidth - rectWidth) / 2;

  // === Hintergrundbox ohne runde Ecken, komplett deckend ===
  ctx.save();
  ctx.fillStyle = 'rgba(173, 216, 230, 1)'; // komplett deckend
  ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
  ctx.restore();

  // === Dünne, leicht wellige weiße Linie als Kontur der Farbfläche, eingerückt ===
  const lineInset = 9; // Einrückung innen
  const waveAmplitude = 3;
  const waveLength = 20;

  ctx.save();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1.5;
  ctx.beginPath();

  // Obere Linie (von links nach rechts)
  for (let x = rectX + lineInset; x <= rectX + rectWidth - lineInset; x++) {
    const y = rectY + lineInset + waveAmplitude * Math.sin(((x - (rectX + lineInset)) / waveLength) * 2 * Math.PI);
    if (x === rectX + lineInset) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  // Rechte Linie (von oben nach unten)
  for (let y = rectY + lineInset; y <= rectY + rectHeight - lineInset; y++) {
    const x = rectX + rectWidth - lineInset + waveAmplitude * Math.sin(((y - (rectY + lineInset)) / waveLength) * 2 * Math.PI);
    ctx.lineTo(x, y);
  }
  // Untere Linie (von rechts nach links)
  for (let x = rectX + rectWidth - lineInset; x >= rectX + lineInset; x--) {
    const y = rectY + rectHeight - lineInset + waveAmplitude * Math.sin(((x - (rectX + lineInset)) / waveLength) * 2 * Math.PI);
    ctx.lineTo(x, y);
  }
  // Linke Linie (von unten nach oben)
  for (let y = rectY + rectHeight - lineInset; y >= rectY + lineInset; y--) {
    const x = rectX + lineInset + waveAmplitude * Math.sin(((y - (rectY + lineInset)) / waveLength) * 2 * Math.PI);
    ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // === Text zeichnen (weiß, ohne Schatten) ===
  ctx.save();
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((line, index) => {
    const y = rectY + padding + index * lineHeight;
    ctx.fillText(line, targetWidth / 2, y);
  });
  ctx.restore();

  // === URL innerhalb der Box (weiß, ohne Schatten) ===
  ctx.save();
  ctx.fillStyle = 'white';
  ctx.font = `bold ${urlFontSize}px "Open Sans"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(
    urlText,
    targetWidth / 2,
    rectY + padding + totalTextHeight + urlPaddingTop // neuer Abstand zum Haupttext
  );
  ctx.restore();

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
