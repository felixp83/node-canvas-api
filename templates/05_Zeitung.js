const { createCanvas } = require('canvas');

module.exports = async function generateTemplate(img, overlayText, targetWidth, targetHeight, website) {
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // === Farben ===
  const white = '#fff';
  const bgColor = '#f5f0e6';
  const textColor = '#000';

  // === Bereiche ===
  const topHeight = targetHeight * 0.18;
  const bottomHeight = targetHeight * 0.15;
  const titleBarHeight = targetHeight * 0.15;

  // === Hintergrundgrundfarbe (für Bildbereich) ===
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // --- Obere weiße Fläche ---
  ctx.fillStyle = white;
  ctx.fillRect(0, 0, targetWidth, topHeight);

  // --- Abgerissene Kante unten an oberem weißen Bereich ---
  drawTornEdge(ctx, 0, topHeight, targetWidth, 10, 15);

  // --- CTA Text "JETZT ANSCHAUEN" in Schwarz, zentriert, mittig in oberem Bereich ---
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const ctaFontSize = Math.floor(topHeight * 0.4);
  ctx.font = `bold ${ctaFontSize}px "Open Sans", sans-serif`;
  ctx.fillText('JETZT ANSCHAUEN', targetWidth / 2, topHeight / 2);

  // --- Unterer weißer Bereich ---
  const bottomY = targetHeight - bottomHeight;
  ctx.fillStyle = white;
  ctx.fillRect(0, bottomY, targetWidth, bottomHeight);

  // --- Abgerissene Kante oben am unteren weißen Bereich ---
  drawTornEdge(ctx, 0, bottomY, targetWidth, 10, 15, true);

  // --- URL unten mittig ---
  const urlFontSize = Math.floor(bottomHeight * 0.4);
  ctx.fillStyle = textColor;
  ctx.font = `normal ${urlFontSize}px "Open Sans", sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText(website || 'www.montessori-helden.de', targetWidth / 2, bottomY + bottomHeight / 2);

  // --- Halbtransparenter weißer Balken für Haupttitel ---
  const titleBarY = topHeight + (targetHeight - topHeight - bottomHeight) / 2 - titleBarHeight / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(0, titleBarY, targetWidth, titleBarHeight);

  // --- Haupttitel Text ---
  ctx.fillStyle = '#5b4636';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Schriftgröße dynamisch anpassen, max 3 Zeilen
  const maxWidth = targetWidth * 0.9;
  let chosenFontSize = titleBarHeight * 0.5;
  ctx.font = `900 ${chosenFontSize}px "Open Sans", sans-serif`;

  let lines = wrapText(ctx, overlayText, maxWidth, 3);
  while (lines.length * chosenFontSize * 1.2 > titleBarHeight) {
    chosenFontSize -= 2;
    ctx.font = `900 ${chosenFontSize}px "Open Sans", sans-serif`;
    lines = wrapText(ctx, overlayText, maxWidth, 3);
    if (chosenFontSize < 12) break; // Minimum Schriftgröße
  }

  const totalTextHeight = lines.length * chosenFontSize * 1.2;
  let textStartY = titleBarY + (titleBarHeight - totalTextHeight) / 2 + chosenFontSize * 0.1;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], targetWidth / 2, textStartY + i * chosenFontSize * 1.2);
  }

  // --- Bildbereich dazwischen (zwischen oberem weißen Bereich + Titelbalken und unterem weißen Bereich) ---
  const imageAreaYStart = topHeight;
  const imageAreaYEnd = bottomY;
  const imageAreaHeight = imageAreaYEnd - imageAreaYStart;

  // Bild quadratisch skalieren, max Höhe = imageAreaHeight
  const maxImgSize = Math.min(targetWidth, imageAreaHeight);
  let sx, sy, sSize;
  if (img.width > img.height) {
    sSize = img.height;
    sx = (img.width - sSize) / 2;
    sy = 0;
  } else {
    sSize = img.width;
    sx = 0;
    sy = (img.height - sSize) / 2;
  }

  const dx = (targetWidth - maxImgSize) / 2;
  const dy = imageAreaYStart + (imageAreaHeight - maxImgSize) / 2;

  ctx.drawImage(img, sx, sy, sSize, sSize, dx, dy, maxImgSize, maxImgSize);

  return canvas;
};

// === Hilfsfunktion: gezackte abgerissene Kante zeichnen ===
// Wenn invert = true, wird Zackenkante nach oben gezeichnet (für unteren weißen Bereich)
function drawTornEdge(ctx, x, y, width, amplitude, segmentWidth, invert = false) {
  ctx.fillStyle = '#f5f0e6'; // Hintergrundfarbe, um "abgerissen" Effekt zu erzeugen
  ctx.beginPath();

  if (!invert) {
    // von links nach rechts unten
    ctx.moveTo(x, y);
    for (let i = 0; i < width; i += segmentWidth) {
      ctx.lineTo(x + i, y + (i / segmentWidth) % 2 === 0 ? amplitude : 0);
    }
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + amplitude + 10);
    ctx.lineTo(x, y + amplitude + 10);
  } else {
    // von links nach rechts oben
    ctx.moveTo(x, y + amplitude + 10);
    for (let i = 0; i < width; i += segmentWidth) {
      ctx.lineTo(x + i, y + (i / segmentWidth) % 2 === 0 ? 0 : amplitude);
    }
    ctx.lineTo(x + width, y + amplitude + 10);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

// === Text Wrapper (max Zeilen und max Breite) ===
function wrapText(ctx, text, maxWidth, maxLines) {
  const words = text.split(' ');
  let lines = [];
  let currentLine = '';

  for (let word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines) break;
    }
  }
  if (currentLine && lines.length < maxLines) lines.push(currentLine);

  if (lines.length > maxLines) lines = lines.slice(0, maxLines);
  return lines;
}
