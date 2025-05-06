import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import TerminalManager from './terminal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const terminalManager = new TerminalManager();

// Serve static files from the React app
app.use(express.static(join(__dirname, '../dist')));

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
    if (req.url.startsWith('/api/terminals/')) {
        terminalManager.handleConnection(ws, req);
    }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 