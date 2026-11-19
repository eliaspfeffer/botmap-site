import assert from 'node:assert/strict';
import test from 'node:test';
import { githubPages, installerAssets } from '../../github-data.mjs';

test('reads only public DMG totals across release pages', async () => {
  const next = 'https://api.github.com/repositories/1442814961/releases?per_page=100&page=2';
  const dmg = download_count => ({ name: 'Botmap.dmg', download_count });
  const responses = [
    new Response(JSON.stringify([{ assets: [dmg(160), { name: 'Botmap.zip', download_count: 999 }] }]), {
      headers: { link: `<${next}>; rel="next"` },
    }),
    new Response(JSON.stringify([{ assets: [dmg(8)] }, { draft: true, assets: [dmg(30)] }])),
  ];
  const urls = [];
  const releases = await githubPages('repos/eliaspfeffer/botmap-site/releases', undefined, async (url, options) => {
    assert.equal(options.credentials, 'omit');
    assert.equal(options.referrerPolicy, 'no-referrer');
    urls.push(url);
    return responses.shift();
  });
  assert.deepEqual(installerAssets(releases), [dmg(160), dmg(8)]);
  assert.deepEqual(urls, ['https://api.github.com/repos/eliaspfeffer/botmap-site/releases?per_page=100', next]);
});

test('rejects partial totals on an API failure', async () => {
  await assert.rejects(githubPages('repos/eliaspfeffer/botmap-site/releases', undefined, async () => new Response(null, { status: 403 })), /unavailable/);
});
