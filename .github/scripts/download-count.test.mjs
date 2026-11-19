import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';

const script = await readFile(new URL('../../download-count.js', import.meta.url), 'utf8');
const releases = 'https://api.github.com/repos/eliaspfeffer/botmap-site/releases';
const dmg = download_count => ({ name: 'Botmap.dmg', download_count });

async function load(responses) {
  const count = { textContent: '166+' };
  const urls = [];
  await vm.runInNewContext(script, {
    document: { getElementById: () => count }, AbortSignal,
    fetch: async (url, options) => {
      assert.equal(options.credentials, 'omit');
      assert.equal(options.referrerPolicy, 'no-referrer');
      urls.push(url);
      return responses.shift();
    },
  });
  return { count: count.textContent, urls };
}

test('totals only public DMG downloads across releases and pages', async () => {
  const next = 'https://api.github.com/repositories/1442814961/releases?per_page=100&page=2';
  const result = await load([
    new Response(JSON.stringify([{ assets: [dmg(160), { name: 'Botmap.zip', download_count: 999 }] }]), {
      headers: { link: `<${next}>; rel="next"` },
    }),
    new Response(JSON.stringify([{ assets: [dmg(8)] }, { draft: true, assets: [dmg(30)] }])),
  ]);
  assert.deepEqual(result, { count: '168', urls: [releases + '?per_page=100', next] });
});

test('keeps the published fallback on an API failure', async () => {
  assert.equal((await load([new Response(null, { status: 403 })])).count, '166+');
});
