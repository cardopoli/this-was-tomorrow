/* Opens "Read the conversation" links in a pop-up over the site page.
   Falls back to the normal page if anything goes wrong. */
(function () {
  var box, sheet, lastFocus;
  function build() {
    box = document.createElement('div');
    box.className = 'twt-reader';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Conversation');
    box.innerHTML = '<button class="twt-reader-close" aria-label="Close">✕</button><div class="twt-reader-sheet" tabindex="-1"></div>';
    document.body.appendChild(box);
    sheet = box.querySelector('.twt-reader-sheet');
    box.querySelector('.twt-reader-close').addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
  }
  function close() {
    box.classList.remove('active');
    document.body.classList.remove('twt-reader-open');
    if (location.hash === '#read') history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus) lastFocus.focus();
  }
  function open(url) {
    if (!box) build();
    lastFocus = document.activeElement;
    sheet.innerHTML = '<p class="twt-reader-loading">Loading…</p>';
    box.classList.add('active');
    document.body.classList.add('twt-reader-open');
    sheet.scrollTop = 0;
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var art = doc.querySelector('[data-transcript]');
      if (!art) throw new Error('no transcript');
      sheet.innerHTML = '';
      sheet.appendChild(document.importNode(art, true));
      sheet.focus();
    });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.twt-read');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    open(a.getAttribute('href')).catch(function () { location.href = a.getAttribute('href'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && box && box.classList.contains('active')) close();
  });
})();
