async function preferChromeWebStore() {
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/eliaspfeffer/botmap-site/tab-sharing-store/tab-sharing-store.json',
      { signal: AbortSignal.timeout(3000) },
    );
    if (!response.ok || (await response.json()).available !== true) return;
  } catch {
    return;
  }

  document.getElementById('tab-sharing-preview').hidden = true;
  document.getElementById('tab-sharing-store-ready').hidden = false;
  if (location.hash === '#tab-sharing') {
    location.replace(document.getElementById('tab-sharing-store-link').href);
  }
}

preferChromeWebStore();
