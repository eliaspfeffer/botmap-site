# Install Botmap from your terminal

```sh
npx --yes --allow-remote=all https://trybotmap.com/install-v1.0.2.tgz
```

Requires an **Apple silicon Mac, macOS 12+ and Node.js 18+**. No npm account,
global npm installation or administrator password is needed.

The command downloads the latest stable Botmap ZIP from the official GitHub
release. It checks its SHA-256 digest, Developer ID, bundle identity, Apple
notarization and startup before installing it in `~/Applications/Botmap.app`.
Then it opens Botmap. `--no-open` installs without launching it; `--help` shows usage.

The explicit `--allow-remote=all` flag allows this URL installation on npm 12,
which blocks remote tarballs by default ([npm documentation](https://docs.npmjs.com/cli/using-npm/config/#allow-remote)).
It applies only to this command and does not change npm settings.

When several installations exist, the newest fully verified version is opened. Older or unverified copies are left untouched. An existing installation is never replaced. Use
Botmap's updater to update it. Your chats, credentials, drafts and browser tabs
are never modified by the installer. On unsupported platforms it exits without
downloading anything.

The installer has no dependencies or npm lifecycle scripts. Its source is
[`cli.mjs`](https://github.com/eliaspfeffer/botmap-site/blob/main/installer/cli.mjs).
The `botmap` package on npm is unrelated; use the complete command above.

## Maintainers

Run `node --test installer/test.mjs`. Pack with
`npm pack ./installer --pack-destination /tmp`, then copy the resulting
`botmap-installer-1.0.2.tgz` to `install.tgz` at the site root.
Copy it to the versioned `install-v1.0.2.tgz` URL used by the website and keep `install.tgz` as a compatibility alias. Bump the package version and public URL together for installer changes, so npm cannot reuse an older cached package.

The installer source is MIT licensed, copyright 2026 Elias Pfeffer. Permission
is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files, to deal in the Software without
restriction, including without limitation the rights to use, copy, modify,
merge, publish, distribute, sublicense, and/or sell copies of the Software, and
to permit persons to whom the Software is furnished to do so, subject to the
following conditions: this copyright notice and permission notice shall be
included in all copies or substantial portions of the Software. THE SOFTWARE
IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Botmap itself retains its separate application licence.
