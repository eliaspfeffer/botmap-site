import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {checkPlatform, releaseAsset, verifyApp, install} from './cli.mjs';

const bytes = Buffer.from('installer test archive');
const asset = {name: 'Botmap.zip', browser_download_url: 'https://github.com/eliaspfeffer/botmap-site/releases/download/v2.3.49/Botmap.zip', digest: 'sha256:' + createHash('sha256').update(bytes).digest('hex'), size: bytes.length};
const release = {tag_name: 'v2.3.49', draft: false, prerelease: false, assets: [asset]};

test('only the supported Mac platform proceeds', () => {
  checkPlatform('darwin', 'arm64', '21.0.0');
  for (const args of [['linux', 'arm64', '30'], ['darwin', 'x64', '25'], ['darwin', 'arm64', '20']])
    assert.throws(() => checkPlatform(...args), /requires an Apple silicon Mac/);
});

test('release identity, host, size and checksum metadata fail closed', () => {
  assert.equal(releaseAsset(release), asset);
  for (const bad of [
    {...release, prerelease: true}, {...release, draft: true}, {...release, tag_name: '../../bad'},
    {...release, assets: [{...asset, digest: undefined}]},
    {...release, assets: [{...asset, size: 400_000_000}]},
    {...release, assets: [{...asset, browser_download_url: 'https://example.com/Botmap.zip'}]},
  ]) assert.throws(() => releaseAsset(bad), /No verified stable/);
});

function fixture(t, {body = bytes, identity = 'TeamIdentifier=WZJ53885PB', fail, race = false} = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'botmap-installer-test-'));
  t.after(() => fs.rmSync(home, {recursive: true, force: true}));
  const calls = [], target = path.join(home, 'Applications/Botmap.app');
  const request = async url => url.includes('/releases/latest') ? Response.json(release) : new Response(body);
  const run = (file, args) => {
    calls.push([file, args]);
    if (file.endsWith('/' + fail)) throw Error('test refused ' + fail);
    if (file.endsWith('/tar')) fs.mkdirSync(path.join(args.at(-1), 'Botmap.app'), {recursive: true});
    if (file.endsWith('/codesign') && args[0] === '-dv') return identity;
    if (file.endsWith('/PlistBuddy')) return 'com.eliaspfeffer.botmap\n';
    if (file.endsWith('/MacOS/Botmap')) {
      if (race) { fs.mkdirSync(target); fs.writeFileSync(path.join(target, 'keep'), 'another installer'); }
      return 'v43.8.6\n';
    }
    return '';
  };
  return {home, target, calls, request, run, log: () => {}};
}

test('a verified fresh install completes, cleans staging and launches exactly its app', async t => {
  const f = fixture(t); await install(f);
  assert(fs.statSync(f.target).isDirectory());
  assert.deepEqual(fs.readdirSync(path.dirname(f.target)), ['Botmap.app']);
  assert.deepEqual(f.calls.at(-1), ['/usr/bin/open', [f.target]]);
  assert(f.calls.some(([file]) => file.endsWith('/spctl')));
  assert(f.calls.some(([file]) => file.endsWith('/MacOS/Botmap')));
});

test('--no-open installs without launching', async t => {
  const f = fixture(t); await install({...f, open: false});
  assert(fs.existsSync(f.target)); assert(!f.calls.some(([file]) => file.endsWith('/open')));
});

test('an existing app is kept and no download or extraction occurs', async t => {
  const f = fixture(t); fs.mkdirSync(f.target, {recursive: true}); fs.writeFileSync(path.join(f.target, 'keep'), 'unchanged');
  await install({...f, request: () => { throw Error('must not download'); }});
  assert.equal(fs.readFileSync(path.join(f.target, 'keep'), 'utf8'), 'unchanged');
  assert(!f.calls.some(([file]) => file.endsWith('/tar')));
  assert.deepEqual(f.calls.at(-1), ['/usr/bin/open', [f.target]]);
});

test('checksum failure never extracts or installs', async t => {
  const f = fixture(t, {body: Buffer.alloc(bytes.length)});
  await assert.rejects(install(f), /checksum mismatch/);
  assert(!fs.existsSync(f.target)); assert.equal(f.calls.length, 0);
});

test('oversized or truncated downloads fail', async t => {
  for (const body of [Buffer.alloc(bytes.length + 1), Buffer.alloc(1)]) {
    const f = fixture(t, {body}); await assert.rejects(install(f), /larger than expected|checksum mismatch/);
    assert(!fs.existsSync(f.target));
  }
});

test('wrong signer, signature rejection, notarization rejection and startup failure leave no app', async t => {
  for (const options of [{identity: 'TeamIdentifier=OTHER'}, {fail: 'tar'}, {fail: 'codesign'}, {fail: 'spctl'}, {fail: 'Botmap'}]) {
    const f = fixture(t, options); await assert.rejects(install(f));
    assert(!fs.existsSync(f.target));
    if (fs.existsSync(path.dirname(f.target))) assert.deepEqual(fs.readdirSync(path.dirname(f.target)), []);
    assert(!f.calls.some(([file]) => file.endsWith('/open')));
  }
});

test('another installation created during download is never overwritten', async t => {
  const f = fixture(t, {race: true}); await assert.rejects(install(f), /EEXIST/);
  assert.equal(fs.readFileSync(path.join(f.target, 'keep'), 'utf8'), 'another installer');
});

test('wrong bundle identity is rejected even with the correct developer', () => {
  assert.throws(() => verifyApp('/test/Botmap.app', (file, args) => file.endsWith('/PlistBuddy') ? 'other.app' : args[0] === '-dv' ? 'TeamIdentifier=WZJ53885PB' : ''), /not the Botmap app/);
});

test('GitHub failures leave no install', async t => {
  const f = fixture(t); await assert.rejects(install({...f, request: async () => new Response('', {status: 403})}), /GitHub.*403/);
  assert(!fs.existsSync(f.target));
});
