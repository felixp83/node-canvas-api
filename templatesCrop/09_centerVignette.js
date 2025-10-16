const { createCanvas } = require('canvas');

module.exports = async function centerCropSquare(img) {
  const targetSize = 1000; // quadratisches Ziel
  const targetWidth = targetSize;
  const targetHeight = targetSize;

  const imgWidth = img.width;
  const imgHeight = img.height;

  // Wir behalten die gesamte Höhe und schneiden nur links/rechts
  let cropHeight = imgHeight;
  let cropWidth = imgHeight; // damit quadratischer Ausschnitt

  // Falls das Bild schmaler ist als hoch, nehmen wir die volle Breite
  if (imgWidth < imgHeight) {
    cropWidth = imgWidth;
    cropHeight = imgWidth;
  }

  // zentrierter Startpunkt (nur horizontal relevant)
  const sx = (imgWidth - cropWidth) / 2;
  const sy = (imgHeight - cropHeight) / 2;

  // Canvas mit 1000x1000
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // Zuschneiden + auf 1000x1000 skalieren
  ctx.drawImage(
    img,
    sx, sy, cropWidth, cropHeight,  // Quellbereich (quadratisch)
    0, 0, targetWidth, targetHeight // Zielgröße
  );

  // --- Vignette hinzufügen ---
  const vignette = ctx.createRadialGradient(
    targetWidth / 2, targetHeight / 2, targetWidth * 0.4, // innerer Kreis (transparent)
    targetWidth / 2, targetHeight / 2, targetWidth / 2  // äußerer Kreis (dunkel)
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');   // Zentrum transparent
  vignette.addColorStop(1, 'rgba(0,0,0,0.25)'); // Ränder leicht abgedunkelt

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  return canvas;
};
