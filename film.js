// A click anywhere on the film starts it. Chrome's own player only listens to its play button; where a browser does
// start it on a click (Safari), this leaves it alone, and the control bar stays the browser's.
const film = document.querySelector('.film video');
if (film) film.addEventListener('click', (e) => {
  if (e.clientY > film.getBoundingClientRect().bottom - 60) return;
  const was = film.paused;
  setTimeout(() => { if (was && film.paused) film.play().catch(() => {}); }, 0);
});
