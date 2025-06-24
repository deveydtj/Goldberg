const express = require('express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });
const PORT = process.env.PORT || 3000;

// In-memory storage for connected players
const emojiList = ['😀', '😎', '😂', '🤖', '🦄', '🐱', '🐶', '🐸', '🐵', '🐼', '🐧', '🐰'];
const players = new Map();

const DB_FILE = path.join(__dirname, 'data.json');

function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { sessions: {}, puzzleState: null, difficulty: 1, progress: {} };
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

let db = loadDB();
let puzzleState = db.puzzleState;
if (!puzzleState) {
  puzzleState = generatePuzzle(db.difficulty);
  db.puzzleState = puzzleState;
  saveDB(db);
}

function generatePuzzle(difficulty = 1) {
  const pieces = [];
  pieces.push({
    id: crypto.randomUUID(),
    type: 'ball',
    x: 40,
    y: 40,
    vx: 0,
    vy: 0,
    radius: 8,
    spawnTime: Date.now()
  });
  const blockCount = 5 + Math.max(0, difficulty - 1);
  for (let i = 0; i < blockCount; i++) {
    pieces.push({
      id: crypto.randomUUID(),
      type: 'block',
      x: Math.random() * 760 + 20,
      y: Math.random() * 560 + 20,
      static: true,
      spawnTime: Date.now()
    });
  }
  const rampCount = Math.max(1, Math.floor(difficulty / 2));
  for (let i = 0; i < rampCount; i++) {
    pieces.push({
      id: crypto.randomUUID(),
      type: 'ramp',
      x: Math.random() * 760 + 20,
      y: Math.random() * 560 + 20,
      direction: Math.random() < 0.5 ? 'left' : 'right',
      spawnTime: Date.now()
    });
  }
  const fanCount = Math.max(0, Math.floor(difficulty / 3));
  for (let i = 0; i < fanCount; i++) {
    pieces.push({
      id: crypto.randomUUID(),
      type: 'fan',
      x: Math.random() * 760 + 20,
      y: Math.random() * 560 + 20,
      power: 1,
      spawnTime: Date.now()
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

function broadcastLeaderboard() {
  broadcast({ type: 'leaderboard', leaderboard: db.progress || {} });
}

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress || '0.0.0.0';
  let emoji = db.sessions[ip];
  if (!emoji) {
    emoji = emojiForIP(ip);
    db.sessions[ip] = emoji;
    saveDB(db);
  }

  players.set(ws, { ip, emoji });

  // Send existing puzzle state and assigned emoji to the new player
  ws.send(JSON.stringify({
    type: 'welcome',
    emoji,
    pieces: puzzleState.pieces,
    target: puzzleState.target,
    leaderboard: db.progress || {}
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
      data.piece.spawnTime = Date.now();
      data.piece.owner = emoji;
      puzzleState.pieces.push(data.piece);
      broadcast({ type: 'addPiece', piece: data.piece });
      if (checkPuzzleComplete(data.piece)) {
        broadcast({ type: 'puzzleComplete', emoji });
        db.difficulty += 1;
        db.progress = db.progress || {};
        db.progress[ip] = (db.progress[ip] || 0) + 1;
        puzzleState = db.puzzleState = generatePuzzle(db.difficulty);
        saveDB(db);
        broadcastLeaderboard();
        broadcast({ type: 'newPuzzle', pieces: puzzleState.pieces, target: puzzleState.target });
      } else {
        db.puzzleState = puzzleState;
        saveDB(db);
      }
    } else if (data.type === 'ballUpdate') {
      const ballIndex = puzzleState.pieces.findIndex(p => p.id === data.ball.id);
      if (ballIndex !== -1) {
        puzzleState.pieces[ballIndex] = data.ball;
      }
      broadcast({ type: 'ballUpdate', ball: data.ball });
      if (checkPuzzleComplete(data.ball)) {
        broadcast({ type: 'puzzleComplete', emoji });
        db.difficulty += 1;
        db.progress = db.progress || {};
        db.progress[ip] = (db.progress[ip] || 0) + 1;
        puzzleState = db.puzzleState = generatePuzzle(db.difficulty);
        saveDB(db);
        broadcastLeaderboard();
        broadcast({ type: 'newPuzzle', pieces: puzzleState.pieces, target: puzzleState.target });
      } else {
        db.puzzleState = puzzleState;
        saveDB(db);
      }
    } else if (data.type === 'movePiece') {
      const piece = puzzleState.pieces.find(p => p.id === data.id);
      if (piece && piece.owner === emoji) {
        piece.x = data.x;
        piece.y = data.y;
        broadcast({ type: 'movePiece', id: piece.id, x: piece.x, y: piece.y });
        db.puzzleState = puzzleState;
        saveDB(db);
      }
    } else if (data.type === 'removePiece') {
      const index = puzzleState.pieces.findIndex(p => p.id === data.id);
      if (index !== -1 && puzzleState.pieces[index].owner === emoji) {
        puzzleState.pieces.splice(index, 1);
        broadcast({ type: 'removePiece', id: data.id });
        db.puzzleState = puzzleState;
        saveDB(db);
      }
    } else if (data.type === 'chat') {
      broadcast({ type: 'chat', emoji, text: data.text });
    } else if (data.type === 'cursor') {
      broadcast({ type: 'cursor', emoji, x: data.x, y: data.y });
    } else if (data.type === 'resetPuzzle') {
      // regenerate puzzle at current difficulty
      puzzleState = db.puzzleState = generatePuzzle(db.difficulty);
      saveDB(db);
      broadcast({ type: 'newPuzzle', pieces: puzzleState.pieces, target: puzzleState.target });
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
