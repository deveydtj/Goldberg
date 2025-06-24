const express = require('express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const crypto = require('crypto');

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });
const PORT = process.env.PORT || 3000;

// In-memory storage for connected players and puzzle pieces
const emojiList = ['😀', '😎', '😂', '🤖', '🦄', '🐱', '🐶', '🐸', '🐵', '🐼', '🐧', '🐰'];
const players = new Map();
const puzzlePieces = [];

function emojiForIP(ip) {
  // Simple hash to map an IP to one of the emojis
  const hash = crypto.createHash('md5').update(ip).digest()[0];
  return emojiList[hash % emojiList.length];
}

app.use(express.static(path.join(__dirname, '../public')));

// Broadcast helper
function broadcast(obj) {
  const msg = JSON.stringify(obj);
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(msg);
    }
  });
}

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress || '0.0.0.0';
  const emoji = emojiForIP(ip);

  players.set(ws, { ip, emoji });

  // Send existing puzzle state and assigned emoji to the new player
  ws.send(JSON.stringify({ type: 'welcome', emoji, pieces: puzzlePieces }));

  // Notify others a player joined
  broadcast({ type: 'playerJoined', emoji });

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      return;
    }

    // Update puzzle state and broadcast actions
    if (data.type === 'addPiece') {
      puzzlePieces.push(data.piece);
      broadcast({ type: 'addPiece', piece: data.piece });
    }
  });

  ws.on('close', () => {
    players.delete(ws);
    broadcast({ type: 'playerLeft', emoji });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
