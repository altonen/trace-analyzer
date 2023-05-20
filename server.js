
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  if (req.url === '/' && req.method === 'GET') {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

      // Read the CSV file
      fs.readFile('test.html', 'utf8', (err, data) => {
        if (err) {
          res.statusCode = 500;
          res.end('Error reading CSV file');
        } else {
          res.setHeader('Content-Type', 'text/html');
          res.end(data);
        }
      });
  }
  else if (req.url === '/peer-info' && req.method === 'GET') {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    // Read the CSV file
    fs.readFile('peers.csv', 'utf8', (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end('Error reading CSV file');
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.end(data);
      }
    });
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
});

const port = 8000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
