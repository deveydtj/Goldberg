import crypto from 'crypto';

function createRNG(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  let a = h >>> 0;
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const WIDTH = 800;
const HEIGHT = 600;
const MARGIN = 20;
const MAX_ATTEMPTS = 30;
// Minimum distance between any two pieces when generating levels
const minDistancePx = 40;

function randomPosition(existing=[], rng=Math.random) {
  for (let a=0; a<MAX_ATTEMPTS; a++) {
    const x = rng() * (WIDTH - MARGIN*2) + MARGIN;
    const y = rng() * (HEIGHT - MARGIN*2) + MARGIN;
    let ok = true;
    for (const p of existing) {
      const dx = p.x - x;
      const dy = p.y - y;
      if (Math.hypot(dx, dy) < minDistancePx) { ok = false; break; }
    }
    if (ok) return { x, y };
  }
  // fallback if space exhausted
  return { x: rng() * (WIDTH - MARGIN*2) + MARGIN,
           y: rng() * (HEIGHT - MARGIN*2) + MARGIN };
}

function generatePuzzle(difficulty = 1, seed = crypto.randomUUID()) {
  const rng = createRNG(seed);
  let counter = 0;
  const nextId = () => `${seed}-${counter++}`;
  const pieces = [];

  // Phase 1 - golden path: place ball, target and a simple path of blocks
  const ball = {
    id: nextId(),
    type: 'ball',
    x: MARGIN + 30,
    y: MARGIN + 30,
    vx: 0,
    vy: 0,
    radius: 8,
    spawnTime: Date.now(),
  };
  pieces.push(ball);
  const existing = [{ x: ball.x, y: ball.y }];

  const targetPos = randomPosition(existing, rng);
  const target = { x: targetPos.x, y: targetPos.y };

  const pathLen = Math.hypot(target.x - ball.x, target.y - ball.y);
  const maxSteps = Math.floor(pathLen / minDistancePx) - 1;
  const steps = Math.max(1, Math.min(difficulty + 2, maxSteps));
  for (let i = 1; i <= steps; i++) {
    const t = i / (steps + 1);
    const x = ball.x + (target.x - ball.x) * t;
    const y = ball.y + (target.y - ball.y) * t;
    const pos = { x, y };
    pieces.push({
      id: nextId(),
      type: 'block',
      x,
      y,
      static: true,
      spawnTime: Date.now(),
    });
    existing.push(pos);
  }

  // Phase 2 - Poisson disk: random interactive pieces
  const extraCount = difficulty + 2;
  const types = ['block', 'ramp', 'fan', 'spring', 'wall'];
  for (let i = 0; i < extraCount; i++) {
    const pos = randomPosition(existing, rng);
    const type = types[Math.floor(rng() * types.length)];
    const piece = {
      id: nextId(),
      type,
      x: pos.x,
      y: pos.y,
      spawnTime: Date.now(),
    };
    if (type === 'ramp') piece.direction = rng() < 0.5 ? 'left' : 'right';
    if (type === 'fan') piece.power = 1;
    if (type === 'spring') piece.power = 8;
    if (type === 'wall') {
      piece.width = 60;
      piece.height = 20;
      piece.static = true;
    }
    if (type === 'block') piece.static = true;
    pieces.push(piece);
    existing.push(pos);
  }

  // Phase 3 - extra barriers near the path
  const barrierCount = Math.floor(difficulty / 2);
  for (let i = 0; i < barrierCount; i++) {
    const pos = randomPosition(existing, rng);
    const piece = {
      id: nextId(),
      type: 'wall',
      x: pos.x,
      y: pos.y,
      width: 60,
      height: 20,
      static: true,
      spawnTime: Date.now(),
    };
    pieces.push(piece);
    existing.push(pos);
  }

  return { seed, difficulty, pieces, target };
}

export { generatePuzzle, minDistancePx };
