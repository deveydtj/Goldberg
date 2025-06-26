import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { solvePuzzle } = require('../server/solver.js');
const { generatePuzzle } = require('../server/levelGenerator.js');


test('solver returns a path for generated puzzles', async () => {
  const puzzle = generatePuzzle(2);
  const result = await solvePuzzle(puzzle);
  assert.ok(Array.isArray(result.solutionPath));
  assert.ok(result.solutionPath.length >= 2);
  assert.equal(typeof result.difficultyScore, 'number');
});
