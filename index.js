const express = require('express');
const { loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

const standard = require('./templates/01_Standard');
const centerCrop = require('./templatesCrop/01_centerCrop');
const bottomleftCrop = require('./templatesCrop/02_bottomleftCrop');
const bottomrightCrop = require('./templatesCrop/03_bottomrightCrop');
const topleftCrop = require('./templatesCrop/04_topleftCrop');
const toprightCrop = require('./templatesCrop/05_toprightCrop');
const verspielt = require('./templates/02_Verspielt');
const outline = require('./templates/03_outline');
const centerCropZoom = require('./templatesCrop/01_1_centerCropZoom');
const quadrat = require('./templates/04_Quadrat');

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

// Route: Standard Template
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

// Route: Center Crop Template
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

// Route: Bottom Left Crop Template
app.post('/bottom-left-crop', async (req, res) => {
  const imageUrl = req.body.url;

  if (!imageUrl) {
    return res.status(400).send('Missing "url" in request body');
  }

  try {
    const img = await loadImage(imageUrl);
    const canvas = await bottomleftCrop(img);

    const filename = `img-bottomleft-crop-${Date.now()}.png`;
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

// Route: Bottom Right Crop Template
app.post('/bottom-right-crop', async (req, res) => {
  const imageUrl = req.body.url;

  if (!imageUrl) {
    return res.status(400).send('Missing "url" in request body');
  }

  try {
    const img = await loadImage(imageUrl);
    const canvas = await bottomrightCrop(img);

    const filename = `img-bottomright-crop-${Date.now()}.png`;
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

// Route: Top Left Crop Template
app.post('/top-left-crop', async (req, res) => {
  const imageUrl = req.body.url;

  if (!imageUrl) {
    return res.status(400).send('Missing "url" in request body');
  }

  try {
    const img = await loadImage(imageUrl);
    const canvas = await topleftCrop(img);

    const filename = `img-topleft-crop-${Date.now()}.png`;
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

// Route: Top Right Crop Template
app.post('/top-right-crop', async (req, res) => {
  const imageUrl = req.body.url;

  if (!imageUrl) {
    return res.status(400).send('Missing "url" in request body');
  }

  try {
    const img = await loadImage(imageUrl);
    const canvas = await toprightCrop(img);

    const filename = `img-topright-crop-${Date.now()}.png`;
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

// Neue Route: Verspielt Template
app.post('/verspielt', async (req, res) => {
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

    const canvas = await verspielt(img, overlayText, targetWidth, targetHeight);

    const filename = `img-verspielt-${Date.now()}.png`;
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
// Neue Route: Outline Template
app.post('/outline', async (req, res) => {
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

    const canvas = await outline(img, overlayText, targetWidth, targetHeight);

    const filename = `img-outline-${Date.now()}.png`;
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
// Neue Route: CenterCropZoom Template
app.post('/center-crop-zoom', async (req, res) => {
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

    const canvas = await centerCropZoom(img, overlayText, targetWidth, targetHeight);

    const filename = `img-center-crop-zoom-${Date.now()}.png`;
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
// Neue Route: Quadrat Template
app.post('/quadrat', async (req, res) => {
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

    const canvas = await quadrat(img, overlayText, targetWidth, targetHeight);

    const filename = `img-quadrat-${Date.now()}.png`;
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
