import express from 'express';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fetch from 'node-fetch';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Custom auth handler for better control and debugging
app.use('/auth', async (req, res, next) => {
  try {
    console.log(`[AUTH] ${req.method} ${req.url}`);
    console.log('[AUTH] Request body:', JSON.stringify(req.body, null, 2));
    
    // Forward to backend API
    const backendUrl = `http://localhost:3008${req.url}`;
    console.log('[AUTH] Forwarding to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': req.get('User-Agent') || 'Frontend-Proxy/1.0'
      },
      body: JSON.stringify(req.body)
    });
    
    console.log(`[AUTH] Backend responded: ${response.status} ${response.statusText}`);
    
    const responseData = await response.json();
    console.log('[AUTH] Response data:', JSON.stringify(responseData, null, 2));
    
    // Forward response back to frontend
    res.status(response.status).json(responseData);
    
  } catch (error) {
    console.error('[AUTH] Error:', error.message);
    res.status(500).json({ 
      error: 'Authentication proxy error', 
      details: error.message 
    });
  }
});

// Proxy other API requests to backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3008',
  changeOrigin: true,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[PROXY] → ${req.method} ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[PROXY] ← ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
  },
  onError: (err, req, res) => {
    console.error('[PROXY] Error:', err.message);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}));

// Handle all other routes with index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = 3009;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Leave Portal Frontend running on http://localhost:${PORT}`);
  console.log(`📡 Backend API: http://localhost:3008`);
  console.log(`🔧 Login should now work properly!`);
});

export default app;
