import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { generatePuzzle, minDistancePx } = require('../server/levelGenerator.js');

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

test('generator keeps pieces spaced apart', () => {
  const puzzle = generatePuzzle(3);
  const all = puzzle.pieces.concat({ id: 'target', x: puzzle.target.x, y: puzzle.target.y });
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      assert.ok(distance(all[i], all[j]) >= minDistancePx,
        `pieces too close: ${all[i].id} and ${all[j].id}`);
    }
  }
});
