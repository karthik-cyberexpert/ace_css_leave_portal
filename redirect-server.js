const http = require('http');
const url = require('url');

// Configuration
const LISTEN_PORT = 80;
const TARGET_PORT = 8085;
const TARGET_HOST = 'localhost';

console.log('?? Starting HTTP Redirect Server...');
console.log(?? Redirecting port  -> );

// Create HTTP server
const server = http.createServer((req, res) => {
    const targetUrl = http://:;
    
    console.log(?? Redirecting:  -> );
    
    // Send 301 permanent redirect
    res.writeHead(301, {
        'Location': targetUrl,
        'Cache-Control': 'no-cache'
    });
    res.end();
});

// Start server
server.listen(LISTEN_PORT, '0.0.0.0', () => {
    console.log('? Redirect server started successfully!');
    console.log(?? Access your site at: http://192.168.46.89 (no port needed!));
    console.log(?? Redirects to: http://localhost:);
    console.log('');
    console.log('Press Ctrl+C to stop the server');
});

// Handle errors
server.on('error', (err) => {
    console.error('? Server error:', err.message);
    if (err.code === 'EADDRINUSE') {
        console.error(??  Port  is already in use!);
        console.error('   Try running as Administrator or stop other services using port 80');
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n?? Shutting down redirect server...');
    server.close(() => {
        console.log('? Redirect server stopped');
        process.exit(0);
    });
});
