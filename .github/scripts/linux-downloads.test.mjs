import assert from 'node:assert/strict';
import test from 'node:test';
import { newestPackage } from '../../linux-downloads.mjs';

test('selects the newest official package for the architecture and keeps a working fallback', () => {
  const prefix = 'https://github.com/eliaspfeffer/botmap-site/releases/download/linux-latest/';
  const asset = name => ({ name, browser_download_url: prefix + name, state: 'uploaded', size: 1024 });
  const fallback = prefix + 'botmap_2.3.162_amd64.deb';
  const packages = [
    asset('botmap_2.3.159_amd64.deb'),
    asset('botmap_2.3.175_arm64.deb'),
    asset('botmap_2.3.170_amd64.deb'),
    asset('botmap_2.4.0_amd64.deb'),
    { ...asset('botmap_3.0.0_amd64.deb'), browser_download_url: 'https://example.com/file.deb' },
    { ...asset('botmap_3.1.0_amd64.deb'), state: 'new' },
    { ...asset('botmap_3.2.0_amd64.deb'), size: 0 },
  ];
  assert.equal(newestPackage(packages, 'amd64', fallback), prefix + 'botmap_2.4.0_amd64.deb');
  assert.equal(newestPackage(packages.slice(0, 2), 'amd64', fallback), fallback);
});
