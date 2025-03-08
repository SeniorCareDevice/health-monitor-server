const express = require('express');
const WebSocket = require('ws');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from 'public' folder
app.use(express.static('public'));

// Create HTTP server and attach WebSocket
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (message) => {
        console.log('Received:', message);
        // Broadcast to all clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});