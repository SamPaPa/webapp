const http = require("http");

const PORT = process.env.PORT || 3000;

const page = (req) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My App</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 4rem auto; padding: 0 1rem; }
    code { background: #eee; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>It works 🎉</h1>
  <p>Served over HTTPS by nginx, proxied to a Node app in Docker.</p>
  <p>Host: <code>${req.headers.host}</code><br>
     Protocol: <code>${req.headers["x-forwarded-proto"] || "http"}</code></p>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("ok");
  }
  if (req.url === "/favicon.ico") {
    res.writeHead(204);
    return res.end();
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(page(req));
});

server.listen(PORT, () => console.log(`App listening on ${PORT}`));