const { createCanvas } = require('canvas');

module.exports = async function generateTemplate(img, overlayText, targetWidth, targetHeight, website) {
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  const topHeight = targetHeight * 0.18;
  const bottomHeight = targetHeight * 0.15;
  const imageHeight = targetHeight - topHeight - bottomHeight;

  // === Hintergrund komplett weiß ===
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // === Abrisskante unten am oberen weißen Bereich ===
  drawTornEdge(ctx, 0, topHeight - 10, targetWidth, 20, 12, false);

  // === Text: "JETZT ANSCHAUEN" (fett, mittig oben) ===
  ctx.fillStyle = '#000000';
  ctx.font = `bold ${Math.floor(topHeight * 0.3)}px Open Sans`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JETZT ANSCHAUEN', targetWidth / 2, topHeight / 2);

  // === Bild ===
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

  // === Transparenter Balken für Titel ===
  const barHeight = imageHeight * 0.18;
  const barY = topHeight + imageHeight / 2 - barHeight / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(0, barY, targetWidth, barHeight);

  // === Overlay Text ===
  const maxTitleWidth = targetWidth * 0.9;
  const maxLines = 2;
  ctx.fillStyle = '#000';
  let titleFontSize = 40;
  let lines;

  for (let size = 50; size >= 20; size -= 2) {
    ctx.font = `bold ${size}px Open Sans`;
    lines = wrapText(ctx, overlayText, maxTitleWidth, maxLines);
    if (lines.length <= maxLines) {
      titleFontSize = size;
      break;
    }
  }

  ctx.font = `bold ${titleFontSize}px Open Sans`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lineHeight = titleFontSize * 1.2;
  const textStartY = barY + (barHeight - lines.length * lineHeight) / 2 + lineHeight / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, targetWidth / 2, textStartY + i * lineHeight);
  });

  // === Abrisskante oben an unterem weißen Bereich ===
  const bottomY = targetHeight - bottomHeight;
  drawTornEdge(ctx, 0, bottomY, targetWidth, 20, 12, true);

  // === URL ===
  const urlText = website || 'www.montessori-helden.de';
  ctx.fillStyle = '#444';
  const urlFontSize = Math.floor(bottomHeight * 0.25);
  ctx.font = `normal ${urlFontSize}px Open Sans`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(urlText, targetWidth / 2, bottomY + bottomHeight / 2);

  return canvas;
};

// === Abrisskanten zeichnen ===
function drawTornEdge(ctx, x, y, width, height, zigzagSize, topEdge = false) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  if (topEdge) {
    ctx.moveTo(x, y + height);
    let toggle = true;
    for (let i = 0; i <= width; i += zigzagSize) {
      ctx.lineTo(i, toggle ? y : y + height);
      toggle = !toggle;
    }
    ctx.lineTo(width, y + height * 2);
    ctx.lineTo(0, y + height * 2);
  } else {
    ctx.moveTo(x, y);
    let toggle = true;
    for (let i = 0; i <= width; i += zigzagSize) {
      ctx.lineTo(i, toggle ? y + height : y);
      toggle = !toggle;
    }
    ctx.lineTo(width, y - height);
    ctx.lineTo(0, y - height);
  }
  ctx.closePath();
  ctx.fill();
}

// === Textumbruch ===
function wrapText(ctx, text, maxWidth, maxLines) {
  const words = text.split(' ');
  let lines = [], currentLine = '';

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
