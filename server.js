const express = require('express');
const cors = require('cors');
const path = require('path');
let WebSocket = require("ws");
let WSServer = require("ws").Server;

const app = express();

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

app.get('/roles', (req, res) => {
  const filePath = path.join(__dirname, './', 'roles.json');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=roles.json');
  res.sendFile(filePath);
});

app.get('/addresses', (req, res) => {
  const filePath = path.join(__dirname, './', 'addresses.json');

  res.setHeader('Content-Type', 'text/json');
  res.setHeader('Content-Disposition', 'attachment; filename=addresses.json');
  res.sendFile(filePath);
});

app.get('/substreams', (req, res) => {
  const filePath = path.join(__dirname, './', 'substreams.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=substreams.csv');
  res.sendFile(filePath);
});

app.get('/sync-connectivity', (req, res) => {
  const filePath = path.join(__dirname, './', 'sync_connectivity.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=sync_connectivity.csv');
  res.sendFile(filePath);
});

app.get('/sync-request-response', (req, res) => {
  const filePath = path.join(__dirname, './', 'sync_request_response.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=sync_request_response.csv');
  res.sendFile(filePath);
});

app.get('/sync-msg', (req, res) => {
  const filePath = path.join(__dirname, './', 'sync_msg.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=sync_msg.csv');
  res.sendFile(filePath);
});

app.get('/sync-bytes', (req, res) => {
  const filePath = path.join(__dirname, './', 'sync_bytes.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=sync_bytes.csv');
  res.sendFile(filePath);
});

app.get('/grandpa-msg', (req, res) => {
  const filePath = path.join(__dirname, './', 'grandpa_msg.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=grandpa_msg.csv');
  res.sendFile(filePath);
});

app.get('/grandpa-bytes', (req, res) => {
  const filePath = path.join(__dirname, './', 'grandpa_bytes.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=grandpa_bytes.csv');
  res.sendFile(filePath);
});

app.get('/connectivity.js', (req, res) => {
  const filePath = path.join(__dirname, 'public/js', 'connectivity.js');

  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(filePath);
});

app.get('/data_usage.js', (req, res) => {
  const filePath = path.join(__dirname, 'public/js', 'data_usage.js');

  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(filePath);
});

app.get('/general.js', (req, res) => {
  const filePath = path.join(__dirname, 'public/js', 'general.js');

  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(filePath);
});

app.get('/utils.js', (req, res) => {
  const filePath = path.join(__dirname, 'public/js', 'utils.js');

  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(filePath);
});

app.get('/sync.js', (req, res) => {
  const filePath = path.join(__dirname, 'public/js', 'sync.js');

  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(filePath);
});

app.get('/grandpa.js', (req, res) => {
  const filePath = path.join(__dirname, 'public/js', 'grandpa.js');

  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(filePath);
});

app.get('/upload.js', (req, res) => {
  const filePath = path.join(__dirname, 'public/js', 'upload.js');

  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(filePath);
});

var server = require("http").createServer();
server.listen(8000).on("request", app);

// use the same server for WebSocket and http server
let wss = new WSServer({
    server: server
});

wss.on('connection', function(client) {
    console.log("client connected")

    client.on('message', function(msg) {
        if (msg === "status") {
            console.log('check status of logs');
        } else {
            console.log(msg);
        }
    });

    client.on('close', function(connection) {
        console.log("client disconnected");
    });
});
