const { createCanvas } = require('canvas');

module.exports = async function generateTemplate(img, overlayText, _targetWidth, _targetHeight, website) {
  // === Canvas fix 1000x1500 px ===
  const targetWidth = 1000;
  const targetHeight = 1500;

  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // === Hintergrund hellblau ===
  ctx.fillStyle = '#d1dcd8';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // === Bild einfügen ===
  if (img && img.width && img.height) {
    const imgAspect = img.width / img.height;
    const canvasAspect = targetWidth / targetHeight;

    let dx = 0;
    let dy = 0;
    let dw = targetWidth;
    let dh = targetHeight;

    if (img.width === img.height) {
      // Quadratisches Bild: oben platzieren, 1000x1000
      const squareSize = Math.min(targetWidth, targetHeight * 2 / 3);
      const sSize = img.width;
      const sx = 0;
      const sy = 0;
      dx = 0;
      dy = 0;
      dw = targetWidth;
      dh = squareSize;

      ctx.drawImage(img, sx, sy, sSize, sSize, dx, dy, dw, dh);
    } else if (img.height === targetHeight && img.width === targetWidth) {
      // Hochformatbild 1000x1500 px: Hintergrund komplett
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    } else if (imgAspect > canvasAspect) {
      // Breiter als hoch: auf Höhe skalieren, zentriert
      dh = targetHeight;
      dw = dh * imgAspect;
      dx = (targetWidth - dw) / 2;
      dy = 0;
      ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);
    } else {
      // Hochformat oder gleiches Verhältnis: auf Breite skalieren
      dw = targetWidth;
      dh = dw / imgAspect;
      dx = 0;
      dy = 0;
      ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);
    }
  }

  // === Footer-Abstand (für URL und Button) ===
  const footerPadding = targetHeight * 0.05;
  const urlFontSize = 48;
  const urlText = website || "www.montessori-helden.de";

  // === Button-Parameter ===
  const buttonBaseHeight = 120;
  const buttonHeight = buttonBaseHeight * 0.9 * 0.85 * 0.9;
  const buttonText = "JETZT WEITERLESEN";
  const buttonFontSize = 28;

  ctx.font = `normal ${buttonFontSize}px "Open Sans"`;
  const buttonTextWidth = ctx.measureText(buttonText).width;
  const paddingX = 40;
  const baseButtonWidth = buttonTextWidth + paddingX * 2;
  const buttonWidth = baseButtonWidth * 1.1 * 1.2 * 1.15;

  const buttonX = (targetWidth - buttonWidth) / 2;
  const buttonY = targetHeight - footerPadding * 2 - urlFontSize - buttonHeight + 50;

  // === Haupttext dynamisch in freiem Raum ===
  const topY = img.width === img.height ? Math.min(targetWidth, targetHeight * 2 / 3) + 50 : 50;
  const bottomY = buttonY - 20;
  const textAreaHeight = bottomY - topY;

  const overlayMaxWidth = targetWidth * 0.9;
  let chosenFontSize = 40;
  let lines = [];
  let lineHeight = 0;

  for (let size = 60; size >= 20; size -= 2) {
    ctx.font = `900 ${size}px "Open Sans"`;
    lineHeight = size * 1.2;
    lines = wrapText(ctx, overlayText, overlayMaxWidth, 3);
    if (lines.length * lineHeight <= textAreaHeight) {
      chosenFontSize = size;
      break;
    }
  }

  const textBlockHeight = lines.length * lineHeight;
  const textStartY = topY + (textAreaHeight - textBlockHeight) / 2;

  ctx.font = `900 ${chosenFontSize}px "Open Sans"`;
  ctx.fillStyle = '#5b4636';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => {
    ctx.fillText(line, targetWidth / 2, textStartY + i * lineHeight);
  });

  // === Button zeichnen ===
  ctx.fillStyle = '#5b4636';
  roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 14, true, false);

  ctx.fillStyle = 'white';
  ctx.font = `normal ${buttonFontSize}px "Open Sans"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(buttonText, targetWidth / 2, buttonY + buttonHeight / 2);

  // === URL ganz unten ===
  ctx.font = `normal ${urlFontSize}px "Open Sans"`;
  ctx.fillStyle = '#5b4636';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(urlText, targetWidth / 2, targetHeight - footerPadding + 45);

  return canvas;
};

// === Hilfsfunktionen ===
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

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
    for (let side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
