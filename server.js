// Parts of the code from here have been taken from https://github.com/ultravideo/cloud-encoder
// which is licensed under BSD-2.

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const multer = require('multer');
const { spawn } = require('child_process');

let WSServer = require("ws").Server;
var ws_client = null;

const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve static files from the "public" directory
app.use(express.static('public'));

app.get('/peer-info', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'peers.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=peers.csv');
  res.sendFile(filePath);
});

app.get('/block-announcements', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'block_announcements.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=block_announcements.csv');
  res.sendFile(filePath);
});

app.get('/block-imports', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'block_import_times.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=block_import_times.csv');
  res.sendFile(filePath);
});

app.get('/best-and-finalized', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'block_info.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=block_info.csv');
  res.sendFile(filePath);
});

app.get('/sent-bytes', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'bytes_sent.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=bytes_sent.csv');
  res.sendFile(filePath);
});

app.get('/received-bytes', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'bytes_received.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=bytes_received.csv');
  res.sendFile(filePath);
});

app.get('/sent-messages', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'messages_sent.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=messages_sent.csv');
  res.sendFile(filePath);
});

app.get('/received-messages', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'messages_received.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=messages_received.csv');
  res.sendFile(filePath);
});

app.get('/connectivity', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'connectivity.json');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=connectivity.json');
  res.sendFile(filePath);
});

app.get('/sync-request-failure-success', (req, res) => {
  console.log('got request for sucess/failure repsonse');

  const filePath = path.join(__dirname, './results/', 'sync_request_success_failure.json');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=sync_request_success_failure.json');
  res.sendFile(filePath);
});

app.get('/roles', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'roles.json');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=roles.json');
  res.sendFile(filePath);
});

app.get('/addresses', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'addresses.json');

  res.setHeader('Content-Type', 'text/json');
  res.setHeader('Content-Disposition', 'attachment; filename=addresses.json');
  res.sendFile(filePath);
});

app.get('/substreams', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'substreams.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=substreams.csv');
  res.sendFile(filePath);
});

app.get('/sync-connectivity', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'sync_connectivity.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=sync_connectivity.csv');
  res.sendFile(filePath);
});

app.get('/sync-request-response', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'sync_request_response.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=sync_request_response.csv');
  res.sendFile(filePath);
});

app.get('/sync-msg', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'sync_msg.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=sync_msg.csv');
  res.sendFile(filePath);
});

app.get('/sync-bytes', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'sync_bytes.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=sync_bytes.csv');
  res.sendFile(filePath);
});

app.get('/grandpa-msg', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'grandpa_msg.csv');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=grandpa_msg.csv');
  res.sendFile(filePath);
});

app.get('/grandpa-bytes', (req, res) => {
  const filePath = path.join(__dirname, './results/', 'grandpa_bytes.csv');

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

app.get('/resumable.js', (req, res) => {
  const filePath = path.join(__dirname, 'public/js', 'resumable.js');

  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(filePath);
});

app.use(bodyParser.json({ limit: '10gb' }));
app.use(bodyParser.urlencoded({ limit: '10gb', extended: true }));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
    console.log('file uploaded sucecssfully', req.file.path);
    res.status(200).send('File uploaded successfully.');

    const program = 'target/release/trace-analyzer';
    const args = ['--file', req.file.path];

    const childProcess = spawn(program, args);

    // Event handler for capturing the output of the external program
    childProcess.stdout.on('data', data => {
        console.log(data);
    });

    childProcess.on('error', error => {
        console.error(`Error starting the program: ${error}`);
    });

    childProcess.on('exit', (code, signal) => {
        console.log(`Program exited with code ${code} and signal ${signal}`);
        ws_client.send(JSON.stringify({ 'status': { "analysisReady": 0 } }));
    })
});

var server = require("http").createServer();
server.listen(8000).on("request", app);

// use the same server for WebSocket and http server
let wss = new WSServer({
    server: server
});

wss.on('connection', function(client) {
    const files = fs.readdirSync("results/");
    console.log("client connected")
    ws_client = client;

    client.send(JSON.stringify({ 'status': { "noFiles": files.length === 0 } }));

    client.on('message', function(msg) {
        try {
            var message = JSON.parse(msg);
        } catch (err) {
            console.log("failed to parse client message: ", err);
            return;
        }

        if ("deleteFiles" in message["status"]) {
            console.log('delete files from results/');

            files.forEach(file => {
                const filePath = `results/${file}`;
                fs.unlinkSync(filePath);
            });

            client.send(JSON.stringify({ 'status': { "filesDeleted": true } }));
        }
    });

    client.on('close', function(_connection) {
        console.log("client disconnected");
    });
});
