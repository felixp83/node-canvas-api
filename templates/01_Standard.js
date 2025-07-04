const totalTextHeight = lines.length * lineHeight;

// URL zusätzlich unterhalb des Textes
const urlFontSize = 18;
const urlLineHeight = urlFontSize * 1.3;
const urlTextHeight = urlLineHeight;

// Boxgröße erweitern für die URL
const rectWidth = maxTextWidth + padding * 2;
const rectHeight = totalTextHeight + urlTextHeight + padding * 3;

// Box-Position (20% Abstand vom unteren Rand)
const rectX = (targetWidth - rectWidth) / 2;
const rectY = targetHeight - rectHeight - targetHeight * 0.05;

// === Hintergrundbox ===
ctx.save();
ctx.shadowColor = 'rgba(0,0,0,0.08)';
ctx.shadowBlur = 8;
roundRect(ctx, rectX, rectY, rectWidth, rectHeight, 36); // 20% weniger rund
ctx.fillStyle = 'rgba(173, 216, 230, 0.7)';
ctx.fill();
ctx.restore();

// === Text zeichnen ===
ctx.save();
ctx.shadowColor = 'rgba(0,0,0,0.25)';
ctx.shadowBlur = 4;
ctx.fillStyle = '#333';
lines.forEach((line, index) => {
  const y = rectY + padding + index * lineHeight;
  ctx.fillText(line, targetWidth / 2, y);
});
// URL direkt darunter
ctx.font = `bold ${urlFontSize}px "Open Sans"`;
ctx.fillText('www.montessori-helden.de', targetWidth / 2, rectY + padding + totalTextHeight + padding);
ctx.restore();
