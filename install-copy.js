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
