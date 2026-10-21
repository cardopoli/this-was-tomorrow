// PDF.js is pinned. Only the visible page(s) are rendered; no flip effects.
const PDFJS_ROOT = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/';

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
export function visiblePages(page, total, spread) {
  let first = clampPage(page, total);
  if (spread && first > 1 && first % 2 === 1) first--;
  return spread && first > 1 && first < total ? [first, first + 1] : [first];
}
export function nextPage(page, total, spread) { const visible = visiblePages(page, total, spread), first = visible[0]; return visible.at(-1) === total ? first : clampPage(first + (spread && first > 1 ? 2 : 1), total); }
export function previousPage(page, total, spread) { const first = visiblePages(page, total, spread)[0]; return clampPage(first - (spread && first > 2 ? 2 : 1), total); }
export function pageFromHash(hash) { const match = /^#page=(\d+)$/.exec(hash); return match ? Number(match[1]) : 1; }

async function startReader(root) {
  const $ = id => root.querySelector('#' + id);
  const stage = $('pdf-stage'), pages = $('pdf-pages'), status = $('pdf-status');
  const prev = $('pdf-prev'), next = $('pdf-next'), jump = $('pdf-page'), go = $('pdf-go');
  const layout = $('pdf-layout'), zoom = $('pdf-zoom'), count = $('pdf-count'), fullscreen = $('pdf-fullscreen');
  let doc, current = pageFromHash(location.hash), generation = 0, busy = false;
  let tasks = new Set(), resizeTimer, touchStart, source;
  const media = matchMedia('(min-width: 800px)');
  const isSpread = () => layout.value === 'spread' || (layout.value === 'auto' && media.matches);
  const showError = message => { status.textContent = message; stage.setAttribute('aria-busy', 'false'); };

  function controls() {
    if (!doc) return;
    const visible = visiblePages(current, doc.numPages, isSpread());
    current = visible[0];
    prev.disabled = busy || current === 1;
    next.disabled = busy || visible.at(-1) === doc.numPages;
    jump.disabled = go.disabled = busy;
    layout.disabled = zoom.disabled = false;
    jump.max = String(doc.numPages); jump.value = String(current);
    count.textContent = (visible.length === 1 ? 'Page ' + current : 'Pages ' + visible.join('-')) + ' / ' + doc.numPages;
  }

  async function render() {
    if (!doc) return;
    const version = ++generation;
    for (const task of tasks) task.cancel();
    tasks = new Set();
    busy = true; controls(); stage.setAttribute('aria-busy', 'true');
    status.textContent = 'Loading page' + (isSpread() ? 's' : '') + '…';
    const numbers = visiblePages(current, doc.numPages, isSpread());
    current = numbers[0];
    const frames = [];
    try {
      const pdfPages = await Promise.all(numbers.map(n => doc.getPage(n)));
      if (version !== generation) return;
      const baseViews = pdfPages.map(p => p.getViewport({ scale: 1 }));
      const totalWidth = baseViews.reduce((sum, v) => sum + v.width, 0);
      const maxHeight = Math.max(...baseViews.map(v => v.height));
      const widthScale = stage.clientWidth / totalWidth;
      const scale = zoom.value === 'page'
        ? Math.max(.1, Math.min(widthScale, stage.clientHeight / maxHeight))
        : Math.max(.1, widthScale) * Number(zoom.value);
      for (let i = 0; i < pdfPages.length; i++) {
        if (version !== generation) break;
        const page = pdfPages[i], cssView = page.getViewport({ scale });
        // Bound pixel memory on phones and large screens, even at high zoom.
        const ratio = Math.min(devicePixelRatio || 1, 2, Math.sqrt(6000000 / (cssView.width * cssView.height)));
        const view = page.getViewport({ scale: scale * ratio });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(view.width); canvas.height = Math.ceil(view.height);
        canvas.style.width = cssView.width + 'px'; canvas.style.height = cssView.height + 'px';
        canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', 'PDF page ' + numbers[i]);
        frames.push(canvas);
        const task = page.render({ canvasContext: canvas.getContext('2d'), viewport: view });
        tasks.add(task); await task.promise; tasks.delete(task);
      }
      if (version !== generation) { frames.forEach(c => { c.width = c.height = 0; }); return; }
      for (const canvas of pages.querySelectorAll('canvas')) canvas.width = canvas.height = 0;
      pages.replaceChildren(...frames);
      stage.scrollTop = 0; stage.scrollLeft = 0;
      history.replaceState(null, '', '#page=' + current);
      status.textContent = '';
    } catch (error) {
      frames.forEach(c => { c.width = c.height = 0; });
      if (version === generation && error.name !== 'RenderingCancelledException') showError('This page could not be displayed. Try another page, or open the original PDF below.');
    } finally {
      if (version === generation) { busy = false; stage.setAttribute('aria-busy', 'false'); controls(); }
    }
  }

  function turn(direction) {
    if (!doc || busy) return;
    const target = direction > 0 ? nextPage(current, doc.numPages, isSpread()) : previousPage(current, doc.numPages, isSpread());
    if (target !== current) { current = target; render(); }
  }
  function jumpToPage() {
    if (!doc) return;
    if (!jump.checkValidity()) { jump.reportValidity(); return; }
    current = clampPage(jump.value, doc.numPages); render();
  }
  prev.addEventListener('click', () => turn(-1));
  next.addEventListener('click', () => turn(1));
  go.addEventListener('click', jumpToPage);
  jump.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); jumpToPage(); } });
  layout.addEventListener('change', () => render());
  zoom.addEventListener('change', () => render());
  root.addEventListener('keydown', e => {
    if (!doc || e.ctrlKey || e.altKey || e.metaKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); turn(e.key === 'ArrowRight' ? 1 : -1); }
    if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); current = e.key === 'Home' ? 1 : doc.numPages; render(); }
  });
  stage.addEventListener('touchstart', e => {
    touchStart = e.touches.length === 1 && (zoom.value === '1' || zoom.value === 'page') ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (!touchStart || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - touchStart.x, dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) turn(dx < 0 ? 1 : -1);
  }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
  const resize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => render(), 150); };
  window.addEventListener('resize', resize);
  window.addEventListener('hashchange', () => { current = pageFromHash(location.hash); render(); });
  media.addEventListener('change', resize);
  if (root.requestFullscreen && document.fullscreenEnabled) {
    fullscreen.hidden = false;
    fullscreen.addEventListener('click', async () => {
      try { if (document.fullscreenElement) await document.exitFullscreen(); else await root.requestFullscreen(); }
      catch { status.textContent = 'Full screen is unavailable. You can still use zoom.'; }
    });
    document.addEventListener('fullscreenchange', () => { fullscreen.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen'; resize(); });
  }
  try {
    source = normaliseSource(root.dataset.pdfUrl, location.href);
    $('pdf-original').href = source;
    const pdfjs = await import(PDFJS_ROOT + 'build/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_ROOT + 'build/pdf.worker.min.mjs';
    const loading = pdfjs.getDocument({ url: source, isEvalSupported: false, disableAutoFetch: true, disableStream: true, cMapUrl: PDFJS_ROOT + 'cmaps/', cMapPacked: true, standardFontDataUrl: PDFJS_ROOT + 'standard_fonts/', wasmUrl: PDFJS_ROOT + 'wasm/' });
    loading.onProgress = ({ loaded, total }) => { if (total && !doc) status.textContent = 'Loading the PDF… ' + Math.min(100, Math.round(loaded / total * 100)) + '%'; };
    doc = await loading.promise;
    current = clampPage(current, doc.numPages);
    await render();
  } catch (error) {
    count.textContent = 'PDF reader';
    showError(error.message === 'Please use a link to a PDF file, rather than a Dropbox folder.' ? error.message : 'The PDF could not be displayed here. You can still open or download it below.');
  }
}
if (typeof document !== 'undefined') {
  const root = document.getElementById('pdf-reader');
  if (root) startReader(root);
}
