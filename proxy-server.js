// Simple HTTP proxy server to redirect port 80 to port 8080
// This allows accessing http://ace.cs.leaveportal.local without port numbers
// Run this with: node proxy-server.js (as Administrator)

const http = require('http');
const httpProxy = require('http-proxy-middleware');
const express = require('express');

const app = express();
const PORT = 80;  // Standard HTTP port
const TARGET_PORT = 8085;  // Vite dev server port

console.log('🚀 Starting HTTP Proxy Server...');
console.log(`📡 Proxying port ${PORT} -> ${TARGET_PORT}`);

// Create proxy middleware
const proxy = httpProxy.createProxyMiddleware({
  target: `http://localhost:${TARGET_PORT}`,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying for Vite HMR
  logLevel: 'silent',
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', err.message);
    res.status(500).send('Proxy Error: Unable to connect to development server');
  },
  onProxyReq: (proxyReq, req, res) => {
    // Log requests (optional)
    console.log(`🔄 ${req.method} ${req.url} -> http://localhost:${TARGET_PORT}${req.url}`);
  }
});

// Use proxy for all requests
app.use('/', proxy);

// Start the proxy server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Proxy server started successfully!');
  console.log(`🌐 Frontend accessible at: http://ace.cs.leaveportal.local`);
  console.log(`🌐 Direct IP access: http://192.168.46.89`);
  console.log(`🔧 Proxying to Vite server: http://localhost:${TARGET_PORT}`);
  console.log('');
  console.log('📋 Setup Instructions:');
  console.log('1. Keep this proxy server running');
  console.log('2. In another terminal, run: npm run dev-full');
  console.log('3. Access your site at: http://ace.cs.leaveportal.local (no port needed!)');
  console.log('');
  console.log('Press Ctrl+C to stop the proxy server');
});

// Handle WebSocket upgrades for Vite HMR
server.on('upgrade', (req, socket, head) => {
  proxy.upgrade(req, socket, head);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down proxy server...');
  server.close(() => {
    console.log('✅ Proxy server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});
