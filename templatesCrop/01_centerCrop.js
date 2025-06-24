const { createCanvas } = require('canvas');

module.exports = async function centerCrop(img) {
  const targetWidth = 1000;
  const targetHeight = 1500;

  // Berechne Skalierungsfaktor, damit das Bild den Zielbereich komplett füllt (cover)
  const scale = Math.max(targetWidth / img.width, targetHeight / img.height);

  // Berechnete neue Bildgröße nach Skalierung
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;

  // Berechne Startpunkt, um den mittleren Ausschnitt (center crop) zu zeichnen
  const sx = (scaledWidth - targetWidth) / 2;
  const sy = (scaledHeight - targetHeight) / 2;

  // Canvas mit Zielgröße erstellen
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  // Zeichne das skalierte Bild auf Canvas mit Offset, sodass mittlerer Bereich ausgeschnitten wird
  ctx.drawImage(
    img,
    0, 0, img.width, img.height,         // Quelle: komplettes Originalbild
    -sx, -sy, scaledWidth, scaledHeight  // Ziel: skaliert und verschoben auf Canvas, damit center crop entsteht
  );

  return canvas;
};
