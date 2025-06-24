import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import { WebSocket } from 'ws';
import { setTimeout as delay } from 'timers/promises';

const PORT = 4010;

test('server welcomes a new connection', async () => {
  const server = spawn(process.execPath, ['server/server.js'], { env: { PORT }, stdio: 'ignore' });
  server.unref();
  await delay(500); // allow server to start
  const ws = new WebSocket(`ws://localhost:${PORT}`);
  const msg = await new Promise(resolve => ws.once('message', data => resolve(JSON.parse(data))));
  assert.equal(msg.type, 'welcome');
  assert.ok(msg.emoji);
  ws.terminate();
  server.kill();
  await delay(100);
});

test('server relays chat messages', async () => {
  const server = spawn(process.execPath, ['server/server.js'], { env: { PORT }, stdio: 'ignore' });
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
});

test('players can move and remove their pieces', async () => {
  const server = spawn(process.execPath, ['server/server.js'], { env: { PORT }, stdio: 'ignore' });
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
});
