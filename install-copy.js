const copy = document.getElementById('copy-install');
copy?.addEventListener('click', async () => {
  const command = document.getElementById('install-command');
  const status = document.getElementById('copy-status');
  try {
    await navigator.clipboard.writeText(command.textContent);
    status.textContent = 'Copied. Paste it into your terminal.';
  } catch {
    const range = document.createRange(); range.selectNodeContents(command);
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    status.textContent = 'Command selected. Press ⌘C or Ctrl+C to copy.';
  }
});
