// =====================================================
// FABBRIDGE LOCAL DEVELOPMENT SERVER
// Serves the frontend on port 5501 (matching VS Code Live Server settings)
// =====================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5501;
const FRONTEND_DIR = path.join(__dirname, 'frontend');

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'text/javascript; charset=UTF-8',
    '.mjs': 'text/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=UTF-8'
};

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // Normalize paths: strip leading /frontend if present
    if (pathname.startsWith('/frontend/')) {
        pathname = pathname.slice('/frontend'.length);
    } else if (pathname === '/frontend') {
        pathname = '/';
    }

    if (pathname === '/' || pathname === '') {
        pathname = '/index.html';
    }

    let filePath = path.join(FRONTEND_DIR, pathname);

    // If no file extension and file doesn't exist, try appending .html
    if (!path.extname(filePath) && !fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
    }

    // Security check: ensure path is inside FRONTEND_DIR
    if (!filePath.startsWith(FRONTEND_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head><title>404 Not Found</title></head>
                <body style="font-family: sans-serif; padding: 40px; text-align: center;">
                    <h2>404 - Page Not Found</h2>
                    <p>The requested URL <code>${escapeHtml(req.url)}</code> was not found.</p>
                    <p><a href="/">Return to Home</a> | <a href="/marketplace.html">Marketplace</a></p>
                </body>
                </html>
            `);
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Cache-Control': 'no-cache'
        });

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    });
});

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`FabBridge Server is running!`);
    console.log(`Local URL: http://localhost:${PORT}`);
    console.log(`Marketplace: http://localhost:${PORT}/marketplace.html`);
    console.log(`Post Requirement: http://localhost:${PORT}/post_requirement.html`);
    console.log(`Login: http://localhost:${PORT}/login.html`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is in use. Retrying on port 5502...`);
        server.listen(5502, '0.0.0.0', () => {
            console.log(`FabBridge Server is running on http://localhost:5502`);
        });
    } else {
        console.error('Server error:', err);
    }
});
