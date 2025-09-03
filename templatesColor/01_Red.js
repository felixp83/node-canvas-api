// 01_Red.js
const { createCanvas } = require('canvas');

module.exports = async function generateRedTemplate() {
  // Fixes: exakt 1000x1500 px
  const WIDTH = 1000;
  const HEIGHT = 1500;

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // === Sanfter Rotton als Grundfläche ===
  const baseRed = '#E87474'; // soft red
  ctx.fillStyle = baseRed;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // === Leicht geschwungenes Muster in etwas hellerem Rot ===
  // dezente, halbtransparente Wellenbänder
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#F29A9A'; // etwas heller als Grundfläche

  const bands = 7;
  const bandHeight = 64;
  const amplitude = 28;

  for (let i = 0; i < bands; i++) {
    const y = 100 + i * ((HEIGHT - 200) / (bands - 1)); // gleichmäßig verteilt
    const bh = bandHeight * (0.9 + (i % 2) * 0.15);      // minimale Variation
    const amp = amplitude * (0.85 + (i % 3) * 0.1);      // minimale Variation
    const phase = i * 0.6;

    ctx.beginPath();
    // obere Wellenkante
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      WIDTH * 0.25, y - amp * Math.cos(phase),
      WIDTH * 0.75, y + amp * Math.sin(phase),
      WIDTH, y
    );
    // untere Wellenkante (Band schließen)
    const y2 = y + bh;
    ctx.lineTo(WIDTH, y2);
    ctx.bezierCurveTo(
      WIDTH * 0.75, y2 + amp * Math.cos(phase + 0.7),
      WIDTH * 0.25, y2 - amp * Math.sin(phase + 0.7),
      0, y2
    );
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

  return canvas;
};
