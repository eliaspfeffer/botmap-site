const STORAGE = 'botmap-recent-invitations';
const AGE = 30 * 24 * 60 * 60 * 1000;
const LIMIT = 6;

export function guestLink(input, allowLocal = false) {
  if (typeof input !== 'string' || input.length > 1500) return null;
  try {
    const url = new URL(input);
    const hash = new URLSearchParams(url.hash.slice(1));
    const key = hash.get('k');
    const local = allowLocal && url.protocol === 'http:' && url.hostname === '127.0.0.1';
    const tailnet = url.protocol === 'https:' && /^[a-z0-9-]+\.[a-z0-9-]+\.ts\.net$/.test(url.hostname) && ['8444', '10000'].includes(url.port);
    if ((!local && !tailnet) || url.username || url.password ||
        url.pathname !== '/' || url.searchParams.get('guest') !== '1' || !/^g_[A-Za-z0-9_-]{43}$/.test(key || '')) return null;
    url.search = '?guest=1';
    url.hash = new URLSearchParams({ k: key, ...(hash.has('from') ? { from: hash.get('from').slice(0, 80) } : {}) });
    return url;
  } catch { return null; }
}

export function recentInvitations(storage, link, now = Date.now(), allowLocal = false) {
  let entries = [];
  try {
    entries = JSON.parse(storage.getItem(STORAGE) || '[]');
    if (!Array.isArray(entries)) entries = [];
  } catch { /* Private browsing can disable storage. */ }
  entries = entries.filter(entry => entry?.at > now - AGE && entry.at <= now && guestLink(entry.link, allowLocal));
  if (link) {
    const key = guestIdentity(link);
    entries = [{ link: link.href, at: now }, ...entries.filter(entry => guestIdentity(new URL(entry.link)) !== key)];
  }
  entries = entries.slice(0, LIMIT);
  try { storage.setItem(STORAGE, JSON.stringify(entries)); } catch { /* Browser collaboration still works. */ }
  return entries.map(entry => entry.link);
}

function guestIdentity(url) {
  return url.origin + '/' + new URLSearchParams(url.hash.slice(1)).get('k');
}

function showPage() {
  const query = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.slice(1));
  const local = location.protocol === 'http:' && location.hostname === '127.0.0.1';
  const link = guestLink(hash.get('link'), local);
  let storage;
  try { storage = localStorage; } catch { /* Browser collaboration still works. */ }
  const recent = recentInvitations(storage, link, Date.now(), local);
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  const de = navigator.language.startsWith('de');
  document.documentElement.lang = de ? 'de' : 'en';
  const title = document.querySelector('#title');
  const status = document.querySelector('#status');
  const action = document.querySelector('#action');
  const button = (label, href) => { action.hidden = false; action.textContent = label; action.href = href; };

  if (query.has('resume')) {
    if (!recent.length) {
      title.textContent = de ? 'Keine Botmap-Einladungen' : 'No Botmap invitations';
      status.textContent = de ? 'Du kannst diesen Tab schließen und Botmap verwenden.' : 'You can close this tab and use Botmap.';
      return;
    }
    title.textContent = de ? 'Deine Botmap-Einladungen' : 'Your Botmap invitations';
    status.textContent = de ? 'Botmap zeigt dir die geteilten Nodes, bevor du sie hinzufügst.' : 'Botmap will show you the shared nodes before you add them.';
    const protocol = 'botmap-invite://open?' + new URLSearchParams(recent.map(link => ['link', link]));
    const resume = document.querySelector('#resume');
    const frame = document.createElement('iframe');
    frame.hidden = true;
    frame.title = 'Botmap';
    document.body.append(frame);
    const open = () => { frame.src = protocol; };
    resume.hidden = false;
    resume.textContent = de ? 'In Botmap ansehen' : 'Review in Botmap';
    resume.addEventListener('click', open);
    open();
    return;
  }

  if (query.has('install')) {
    const ua = navigator.userAgent;
    const windows = navigator.platform.toLowerCase().startsWith('win');
    const linux = navigator.platform.toLowerCase().startsWith('linux') && !/Android/i.test(ua);
    const mac = /Mac/i.test(navigator.platform) && navigator.maxTouchPoints < 2;
    const appStore = /iPhone|iPad|iPod/i.test(ua) || /Mac/i.test(navigator.platform) && navigator.maxTouchPoints > 1;
    const url = windows ? 'https://github.com/eliaspfeffer/botmap-site/releases/download/windows-latest/Botmap-Setup-x64.exe' : linux ? '/support/#linux' : mac ? 'https://github.com/eliaspfeffer/botmap-site/releases/latest/download/Botmap.dmg' : appStore ? '/support/#iphone' : '/';
    title.textContent = de ? 'Botmap installieren' : 'Install Botmap';
    status.textContent = de ? 'Öffne Botmap nach der Installation, um deine Einladung anzusehen.' : 'Open Botmap after installing to review your invitation.';
    button(de ? 'Zum Download' : 'Get Botmap', url);
    if (mac || windows) location.href = url;
    return;
  }

  if (link) {
    button(de ? 'Einladung öffnen' : 'Open invitation', link.href);
    location.replace(link.href);
  } else {
    title.textContent = de ? 'Einladung nicht verfügbar' : 'Invitation unavailable';
    status.textContent = de ? 'Öffne den Einladungslink, den du erhalten hast.' : 'Open the invitation link you received.';
  }
}

if (typeof document !== 'undefined') showPage();
