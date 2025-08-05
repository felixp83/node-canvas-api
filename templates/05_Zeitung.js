const { createCanvas } = require('canvas');

module.exports = async function generateTemplate(img, overlayText, targetWidth, targetHeight, website) {
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // === Hintergrund ===
  ctx.fillStyle = '#f5f0e6';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // === Bild (vollflächig, unter der oberen weißen Fläche und über der unteren) ===
  const topHeight = targetHeight * 0.18;    // 18% oben
  const bottomHeight = targetHeight * 0.15; // 15% unten
  const imageHeight = targetHeight - topHeight - bottomHeight;

  // Zuschneiden für quadratisches Bild (mittig)
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

  ctx.drawImage(img, sx, sy, sSize, sSize, 0, topHeight, targetWidth, imageHeight);

  // === Obere weiße Fläche (18%) mit "abgerissener" Kante unten ===
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, targetWidth, topHeight);

  // Abgerissene Kante - unten der oberen Fläche (gezackte Linie)
  drawTornEdge(ctx, 0, topHeight - 8, targetWidth, 8, 15);

  // Call to Action Text "JETZT ANSCHAUEN"
  ctx.fillStyle = '#000';
  const ctaFontSize = Math.floor(topHeight * 0.35);
  ctx.font = `bold ${ctaFontSize}px "Open Sans"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("JETZT ANSCHAUEN", targetWidth / 2, topHeight / 2);

  // === Weiß-transparenter Balken für Haupttitel direkt unter dem oberen Bereich ===
  const overlayBarHeight = topHeight * 0.8;
  const overlayBarY = topHeight + 10;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillRect(0, overlayBarY, targetWidth, overlayBarHeight);

  // Haupttitel (Overlay Text)
  ctx.fillStyle = '#5b4636';
  const maxOverlayFontSize = overlayBarHeight * 0.7;
  ctx.font = `900 ${maxOverlayFontSize}px "Open Sans"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Text umbrechen, max 2 Zeilen
  let lines = wrapText(ctx, overlayText, targetWidth * 0.9, 2);
  const lineHeight = maxOverlayFontSize * 1.2;
  const textBlockHeight = lines.length * lineHeight;
  const textStartY = overlayBarY + (overlayBarHeight - textBlockHeight) / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, targetWidth / 2, textStartY + i * lineHeight + lineHeight / 2);
  });

  // === Untere weiße Fläche (15%) mit URL und abgerissener Kante oben ===
  const footerY = targetHeight - bottomHeight;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, footerY, targetWidth, bottomHeight);

  // Abgerissene Kante - oben der unteren Fläche
  drawTornEdge(ctx, 0, footerY, targetWidth, 8, 15, true);

  // URL Text
  const urlText = website || "www.montessori-helden.de";
  ctx.fillStyle = '#5b4636';
  const urlFontSize = Math.floor(bottomHeight * 0.4);
  ctx.font = `normal ${urlFontSize}px "Open Sans"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(urlText, targetWidth / 2, footerY + bottomHeight / 2);

  return canvas;
};

// Hilfsfunktion: Zeichnet eine gezackte "abgerissene" Kante
// x,y = Startpunkt, width = Breite, height = Höhe der Zacken, zigzagCount = Anzahl Zacken
// flip=true => Zacken oben (für Fußzeile)
function drawTornEdge(ctx, x, y, width, height, zigzagCount, flip = false) {
  const segmentWidth = width / zigzagCount;
  ctx.fillStyle = '#fff';

  ctx.beginPath();
  if (!flip) {
    ctx.moveTo(x, y);
    for (let i = 0; i < zigzagCount; i++) {
      const px = x + i * segmentWidth;
      ctx.lineTo(px + segmentWidth / 2, y + height * (i % 2 === 0 ? 1 : 0));
      ctx.lineTo(px + segmentWidth, y);
    }
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
  } else {
    // Für Fußzeile oben gezackt
    ctx.moveTo(x, y + height);
    for (let i = 0; i < zigzagCount; i++) {
      const px = x + i * segmentWidth;
      ctx.lineTo(px + segmentWidth / 2, y + height * (i % 2 === 0 ? 0 : 1));
      ctx.lineTo(px + segmentWidth, y + height);
    }
    ctx.lineTo(x + width, y);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

// === Textumbruch, ähnlich zu deinem Original ===
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
