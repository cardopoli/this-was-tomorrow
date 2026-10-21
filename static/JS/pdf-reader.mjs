// Silent PDF reader. PDF.js is pinned. Pages fill the screen; the few labels
// fade away when you stop moving. Neighbouring pages are drawn in advance so
// turning is instant.
const PDFJS_ROOT = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/';
const IDLE_MS = 2200, MARGIN = 0.04, ZOOM = 2.2, CACHE_MAX = 10;

export function normaliseSource(raw, base) {
  const url = new URL(String(raw || '').trim(), base);
  if (!String(raw || '').trim() || !['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid PDF address.');
  if (url.hostname === 'www.dropbox.com' || url.hostname === 'dropbox.com') {
    if (url.pathname.startsWith('/scl/fo/')) throw new Error('Please use a link to a PDF file, rather than a Dropbox folder.');
    url.hostname = 'dl.dropboxusercontent.com';
    url.searchParams.delete('raw');
    url.searchParams.set('dl', '1');
  }
  return url.href;
}
export function clampPage(page, total) { return Math.max(1, Math.min(total, Math.trunc(Number(page)) || 1)); }
// Laid out like a printed book: the cover (first page) and back cover (last
// page) always stand alone; everything between pairs up 2-3, 4-5 ...
export function visiblePages(page, total, spread) {
  let first = clampPage(page, total);
  if (!spread || first === 1 || first === total) return [first];
  if (first % 2 === 1) first--;
  return first + 1 < total ? [first, first + 1] : [first];
}
export function nextPage(page, total, spread) { const v = visiblePages(page, total, spread); return v.at(-1) === total ? v[0] : clampPage(v.at(-1) + 1, total); }
export function previousPage(page, total, spread) { const first = visiblePages(page, total, spread)[0]; return visiblePages(Math.max(1, first - 1), total, spread)[0]; }
export function pageFromHash(hash) { const m = /^#page=(\d+)$/.exec(hash); return m ? Number(m[1]) : 1; }

async function startReader(root) {
  const $ = id => document.getElementById(id);
  const stage = $('pdf-stage'), holder = $('pdf-pages'), count = $('pdf-count'), status = $('pdf-status'), full = $('pdf-fullscreen');
  let doc, current = pageFromHash(location.hash), zoomed = false, generation = 0, idleTimer, resizeTimer;
  const sizes = new Map();          // page number -> unscaled viewport {width,height}
  const cache = new Map();          // "page@scale" -> Promise<canvas>
  const wide = () => {
    const w = innerWidth, h = innerHeight;
    return w >= 760 && w / h > 1.1;  // two-page spreads on landscape screens
  };

  // ---- quiet furniture -------------------------------------------------------
  const wake = () => { root.classList.remove('idle'); clearTimeout(idleTimer); idleTimer = setTimeout(() => root.classList.add('idle'), IDLE_MS); };
  const hush = () => { clearTimeout(idleTimer); root.classList.add('idle'); };

  // ---- drawing ---------------------------------------------------------------
  async function size(n) {
    if (!sizes.has(n)) { const p = await doc.getPage(n), v = p.getViewport({ scale: 1 }); sizes.set(n, { width: v.width, height: v.height }); }
    return sizes.get(n);
  }
  async function scaleFor(numbers) {
    const views = await Promise.all(numbers.map(size));
    const w = views.reduce((s, v) => s + v.width, 0), h = Math.max(...views.map(v => v.height));
    const fit = Math.min(innerWidth * (1 - MARGIN * 2) / w, innerHeight * (1 - MARGIN * 3) / h);
    return Math.max(0.1, fit * (zoomed ? ZOOM : 1));
  }
  function draw(n, scale) {
    const key = n + '@' + scale.toFixed(4);
    if (cache.has(key)) { const hit = cache.get(key); cache.delete(key); cache.set(key, hit); return hit; }
    const job = (async () => {
      const page = await doc.getPage(n), css = page.getViewport({ scale });
      const ratio = Math.min(devicePixelRatio || 1, 2, Math.sqrt(8000000 / (css.width * css.height)));
      const view = page.getViewport({ scale: scale * ratio });
      const c = document.createElement('canvas');
      // round DOWN so no pixel sits half outside the page (that sliver showed as a pale line)
      c.width = Math.floor(view.width); c.height = Math.floor(view.height);
      c.style.width = (c.width / ratio) + 'px'; c.style.height = (c.height / ratio) + 'px';
      c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'Page ' + n);
      await page.render({ canvasContext: c.getContext('2d'), viewport: view }).promise;
      return c;
    })();
    cache.set(key, job);
    job.catch(() => cache.delete(key));
    while (cache.size > CACHE_MAX) {
      const [oldKey, old] = cache.entries().next().value; cache.delete(oldKey);
      old.then(c => { if (!c.isConnected) c.width = c.height = 0; }).catch(() => {});
    }
    return job;
  }
  async function prepare(first) {
    const numbers = visiblePages(first, doc.numPages, wide()), scale = await scaleFor(numbers);
    return Promise.all(numbers.map(n => draw(n, scale)));
  }

  async function show(focus) {
    if (!doc) return;
    const version = ++generation, spread = wide();
    const numbers = visiblePages(current, doc.numPages, spread);
    current = numbers[0];
    try {
      const canvases = await prepare(current);
      if (version !== generation) return;
      // the same canvas cannot sit in two places; clone if a spread repeats one
      holder.replaceChildren(...canvases);
      holder.classList.remove('waiting');
      if (zoomed && focus) {
        stage.scrollLeft = focus.x * stage.scrollWidth - innerWidth / 2;
        stage.scrollTop = focus.y * stage.scrollHeight - innerHeight / 2;
      } else { stage.scrollLeft = stage.scrollTop = 0; }
      const label = (numbers.length > 1 ? numbers.join('-') : numbers[0]) + ' / ' + doc.numPages;
      count.textContent = label; status.textContent = 'Page ' + label;
      history.replaceState(null, '', '#page=' + current);
      // quietly get the neighbours ready
      if (!zoomed) {
        const ahead = nextPage(current, doc.numPages, spread), behind = previousPage(current, doc.numPages, spread);
        setTimeout(() => { if (version === generation) { prepare(ahead).catch(() => {}); if (behind !== current) prepare(behind).catch(() => {}); } }, 120);
      }
    } catch (error) {
      if (version === generation) console.warn('PDF page could not be drawn', error);
    }
  }

  function turn(direction) {
    if (!doc) return;
    const spread = wide(), target = direction > 0 ? nextPage(current, doc.numPages, spread) : previousPage(current, doc.numPages, spread);
    if (target === current) return;
    if (zoomed) zoomed = false, stage.classList.remove('zoomed');
    current = target; show();
  }
  function toggleZoom(event) {
    if (!doc) return;
    let focus = { x: .5, y: .5 };
    const box = holder.getBoundingClientRect();
    if (event && box.width) focus = { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height };
    zoomed = !zoomed; stage.classList.toggle('zoomed', zoomed); if (zoomed) hush(); show(focus);
  }

  // ---- input -----------------------------------------------------------------
  const zone = x => x < innerWidth * 0.38 ? 'prev' : x > innerWidth * 0.62 ? 'next' : 'mid';
  const touch = matchMedia('(hover: none)');
  stage.addEventListener('mousemove', e => { stage.dataset.zone = zoomed ? '' : zone(e.clientX); });
  stage.addEventListener('click', e => {
    if (zoomed) { toggleZoom(); return; }
    const z = zone(e.clientX);
    if (z === 'prev') turn(-1);
    else if (z === 'next') turn(1);
    else if (touch.matches) { root.classList.contains('idle') ? wake() : hush(); }
    else toggleZoom(e);
  });
  let start;
  stage.addEventListener('touchstart', e => { start = !zoomed && e.touches.length === 1 && (visualViewport?.scale ?? 1) <= 1.01 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() } : null; }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (!start || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - start.x, dy = e.changedTouches[0].clientY - start.y; start = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) { e.preventDefault(); turn(dx < 0 ? 1 : -1); }
  });
  addEventListener('mousemove', () => { if (!touch.matches) wake(); }, { passive: true });
  root.addEventListener('keydown', e => {
    if (!doc || e.ctrlKey || e.altKey || e.metaKey) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); turn(1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); turn(-1); }
    else if (k === 'Home' || k === 'End') { e.preventDefault(); zoomed = false; stage.classList.remove('zoomed'); current = k === 'Home' ? 1 : doc.numPages; show(); }
    else if (k === 'z' || k === 'Z') toggleZoom();
    else if ((k === 'f' || k === 'F') && !full.hidden) full.click();
    else if (k === 'Escape' && zoomed) toggleZoom();
    else return;
    wake();
  });
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { cache.clear(); show(); }, 160); });
  addEventListener('hashchange', () => { const p = pageFromHash(location.hash); if (doc && p !== current) { current = p; show(); } });

  if (root.requestFullscreen && document.fullscreenEnabled) {
    full.hidden = false;
    full.addEventListener('click', e => { e.stopPropagation(); document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}); });
    document.addEventListener('fullscreenchange', () => { full.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen'; root.focus(); });
  }

  // ---- open ------------------------------------------------------------------
  root.focus({ preventScroll: true });
  wake();
  try {
    const source = normaliseSource(root.dataset.pdfUrl, location.href);
    $('pdf-original').href = source;
    const pdfjs = await import(PDFJS_ROOT + 'build/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_ROOT + 'build/pdf.worker.min.mjs';
    doc = await pdfjs.getDocument({ url: source, isEvalSupported: false, disableAutoFetch: true, disableStream: true,
      cMapUrl: PDFJS_ROOT + 'cmaps/', cMapPacked: true, standardFontDataUrl: PDFJS_ROOT + 'standard_fonts/', wasmUrl: PDFJS_ROOT + 'wasm/' }).promise;
    current = clampPage(current, doc.numPages);
    await show();
  } catch (error) {
    console.warn(error);
    root.classList.add('failed'); count.textContent = '';
  }
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('pdf-reader');
  if (root) startReader(root);
}
