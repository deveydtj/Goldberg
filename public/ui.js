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

export function setupResponsiveCanvas(canvas, baseWidth = 800, baseHeight = 600) {
    if (!canvas.style) canvas.style = {};
    function resize() {
        const scaleX = window.innerWidth / baseWidth;
        const scaleY = window.innerHeight / baseHeight;
        const scale = Math.min(scaleX, scaleY);
        canvas.width = baseWidth;
        canvas.height = baseHeight;
        canvas.style.transformOrigin = 'top left';
        canvas.style.transform = `scale(${scale})`;
    }
    resize();
    window.addEventListener('resize', resize);
}

export { Block, Ramp, Ball, Fan, Spring, Wall } from './pieces.js';
