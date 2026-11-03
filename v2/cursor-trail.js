import { createWaterWake } from './water-wake.js';

(() => {
  const layer = document.getElementById('cursor-trail');
  const canvas = layer.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Move a small drawing surface with the pointer instead of repainting the viewport.
  const size = 504, reach = 222, lifetime = 540;
  const quiet = matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)');
  const water = createWaterWake(document.getElementById('water-template'));
  const points = [];
  let x = 0, y = 0, targetX = 0, targetY = 0, distance = 0;
  let kind = '', action = false, touching = false, pulse = null;
  let frame = 0, lastFrame = 0, lastInput = 0, ratio = 0;
  let palette, blue, pink;

  function clear() {
    if (!kind && !frame && layer.hidden) return;
    cancelAnimationFrame(frame);
    frame = 0;
    water.reset();
    if (!layer.hidden) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    kind = '';
    touching = false;
    pulse = null;
    points.length = 0;
    layer.hidden = true;
  }

  function follow(px, py, type, target) {
    if (quiet.matches || document.hidden || document.documentElement.classList.contains('theme-waving')) {
      clear();
      return;
    }
    const now = performance.now();
    if (kind !== type || layer.hidden) {
      water.reset();
      x = px;
      y = py;
      distance = 0;
      pulse = null;
      points.length = 0;
      points.push({ x, y, time: now, distance: 0, speed: 0 });
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      if (ratio !== dpr) {
        ratio = dpr;
        canvas.width = canvas.height = Math.round(size * ratio);
        canvas.style.width = canvas.style.height = size + 'px';
      }
      layer.hidden = false;
    }
    kind = type;
    targetX = px;
    targetY = py;
    lastInput = now;
    action = !!target?.closest?.('a[href], button:enabled, input, select, textarea');
    if (!frame) {
      lastFrame = now - 16;
      frame = requestAnimationFrame(draw);
    }
  }

  // The same smoothed outline supplies the translucent wash and its two colored edges.
  function ribbon(scale, bias, color, alpha) {
    ctx.beginPath();
    for (const side of [1, -1]) {
      let oldX, oldY;
      for (let i = 0; i < points.length; i++) {
        const p = points[side === 1 ? i : points.length - 1 - i];
        const offset = p.fold + p.width * (bias + side * scale);
        const px = p.x + p.nx * offset, py = p.y + p.ny * offset;
        if (i) ctx.quadraticCurveTo(oldX, oldY, (oldX + px) / 2, (oldY + py) / 2);
        else if (side === 1) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
        oldX = px;
        oldY = py;
      }
      ctx.lineTo(oldX, oldY);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fill();
  }

  function draw(now) {
    frame = 0;
    if (document.hidden || quiet.matches || document.documentElement.classList.contains('theme-waving')) {
      clear();
      return;
    }
    if (palette !== document.documentElement.dataset.theme || !blue) {
      palette = document.documentElement.dataset.theme;
      const style = getComputedStyle(document.documentElement);
      blue = style.getPropertyValue('--sky').trim();
      pink = style.getPropertyValue('--gold').trim();
    }
    const dt = Math.max(1, Math.min(48, now - lastFrame));
    lastFrame = now;
    const blend = 1 - Math.exp(-dt / 22);
    const dx = (targetX - x) * blend, dy = (targetY - y) * blend;
    x += dx;
    y += dy;
    const step = Math.hypot(dx, dy);
    const speed = Math.min(1, step / dt);
    if (step > .3) {
      distance += step;
      points.push({ x, y, time: now, distance, speed });
    }
    while (points.length && (points.length > 38 || distance - points[0].distance > reach || now - points[0].time > lifetime)) points.shift();

    const settling = kind !== 'touch' && water.draw(x, y, dx, dy, dt);
    const left = Math.round(x) - size / 2, top = Math.round(y) - size / 2;
    canvas.style.transform = 'translate3d(' + left + 'px,' + top + 'px,0)';
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.translate(-left, -top);
    const fade = Math.max(0, Math.min(1, (lastInput + lifetime - now) / 260));
    if (points.length > 1 && fade > 0) {
      const tail = points[0], length = Math.max(1, distance - tail.distance);
      for (let i = 0; i < points.length; i++) {
        const p = points[i], before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 1)];
        const vx = after.x - before.x, vy = after.y - before.y;
        const span = Math.hypot(vx, vy) || 1;
        p.nx = -vy / span;
        p.ny = vx / span;
        const belly = Math.sin(Math.PI * (p.distance - tail.distance) / length);
        p.width = (.5 + Math.max(0, belly) * (6 + 10 * p.speed)) * Math.min(1, length / 23);
        p.fold = belly * Math.sin((distance - p.distance) / 32) * (2 + p.speed * 4);
      }
      const ink = ctx.createLinearGradient(tail.x, tail.y, x + .01, y);
      ink.addColorStop(0, 'transparent');
      ink.addColorStop(.27, pink);
      ink.addColorStop(.72, blue);
      ink.addColorStop(1, blue);
      // Two glints catch the edge of the clear wake without painting over the letters.
      const gleam = fade * (kind === 'touch' ? 1 : .72);
      ribbon(1, 0, ink, .075 * gleam);
      ribbon(.075, -.72, ink, .56 * gleam);
      ribbon(.055, .88, pink, .46 * gleam);
    }

    if ((action || touching) && fade > 0) {
      ctx.beginPath();
      ctx.arc(x, y, 6 + speed * 2, 0, Math.PI * 2);
      ctx.strokeStyle = action ? pink : blue;
      ctx.lineWidth = 1;
      ctx.globalAlpha = .36 * fade;
      ctx.stroke();
    }
    if (pulse) {
      const t = Math.min(1, (now - pulse.time) / 290);
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, 6 + 30 * (1 - (1 - t) ** 2), 0, Math.PI * 2);
      ctx.strokeStyle = pink;
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = .8 * (1 - t);
      ctx.stroke();
      if (t >= 1) pulse = null;
    }
    if (fade > 0 || step > .3 || pulse || settling) frame = requestAnimationFrame(draw);
    else if (!touching) clear();
  }

  document.addEventListener('pointermove', e => {
    if (e.isPrimary && e.pointerType !== 'touch') follow(e.clientX, e.clientY, e.pointerType, e.target);
  }, { passive: true });
  document.addEventListener('pointerdown', e => {
    if (!e.isPrimary || e.pointerType === 'touch') return;
    if (e.target.closest?.('#theme-toggle')) { clear(); return; }
    follow(e.clientX, e.clientY, e.pointerType, e.target);
    if (kind) pulse = { x: targetX, y: targetY, time: performance.now() };
  }, { passive: true });
  function touch(e) {
    if (e.touches.length !== 1 || e.target.closest?.('#theme-toggle')) { clear(); return; }
    const finger = e.touches[0];
    follow(finger.clientX, finger.clientY, 'touch', e.target);
    touching = !!kind;
  }
  document.addEventListener('touchstart', e => {
    clear();
    touch(e);
    if (touching) pulse = { x: targetX, y: targetY, time: performance.now() };
  }, { passive: true });
  document.addEventListener('touchmove', touch, { passive: true });
  document.addEventListener('touchend', () => {
    touching = false;
    if (!frame && kind === 'touch') clear();
  }, { passive: true });
  document.addEventListener('touchcancel', clear, { passive: true });
  document.addEventListener('pointerout', e => { if (e.pointerType !== 'touch' && !e.relatedTarget) clear(); });
  window.addEventListener('scroll', () => { if (kind && kind !== 'touch') clear(); }, { passive: true });
  window.addEventListener('blur', clear);
  document.addEventListener('keydown', clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  quiet.addEventListener('change', clear);
})();
