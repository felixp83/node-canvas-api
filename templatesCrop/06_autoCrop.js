// 06_autoCrop.js
const { createCanvas } = require('canvas');

/* ---------- Utils ---------- */
function luma(r, g, b) {
  // Rec. 601
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Runterskalierte Analyse + gleichzeitiges Erfassen von
 * Spalten- und Zeilen-Energien (Gradienten über Luminanz).
 */
function computeEnergies(img, maxAnalysisWidth = 600) {
  const scale = Math.min(1, maxAnalysisWidth / img.width);
  const aw = Math.max(1, Math.round(img.width * scale));
  const ah = Math.max(1, Math.round(img.height * scale));

  const aCanvas = createCanvas(aw, ah);
  const aCtx = aCanvas.getContext('2d');
  aCtx.drawImage(img, 0, 0, aw, ah);

  const { data } = aCtx.getImageData(0, 0, aw, ah);
  const colE = new Float32Array(aw);
  const rowE = new Float32Array(ah);

  const xStep = aw > 800 ? 2 : 1;
  const yStep = ah > 800 ? 2 : 1;

  for (let y = 1; y < ah; y += yStep) {
    for (let x = 1; x < aw; x += xStep) {
      const i    = (y * aw + x) * 4;
      const im1x = (y * aw + (x - 1)) * 4;
      const im1y = ((y - 1) * aw + x) * 4;

      const Y  = luma(data[i],    data[i+1],    data[i+2]);
      const Yx = luma(data[im1x], data[im1x+1], data[im1x+2]);
      const Yy = luma(data[im1y], data[im1y+1], data[im1y+2]);

      const g = Math.abs(Y - Yx) + Math.abs(Y - Yy);
      colE[x] += g;
      rowE[y] += g;
    }
  }

  return { colEnergies: colE, rowEnergies: rowE, analysisWidth: aw, analysisHeight: ah, scale };
}

/**
 * Gleitfenster-Maximierung mit leichter Center- und Drittel-Bias.
 * - centerBias: 0..0.3 (0 = keine Center-Bias)
 * - thirdsBias: 0..0.3 (Bonus nahe Drittellinien)
 */
function findBestStart(energies, windowSize, { centerBias = 0.12, thirdsBias = 0.08 } = {}) {
  const n = energies.length;
  const W = Math.min(windowSize, n);
  if (W >= n) return 0;

  // Precompute integrals (Fenstersumme in O(1))
  const prefix = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + energies[i];

  // Bias-Funktionen
  const thirds1 = n / 3;
  const thirds2 = (2 * n) / 3;

  function biasFor(start) {
    const center = start + W / 2;
    const normCenter = Math.abs(center - n / 2) / (n / 2); // 0 Mitte, 1 Rand
    const bCenter = 1 - centerBias * normCenter;

    // Drittel-Bias: Bonus, je näher das Fensterzentrum an Dritteln ist
    const d1 = Math.abs(center - thirds1) / n;
    const d2 = Math.abs(center - thirds2) / n;
    const nearThird = Math.max(0, 1 - Math.min(d1, d2) * 6); // grobe Glocke
    const bThirds = 1 + thirdsBias * nearThird;

    return bCenter * bThirds;
  }

  let bestStart = 0;
  let bestScore = (prefix[W] - prefix[0]) * biasFor(0);

  for (let start = 1; start <= n - W; start++) {
    const sum = prefix[start + W] - prefix[start];
    const score = sum * biasFor(start);
    if (score > bestScore) {
      bestScore = score;
      bestStart = start;
    }
  }

  return bestStart;
}

/* ---------- Hauptfunktion ---------- */
module.exports = async function autoCrop(img, opts = {}) {
  const {
    targetWidth = 1000,
    targetHeight = 1500,
    analysisMaxWidth = 600,
    centerBiasX = 0.12,
    thirdsBiasX = 0.08,
    centerBiasY = 0.10,
    thirdsBiasY = 0.06
  } = opts;

  const targetRatio = targetWidth / targetHeight;

  const imgWidth = img.width;
  const imgHeight = img.height;
  const imgRatio = imgWidth / imgHeight;

  // Ausgangs-Crop-Größe (Seitenverhältnis sichern)
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

  // Energies berechnen (runterskaliert)
  const { colEnergies, rowEnergies, analysisWidth, analysisHeight, scale } =
    computeEnergies(img, analysisMaxWidth);

  // Fenstergrößen in Analyse-Skala
  const cropW_A = Math.max(1, Math.round(cropWidth * scale));
  const cropH_A = Math.max(1, Math.round(cropHeight * scale));

  // Beste Startpunkte (Analyse-Skala)
  const bestX_A = findBestStart(colEnergies, cropW_A, { centerBias: centerBiasX, thirdsBias: thirdsBiasX });
  const bestY_A = findBestStart(rowEnergies, cropH_A, { centerBias: centerBiasY, thirdsBias: thirdsBiasY });

  // Zurück auf Originalskala + clamp
  let sx = Math.round(bestX_A / scale);
  let sy = Math.round(bestY_A / scale);
  sx = Math.max(0, Math.min(imgWidth - cropWidth, sx));
  sy = Math.max(0, Math.min(imgHeight - cropHeight, sy));

  // Rendern in Zielgröße
  const canvas = createCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    img,
    sx, sy, cropWidth, cropHeight,   // Quelle: adaptiv X+Y
    0, 0, targetWidth, targetHeight  // Ziel
  );

  return canvas;
};
