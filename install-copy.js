async function installPlatform({ userAgentData, platform, userAgent, maxTouchPoints }) {
  const device = userAgentData?.platform || platform || '';
  if (/iPhone/i.test(device + ' ' + userAgent)) return 'iphone';
  if (userAgentData?.mobile || /Android|CrOS|iPad|iPod/i.test(device + ' ' + userAgent)) return '';
  if (/^Win/i.test(device) || /\bWindows NT\b/i.test(userAgent)) return 'windows';
  if (/^Mac/i.test(device) || /Macintosh/i.test(userAgent)) {
    return maxTouchPoints > 1 ? '' : 'mac';
  }
  if (/^Linux/i.test(device) || /\bLinux\b/i.test(userAgent)) {
    try {
      const hints = await userAgentData?.getHighEntropyValues(['architecture', 'bitness']);
      if (hints?.bitness === '32') return '';
      if (hints?.architecture === 'arm') return 'linux-arm64';
      if (hints?.architecture === 'x86') return 'linux-amd64';
    } catch {
      // Fall back to the legacy platform when client hints are unavailable.
    }
    return /\b(?:aarch64|arm64)\b/i.test(platform + ' ' + userAgent) ? 'linux-arm64' : 'linux-amd64';
  }
  return '';
}

async function addIPhoneBeta(downloadActions) {
  let invite;
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/eliaspfeffer/botmap-site/testflight-availability/testflight.json',
      { signal: AbortSignal.timeout(3000) },
    );
    if (!response.ok) return;
    ({ invite } = await response.json());
  } catch {
    return;
  }

  if (typeof invite !== 'string' || !/^https:\/\/testflight\.apple\.com\/join\/[A-Za-z0-9]+$/.test(invite)) return;
  const link = document.createElement('a');
  link.className = 'get get-secondary';
  link.href = invite;
  link.textContent = 'iPhone Beta';
  link.setAttribute('aria-label', 'iPhone Beta on TestFlight');
  downloadActions.append(link);
  return link;
}

const downloadActions = document.querySelector('.desktop-downloads');
if (downloadActions) {
  const iphoneBeta = addIPhoneBeta(downloadActions);
  installPlatform(navigator).then(async platform => {
    const recommended = platform === 'iphone'
      ? await iphoneBeta
      : downloadActions.querySelector(`[data-download-platform="${platform}"]`);
    if (!recommended) return;
    if (platform === 'iphone') {
      downloadActions.querySelector('[data-download-platform="mac"]')?.classList.add('get-secondary');
    }
    recommended.classList.remove('get-secondary');
    if (!downloadActions.contains(document.activeElement)) {
      downloadActions.prepend(recommended);
    }
  });
}

document.querySelectorAll('[data-copy-install]').forEach(copy => copy.addEventListener('click', async () => {
  const section = copy.closest('.terminal-install');
  const command = section.querySelector('code');
  const status = section.querySelector('[role="status"]');
  try {
    await navigator.clipboard.writeText(command.textContent);
    status.textContent = 'Copied. Paste it into your terminal.';
  } catch {
    const range = document.createRange(); range.selectNodeContents(command);
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    status.textContent = 'Command selected. Press ⌘C or Ctrl+C to copy.';
  }
}));
