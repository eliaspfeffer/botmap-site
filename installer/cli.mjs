#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';

const API = 'https://api.github.com/repos/eliaspfeffer/botmap-site/releases/latest';
const TEAM = 'WZJ53885PB';

function runCommand(file, args, options) {
  const result = spawnSync(file, args, options);
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(`${path.basename(file)}: ${String(result.stderr || result.stdout || 'command failed').trim()}`);
  return String(result.stdout || '') + String(result.stderr || '');
}

export function checkPlatform(platform, arch, release) {
  if (platform !== 'darwin' || arch !== 'arm64' || Number(release.split('.')[0]) < 21)
    throw Error('Botmap requires an Apple silicon Mac with macOS 12 or later.');
}

export function releaseAsset(release) {
  const asset = release.assets?.find(a => a.name === 'Botmap.zip');
  if (release.draft || release.prerelease || !/^v\d+\.\d+\.\d+$/.test(release.tag_name) ||
      asset?.browser_download_url !== `https://github.com/eliaspfeffer/botmap-site/releases/download/${release.tag_name}/Botmap.zip` ||
      !/^sha256:[a-f0-9]{64}$/.test(asset?.digest) || !Number.isSafeInteger(asset?.size) || asset.size < 1 || asset.size > 300_000_000)
    throw Error('No verified stable Mac download is available. Try https://trybotmap.com.');
  return asset;
}

export function verifyApp(app, run = runCommand) {
  const options = {encoding: 'utf8', timeout: 120_000, stdio: ['ignore', 'pipe', 'pipe']};
  run('/usr/bin/codesign', ['--verify', '--deep', '--strict', app], options);
  // codesign writes its identity to stderr even on success.
  const identity = run('/usr/bin/codesign', ['-dv', '--verbose=2', app], {...options, stdio: ['ignore', 'pipe', 'pipe']});
  if (!new RegExp(`TeamIdentifier=${TEAM}\\b`).test(identity)) throw Error('The app is not signed by Botmap’s developer.');
  run('/usr/sbin/spctl', ['--assess', '--type', 'execute', app], options);
  const bundle = run('/usr/libexec/PlistBuddy', ['-c', 'Print :CFBundleIdentifier', path.join(app, 'Contents', 'Info.plist')], options).trim();
  if (bundle !== 'com.eliaspfeffer.botmap') throw Error('The download is not the Botmap app.');
}

export async function install({home = os.homedir(), run = runCommand, request = fetch, log = console.log, open = true} = {}) {
  const options = {encoding: 'utf8', timeout: 120_000, stdio: ['ignore', 'pipe', 'pipe']};
  const target = path.join(home, 'Applications', 'Botmap.app');
  const verified=[];let targetError;
  for(const app of [target,path.join(home,'Applications','Botmap v2.app'),'/Applications/Botmap.app'].filter(p=>fs.existsSync(p))) {
    try {verifyApp(app,run);const version=run('/usr/libexec/PlistBuddy',['-c','Print :CFBundleShortVersionString',path.join(app,'Contents/Info.plist')],options).trim();if(!/^\d+(?:\.\d+){1,3}$/.test(version))throw Error('Invalid app version.');verified.push({app,version});}
    catch(error){if(app===target)targetError=error;}
  }
  const existing=verified.sort((a,b)=>b.version.localeCompare(a.version,undefined,{numeric:true}))[0]?.app;
  if (existing) {
    log(`Botmap is already installed at ${existing}. Use its in-app updater for updates.`);
    if (open) run('/usr/bin/open', [existing], options);
    return existing;
  }
  if(targetError)throw Error(`The existing app at ${target} could not be verified and was not replaced. ${targetError.message}`);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'botmap-install-'));
  let stage;
  try {
    log('Finding the latest stable Botmap for Mac…');
    const response = await request(API, {headers: {'User-Agent': 'Botmap-installer', Accept: 'application/vnd.github+json'}, signal: AbortSignal.timeout(30_000)});
    if (!response.ok) throw Error(`GitHub could not provide the download (${response.status}). Please try again later.`);
    const release = await response.json(), asset = releaseAsset(release);
    log(`Downloading Botmap ${release.tag_name}…`);
    const download = await request(asset.browser_download_url, {signal: AbortSignal.timeout(600_000)});
    if (!download.ok || !download.body) throw Error(`The download failed (${download.status}).`);
    const zip = path.join(dir, 'Botmap.zip'), hash = createHash('sha256');
    let bytes = 0;
    await pipeline(Readable.fromWeb(download.body), async function* (body) {
      for await (const chunk of body) {
        bytes += chunk.length;
        if (bytes > asset.size) throw Error('The download is larger than expected. Nothing was installed.');
        hash.update(chunk); yield chunk;
      }
    }, fs.createWriteStream(zip, {mode: 0o600}));
    if (bytes !== asset.size || 'sha256:' + hash.digest('hex') !== asset.digest)
      throw Error('Download checksum mismatch. Nothing was installed.');
    const apps = path.dirname(target); fs.mkdirSync(apps, {recursive: true});
    stage = fs.mkdtempSync(path.join(apps, '.botmap-install-'));
    // bsdtar refuses traversal through .., absolute paths and extraction-time symlinks.
    run('/usr/bin/tar', ['-xf', zip, '-C', stage], options);
    const app = path.join(stage, 'Botmap.app');
    if (!fs.lstatSync(app).isDirectory() || fs.lstatSync(app).isSymbolicLink()) throw Error('The download contains no Botmap app.');
    log('Checking the developer signature and Apple notarization…');
    verifyApp(app, run);
    const runtime = run(path.join(app, 'Contents/MacOS/Botmap'), ['--version'], {...options, timeout: 20_000, killSignal: 'SIGKILL', env: {...process.env, ELECTRON_RUN_AS_NODE: '1'}});
    if (!/^v\d+\.\d+\.\d+\s*$/.test(runtime)) throw Error('macOS could not start Botmap. Nothing was installed.');
    // Reserve the destination without replacing an installation made during the download.
    fs.mkdirSync(target);
    try { fs.renameSync(app, target); }
    catch (error) { try { fs.rmdirSync(target); } catch {} throw error; }
    log(`Installed Botmap ${release.tag_name} at ${target}.`);
    if (open) run('/usr/bin/open', [target], options);
    return target;
  } finally {
    if (stage) fs.rmSync(stage, {recursive: true, force: true});
    fs.rmSync(dir, {recursive: true, force: true});
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Install Botmap for Apple silicon Mac (macOS 12+, Node.js 18+).\n\n  npx --yes --allow-remote=all https://trybotmap.com/install.tgz\n\n--no-open  Install without launching the app.\n\nDownloads the latest stable signed release. Existing installations and user data are preserved.');
    return;
  }
  if (args.some(a => a !== '--no-open')) throw Error('Unknown argument. Use --help for usage.');
  checkPlatform(process.platform, process.arch, os.release());
  await install({open: !args.includes('--no-open')});
}
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch(error => { console.error(`Botmap: ${error.message}`); process.exitCode = 1; });
