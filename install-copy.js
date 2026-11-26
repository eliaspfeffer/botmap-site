function installPlatform({ userAgentData, platform, userAgent, maxTouchPoints }) {
  const device = userAgentData?.platform || platform || '';
  if (userAgentData?.mobile || /Android|CrOS|iPhone|iPad|iPod/i.test(device + ' ' + userAgent)) return '';
  if (!/Win/i.test(device) && (/^Mac/i.test(device) || /Macintosh/i.test(userAgent))) {
    return maxTouchPoints > 1 ? '' : 'mac';
  }
  if (!/Win/i.test(device) && (/^Linux/i.test(device) || /\bLinux\b/i.test(userAgent))) return 'linux';
  return '';
}

const platform = installPlatform(navigator);
if (platform) {
  for (const section of document.querySelectorAll('[data-install-platform]')) {
    section.hidden = section.dataset.installPlatform !== platform;
  }
  const downloads = document.querySelectorAll('[data-download-platform]');
  for (const link of downloads) {
    const preferred = link.dataset.downloadPlatform === platform;
    link.classList.toggle('get-secondary', !preferred);
    if (preferred) link.parentElement.prepend(link);
  }
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
