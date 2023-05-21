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

app.get('/sent-bytes', (req, res) => {
  const filePath = path.join(__dirname, './', 'bytes_sent.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=bytes_sent.csv');
  res.sendFile(filePath);
});

app.get('/received-bytes', (req, res) => {
  const filePath = path.join(__dirname, './', 'bytes_received.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=bytes_received.csv');
  res.sendFile(filePath);
});

app.get('/sent-messages', (req, res) => {
  const filePath = path.join(__dirname, './', 'messages_sent.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=messages_sent.csv');
  res.sendFile(filePath);
});

app.get('/received-messages', (req, res) => {
  const filePath = path.join(__dirname, './', 'messages_received.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=messages_received.csv');
  res.sendFile(filePath);
});

app.get('/connectivity', (req, res) => {
  const filePath = path.join(__dirname, './', 'connectivity.json');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=connectivity.json');
  res.sendFile(filePath);
});

app.get('/network.js', (req, res) => {
  const filePath = path.join(__dirname, 'public/js', 'network.js');

  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(filePath);
});

app.get('/general.js', (req, res) => {
  const filePath = path.join(__dirname, 'public/js', 'general.js');

  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(filePath);
});

app.listen(8000, () => {
  console.log('Server is listening on port 8000');
});