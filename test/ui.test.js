import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleView, sideView, setupResponsiveCanvas } from '../public/ui.js';


test('side view remains enabled', () => {
  assert.equal(sideView, true);
  toggleView();
  assert.equal(sideView, true);
});

test('setupResponsiveCanvas adjusts size', () => {
  const canvas = {};
  global.window = {
    innerWidth: 500,
    innerHeight: 400,
    addEventListener: (_, fn) => fn()
  };
  setupResponsiveCanvas(canvas);
  assert.equal(canvas.width, 500);
  assert.equal(canvas.height, 400);
  delete global.window;
});
