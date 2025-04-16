import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Test server is running!' }));
});

server.listen(8080, '0.0.0.0', () => {
  console.log('Test server running on port 8080');
}); 