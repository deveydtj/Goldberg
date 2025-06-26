const crypto = require('crypto');

const WIDTH = 800;
const HEIGHT = 600;
const MARGIN = 20;
const MAX_ATTEMPTS = 30;
// Minimum distance between any two pieces when generating levels
const minDistancePx = 40;

function randomPosition(existing=[]) {
  for (let a=0; a<MAX_ATTEMPTS; a++) {
    const x = Math.random() * (WIDTH - MARGIN*2) + MARGIN;
    const y = Math.random() * (HEIGHT - MARGIN*2) + MARGIN;
    let ok = true;
    for (const p of existing) {
      const dx = p.x - x;
      const dy = p.y - y;
      if (Math.hypot(dx, dy) < minDistancePx) { ok = false; break; }
    }
    if (ok) return { x, y };
  }
  // fallback if space exhausted
  return { x: Math.random() * (WIDTH - MARGIN*2) + MARGIN,
           y: Math.random() * (HEIGHT - MARGIN*2) + MARGIN };
}

function generatePuzzle(difficulty = 1) {
  const pieces = [];
  // start with ball at a fixed position
  const ball = {
    id: crypto.randomUUID(),
    type: 'ball',
    x: 50,
    y: 50,
    vx: 0,
    vy: 0,
    radius: 8,
    spawnTime: Date.now()
  };
  pieces.push(ball);
  const existing = [ { x: ball.x, y: ball.y } ];

  const blockCount = 5 + Math.max(0, difficulty - 1);
  const rampCount = Math.max(1, Math.floor(difficulty / 2));
  const fanCount = Math.max(0, Math.floor(difficulty / 3));

  for (let i = 0; i < blockCount; i++) {
    const pos = randomPosition(existing);
    pieces.push({
      id: crypto.randomUUID(),
      type: 'block',
      x: pos.x,
      y: pos.y,
      static: true,
      spawnTime: Date.now()
    });
    existing.push(pos);
  }

  for (let i = 0; i < rampCount; i++) {
    const pos = randomPosition(existing);
    pieces.push({
      id: crypto.randomUUID(),
      type: 'ramp',
      x: pos.x,
      y: pos.y,
      direction: Math.random() < 0.5 ? 'left' : 'right',
      spawnTime: Date.now()
    });
    existing.push(pos);
  }

  for (let i = 0; i < fanCount; i++) {
    const pos = randomPosition(existing);
    pieces.push({
      id: crypto.randomUUID(),
      type: 'fan',
      x: pos.x,
      y: pos.y,
      power: 1,
      spawnTime: Date.now()
    });
    existing.push(pos);
  }

  // target position
  const targetPos = randomPosition(existing);
  const target = { x: targetPos.x, y: targetPos.y };

  return { pieces, target };
}

module.exports = { generatePuzzle, minDistancePx };
