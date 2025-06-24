export const GRAVITY = 0.5;

function aabbCircleCollision(cx, cy, r, rect) {
    const left = rect.x - 10;
    const right = rect.x + 10;
    const top = rect.y - 10;
    const bottom = rect.y + 10;
    const nearestX = Math.max(left, Math.min(cx, right));
    const nearestY = Math.max(top, Math.min(cy, bottom));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    if (dx * dx + dy * dy < r * r) {
        // resolve
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) {
                return { x: right + r, y: cy, vx: -Math.abs(rect.static ? 0 : dx), vy: 0 };
            } else {
                return { x: left - r, y: cy, vx: Math.abs(rect.static ? 0 : dx), vy: 0 };
            }
        } else {
            if (dy > 0) {
                return { x: cx, y: bottom + r, vx: 0, vy: Math.abs(rect.static ? 0 : dy) };
            } else {
                return { x: cx, y: top - r, vx: 0, vy: -Math.abs(rect.static ? 0 : dy) };
            }
        }
    }
    return null;
}

export function updateBall(ball, pieces, dt = 1) {
    ball.vy += GRAVITY * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    for (const p of pieces) {
        if (p.type === 'block') {
            const res = aabbCircleCollision(ball.x, ball.y, ball.radius, p);
            if (res) {
                ball.x = res.x;
                ball.y = res.y;
                if (res.vx !== 0) ball.vx = res.vx * 0.5;
                if (res.vy !== 0) ball.vy = res.vy * 0.5;
            }
        }
    }

    return ball;
}
