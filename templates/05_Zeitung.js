const { createCanvas } = require('canvas');

module.exports = async function generateTemplate(img, overlayText, targetWidth, targetHeight, website) {
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // === Parameter ===
  const topWhiteHeight = targetHeight * 0.18;   // obere weiße Fläche (18%)
  const bottomWhiteHeight = targetHeight * 0.15; // untere weiße Fläche (15%)
  const middleHeight = targetHeight - topWhiteHeight - bottomWhiteHeight;

  // === Gesamthintergrund weiß ===
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // === Obere weiße Fläche mit "abgerissener" Kante unten ===
  // (hier ist es bereits weiß, aber wir zeichnen die Kante)
  drawTornEdge(ctx, 0, topWhiteHeight - 8, targetWidth, 16, 12);

  // Call to Action Text "JETZT ANSCHAUEN" (schwarz, mittig, vertikal in Mitte der oberen Fläche)
  ctx.fillStyle = '#000';
  const ctaFontSize = Math.floor(topWhiteHeight * 0.3);
  ctx.font = `bold ${ctaFontSize}px "Open Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JETZT ANSCHAUEN', targetWidth / 2, topWhiteHeight / 2);

  // === Bildbereich zwischen den weißen Flächen ===
  // Bild wird so skaliert, dass es in den mittleren Bereich passt und quadratisch ist
  const maxImgHeight = middleHeight;
  const maxImgWidth = targetWidth;
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

  ctx.drawImage(img, sx, sy, sSize, sSize, 0, topWhiteHeight, targetWidth, maxImgHeight);

  // === Weiß-transparenter Balken für Haupttitel (etwa 15% Höhe vom Bildbereich, über das Bild gelegt) ===
  const titleBarHeight = maxImgHeight * 0.15;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(0, topWhiteHeight + maxImgHeight / 2 - titleBarHeight / 2, targetWidth, titleBarHeight);

  // Haupttitel (overlayText) mittig in Balken, schwarzer Text, fetter Schrift
  ctx.fillStyle = '#000';
  const maxTitleWidth = targetWidth * 0.9;
  ctx.font = `bold 36px "Open Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Text umbrechen falls zu breit
  const titleLines = wrapText(ctx, overlayText, maxTitleWidth, 2);
  const lineHeight = 40;
  const startY = topWhiteHeight + maxImgHeight / 2 - ((titleLines.length - 1) * lineHeight) / 2;
  titleLines.forEach((line, i) => {
    ctx.fillText(line, targetWidth / 2, startY + i * lineHeight);
  });

  // === Untere weiße Fläche mit "abgerissener" Kante oben ===
  // schon weiß, wir zeichnen nur die Kante
  const bottomY = targetHeight - bottomWhiteHeight;
  drawTornEdge(ctx, 0, bottomY, targetWidth, 16, 12, true);

  // Montessori URL mittig in der unteren weißen Fläche
  const urlText = website || 'www.montessori-helden.de';
  ctx.fillStyle = '#000';
  const urlFontSize = Math.floor(bottomWhiteHeight * 0.3);
  ctx.font = `normal ${urlFontSize}px "Open Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(urlText, targetWidth / 2, bottomY + bottomWhiteHeight / 2);

  return canvas;
};

// === Funktion zum Zeichnen der "abgerissenen" Kante (gezackte Linie) ===
// Wenn topEdge=true, wird die Linie oben gezeichnet, sonst unten
function drawTornEdge(ctx, x, y, width, height, zigzagSize, topEdge = false) {
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  if (topEdge) {
    ctx.moveTo(x, y + height);
    let toggle = true;
    for (let i = 0; i <= width; i += zigzagSize) {
      ctx.lineTo(i, toggle ? y : y + height);
      toggle = !toggle;
    }
    ctx.lineTo(width, y + height);
    ctx.lineTo(width, y + height * 2);
    ctx.lineTo(x, y + height * 2);
    ctx.closePath();
  } else {
    ctx.moveTo(x, y);
    let toggle = true;
    for (let i = 0; i <= width; i += zigzagSize) {
      ctx.lineTo(i, toggle ? y + height : y);
      toggle = !toggle;
    }
    ctx.lineTo(width, y);
    ctx.lineTo(width, y + height * 2);
    ctx.lineTo(x, y + height * 2);
    ctx.closePath();
  }
  ctx.fill();
}

// === Text umbrechen Funktion (max. Zeilen, max. Breite) ===
function wrapText(ctx, text, maxWidth, maxLines) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const width = ctx.measureText(testLine).width;
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (lines.length < maxLines - 1) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // letzte Zeile abschneiden mit ...
        let trimmed = currentLine;
        while (ctx.measureText(trimmed + '...').width > maxWidth && trimmed.length > 0) {
          trimmed = trimmed.slice(0, -1);
        }
        lines.push(trimmed + '...');
        return lines;
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}
