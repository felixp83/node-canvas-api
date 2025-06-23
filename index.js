const express = require('express');
const { createCanvas, loadImage } = require('canvas');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/', async (req, res) => {
  const imageUrl = req.body.url;
  const overlayText = req.body.overlay || 'Hello, World!';

  if (!imageUrl) {
    return res.status(400).send('Missing "url" in request body');
  }

  try {
    // Bild laden von URL
    const img = await loadImage(imageUrl);

    const width = img.width;
    const height = img.height;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Bild auf Canvas zeichnen
    ctx.drawImage(img, 0, 0, width, height);

    // Overlay Text
    ctx.fillStyle = 'rgba(0,0,0,0.5)';  // halbtransparenter Hintergrund fürs Overlay
    ctx.fillRect(0, height - 60, width, 60);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px Sans';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(overlayText, width / 2, height - 30);

    // Antwort als PNG
    res.setHeader('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);
  } catch (error) {
    console.error('Error loading image:', error);
    res.status(500).send('Failed to load image from URL');
  }
});

app.listen(port, () => {
  console.log(`Canvas API running on port ${port}`);
});
