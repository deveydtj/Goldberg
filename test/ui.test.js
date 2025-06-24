import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleView, sideView } from '../public/ui.js';


test('side view remains enabled', () => {
  assert.equal(sideView, true);
  toggleView();
  assert.equal(sideView, true);
});
