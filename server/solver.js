const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Simple in-memory cache indexed by puzzle seed
const solverCache = new Map();

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

// If running as a worker, compute path and send back result
if (!isMainThread) {
  const puzzle = workerData;
  const ball = puzzle.pieces.find(p => p.type === 'ball');
  const path = ball ? [ { x: ball.x, y: ball.y }, { x: puzzle.target.x, y: puzzle.target.y } ] : [];
  const difficultyScore = Math.min(100, Math.round(distance(path[0], path[1]) / 10 + puzzle.pieces.length));
  parentPort.postMessage({ solutionPath: path, difficultyScore });
} else {
  // main thread API
  function solvePuzzle(puzzle) {
    if (solverCache.has(puzzle.seed)) {
      return Promise.resolve(solverCache.get(puzzle.seed));
    }
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, { workerData: puzzle });
      worker.once('message', res => {
        solverCache.set(puzzle.seed, res);
        worker.terminate();
        resolve(res);
      });
      worker.once('error', err => {
        worker.terminate();
        reject(err);
      });
    });
  }

  module.exports = { solvePuzzle, solverCache };
}
