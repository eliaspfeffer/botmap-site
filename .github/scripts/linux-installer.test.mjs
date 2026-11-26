import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const installer = fileURLToPath(new URL('../../install-linux.sh', import.meta.url));
const prefix = 'https://github.com/eliaspfeffer/botmap-site/releases/download/linux-latest/';

function run(t, { arch = 'amd64', existing = '', corrupt = false, foreign = false, display = ':42', runtime = '' } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'botmap-installer-test.'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const payload = 'test package';
  const checksum = createHash('sha256').update(payload).digest('hex');
  const asset = (version, cpu) => {
    const name = `botmap_${version}_${cpu}.deb`;
    return { name, state: 'uploaded', size: payload.length, digest: 'sha256:' + checksum, browser_download_url: prefix + name };
  };
  const assets = [asset('2.3.9', 'amd64'), asset('2.3.10', 'amd64'), asset('2.3.12', 'arm64')];
  if (foreign) assets[1].browser_download_url = 'https://example.com/' + assets[1].name;
  writeFileSync(join(directory, 'release.json'), JSON.stringify({ tag_name: 'linux-latest', draft: false, assets }));
  function stub(name, body) {
    writeFileSync(join(directory, name), '#!/bin/sh\nset -eu\n' + body, { mode: 0o700 });
  }
  stub('uname', 'echo Linux');
  stub('dpkg', 'if [ "$1" = --print-architecture ]; then echo "$TEST_ARCH"; fi');
  stub('dpkg-query', 'printf "%s" "$TEST_EXISTING"');
  stub('curl', `
    while [ "$1" != -o ]; do shift; done
    case "$3" in
      https://api.github.com/*) cp "$TEST_ROOT/release.json" "$2" ;;
      https://github.com/eliaspfeffer/botmap-site/releases/download/linux-latest/*)
        printf "%s" "${corrupt ? 'bad package' : payload}" > "$2"
        basename "$3" > "$TEST_ROOT/download"
        printf "%s" "$2" > "$TEST_ROOT/staged"
        ;;
      *) exit 1 ;;
    esac`);
  stub('dpkg-deb', `
    case "$3" in
      Package) echo botmap ;;
      Architecture) echo "$TEST_ARCH" ;;
      Version) base=$(basename "$2"); version=\${base#botmap_}; echo "\${version%_*}" ;;
    esac`);
  stub('sudo', 'exec "$@"');
  stub('apt-get', 'printf "%s\n" "$@" > "$TEST_ROOT/apt"');
  stub('systemctl', 'printf "%s\n" "DISPLAY=:42" "XAUTHORITY=/tmp/test-xauthority"');
  stub('botmap', 'printf "%s" "$DISPLAY" > "$TEST_ROOT/launched"');
  const result = spawnSync('bash', [installer], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, XDG_STATE_HOME: join(directory, 'state'),
      DISPLAY: display, WAYLAND_DISPLAY: '', XDG_RUNTIME_DIR: runtime, TEST_ROOT: directory, TEST_ARCH: arch, TEST_EXISTING: existing },
  });
  const read = name => {
    const file = join(directory, name);
    return existsSync(file) ? readFileSync(file, 'utf8').trim() : undefined;
  };
  return { ...result, downloaded: read('download'), apt: read('apt'), launched: read('launched'), staged: read('staged') };
}

for (const [arch, release] of [['amd64', '2.3.10'], ['arm64', '2.3.12']]) {
  test(`installs and opens the latest ${arch} package`, t => {
    const result = run(t, { arch });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.downloaded, `botmap_${release}_${arch}.deb`);
    assert.match(result.apt, /install\n-y\n/);
    if (process.getuid() !== 0) assert.equal(result.launched, ':42');
    assert.equal(existsSync(result.staged), false);
  });
}

test('keeps an installed version that is at least as new', t => {
  const result = run(t, { existing: 'installed 2.3.11' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.downloaded, undefined);
  assert.equal(result.apt, undefined);
  if (process.getuid() !== 0) assert.equal(result.launched, ':42');
});

test('opens Botmap in the existing desktop when an SSH shell has no display variables', { skip: process.getuid() === 0 }, async t => {
  const runtime = mkdtempSync('/tmp/botmap-runtime.');
  const bus = createServer();
  t.after(() => {
    bus.close();
    rmSync(runtime, { recursive: true, force: true });
  });
  bus.listen(join(runtime, 'bus'));
  await once(bus, 'listening');
  const result = run(t, { existing: 'installed 2.3.10', display: '', runtime });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.launched, ':42');
});

test('rejects an unsupported architecture, foreign download URL, and invalid checksum before APT', t => {
  for (const fixture of [{ arch: 'armhf' }, { foreign: true }, { corrupt: true }]) {
    const result = run(t, fixture);
    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.apt, undefined);
    assert.equal(result.launched, undefined);
  }
});
