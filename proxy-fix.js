const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: 'http://210.212.246.131:3009',
  changeOrigin: true,
  logLevel: 'debug'
}));

// Proxy auth requests to backend API
app.use('/auth', createProxyMiddleware({
  target: 'http://210.212.246.131:3009/api',
  changeOrigin: true,
  logLevel: 'debug'
}));

// Handle all other routes with index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = 8085;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Frontend proxy server running on http://210.212.246.131:${PORT}`);
  console.log(`📡 Proxying API requests to http://210.212.246.131:3009`);
});
