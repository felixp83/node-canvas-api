const { createCanvas } = require('canvas');

module.exports = async function generateFreshTemplate(
  img,
  overlayText,
  targetWidth,
  targetHeight,
  website
) {
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // === Fester oberer weißer Bereich (immer sichtbar oben) ===
  const topWhiteHeight = 500;

  // === Hintergrund gesplittet: weiß oben, Bild unten ===
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, targetWidth, topWhiteHeight);

  // === Headline vorbereiten ===
  const padding = 20;
  const maxTextWidth = targetWidth * 0.8;
  const maxTextBlockHeight = topWhiteHeight * 0.5;
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
    ctx.font = `900 32px "Open Sans"`;
    chosenFontSize = 32;
    lineHeight = 32 * 1.3;
    lines = [overlayText];
  }

  ctx.font = `900 ${chosenFontSize}px "Open Sans"`;
  const totalTextHeight = lines.length * lineHeight;
  const textY = topWhiteHeight / 2 - totalTextHeight / 2 + 55;

  ctx.fillStyle = '#3B2F2F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((line, index) => {
    ctx.fillText(line, targetWidth / 2, textY + index * lineHeight);
  });

  // === CTA-Kapsel oben (im weißen Bereich) ===
  const ctaText = 'JETZT MERKEN';
  const ctaFontSize = 48;
  ctx.font = `bold ${ctaFontSize}px "Open Sans"`;
  const ctaWidth = ctx.measureText(ctaText).width + 100;
  const ctaHeight = ctaFontSize * 1.6;
  const ctaX = (targetWidth - ctaWidth) / 2;
  const ctaY = 80;

  ctx.fillStyle = '#75C47E';
  roundRect(ctx, ctaX, ctaY, ctaWidth, ctaHeight, ctaHeight / 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ctaText, targetWidth / 2, ctaY + ctaHeight / 2);

  // === Bild (unter dem weißen Bereich, ggf. beschnitten) ===
  const imgY = topWhiteHeight;
  const imgHeight = targetHeight - topWhiteHeight;

  if (img && img.width && img.height) {
    const imgAspect = img.width / img.height;
    const canvasAspect = targetWidth / imgHeight;

    let drawWidth, drawHeight, drawX, drawY;
    if (imgAspect > canvasAspect) {
      drawHeight = imgHeight;
      drawWidth = imgHeight * imgAspect;
      drawX = (targetWidth - drawWidth) / 2;
      drawY = imgY;
    } else {
      drawWidth = targetWidth;
      drawHeight = targetWidth / imgAspect;
      drawX = 0;
      drawY = imgY;
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }

  // === Website unten (dynamisch) mit Fallback ===
  const urlText = (website && website.trim() ? website : 'www.montessori-helden.de').toUpperCase();

  const urlFontSize = 42;
  ctx.font = `bold ${urlFontSize}px "Open Sans"`;
  const urlWidth = ctx.measureText(urlText).width + 100;
  const urlHeight = urlFontSize * 1.6;
  const urlX = (targetWidth - urlWidth) / 2;
  const urlY = targetHeight - urlHeight - 55; // 15px höher

  ctx.fillStyle = '#75C47E';
  roundRect(ctx, urlX, urlY, urlWidth, urlHeight, urlHeight / 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(urlText, targetWidth / 2, urlY + urlHeight / 2);

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
