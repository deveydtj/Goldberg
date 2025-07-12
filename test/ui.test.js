import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleView, sideView, setupResponsiveCanvas } from '../public/ui.js';


test('side view remains enabled', () => {
  assert.equal(sideView, true);
  toggleView();
  assert.equal(sideView, true);
});

test('setupResponsiveCanvas applies scaling', () => {
  const canvas = { style: {} };
  global.window = {
    innerWidth: 500,
    innerHeight: 400,
    addEventListener: (_, fn) => fn()
  };
  setupResponsiveCanvas(canvas, 800, 600);
  assert.equal(canvas.width, 800);
  assert.equal(canvas.height, 600);
  assert.ok(canvas.style.transform.startsWith('scale('));
  delete global.window;
});
