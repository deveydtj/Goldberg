const crypto = require('crypto');

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generatePuzzle(difficulty = 1) {
  const pool = {
    block: 3 + difficulty,
    ramp: Math.max(1, Math.floor(difficulty / 2)),
    fan: Math.max(0, Math.floor(difficulty / 3))
  };

  const target = {
    x: rand(100, 700),
    y: rand(400, 560)
  };

  const pieces = [];
  const order = [];
  Object.entries(pool).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) order.push(type);
  });
  shuffle(order);

  let pos = { x: target.x, y: target.y };
  for (const type of order) {
    if (type === 'block') {
      const piece = {
        id: crypto.randomUUID(),
        type: 'block',
        x: clamp(pos.x, 20, 780),
        y: clamp(pos.y + 20, 40, 580),
        static: true,
        spawnTime: Date.now()
      };
      pieces.push(piece);
      pos = { x: piece.x, y: clamp(piece.y - 40, 20, 580) };
    } else if (type === 'ramp') {
      const dir = Math.random() < 0.5 ? 'left' : 'right';
      const piece = {
        id: crypto.randomUUID(),
        type: 'ramp',
        x: clamp(pos.x, 20, 780),
        y: clamp(pos.y + 15, 40, 580),
        direction: dir,
        spawnTime: Date.now()
      };
      pieces.push(piece);
      const dx = dir === 'right' ? -40 : 40;
      pos = {
        x: clamp(pos.x + dx, 20, 780),
        y: clamp(pos.y - 30, 20, 580)
      };
    } else if (type === 'fan') {
      const piece = {
        id: crypto.randomUUID(),
        type: 'fan',
        x: clamp(pos.x, 20, 780),
        y: clamp(pos.y + 30, 40, 580),
        power: 1,
        spawnTime: Date.now()
      };
      pieces.push(piece);
      pos = { x: piece.x, y: clamp(pos.y - 60, 20, 580) };
    }
  }

  const ball = {
    id: crypto.randomUUID(),
    type: 'ball',
    x: clamp(pos.x, 20, 780),
    y: clamp(pos.y, 20, 580),
    vx: 0,
    vy: 0,
    radius: 8,
    spawnTime: Date.now()
  };

  return { pieces: [ball, ...pieces], target, pool };
}

module.exports = { generatePuzzle };
