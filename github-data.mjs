export async function githubPages(path, accept, request = fetch) {
  let next = 'https://api.github.com/' + path + '?per_page=100';
  const rows = [];
  const signal = AbortSignal.timeout(6000);
  while (next) {
    const response = await request(next, {
      credentials: 'omit', referrerPolicy: 'no-referrer', signal,
      ...(accept ? { headers: { Accept: accept } } : {}),
    });
    if (!response.ok) throw new Error('GitHub data unavailable');
    rows.push(...await response.json());
    const link = response.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1];
    next = link?.startsWith('https://api.github.com/') ? link : null;
  }
  return rows;
}

export function installerAssets(releases) {
  return releases.filter(release => !release.draft).flatMap(release => release.assets)
    .filter(asset => asset.name === 'Botmap.dmg' && Number.isSafeInteger(asset.download_count) && asset.download_count >= 0);
}
