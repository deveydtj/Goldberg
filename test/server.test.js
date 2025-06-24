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
