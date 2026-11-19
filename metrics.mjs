import { githubPages, installerAssets } from './github-data.mjs';

// GitHub stargazer timestamps collected at the start of daily tracking (2026-11-19).
const earlierStars = [{"starred_at": "2026-11-05T22:00:12Z"}, {"starred_at": "2026-11-17T11:48:03Z"}, {"starred_at": "2026-11-18T19:26:20Z"}];

export const format = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export function observations(rows) {
  if (!Array.isArray(rows)) throw new Error('Invalid snapshot history');
  return rows.map(({ at, stars }, i) => {
    const timestamp = Date.parse(at);
    if (!Number.isFinite(timestamp) || (i && timestamp <= Date.parse(rows[i - 1].at)) ||
        !Number.isSafeInteger(stars) || stars < 0) {
      throw new Error('Invalid snapshot');
    }
    return { at: timestamp, stars };
  });
}

export function releaseSeries(assets, now) {
  const days = new Map();
  for (const asset of assets) {
    const at = Date.parse(asset.created_at?.slice(0, 10));
    if (!Number.isFinite(at) || at > now) continue;
    days.set(at, (days.get(at) ?? 0) + asset.download_count);
  }
  let downloads = 0;
  const points = [...days].sort(([a], [b]) => a - b).map(([at, count]) => ({ at, downloads: downloads += count }));
  if (points.length && points.at(-1).at < now) points.push({ at: now, downloads });
  return points;
}

export function starSeries(stargazers, samples) {
  const first = samples[0];
  const dates = stargazers.map(row => Date.parse(row.starred_at)).filter(at => Number.isFinite(at) && at < first.at).sort((a, b) => a - b);
  // Removed stars have no timestamp in this feed. Merge only when the baseline matches.
  return dates.length === first.stars
    ? [...dates.map((at, i) => ({ at, stars: i + 1 })), ...samples]
    : samples;
}

export function plotData(samples, key) {
  const max = Math.max(1, Math.ceil(samples.reduce((largest, point) => Math.max(largest, point[key]), 0)));
  const start = samples[0].at;
  const elapsed = samples.at(-1).at - start;
  return {
    max,
    points: samples.map(sample => ({
      x: elapsed ? 43 + (sample.at - start) * 363 / elapsed : 224,
      y: 12 + 82 * (1 - sample[key] / max),
    })),
  };
}

function draw(svg, samples, key) {
  const { max, points } = plotData(samples, key);
  function mark(tag, attrs, value) {
    const element = document.createElementNS(svg.namespaceURI, tag);
    for (const [name, setting] of Object.entries(attrs)) element.setAttribute(name, setting);
    if (value !== undefined) element.textContent = value;
    svg.append(element);
  }
  svg.replaceChildren();
  for (const [y, label] of [[12, format.format(max)], [94, '0']]) {
    mark('line', { x1: 37, x2: 413, y1: y, y2: y });
    mark('text', { x: 31, y: y + 4, 'text-anchor': 'end' }, label);
  }
  if (points.length > 1) {
    const line = points.flatMap(({ x, y }, i) => i ? [`${x},${points[i - 1].y}`, `${x},${y}`] : [`${x},${y}`]);
    mark('polyline', { points: line.join(' ') });
  }
  if (key !== 'downloads') for (const { x, y } of points) mark('circle', { cx: x, cy: y, r: 3 });
  mark('text', { x: points.length > 1 ? 43 : 224, y: 116, 'text-anchor': points.length > 1 ? 'start' : 'middle' }, dateFormat.format(samples[0].at));
  if (points.length > 1) {
    mark('text', { x: 406, y: 116, 'text-anchor': 'end' }, dateFormat.format(samples.at(-1).at));
  }
  svg.hidden = false;
}

async function showReleaseTotals(section) {
  try {
    const assets = installerAssets(await githubPages('repos/eliaspfeffer/botmap-site/releases'));
    const total = assets.reduce((sum, asset) => sum + asset.download_count, 0);
    if (assets.length) document.getElementById('download-count').textContent = format.format(total);
    const points = releaseSeries(assets, Date.now());
    if (!points.length) throw new Error('No installer data');
    draw(section.querySelector('[data-plot="downloads"]'), points, 'downloads');
    section.querySelector('[data-value="downloads"]').textContent = format.format(total);
  } catch {
    // Keep the unavailable value if GitHub cannot provide totals.
  }
}

async function showMetrics(section) {
  try {
    const response = await fetch('https://api.github.com/repos/eliaspfeffer/botmap-site/contents/metrics-history.json?ref=metrics-history', {
      headers: { Accept: 'application/vnd.github.raw+json' }, credentials: 'omit',
      referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error('Snapshot data unavailable');
    const samples = observations(await response.json());
    const latest = samples.at(-1);
    if (!latest) throw new Error('No snapshots yet');

    draw(section.querySelector('[data-plot="stars"]'), starSeries(earlierStars, samples), 'stars');
    section.querySelector('[data-value="stars"]').textContent = format.format(latest.stars);
  } catch {
    // Keep the unavailable value if GitHub cannot provide snapshots.
  }
}

if (typeof document !== 'undefined') {
  const section = document.getElementById('github-activity');
  if (section) {
    void showMetrics(section);
    void showReleaseTotals(section);
  }
}
