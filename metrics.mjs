import { githubPages, installerAssets } from './github-data.mjs';

const DAY = 86_400_000;
export const format = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export function observations(rows) {
  if (!Array.isArray(rows)) throw new Error('Invalid snapshot history');
  const samples = rows.map(({ at, downloads, stars }) => ({ at: Date.parse(at), downloads, stars }));
  return samples.map((sample, i) => {
    const previous = samples[i - 1];
    if (!Number.isFinite(sample.at) || (previous && sample.at <= previous.at) ||
        ![sample.downloads, sample.stars].every(n => Number.isSafeInteger(n) && n >= 0)) {
      throw new Error('Invalid snapshot');
    }
    const rate = previous && sample.downloads >= previous.downloads
      ? (sample.downloads - previous.downloads) * DAY / (sample.at - previous.at) : null;
    return { ...sample, rate };
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
  const values = samples.filter(sample => sample[key] !== null);
  const max = Math.max(1, Math.ceil(values.reduce((largest, point) => Math.max(largest, point[key]), 0)));
  const start = samples[0].at;
  const elapsed = samples.at(-1).at - start;
  return {
    max,
    points: values.map(sample => ({
      x: elapsed ? 43 + (sample.at - start) * 363 / elapsed : 224,
      y: 12 + 82 * (1 - sample[key] / max),
    })),
  };
}

function draw(svg, samples, key, step = false) {
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
  if (key !== 'rate' && points.length > 1) {
    const line = points.flatMap(({ x, y }, i) => step && i ? [`${x},${points[i - 1].y}`, `${x},${y}`] : [`${x},${y}`]);
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
    draw(section.querySelector('[data-plot="downloads"]'), points, 'downloads', true);
    section.querySelector('[data-value="downloads"]').textContent = format.format(total);
    section.querySelector('[data-release-status]').hidden = true;
  } catch {
    section.querySelector('[data-release-status]').textContent = 'Installer totals are temporarily unavailable.';
  }
}

async function showMetrics(section) {
  const stars = githubPages('repos/eliaspfeffer/botmap/stargazers', 'application/vnd.github.star+json').catch(() => null);
  const status = section.querySelector('[role="status"]');
  try {
    const response = await fetch('https://api.github.com/repos/eliaspfeffer/botmap-site/contents/metrics-history.json?ref=metrics-history', {
      headers: { Accept: 'application/vnd.github.raw+json' }, credentials: 'omit',
      referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error('Snapshot data unavailable');
    const samples = observations(await response.json());
    const latest = samples.at(-1);
    if (!latest) throw new Error('No snapshots yet');

    const plot = section.querySelector('[data-plot="stars"]');
    draw(plot, samples, 'stars', true);
    void stars.then(dates => {
      if (dates) draw(plot, starSeries(dates, samples), 'stars', true);
    });
    section.querySelector('[data-value="stars"]').textContent = format.format(latest.stars);
    section.querySelector('[data-value="rate"]').textContent = latest.rate === null ? '—' : format.format(latest.rate);
    if (samples.some(sample => sample.rate !== null)) {
      draw(section.querySelector('[data-plot="rate"]'), samples, 'rate');
      section.querySelector('[data-rate-empty]').hidden = true;
    }
    const start = dateFormat.format(samples[0].at);
    const end = dateFormat.format(latest.at);
    status.textContent = `Daily snapshots since ${start} UTC · latest ${end}`;
    const table = section.querySelector('tbody');
    for (const sample of samples.slice().reverse()) {
      const row = table.insertRow();
      const date = new Date(sample.at).toISOString().slice(0, 10);
      for (const value of [date, format.format(sample.downloads), sample.rate === null ? '—' : format.format(sample.rate), format.format(sample.stars)]) {
        row.insertCell().textContent = value;
      }
    }
    section.querySelector('details').hidden = false;
  } catch {
    status.textContent = 'GitHub activity data is temporarily unavailable.';
  }
}

if (typeof document !== 'undefined') {
  const section = document.getElementById('github-activity');
  if (section) {
    void showMetrics(section);
    void showReleaseTotals(section);
  }
}
