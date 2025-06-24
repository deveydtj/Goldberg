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

function rampCollision(ball, ramp) {
    const dx = ball.x - ramp.x;
    const dy = ball.y - ramp.y;
    if (dx < -12 || dx > 12 || dy < -12 || dy > 12) return null;

    const sqrt2 = Math.SQRT1_2; // 1 / sqrt(2)
    let nx, ny, dist;
    if (ramp.direction === 'right') {
        // line from (-10,10) to (10,-10) => normal (1,1)
        const lineY = -dx + 10;
        if (dy > lineY - ball.radius) {
            // penetration depth along normal
            dist = dy - lineY;
            nx = sqrt2;
            ny = sqrt2;
        } else {
            return null;
        }
    } else {
        // left ramp: line from (-10,-10) to (10,10) => normal (-1,1)
        const lineY = dx + 10;
        if (dy > lineY - ball.radius) {
            dist = dy - lineY;
            nx = -sqrt2;
            ny = sqrt2;
        } else {
            return null;
        }
    }

    // push out along normal
    ball.x -= (dist + ball.radius) * nx;
    ball.y -= (dist + ball.radius) * ny;

    // reflect velocity around ramp normal
    const dot = ball.vx * nx + ball.vy * ny;
    ball.vx = (ball.vx - 2 * dot * nx) * 0.5;
    ball.vy = (ball.vy - 2 * dot * ny) * 0.5;
    return ball;
}

function fanEffect(ball, fan) {
    const dx = ball.x - fan.x;
    const dy = ball.y - fan.y;
    const distSq = dx * dx + dy * dy;
    const radius = 40;
    if (distSq < radius * radius) {
        ball.vy -= fan.power * 2;
    }
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
        } else if (p.type === 'ramp') {
            rampCollision(ball, p);
        } else if (p.type === 'fan') {
            fanEffect(ball, p);
        }
    }

    return ball;
}
