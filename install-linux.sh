#!/usr/bin/env bash
set -euo pipefail

die() {
  printf 'Botmap: %s\n' "$*" >&2
  exit 1
}

main() {
  local arch stage release_prefix package version size checksum actual installed launcher log_dir launch_pid
  local -a apt=(apt-get)
  release_prefix=https://github.com/eliaspfeffer/botmap-site/releases/download/linux-latest

  [[ $(uname -s) == Linux ]] && command -v dpkg >/dev/null && command -v apt-get >/dev/null ||
    die 'This installer requires Debian or Ubuntu.'
  arch=$(dpkg --print-architecture)
  case "$arch" in
    amd64|arm64) ;;
    *) die "Botmap requires 64-bit Intel, AMD or ARM. This system reports $arch." ;;
  esac
  for tool in curl python3 sha256sum; do
    command -v "$tool" >/dev/null || die "Install $tool, then run this command again."
  done

  stage=$(mktemp -d /tmp/botmap-install.XXXXXXXX)
  trap "rm -rf -- '$stage'" EXIT
  local -a download=(curl -q --fail --silent --show-error --location --proto '=https' --proto-redir '=https' --retry 2)
  "${download[@]}" --max-time 30 --max-filesize 2000000 -o "$stage/release.json" \
    'https://api.github.com/repos/eliaspfeffer/botmap-site/releases/tags/linux-latest'

  local asset
  asset=$(python3 - "$arch" "$release_prefix" "$stage/release.json" <<'PY'
import json
import re
import sys

architecture, prefix, metadata = sys.argv[1:]
pattern = re.compile(r'botmap_(\d{1,6})\.(\d{1,6})\.(\d{1,6})_' + architecture + r'\.deb')
try:
    with open(metadata) as source:
        release = json.load(source)
    if release['tag_name'] != 'linux-latest' or release['draft'] is not False:
        raise ValueError
    assets = [(tuple(map(int, match.groups())), asset)
              for asset in release['assets']
              if (match := pattern.fullmatch(asset['name']))]
    _, asset = max(assets, key=lambda candidate: candidate[0])
    name, size, digest = asset['name'], asset['size'], asset['digest']
    if (asset['browser_download_url'] != prefix + '/' + name
            or asset['state'] != 'uploaded'
            or type(size) is not int or not 0 < size <= 400_000_000
            or not re.fullmatch(r'sha256:[a-f0-9]{64}', digest)):
        raise ValueError
except (IndexError, KeyError, TypeError, ValueError):
    sys.exit('Botmap: No verified package is available for this architecture.')
print(name, size, digest.removeprefix('sha256:'))
PY
  ) || return 1
  read -r package size checksum <<< "$asset"
  version=${package#botmap_}
  version=${version%_*}
  installed=$(dpkg-query -W -f='${db:Status-Status} ${Version}' botmap 2>/dev/null || true)

  if [[ "$installed" == 'installed '* ]] && dpkg --compare-versions "${installed#installed }" ge "$version" &&
     command -v botmap >/dev/null; then
    printf 'Botmap %s is already installed.\n' "${installed#installed }"
  else
    if (( EUID != 0 )); then
      command -v sudo >/dev/null || die 'Installation requires sudo access.'
      apt=(sudo apt-get)
    fi
    printf 'Downloading Botmap %s for %s…\n' "$version" "$arch"
    "${download[@]}" --max-time 600 --max-filesize "$size" -o "$stage/$package" "$release_prefix/$package"
    actual=$(sha256sum "$stage/$package")
    [[ "${actual%% *}" == "$checksum" ]] ||
      die 'The package checksum did not match.'
    [[ $(dpkg-deb --field "$stage/$package" Package) == botmap &&
       $(dpkg-deb --field "$stage/$package" Architecture) == "$arch" &&
       $(dpkg-deb --field "$stage/$package" Version) == "$version" ]] ||
      die 'The package metadata did not match the release.'
    chmod 755 "$stage"
    chmod 644 "$stage/$package"
    "${apt[@]}" install -y "$stage/$package"
    printf 'Installed Botmap %s.\n' "$version"
  fi

  launcher=$(command -v botmap) || die 'Botmap is installed, but its launcher could not be found.'
  if (( EUID == 0 )) || [[ -z "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]]; then
    printf 'Open Botmap from your desktop menu.\n'
    return
  fi
  log_dir=${XDG_STATE_HOME:-"$HOME/.local/state"}/botmap
  mkdir -p -- "$log_dir"
  nohup "$launcher" </dev/null >"$log_dir/install-launch.log" 2>&1 &
  launch_pid=$!
  sleep 1
  if ! kill -0 "$launch_pid" 2>/dev/null; then
    wait "$launch_pid" || die "Botmap could not open. See $log_dir/install-launch.log."
  fi
  printf 'Opened Botmap.\n'
}

main "$@"
