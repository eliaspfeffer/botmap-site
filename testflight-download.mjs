async function showIPhoneBeta() {
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
  document.querySelector('.desktop-downloads').append(link);
}

showIPhoneBeta();
