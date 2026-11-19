// Count the same public DMG asset linked by the download button across all published releases.
(async () => {
  const count = document.getElementById('download-count');
  const releases = 'https://api.github.com/repos/eliaspfeffer/botmap-site/releases';
  let next = releases + '?per_page=100';
  let total = 0;
  try {
    const signal = AbortSignal.timeout(6000);
    while (next) {
      const response = await fetch(next, { credentials: 'omit', referrerPolicy: 'no-referrer', signal });
      if (!response.ok) return;
      const page = await response.json();
      for (const release of page) {
        if (release.draft) continue;
        for (const asset of release.assets) {
          if (asset.name === 'Botmap.dmg' && Number.isSafeInteger(asset.download_count) && asset.download_count >= 0) {
            total += asset.download_count;
          }
        }
      }
      const nextLink = response.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1];
      next = nextLink?.startsWith('https://api.github.com/') ? nextLink : null;
    }
    if (total > 0) count.textContent = total.toLocaleString('en-US');
  } catch {
    // Preserve the published count as a lower bound when GitHub is unavailable.
  }
})();
