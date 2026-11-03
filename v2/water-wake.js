// The red/green channels describe the slope of a circular swell. Blue stores the
// water carried along by the pointer. Make this small, smooth texture just once.
function pressureTexture() {
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (2 * x + 1) / size - 1, v = (2 * y + 1) / size - 1;
      const r2 = u * u + v * v, r = Math.sqrt(r2);
      // A broad, shallow lip bends thin strokes without folding them back on themselves.
      const slope = .18 * Math.exp(-(((r - .72) / .27) ** 2)) - .78 * Math.exp(-2.9 * r2);
      const edge = Math.max(0, Math.min(1, (1 - r) / .40));
      const i = (y * size + x) * 4;
      image.data[i] = 255 * (.5 + u * slope);
      image.data[i + 1] = 255 * (.5 + v * slope);
      image.data[i + 2] = 255 * Math.exp(-3 * r2);
      image.data[i + 3] = 255 * edge * edge * (3 - 2 * edge);
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

// Apply the field to the real, already typeset ink. Hit boxes, selection and
// line breaks stay native, and the browser never has to filter a full viewport.
export function createWaterWake(template) {
  const targets = document.querySelectorAll([
    '.hero-status, #heroName, .hero-sub, .hero-tagline, .hero-contact, .ticker',
    '.sidenav, .topnav-name, .topnav-github, .mob-menu a, .sk-tip-body',
    '.sec-hdr, .skills-grid > div, .info-list li, .proj-thumb-tag',
    '.proj-meta, .proj-desc, .proj-tags, .exp-item > div, .win-list li, .footer'
  ].join(','));
  const visible = new Set(), active = new Map(), spare = [];
  const observer = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (isIntersecting) visible.add(target);
      else visible.delete(target);
    }
  });
  targets.forEach(el => observer.observe(el));
  let texture, serial = 0;
  let rearX, rearY, flowX = 0, flowY = 0, rearFlowX = 0, rearFlowY = 0, energy = 0;

  function makeFilter() {
    const filter = template.cloneNode(true);
    filter.id = 'water-ink-' + ++serial;
    const images = [...filter.querySelectorAll('feImage')];
    const matrices = [...filter.querySelectorAll('feColorMatrix')];
    texture ??= pressureTexture();
    for (const img of images) img.setAttribute('href', texture);
    template.parentNode.appendChild(filter);
    return { filter, images, matrices, warp: filter.lastElementChild };
  }

  function release(el, slot) {
    el.style.removeProperty('filter');
    active.delete(el);
    spare.push(slot);
  }

  function reset() {
    for (const [el, slot] of active) release(el, slot);
    rearX = rearY = undefined;
    flowX = flowY = rearFlowX = rearFlowY = energy = 0;
  }

  function matrix(gain, dragX, dragY) {
    const bias = (1 - gain) * .5;
    return `${gain} 0 ${dragX.toFixed(3)} 0 ${bias}  0 ${gain} ${dragY.toFixed(3)} 0 ${bias}  0 0 0 0 0  0 0 0 1 0`;
  }

  function draw(x, y, dx, dy, dt) {
    if (rearX === undefined) { rearX = x - dx; rearY = y - dy; }
    const speed = Math.hypot(dx, dy) / dt;
    const force = 1 - Math.exp(-speed / .62);
    const steer = 1 - Math.exp(-dt / 32), drift = 1 - Math.exp(-dt / 95);
    energy += (force - energy) * (1 - Math.exp(-dt / (force > energy ? 32 : 148)));
    flowX += (dx / (dt * (speed + .18)) - flowX) * steer;
    flowY += (dy / (dt * (speed + .18)) - flowY) * steer;
    // A slower, oppositely curved swell keeps travelling through a reversal.
    rearX += (x - rearX) * drift; rearY += (y - rearY) * drift;
    rearFlowX += (flowX - rearFlowX) * drift; rearFlowY += (flowY - rearFlowY) * drift;
    if (energy < .012) {
      for (const [el, slot] of active) release(el, slot);
      return false;
    }

    const w = Math.round(114 + 66 * energy + 40 * Math.abs(flowX));
    const h = Math.round(106 + 46 * energy + 36 * Math.abs(flowY));
    const ww = Math.round(w * .92), wh = Math.round(h * .82);
    const headLeft = x - w / 2, headTop = y - h / 2;
    const rearLeft = rearX - ww / 2, rearTop = rearY - wh / 2;
    const left = Math.min(headLeft, rearLeft), right = Math.max(headLeft + w, rearLeft + ww);
    const top = Math.min(headTop, rearTop), bottom = Math.max(headTop + h, rearTop + wh);

    // Batch layout reads before touching the SVG graph. Only nearby text blocks
    // get a filter, and the slots are reused as the wake travels down the page.
    const hit = new Map();
    for (const el of visible) {
      if (el.closest('[inert]') || (el.className === 'sk-tip-body' && !el.parentElement.classList.contains('show'))) continue;
      const box = el.getBoundingClientRect();
      if (box.width && box.height && box.left < right && box.right > left && box.top < bottom && box.bottom > top) hit.set(el, box);
    }
    for (const [el, slot] of active) if (!hit.has(el)) release(el, slot);
    const rearMatrix = matrix(-.64, -.17 * rearFlowX - .16 * rearFlowY, -.17 * rearFlowY + .16 * rearFlowX);
    const headMatrix = matrix(1, -.34 * flowX + .13 * flowY, -.34 * flowY - .13 * flowX);
    for (const [el, box] of hit) {
      let slot = active.get(el);
      if (!slot) {
        slot = spare.pop() || makeFilter();
        active.set(el, slot);
        el.style.filter = 'url(#' + slot.filter.id + ')';
      }
      // Extra ink at ascenders, italic overhangs and focus outlines must survive the warp.
      slot.filter.setAttribute('width', Math.ceil(box.width) + 64);
      slot.filter.setAttribute('height', Math.ceil(box.height) + 64);
      place(slot.images[0], rearLeft - box.left, rearTop - box.top, ww, wh);
      place(slot.images[1], headLeft - box.left, headTop - box.top, w, h);
      slot.matrices[0].setAttribute('values', rearMatrix);
      slot.matrices[1].setAttribute('values', headMatrix);
      slot.warp.setAttribute('scale', (energy * (el.id === 'heroName' ? 65 : 40)).toFixed(1));
    }
    return true;
  }

  function place(image, x, y, width, height) {
    image.setAttribute('x', x.toFixed(1));
    image.setAttribute('y', y.toFixed(1));
    image.setAttribute('width', width);
    image.setAttribute('height', height);
  }
  return { draw, reset };
}
