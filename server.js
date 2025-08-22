const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets (HTML, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Simple health endpoint (good for k8s/docker health checks)
app.get('/healthz', (req, res) => res.status(200).send('ok'));

// Stream MP4 with range requests for seeking
app.get('/video', (req, res) => {
  const videoPath = path.join(__dirname, 'public', 'sample.mp4');
  if (!fs.existsSync(videoPath)) return res.status(404).send('Video not found');

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const file = fs.createReadStream(videoPath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4'
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes'
    });
    fs.createReadStream(videoPath).pipe(res);
  }
});

app.listen(PORT, () => {
  console.log(`Video server listening on http://0.0.0.0:${PORT}`);
});
