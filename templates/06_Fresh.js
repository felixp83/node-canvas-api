const { createCanvas } = require('canvas');

module.exports = async function generateTemplate(img, overlayText, targetWidth, targetHeight, website) {
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // === Layout-Bereiche ===
  const topBoxHeight = targetHeight * 0.12;
  const textAreaHeight = targetHeight * 0.25;
  const imageAreaY = topBoxHeight + textAreaHeight;
  const imageAreaHeight = targetHeight - imageAreaY - topBoxHeight * 0.5;

  // === Hintergrund weiß ===
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // === CTA in grünem Kasten oben ===
  const ctaText = 'JETZT MERKEN';
  const ctaFontSize = Math.floor(topBoxHeight * 0.35);
  const ctaPadding = 20;

  const ctaTextWidth = measureTextWidth(ctx, ctaText, `bold ${ctaFontSize}px "Open Sans"`);
  const ctaBoxWidth = ctaTextWidth + ctaPadding * 2;
  const ctaBoxHeight = ctaFontSize * 1.6;
  const ctaBoxX = (targetWidth - ctaBoxWidth) / 2;
  const ctaBoxY = (topBoxHeight - ctaBoxHeight) / 2;

  ctx.fillStyle = '#7ac66c';
  roundRect(ctx, ctaBoxX, ctaBoxY, ctaBoxWidth, ctaBoxHeight, 12, true, false);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${ctaFontSize}px "Open Sans"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ctaText, targetWidth / 2, ctaBoxY + ctaBoxHeight / 2);

  // === Headline & Subline Textbereich ===
  const headline = overlayText.split('\n')[0] || 'Titel';
  const subline = overlayText.split('\n')[1] || 'Untertitel';

  ctx.fillStyle = '#3b2e2a';
  ctx.font = `bold ${Math.floor(textAreaHeight * 0.18)}px "Open Sans"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(headline, targetWidth / 2, topBoxHeight + 10);

  ctx.font = `normal ${Math.floor(textAreaHeight * 0.12)}px "Open Sans"`;
  ctx.fillStyle = '#3b2e2a';
  ctx.fillText(subline, targetWidth / 2, topBoxHeight + textAreaHeight * 0.5);

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

  ctx.drawImage(img, sx, sy, sSize, sSize, 0, imageAreaY, targetWidth, imageAreaHeight);

  // === Footer URL ===
  const urlText = website || 'www.superduperseite.de';
  const urlFontSize = Math.floor(topBoxHeight * 0.25);
  ctx.fillStyle = '#ffffff';
  const urlBoxWidth = measureTextWidth(ctx, urlText, `bold ${urlFontSize}px "Open Sans"`) + 40;
  const urlBoxHeight = urlFontSize * 1.6;
  const urlBoxY = targetHeight - urlBoxHeight - 16;

  ctx.fillStyle = '#7ac66c';
  roundRect(ctx, (targetWidth - urlBoxWidth) / 2, urlBoxY, urlBoxWidth, urlBoxHeight, 10, true, false);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${urlFontSize}px "Open Sans"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(urlText, targetWidth / 2, urlBoxY + urlBoxHeight / 2);

  return canvas;
};

function measureTextWidth(ctx, text, font) {
  ctx.font = font;
  return ctx.measureText(text).width;
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

