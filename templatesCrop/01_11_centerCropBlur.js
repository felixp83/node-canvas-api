// 01_11_centerCropBlur.js
const { createCanvas } = require('canvas');

// Skalierungsbasierter Blur, funktioniert ohne ctx.filter.
// strength: 0.05 (leicht) bis 0.35 (sehr stark)
// passes: Wiederholungen, jede Wiederholung verstärkt den Effekt
function applyScaleBlur(srcCanvas, { strength = 0.35, passes = 2 } = {}) {
  const w = srcCanvas.width;
  const h = srcCanvas.height;

  // Stärke in Downscale-Verhältnis umsetzen (5%..50% der Originalgröße)
  const ratio = Math.max(0.1, Math.min(0.6, strength));

  const smallW = Math.max(1, Math.round(w * ratio));
  const smallH = Math.max(1, Math.round(h * ratio));

  const tmp = createCanvas(smallW, smallH);
  const tctx = tmp.getContext('2d');
  const sctx = srcCanvas.getContext('2d');

  // Hohe Interpolationsqualität
  tctx.imageSmoothingEnabled = true;
  tctx.imageSmoothingQuality = 'high';
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = 'high';

  // Mehrere Down-/Upscale-Pässe für stärkeren Blur
  for (let i = 0; i < passes; i++) {
    // Downscale
    tctx.clearRect(0, 0, smallW, smallH);
    tctx.drawImage(srcCanvas, 0, 0, smallW, smallH);

    // Upscale zurück auf Originalgröße
    sctx.clearRect(0, 0, w, h);
    sctx.drawImage(tmp, 0, 0, smallW, smallH, 0, 0, w, h);
  }
}

module.exports = async function centerCropWithDynamicZoomAndBlur(img) {
  const targetWidth = 1000;
  const targetHeight = 1500;
  const targetRatio = targetWidth / targetHeight; // ≈0.6667

  // Dynamischer Zoomfaktor zwischen 1.10 (110%) und 1.20 (120%)
  const minZoom = 1.10;
  const maxZoom = 1.20;
  const zoomFactor = Math.random() * (maxZoom - minZoom) + minZoom;

  const imgWidth = img.width;
  const imgHeight = img.height;
  const imgRatio = imgWidth / imgHeight;

  let cropWidth, cropHeight;

  if (imgWidth >= targetWidth && imgHeight >= targetHeight) {
    cropWidth = targetWidth;
    cropHeight = targetHeight;
  } else {
    if (imgRatio > targetRatio) {
      cropHeight = imgHeight;
      cropWidth = cropHeight * targetRatio;
    } else {
      cropWidth = imgWidth;
      cropHeight = cropWidth / targetRatio;
    }
  }

  // Gezoomter Crop-Bereich (kleiner als cropWidth/-Height)
  const zoomedCropWidth = cropWidth / zoomFactor;
  const zoomedCropHeight = cropHeight / zoomFactor;

  // Zentrierter Startpunkt des Ausschnitts
  const sx = (imgWidth - zoomedCropWidth) / 2;
  const sy = (imgHeight - zoomedCropHeight) / 2;

  // Offscreen-Canvas zum Rendern und Weichzeichnen
  const work = createCanvas(targetWidth, targetHeight);
  const wctx = work.getContext('2d');

  // Erst den zugeschnittenen/gesoomten Bereich rendern
  wctx.imageSmoothingEnabled = true;
  wctx.imageSmoothingQuality = 'high';
  wctx.drawImage(
    img,
    sx, sy, zoomedCropWidth, zoomedCropHeight,
    0, 0, targetWidth, targetHeight
  );

  // --- Starker Blur ohne ctx.filter ---
  const BLUR_STRENGTH = 0.35; // 0.05..0.35 -> höher = stärker (z.B. 0.20 oder 0.25)
  const BLUR_PASSES = 3;      // 2–3 Pässe = sehr weich
  applyScaleBlur(work, { strength: BLUR_STRENGTH, passes: BLUR_PASSES });

  // Ergebnis ins Ziel-Canvas kopieren (falls du später noch darauf zeichnen willst)
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(work, 0, 0);

  return canvas;
};
