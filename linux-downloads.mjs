const release = 'https://github.com/eliaspfeffer/botmap-site/releases/download/linux-latest/';
const releaseApi = 'https://api.github.com/repos/eliaspfeffer/botmap-site/releases/tags/linux-latest';

export function newestPackage(assets, architecture, fallback) {
  const prefix = 'botmap_';
  const suffix = '_' + architecture + '.deb';
  function version(name) {
    if (!name.startsWith(prefix) || !name.endsWith(suffix)) return null;
    const number = name.slice(prefix.length, -suffix.length);
    return /^\d{1,6}\.\d{1,6}\.\d{1,6}$/.test(number) ? number.split('.').map(Number) : null;
  }
  let best = fallback;
  let current = version(best.slice(release.length));
  for (const asset of assets) {
    const next = version(asset.name);
    if (!next || asset.browser_download_url !== release + asset.name) continue;
    const difference = next.map((part, index) => part - current[index]).find(Boolean);
    if (difference > 0) {
      best = asset.browser_download_url;
      current = next;
    }
  }
  return best;
}

async function refreshDownloads(links) {
  try {
    const response = await fetch(releaseApi, { credentials: 'omit', signal: AbortSignal.timeout(5000) });
    if (!response.ok) return;
    const { assets } = await response.json();
    for (const link of links) link.href = newestPackage(assets, link.dataset.linuxDownload, link.href);
  } catch {
    // The published package links still work when the GitHub API is unavailable.
  }
}

if (typeof document !== 'undefined') refreshDownloads(document.querySelectorAll('[data-linux-download]'));
