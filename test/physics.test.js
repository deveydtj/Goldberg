import test from 'node:test';
import assert from 'node:assert/strict';
import { updateBall } from '../public/physics.js';

const block = { id: 'b', type: 'block', x: 60, y: 50, static: true };

function cloneBall() {
  return { id: 'ball', type: 'ball', x: 50, y: 40, vx: 10, vy: 0, radius: 5 };
}

test('gravity increases vertical velocity', () => {
  const ball = cloneBall();
  updateBall(ball, [], 1);
  assert.ok(ball.vy > 0);
});

test('ball collides with block and stops on top', () => {
  const ball = { id: 'ball', type: 'ball', x: 60, y: 39, vx: 0, vy: 0, radius: 5 };
  for (let i = 0; i < 2; i++) {
    updateBall(ball, [block], 1);
  }
  assert.ok(ball.y <= 35.001);
});

test('ball bounces off a ramp', () => {
  const ramp = { id: 'r1', type: 'ramp', x: 60, y: 60, direction: 'right' };
  const ball = { id: 'ball', type: 'ball', x: 60, y: 50, vx: 0, vy: 2, radius: 5 };
  for (let i = 0; i < 5; i++) {
    updateBall(ball, [ramp], 1);
  }
  assert.ok(ball.vy <= 0);
});

test('spring pushes ball upward', () => {
  const spring = { id: 's1', type: 'spring', x: 60, y: 60, power: 8 };
  const ball = { id: 'ball', type: 'ball', x: 60, y: 59, vx: 0, vy: 1, radius: 5 };
  updateBall(ball, [spring], 1);
  assert.ok(ball.vy < 0);
});
