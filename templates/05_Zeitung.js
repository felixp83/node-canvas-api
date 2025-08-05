const { createCanvas } = require('canvas');

module.exports = async function generateTemplate(img, overlayText, targetWidth, targetHeight, website) {
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  const topHeight = targetHeight * 0.18;
  const bottomHeight = targetHeight * 0.15;
  const imageHeight = targetHeight - topHeight - bottomHeight;

  // Hintergrund weiß
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Obere abgerissene Kante
  drawTornEdge(ctx, 0, topHeight - 8, targetWidth, 16, 12);

  // Call to Action oben
  ctx.fillStyle = '#000';
  const ctaFontSize = Math.floor(topHeight * 0.3);
  ctx.font = `bold ${ctaFontSize}px "Open Sans"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JETZT ANSCHAUEN', targetWidth / 2, topHeight / 2);

  // Bild platzieren
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

  // Transparenter Balken für overlayText
  const titleBarHeight = imageHeight * 0.15;
  const barY = topHeight + imageHeight / 2 - titleBarHeight / 2;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillRect(0, barY, targetWidth, titleBarHeight);

  // OverlayText (z. B. Haupttitel)
  ctx.fillStyle = '#000';
  ctx.font = `bold 36px "Open Sans"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxTitleWidth = targetWidth * 0.9;
  const lines = wrapText(ctx, overlayText, maxTitleWidth, 2);
  const lineHeight = 40;
  const startY = barY + titleBarHeight / 2 - (lines.length - 1) * lineHeight / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, targetWidth / 2, startY + i * lineHeight);
  });

  // Untere abgerissene Kante
  const bottomY = targetHeight - bottomHeight;
  drawTornEdge(ctx, 0, bottomY, targetWidth, 16, 12, true);

  // URL unten mittig
  const url = (website || 'www.montessori-helden.de').toUpperCase();
  const urlFontSize = Math.floor(bottomHeight * 0.3);
  ctx.fillStyle = '#000';
  ctx.font = `normal ${urlFontSize}px "Open Sans"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(url, targetWidth / 2, bottomY + bottomHeight / 2);

  return canvas;
};

// Abgerissene Kante zeichnen (oben oder unten)
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

// Text umbrechen (max. 2 Zeilen)
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
