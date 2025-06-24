const express = require('express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const crypto = require('crypto');

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });
const PORT = process.env.PORT || 3000;

// In-memory storage for connected players
const emojiList = ['😀', '😎', '😂', '🤖', '🦄', '🐱', '🐶', '🐸', '🐵', '🐼', '🐧', '🐰'];
const players = new Map();
// Current puzzle state managed on the server
let puzzleState = generatePuzzle();

function generatePuzzle() {
  const pieces = [];
  pieces.push({
    id: crypto.randomUUID(),
    type: 'ball',
    x: 40,
    y: 40,
    vx: 0,
    vy: 0,
    radius: 8
  });
  for (let i = 0; i < 5; i++) {
    pieces.push({
      id: crypto.randomUUID(),
      type: 'block',
      x: Math.random() * 760 + 20,
      y: Math.random() * 560 + 20,
      static: true
    });
  }
  const target = {
    x: Math.random() * 760 + 20,
    y: Math.random() * 560 + 20
  };
  return { pieces, target };
}

function checkPuzzleComplete(piece) {
  const dx = piece.x - puzzleState.target.x;
  const dy = piece.y - puzzleState.target.y;
  return Math.sqrt(dx * dx + dy * dy) < 20;
}

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
  ws.send(JSON.stringify({
    type: 'welcome',
    emoji,
    pieces: puzzleState.pieces,
    target: puzzleState.target
  }));

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
      puzzleState.pieces.push(data.piece);
      broadcast({ type: 'addPiece', piece: data.piece });
      if (checkPuzzleComplete(data.piece)) {
        broadcast({ type: 'puzzleComplete', emoji });
        puzzleState = generatePuzzle();
        broadcast({ type: 'newPuzzle', pieces: puzzleState.pieces, target: puzzleState.target });
      }
    } else if (data.type === 'ballUpdate') {
      const ballIndex = puzzleState.pieces.findIndex(p => p.id === data.ball.id);
      if (ballIndex !== -1) {
        puzzleState.pieces[ballIndex] = data.ball;
      }
      broadcast({ type: 'ballUpdate', ball: data.ball });
      if (checkPuzzleComplete(data.ball)) {
        broadcast({ type: 'puzzleComplete', emoji });
        puzzleState = generatePuzzle();
        broadcast({ type: 'newPuzzle', pieces: puzzleState.pieces, target: puzzleState.target });
      }
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
