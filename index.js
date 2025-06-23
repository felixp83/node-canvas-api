const express = require('express');
const { createCanvas } = require('canvas');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  const text = req.query.text || 'Hello, World!';

  const width = 800;
  const height = 400;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Hintergrund
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, width, height);

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px Sans';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  // Header für PNG
  res.setHeader('Content-Type', 'image/png');

  // Bild zurücksenden
  canvas.createPNGStream().pipe(res);
});

app.listen(port, () => {
  cons
