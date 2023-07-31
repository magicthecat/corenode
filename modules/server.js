const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000; // Change this to your desired port number

function getFilePathFromRoute(route) {
    if (route === '/') {
        return 'public/index.html';
    }

    const fileName = route.slice(1); // Remove the leading forward slash
    return `public/${fileName}.html`;
}

const server = http.createServer((req, res) => {
    const filePath = getFilePathFromRoute(req.url);

    fs.readFile(path.join(__dirname, '..', filePath), 'utf8', (err, content) => {
        if (err) {
            // File not found
            if (err.code === 'ENOENT') {
                fs.readFile(path.join(__dirname, '..', 'public', '404.html'), 'utf8', (err, notFoundContent) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal server error');
                    } else {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end(notFoundContent);
                    }
                });
            } else {
                // Server error
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal server error');
            }
        } else {
            const fileExt = path.extname(filePath).toLowerCase();
            const contentType = {
                '.html': 'text/html',
                '.js': 'text/javascript',
                '.css': 'text/css',
            }[fileExt] || 'text/plain';

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});