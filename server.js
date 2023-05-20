const express = require('express');
// const multer = require('multer');
const cors = require('cors');
const path = require('path');
// const fs = require ('fs');

const app = express();
// const upload = multer({ dest: 'uploads/' });

// Enable CORS for all routes
app.use(cors());

// Serve static files from the "public" directory
app.use(express.static('public'));

app.get('/peer-info', (req, res) => {
  const filePath = path.join(__dirname, './', 'peers.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=peers.csv');
  res.sendFile(filePath);
});

app.get('/block-announcements', (req, res) => {
  const filePath = path.join(__dirname, './', 'block_announcements.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=block_announcements.csv');
  res.sendFile(filePath);
});

app.get('/block-imports', (req, res) => {
  const filePath = path.join(__dirname, './', 'block_import_times.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=block_import_times.csv');
  res.sendFile(filePath);
});

app.get('/best-and-finalized', (req, res) => {
  const filePath = path.join(__dirname, './', 'block_info.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=block_info.csv');
  res.sendFile(filePath);
});

app.listen(8000, () => {
  console.log('Server is listening on port 8000');
});