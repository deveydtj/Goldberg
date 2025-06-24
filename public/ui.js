export let sideView = false;

export function toggleView() {
    sideView = !sideView;
    return sideView;
}

export function pieceAlpha(piece, duration = 300) {
    if (!piece.spawnTime) return 1;
    const age = Date.now() - piece.spawnTime;
    return Math.min(age / duration, 1);
}

export { Block, Ramp, Ball, Fan } from './pieces.js';
