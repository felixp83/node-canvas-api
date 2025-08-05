const { createCanvas } = require('canvas');

module.exports = async function generateTemplate(img, overlayText, targetWidth, targetHeight, website) {
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  const topWhiteHeight = targetHeight * 0.18;
  const bottomWhiteHeight = targetHeight * 0.15;
  const middleHeight = targetHeight - topWhiteHeight - bottomWhiteHeight;

  // === Hintergrund weiß ===
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // === Abrisskante oben === (sichtbare Zickzack-Linie)
  drawTornLine(ctx, 0, topWhiteHeight, targetWidth, 20, '#999');

  // === Call to Action ===
  ctx.fillStyle = '#000';
  const ctaFontSize = Math.floor(topWhiteHeight * 0.3);
  ctx.font = `bold ${ctaFontSize}px "Open Sans"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JETZT ANSCHAUEN', targetWidth / 2, topWhiteHeight / 2);

  // === Bildbereich ===
  const maxImgHeight = middleHeight;
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

  // === Weiß-transparenter Balken ===
  const titleBarHeight = maxImgHeight * 0.15;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(0, topWhiteHeight + maxImgHeight / 2 - titleBarHeight / 2, targetWidth, titleBarHeight);

  // === Overlay Text ===
  ctx.fillStyle = '#000';
  ctx.font = `bold 36px "Open Sans"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const maxTitleWidth = targetWidth * 0.9;
  const titleLines = wrapText(ctx, overlayText, maxTitleWidth, 2);
  const lineHeight = 40;
  const startY = topWhiteHeight + maxImgHeight / 2 - ((titleLines.length - 1) * lineHeight) / 2;
  titleLines.forEach((line, i) => {
    ctx.fillText(line, targetWidth / 2, startY + i * lineHeight);
  });

  // === Abrisskante unten === (sichtbare Zickzack-Linie)
  const bottomY = targetHeight - bottomWhiteHeight;
  drawTornLine(ctx, 0, bottomY, targetWidth, 20, '#999');

  // === Website URL ===
  const urlText = website || 'www.montessori-helden.de';
  const urlFontSize = Math.floor(bottomWhiteHeight * 0.2);
  ctx.fillStyle = '#000';
  ctx.font = `normal ${urlFontSize}px "Open Sans"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(urlText, targetWidth / 2, bottomY + bottomWhiteHeight / 2);

  return canvas;
};

// === Sichtbare Zickzack-Linie statt Fläche ===
function drawTornLine(ctx, x, y, width, height, color = '#000') {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  let toggle = true;
  for (let i = 0; i <= width; i += height) {
    ctx.lineTo(i, toggle ? y + height : y);
    toggle = !toggle;
  }
  ctx.stroke();
}

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
