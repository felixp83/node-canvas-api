const { createCanvas } = require('canvas');

module.exports = async function generateTemplate(img, overlayText, targetWidth, targetHeight, website) {
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // === Layout Parameter ===
  const topWhiteHeight = targetHeight * 0.18;
  const bottomWhiteHeight = targetHeight * 0.15;
  const middleHeight = targetHeight - topWhiteHeight - bottomWhiteHeight;

  // === Hintergrund weiß ===
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // === Obere Abrisskante ===
  drawTornEdge(ctx, 0, topWhiteHeight - 10, targetWidth, 20, 16);

  // === Call to Action oben ===
  ctx.fillStyle = '#000';
  const ctaFontSize = Math.floor(topWhiteHeight * 0.3);
  ctx.font = `bold ${ctaFontSize}px "Open Sans"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JETZT ANSCHAUEN', targetWidth / 2, topWhiteHeight / 2);

  // === Bildbereich mittig ===
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

  ctx.drawImage(img, sx, sy, sSize, sSize, 0, topWhiteHeight, targetWidth, middleHeight);

  // === Titelbalken über Bild ===
  const titleBarHeight = middleHeight * 0.18;
  const titleBarY = topWhiteHeight + middleHeight / 2 - titleBarHeight / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(0, titleBarY, targetWidth, titleBarHeight);

  ctx.fillStyle = '#000';
  const maxTitleWidth = targetWidth * 0.9;
  ctx.font = `bold 36px "Open Sans"`;
  const lines = wrapText(ctx, overlayText, maxTitleWidth, 2);
  const lineHeight = 40;
  const titleStartY = titleBarY + (titleBarHeight - lineHeight * lines.length) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, targetWidth / 2, titleStartY + i * lineHeight);
  });

  // === Untere Abrisskante ===
  const bottomY = targetHeight - bottomWhiteHeight;
  drawTornEdge(ctx, 0, bottomY, targetWidth, 20, 16, true);

  // === URL unten ===
  const urlText = website || 'www.montessori-helden.de';
  ctx.fillStyle = '#000';
  const urlFontSize = Math.floor(bottomWhiteHeight * 0.22);
  ctx.font = `normal ${urlFontSize}px "Open Sans"`;
  ctx.textBaseline = 'middle';
  ctx.fillText(urlText, targetWidth / 2, bottomY + bottomWhiteHeight / 2);

  return canvas;
};

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
