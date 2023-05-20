const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Enable CORS for all routes
app.use(cors());

// Serve static files from the "public" directory
app.use(express.static('public'));

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const { filename, size, mimetype } = req.file;
  res.send(`File uploaded: ${filename}, size: ${size} bytes, type: ${mimetype}`);
});

app.get('/peer-info', (req, res) => {
  // Path to your CSV file
  const filePath = path.join(__dirname, './', 'peers.csv');

  // Set the appropriate headers
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=peer-info.csv');

  // Send the file
  res.sendFile(filePath);
});

app.listen(8000, () => {
  console.log('Server is listening on port 8000');
});