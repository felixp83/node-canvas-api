const express = require('express');
const { createCanvas } = require('canvas');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  const canvas = createCanvas(500, 300);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1e90ff';
  ctx.fillRect(0, 0, 500, 300);

  ctx.fillStyle = '#fff';
  ctx.font = '30px Arial';
  ctx.fillText('Hello from node-canvas!', 50, 150);

  res.setHeader('Content-Type', 'image/png');
  canvas.createPNGStream().pipe(res);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
