async function installPlatform({ userAgentData, platform, userAgent, maxTouchPoints }) {
  const device = userAgentData?.platform || platform || '';
  if (userAgentData?.mobile || /Android|CrOS|iPhone|iPad|iPod/i.test(device + ' ' + userAgent)) return '';
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

const downloads = document.querySelectorAll('[data-download-platform]');
if (downloads.length) {
  installPlatform(navigator).then(platform => {
    const recommended = [...downloads].find(link => link.dataset.downloadPlatform === platform);
    if (!recommended) return;
    recommended.classList.remove('get-secondary');
    if (!recommended.parentElement.contains(document.activeElement)) {
      recommended.parentElement.prepend(recommended);
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
