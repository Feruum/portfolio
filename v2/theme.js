// This script runs in the head so a saved dark theme is applied before first paint.
(() => {
  const key = 'madi-portfolio-theme';
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let theme = 'light', button, active, ripple;
  try {
    if (localStorage.getItem(key) === 'dark') theme = 'dark';
  } catch { /* The switch still works when storage is unavailable. */ }

  function paint() {
    const dark = theme === 'dark';
    root.dataset.theme = theme;
    meta.content = dark ? '#08090b' : '#ffffff';
    if (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
    }
  }
  paint();

  function clearWave() {
    root.classList.remove('theme-waving');
    root.style.removeProperty('--wave-origin');
    root.style.removeProperty('--wave-radius');
  }

  function interrupt() {
    if (active) active.skipTransition();
    active = null;
    ripple?.remove();
    ripple = null;
    clearWave();
  }

  function toggle(event) {
    theme = theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(key, theme); } catch { /* In-memory selection. */ }
    interrupt();
    if (reduced.matches) { paint(); return; }

    const box = button.getBoundingClientRect();
    const x = event.detail ? event.clientX : box.left + box.width / 2;
    const y = event.detail ? event.clientY : box.top + box.height / 2;
    const radius = Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))) + 2;

    if (document.startViewTransition) {
      root.style.setProperty('--wave-origin', x + 'px ' + y + 'px');
      root.style.setProperty('--wave-radius', radius + 'px');
      root.classList.add('theme-waving');
      try {
        const transition = document.startViewTransition(paint);
        active = transition;
        // A second click can intentionally skip the previous snapshot.
        transition.ready.catch(() => {});
        const finish = () => {
          if (active === transition) { active = null; clearWave(); }
        };
        transition.finished.then(finish, finish);
        return;
      } catch { clearWave(); }
    }

    // Without native snapshots, carry the same gesture with a single expanding ring.
    paint();
    ripple = document.createElement('span');
    ripple.className = 'theme-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    Object.assign(ripple.style, {
      left: x - radius + 'px', top: y - radius + 'px',
      width: radius * 2 + 'px', height: radius * 2 + 'px',
    });
    ripple.addEventListener('animationend', event => event.currentTarget.remove(), { once: true });
    document.body.append(ripple);
  }

  function bind() {
    button = document.getElementById('theme-toggle');
    paint();
    button.hidden = false;
    document.addEventListener('click', event => {
      if (button.contains(event.target)) { toggle(event); return; }
      // While snapshots are onscreen, browsers can retarget a second tap to <html>.
      if (!active || event.target !== root || !event.detail) return;
      const box = button.getBoundingClientRect();
      if (event.clientX >= box.left && event.clientX <= box.right &&
          event.clientY >= box.top && event.clientY <= box.bottom) toggle(event);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('readystatechange', bind, { once: true });
  else bind();

  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    theme = event.newValue === 'dark' ? 'dark' : 'light';
    interrupt();
    paint();
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) { interrupt(); paint(); }
  });
})();
