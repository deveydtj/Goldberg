import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import { WebSocket } from 'ws';
import { setTimeout as delay } from 'timers/promises';
import { join, dirname } from 'path';
import { unlinkSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const PORT = 4010;
const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE = join(__dirname, 'test-db.json');

test('server welcomes a new connection', async () => {
  const server = spawn(process.execPath, ['server/server.js'], { env: { PORT, DB_FILE }, stdio: 'ignore' });
  server.unref();
  await delay(500); // allow server to start
  const ws = new WebSocket(`ws://localhost:${PORT}`);
  const msg = await new Promise(resolve => ws.once('message', data => resolve(JSON.parse(data))));
  assert.equal(msg.type, 'welcome');
  assert.ok(msg.emoji);
  ws.terminate();
  server.kill();
  await delay(100);
  if (existsSync(DB_FILE)) unlinkSync(DB_FILE);
});

test('server relays chat messages', async () => {
  const server = spawn(process.execPath, ['server/server.js'], { env: { PORT, DB_FILE }, stdio: 'ignore' });
  server.unref();
  await delay(500);
  const ws1 = new WebSocket(`ws://localhost:${PORT}`);
  const ws2 = new WebSocket(`ws://localhost:${PORT}`);
  await new Promise(resolve => ws1.once('message', () => resolve()));
  await new Promise(resolve => ws2.once('message', () => resolve()));
  ws1.send(JSON.stringify({ type: 'chat', text: 'hello' }));
  const msg = await new Promise(resolve => {
    const handler = data => {
      const m = JSON.parse(data);
      if (m.type === 'chat') {
        ws2.off('message', handler);
        resolve(m);
      }
    };
    ws2.on('message', handler);
  });
  assert.equal(msg.text, 'hello');
  ws1.terminate();
  ws2.terminate();
  server.kill();
  await delay(100);
  if (existsSync(DB_FILE)) unlinkSync(DB_FILE);
});

test('players can move and remove their pieces', async () => {
  const server = spawn(process.execPath, ['server/server.js'], { env: { PORT, DB_FILE }, stdio: 'ignore' });
  server.unref();
  await delay(500);
  const ws1 = new WebSocket(`ws://localhost:${PORT}`);
  const ws2 = new WebSocket(`ws://localhost:${PORT}`);
  await new Promise(resolve => ws1.once('message', () => resolve()));
  await new Promise(resolve => ws2.once('message', () => resolve()));

  const piece = { id: 'p1', type: 'block', x: 50, y: 50 };
  ws1.send(JSON.stringify({ type: 'addPiece', piece }));
  const added = await new Promise(resolve => {
    ws2.on('message', function handler(data) {
      const m = JSON.parse(data);
      if (m.type === 'addPiece') {
        ws2.off('message', handler);
        resolve(m.piece);
      }
    });
  });

  ws1.send(JSON.stringify({ type: 'movePiece', id: added.id, x: 60, y: 60 }));
  const moved = await new Promise(resolve => {
    ws2.on('message', function handler(data) {
      const m = JSON.parse(data);
      if (m.type === 'movePiece') {
        ws2.off('message', handler);
        resolve(m);
      }
    });
  });
  assert.equal(moved.x, 60);
  assert.equal(moved.y, 60);

  ws1.send(JSON.stringify({ type: 'removePiece', id: added.id }));
  const removed = await new Promise(resolve => {
    ws2.on('message', function handler(data) {
      const m = JSON.parse(data);
      if (m.type === 'removePiece') {
        ws2.off('message', handler);
        resolve(m);
      }
    });
  });
  assert.equal(removed.id, added.id);

  ws1.terminate();
  ws2.terminate();
  server.kill();
  await delay(100);
  if (existsSync(DB_FILE)) unlinkSync(DB_FILE);
});

test('resetPuzzle generates a new puzzle', async () => {
  const server = spawn(process.execPath, ['server/server.js'], { env: { PORT, DB_FILE }, stdio: 'ignore' });
  server.unref();
  await delay(500);
  const ws = new WebSocket(`ws://localhost:${PORT}`);
  await new Promise(resolve => ws.once('message', () => resolve()));
  ws.send(JSON.stringify({ type: 'resetPuzzle' }));
  const msg = await new Promise(resolve => {
    ws.on('message', function handler(data) {
      const m = JSON.parse(data);
      if (m.type === 'newPuzzle') {
        ws.off('message', handler);
        resolve(m);
      }
    });
  });
  assert.equal(msg.type, 'newPuzzle');
  ws.terminate();
  server.kill();
  await delay(100);
  if (existsSync(DB_FILE)) unlinkSync(DB_FILE);
});

test('resetLevel restores original puzzle state', async () => {
  const server = spawn(process.execPath, ['server/server.js'], { env: { PORT, DB_FILE }, stdio: 'ignore' });
  server.unref();
  await delay(500);
  const ws = new WebSocket(`ws://localhost:${PORT}`);
  const welcome = await new Promise(resolve => ws.once('message', data => resolve(JSON.parse(data))));
  const { generatePuzzle } = require('../server/levelGenerator.js');
  const puzzle = generatePuzzle(welcome.difficulty, welcome.seed);
  const originalIds = puzzle.pieces.map(p => p.id).sort();

  // modify puzzle by adding a piece
  const piece = { id: 'temp', type: 'block', x: 10, y: 10 };
  ws.send(JSON.stringify({ type: 'addPiece', piece }));
  await new Promise(resolve => ws.once('message', () => resolve()));

  ws.send(JSON.stringify({ type: 'resetLevel' }));
  const msg = await new Promise(resolve => {
    ws.on('message', function handler(data) {
      const m = JSON.parse(data);
      if (m.type === 'newPuzzle') {
        ws.off('message', handler);
        resolve(m);
      }
    });
  });

  const puzzle2 = generatePuzzle(msg.difficulty, msg.seed);
  const ids = puzzle2.pieces.map(p => p.id).sort();
  assert.deepEqual(ids, originalIds);
  ws.terminate();
  server.kill();
  await delay(100);
  if (existsSync(DB_FILE)) unlinkSync(DB_FILE);
});

test('players can rotate their pieces', async () => {
  const server = spawn(process.execPath, ['server/server.js'], { env: { PORT, DB_FILE }, stdio: 'ignore' });
  server.unref();
  await delay(500);
  const ws1 = new WebSocket(`ws://localhost:${PORT}`);
  const ws2 = new WebSocket(`ws://localhost:${PORT}`);
  await new Promise(resolve => ws1.once('message', () => resolve()));
  await new Promise(resolve => ws2.once('message', () => resolve()));

  const piece = { id: 'r1', type: 'ramp', x: 40, y: 40, direction: 'right' };
  ws1.send(JSON.stringify({ type: 'addPiece', piece }));
  const added = await new Promise(resolve => {
    ws2.on('message', function handler(data) {
      const m = JSON.parse(data);
      if (m.type === 'addPiece') {
        ws2.off('message', handler);
        resolve(m.piece);
      }
    });
  });

  ws1.send(JSON.stringify({ type: 'rotatePiece', id: added.id, direction: 'left' }));
  const rotated = await new Promise(resolve => {
    ws2.on('message', function handler(data) {
      const m = JSON.parse(data);
      if (m.type === 'rotatePiece') {
        ws2.off('message', handler);
        resolve(m);
      }
    });
  });
  assert.equal(rotated.direction, 'left');

  ws1.terminate();
  ws2.terminate();
  server.kill();
  await delay(100);
  if (existsSync(DB_FILE)) unlinkSync(DB_FILE);
});
