export let sideView = true;

// Top-down view has been removed. toggleView now simply
// ensures the side view stays enabled.
export function toggleView() {
    sideView = true;
    return sideView;
}

export function pieceAlpha(piece, duration = 300) {
    if (!piece.spawnTime) return 1;
    const age = Date.now() - piece.spawnTime;
    return Math.min(age / duration, 1);
}

export { Block, Ramp, Ball, Fan, Spring } from './pieces.js';
