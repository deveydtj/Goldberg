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
