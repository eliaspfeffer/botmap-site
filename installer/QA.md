# Terminal installer QA — 2026-11-11

Command:

```sh
npx --yes --allow-remote=all https://trybotmap.com/install.tgz
```

## Checked

- 11 Node tests pass. They cover the Mac platform restriction, stable-release and URL validation, required digest and size metadata, checksum failure, oversized/truncated downloads, wrong developer or bundle, signature/notarization rejection, extraction/startup failure, cleanup, existing installations, concurrent installation and GitHub failure. The open command is asserted to target only the installed app.
- The tarball contains only package.json, cli.mjs and README.md. Its bytes match the reviewed source. No dependencies, lifecycle hooks, credentials or application source are bundled.
- Real npm 12.2.1 and npm 11.20.0 both execute the URL package and display its help. npm 12 rejects the command without its documented per-command `--allow-remote=all` opt-in; no persistent npm configuration was changed.
- A real `npx` install through the local HTTP URL downloaded the public stable v2.3.49 ZIP into an isolated temporary HOME. SHA-256, codesign, expected team/bundle, Gatekeeper and the signed executable's Node-mode startup probe passed. The installed app was not launched (`--no-open`), so no second Botmap GUI, import or user-data store was started. The live app and prepared 2.3.54 update were left in place.
- The first run failed safely during a redundant copy because the disk filled. Its temporary data was cleaned and no app was installed. The installer now extracts directly into the destination filesystem's hidden staging folder and renames the verified app, avoiding a second full app copy. Only our redundant earlier 2.3.54 build app/DMG copies were removed; the recovery backups, signed ZIP and prepared update were retained.
- Real ego lite, existing assigned Space 185/profile: the visible command, desktop copy confirmation, keyboard activation and rejected-clipboard selection fallback were checked. At 320px width there is no horizontal overflow; command and Copy remain inside the viewport, and scrolling reaches the footer. Desktop and 375px screenshots were inspected. Device emulation was cleared. No external browser or fresh browser profile was used.

## Boundaries

The automatic GUI launch is covered by the command-level test, not a second physical first-run walkthrough. The real installation uses `--no-open` to preserve the running Botmap session. Intel, Windows and Linux installs are intentionally unsupported. No npm registry name or login is needed; the registry's unrelated `botmap` package is not used.
