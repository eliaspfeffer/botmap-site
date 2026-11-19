import assert from 'node:assert/strict';
import test from 'node:test';
import { observations, plotData, releaseSeries, starSeries } from '../../metrics.mjs';

const row = (day, downloads, stars = 3) => ({ at: `2026-11-${day}T06:00:00Z`, downloads, stars });

test('one snapshot provides a star point, with zero stars supported', () => {
  const points = observations([row(19, 166, 0)]);
  assert.deepEqual(plotData(points, 'stars'), { max: 1, points: [{ x: 224, y: 94 }] });
  assert.throws(() => observations([row(22, 1), row(21, 2)]), /Invalid snapshot/);
});

test('assigns real totals to upload days and carries the endpoint through today', () => {
  const asset = (day, download_count) => ({ created_at: `2026-11-${day}T11:00:00Z`, download_count });
  assert.deepEqual(releaseSeries([asset(12, 8), asset(10, 3), asset(12, 4)], Date.parse('2026-11-19')), [
    { at: Date.parse('2026-11-10'), downloads: 3 },
    { at: Date.parse('2026-11-12'), downloads: 15 },
    { at: Date.parse('2026-11-19'), downloads: 15 },
  ]);
});

test('uses earlier surviving-star timestamps only with a matching snapshot baseline', () => {
  const samples = observations([row(19, 166, 2)]);
  const active = ['2026-11-17', '2026-11-05'].map(starred_at => ({ starred_at }));
  assert.deepEqual(starSeries(active, samples).map(point => point.stars), [1, 2, 2]);
  assert.equal(starSeries(active.slice(1), samples), samples);
});
