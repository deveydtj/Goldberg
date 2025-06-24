import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleView, sideView } from '../public/ui.js';


test('toggleView switches between views', () => {
  const first = toggleView();
  assert.equal(sideView, first);
  const second = toggleView();
  assert.equal(sideView, second);
  assert.notEqual(first, second);
});
