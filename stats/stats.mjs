import { format } from '../metrics.mjs';

const activity = document.getElementById('desktop-activity');
const endpoint = activity.dataset.endpoint;
const status = document.getElementById('activity-status');
const countryStatus = document.getElementById('country-status');
const unlock = document.getElementById('activity-unlock');
const input = document.getElementById('stats-key');
const open = document.getElementById('stats-open');
const counts = document.getElementById('activity-counts');
const table = document.getElementById('country-table');
const countries = new Intl.DisplayNames(['en'], { type: 'region' });

if (endpoint) {
  unlock.hidden = false;
  status.textContent = 'Enter your access key to view activity.';
  open.addEventListener('click', loadSummary);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !open.disabled) void loadSummary();
    if (event.key === 'Escape') input.value = '';
  });
}

async function loadSummary() {
  const key = input.value.trim();
  if (!key) {
    input.focus();
    return;
  }
  input.value = '';
  open.disabled = true;
  status.textContent = 'Loading activity…';
  try {
    const response = await fetch(endpoint, {
      headers: { Authorization: 'Bearer ' + key },
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 401) {
      status.textContent = 'That access key didn’t match.';
      input.focus();
      return;
    }
    if (!response.ok) throw new Error('Summary unavailable');
    const summary = await response.json();
    for (const [period, value] of Object.entries({ day: summary.day, week: summary.week, month: summary.month })) {
      document.getElementById('active-' + period).textContent = format.format(value);
    }
    counts.hidden = false;
    table.tBodies[0].replaceChildren(...summary.countries.map(({ country, installations }) => {
      const row = document.createElement('tr');
      row.insertCell().textContent = country ? countries.of(country) : 'Unknown or not shared';
      row.insertCell().textContent = format.format(installations);
      return row;
    }));
    table.hidden = !summary.countries.length;
    countryStatus.hidden = !!summary.countries.length;
    countryStatus.textContent = 'No country data yet.';
    status.textContent = summary.month ? 'Updated just now.' : 'No activity reported in the past 30 days.';
    unlock.hidden = true;
  } catch {
    status.textContent = 'Activity is unavailable. Try again.';
    input.focus();
  } finally {
    open.disabled = false;
  }
}
