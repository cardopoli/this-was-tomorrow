(() => {
  const wrap = document.getElementById('mapWrap');
  if (!wrap) return;
  const svg = wrap.querySelector(':scope > svg');
  const locations = JSON.parse(document.getElementById('detailMapData').textContent);
  const list = document.getElementById('detailLocations');
  const gallery = document.getElementById('galleryWrap');
  const original = svg.viewBox.baseVal;
  const base = { x: original.x, y: original.y, w: original.width, h: original.height };
  let box = { ...base };
  const apply = () => {
    svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.w} ${box.h}`);
    document.getElementById('detailZoomIn').disabled = box.w <= base.w / 2 + .01;
    document.getElementById('detailZoomOut').disabled = box.w >= base.w - .01;
  };
  const at = (x, y) => { const p = svg.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const zoom = (factor, anchor = { x: box.x + box.w / 2, y: box.y + box.h / 2 }) => {
    const w = Math.max(base.w / 2, Math.min(base.w, box.w / factor));
    const ratio = w / box.w;
    box = { x: anchor.x + (box.x - anchor.x) * ratio, y: anchor.y + (box.y - anchor.y) * ratio, w, h: box.h * ratio };
    apply();
  };
  const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.append(overlay);
  function select(loc, centre = false) {
    gallery.hidden = false;
    gallery.replaceChildren();
    const selectedButton = [...list.children].find(el => el.dataset.mapLetter === loc.letter);
    if (matchMedia('(max-width: 800px)').matches && selectedButton) selectedButton.after(gallery);
    else list.after(gallery);
    const title = document.createElement('p'); title.className = 'detail-gallery-title';
    title.textContent = `${loc.letter} - ${loc.name}`; gallery.append(title);
    if (loc.page) {
      const link = document.createElement('a'); link.className = 'detail-gallery-link';
      link.href = `/exhibition/${encodeURIComponent(loc.page)}/`; link.textContent = 'View exhibition page'; gallery.append(link);
    }
    if (loc.dropbox_url && window._twt?.buildGallery) {
      const holder = document.createElement('div'); holder.id = `gal-cress-${loc.letter.toLowerCase()}`;
      holder.className = 'dbx-gallery'; gallery.append(holder);
      window._twt.buildGallery('https://dropbox-proxy.cardopoli.workers.dev', loc.dropbox_url, holder.id);
    }
    document.querySelectorAll('[data-map-letter]').forEach(el => el.classList.toggle('selected', el.dataset.mapLetter === loc.letter));
    if (centre) {
      box = { x: Number(loc.x) - base.w / 4, y: Number(loc.y) - base.h / 4, w: base.w / 2, h: base.h / 2 };
      apply();
    }
  }
  locations.forEach(loc => {
    const button = document.createElement('button'); button.type = 'button';
    button.className = 'detail-location-button'; button.dataset.mapLetter = loc.letter;
    button.textContent = `${loc.letter}. ${loc.name}`;
    button.addEventListener('click', () => select(loc, true)); list.append(button);
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', loc.x); circle.setAttribute('cy', loc.y); circle.setAttribute('r', 20);
    circle.setAttribute('class', 'detail-hotspot'); circle.setAttribute('role', 'button'); circle.setAttribute('tabindex', '0');
    circle.setAttribute('aria-label', `${loc.letter}: ${loc.name}`); circle.dataset.mapLetter = loc.letter;
    circle.addEventListener('click', () => select(loc));
    circle.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(loc); } });
    overlay.append(circle);
  });
  addEventListener('resize', () => {
    if (gallery.hidden) return;
    const selected = list.querySelector('.detail-location-button.selected');
    if (matchMedia('(max-width: 800px)').matches && selected) selected.after(gallery);
    else list.after(gallery);
  });
  document.getElementById('detailZoomIn').onclick = () => zoom(1.4);
  document.getElementById('detailZoomOut').onclick = () => zoom(1 / 1.4);
  document.getElementById('detailReset').onclick = () => { box = { ...base }; apply(); };
  apply();
  wrap.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.exp(-e.deltaY * .0015), at(e.clientX, e.clientY)); }, { passive: false });
  const pointers = new Map(); let pinch = null;
  wrap.addEventListener('pointerdown', e => {
    if (e.target.closest('button') || e.target.classList.contains('detail-hotspot')) return;
    wrap.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pinch = null; wrap.classList.add('dragging');
  });
  wrap.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    const previous = pointers.get(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const ps = [...pointers.values()];
    if (ps.length === 2) {
      const mid = { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2 };
      const distance = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
      if (pinch) {
        zoom(distance / pinch.distance, at(mid.x, mid.y));
        const a = at(pinch.mid.x, pinch.mid.y), b = at(mid.x, mid.y);
        box.x += a.x - b.x; box.y += a.y - b.y; apply();
      }
      pinch = { mid, distance };
    } else {
      const a = at(previous.x, previous.y), b = at(e.clientX, e.clientY);
      box.x += a.x - b.x; box.y += a.y - b.y; apply();
    }
  });
  const release = e => { pointers.delete(e.pointerId); pinch = null; if (!pointers.size) wrap.classList.remove('dragging'); };
  wrap.addEventListener('pointerup', release); wrap.addEventListener('pointercancel', release);
  wrap.tabIndex = 0;
  wrap.addEventListener('keydown', e => {
    if (e.target !== wrap) return;
    const step = box.w * .08;
    if (e.key === '+' || e.key === '=') zoom(1.3);
    else if (e.key === '-') zoom(1 / 1.3);
    else if (e.key === 'ArrowLeft') box.x -= step;
    else if (e.key === 'ArrowRight') box.x += step;
    else if (e.key === 'ArrowUp') box.y -= step;
    else if (e.key === 'ArrowDown') box.y += step;
    else return;
    e.preventDefault(); apply();
  });
})();
