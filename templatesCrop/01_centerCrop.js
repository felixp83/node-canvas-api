const centerCrop = require('./templatesCrop/01_centerCrop');

// ...

app.post('/center-crop', async (req, res) => {
  const imageUrl = req.body.url;

  if (!imageUrl) {
    return res.status(400).send('Missing "url" in request body');
  }

  try {
    const canvas = await centerCrop(imageUrl);

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
