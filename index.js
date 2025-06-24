const express = require('express');
const { loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

const standard = require('./templates/01_Standard');
const centerCrop = require('./templatesCrop/01_centerCrop');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
app.use('/public', express.static(publicDir));

// Schriftart registrieren
registerFont(path.join(__dirname, 'fonts', 'OpenSans-Bold.ttf'), {
  family: 'Open Sans',
  weight: 'bold',
});

// Bestehende Route mit Standard
app.post('/', async (req, res) => {
  const imageUrl = req.body.url;
  let overlayText = req.body.overlay || 'Hello, World!';
  overlayText = overlayText.toUpperCase();

  if (!imageUrl) {
    return res.status(400).send('Missing "url" in request body');
  }

  try {
    const img = await loadImage(imageUrl);
    const targetWidth = img.width;
    const targetHeight = img.height;

    const canvas = await standard(img, overlayText, targetWidth, targetHeight);

    const filename = `img-${Date.now()}.png`;
    const savePath = path.join(publicDir, filename);
    const out = fs.createWriteStream(savePath);
    const stream = canvas.createPNGStream();

    stream.pipe(out);
    out.on('finish', () => {
      const imgUrl = `${req.protocol}://${req.get('host')}/public/${filename}`;
      res.json({ imgUrl });
    });

  } catch (error) {
    console.error('Fehler:', error);
    res.status(500).send('Fehler beim Verarbeiten des Bildes');
  }
});

// Neue Route für Center Crop Template
app.post('/center-crop', async (req, res) => {
  const imageUrl = req.body.url;

  if (!imageUrl) {
    return res.status(400).send('Missing "url" in request body');
  }

  try {
    const img = await loadImage(imageUrl);
    const canvas = await centerCrop(img);

    const filename = `img-crop-${Date.now()}.png`;
    const savePath = path.join(publicDir, filename);
    const out = fs.createWriteStream(savePath);
    const stream = canvas.createPNGStream();

    stream.pipe(out);
    out.on('finish', () => {
      const imgUrl = `${req.protocol}://${req.get('host')}/public/${filename}`;
      res.json({ imgUrl });
    });

  } catch (error) {
    console.error('Fehler:', error);
    res.status(500).send('Fehler beim Verarbeiten des Bildes');
  }
});

app.listen(port, () => {
  console.log(`✅ Server läuft auf http://localhost:${port}`);
});
