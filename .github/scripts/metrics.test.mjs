import assert from 'node:assert/strict';
import test from 'node:test';
import { observations, plotData } from '../../metrics.mjs';

const row = (day, downloads, stars = 3) => ({ at: `2026-11-${day}T06:00:00Z`, downloads, stars });

test('uses elapsed days and skips decreases in the asset totals', () => {
  const points = observations([row(19, 166), row(21, 172, 4), row(22, 140, 5), row(23, 140, 5)]);
  assert.deepEqual(points.map(point => point.rate), [null, 3, null, 0]);
  assert.deepEqual(plotData(points, 'rate').points.map(point => point.y), [12, 94]);
});

test('one snapshot provides a star point and no rate, with zero stars supported', () => {
  const points = observations([row(19, 166, 0)]);
  assert.deepEqual(plotData(points, 'stars'), { max: 1, points: [{ x: 224, y: 94 }] });
  assert.deepEqual(plotData(points, 'rate').points, []);
  assert.throws(() => observations([row(22, 1), row(21, 2)]), /Invalid snapshot/);
});
