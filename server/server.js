import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { generatePuzzle } from './levelGenerator.js';
import { solvePuzzle } from './solver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });
const PORT = process.env.PORT || 3000;

// In-memory storage for connected players
const emojiList = ['😀', '😎', '😂', '🤖', '🦄', '🐱', '🐶', '🐸', '🐵', '🐼', '🐧', '🐰'];
const players = new Map();

const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'data.json');

function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { sessions: {}, puzzleState: null, difficulty: 1, progress: {} };
  }
}

function saveDB(db) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

let db = loadDB();
let puzzleState = db.puzzleState;

// Initialize puzzle state and solve it
async function initializePuzzleState() {
  if (!puzzleState) {
    puzzleState = generatePuzzle(db.difficulty);
    db.puzzleState = puzzleState;
    saveDB(db);
  }

  // Wait for puzzle solution before proceeding
  try {
    const solutionResult = await solvePuzzle(puzzleState);
    puzzleState.solutionPath = solutionResult.solutionPath;
    puzzleState.difficultyScore = solutionResult.difficultyScore;
    db.puzzleState = puzzleState;
    saveDB(db);
  } catch (err) {
    console.error('Failed to solve initial puzzle:', err);
  }
}

// Initialize puzzle state and continue setup
initializePuzzleState().then(() => {
  console.log('Puzzle state initialized');
}).catch(err => {
  console.error('Failed to initialize puzzle state:', err);
});

let initialPuzzleState = JSON.parse(JSON.stringify(puzzleState));

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
    seed: puzzleState.seed,
    difficulty: puzzleState.difficulty,
    leaderboard: db.progress || {}
  }));

  // Notify others a player joined
  broadcast({ type: 'playerJoined', emoji });

  ws.on('message', async (message) => {
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
        
        // Wait for puzzle solution before proceeding
        try {
          const solutionResult = await solvePuzzle(puzzleState);
          puzzleState.solutionPath = solutionResult.solutionPath;
          puzzleState.difficultyScore = solutionResult.difficultyScore;
          db.puzzleState = puzzleState;
          saveDB(db);
          initialPuzzleState = JSON.parse(JSON.stringify(puzzleState));
          broadcastLeaderboard();
          broadcast({ type: 'newPuzzle', seed: puzzleState.seed, difficulty: puzzleState.difficulty });
        } catch (err) {
          console.error('Failed to solve puzzle after completion:', err);
        }
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
        
        // Wait for puzzle solution before proceeding
        try {
          const solutionResult = await solvePuzzle(puzzleState);
          puzzleState.solutionPath = solutionResult.solutionPath;
          puzzleState.difficultyScore = solutionResult.difficultyScore;
          db.puzzleState = puzzleState;
          saveDB(db);
          initialPuzzleState = JSON.parse(JSON.stringify(puzzleState));
          broadcastLeaderboard();
          broadcast({ type: 'newPuzzle', seed: puzzleState.seed, difficulty: puzzleState.difficulty });
        } catch (err) {
          console.error('Failed to solve puzzle after ball update completion:', err);
        }
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
    } else if (data.type === 'rotatePiece') {
      const piece = puzzleState.pieces.find(p => p.id === data.id);
      if (piece && piece.owner === emoji && piece.type === 'ramp') {
        piece.direction = data.direction;
        broadcast({ type: 'rotatePiece', id: piece.id, direction: piece.direction });
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
    } else if (data.type === 'setEmoji') {
      const player = players.get(ws);
      if (player && typeof data.emoji === 'string') {
        const oldEmoji = player.emoji;
        player.emoji = data.emoji;
        db.sessions[player.ip] = data.emoji;
        saveDB(db);
        emoji = data.emoji;
        ws.send(JSON.stringify({ type: 'emojiConfirmed', emoji }));
        broadcast({ type: 'emojiChanged', oldEmoji, newEmoji: data.emoji });
      }
    } else if (data.type === 'resetPuzzle') {
      // regenerate puzzle at current difficulty
      puzzleState = db.puzzleState = generatePuzzle(db.difficulty);
      
      // Wait for puzzle solution before proceeding
      try {
        const solutionResult = await solvePuzzle(puzzleState);
        puzzleState.solutionPath = solutionResult.solutionPath;
        puzzleState.difficultyScore = solutionResult.difficultyScore;
        db.puzzleState = puzzleState;
        saveDB(db);
        initialPuzzleState = JSON.parse(JSON.stringify(puzzleState));
        broadcast({ type: 'newPuzzle', seed: puzzleState.seed, difficulty: puzzleState.difficulty });
      } catch (err) {
        console.error('Failed to solve puzzle after reset:', err);
      }
    } else if (data.type === 'resetLevel') {
      // restore puzzle to its original state without changing difficulty
      puzzleState = db.puzzleState = JSON.parse(JSON.stringify(initialPuzzleState));
      saveDB(db);
      broadcast({ type: 'newPuzzle', seed: puzzleState.seed, difficulty: puzzleState.difficulty });
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
