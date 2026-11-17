/* Opens "Read the conversation" links in a side panel, so the audio player stays usable.
   Falls back to the normal page if anything goes wrong. */
(function () {
  var box, sheet, lastFocus;
  function build() {
    box = document.createElement('div');
    box.className = 'twt-reader';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'false');
    box.setAttribute('aria-label', 'Conversation');
    box.innerHTML = '<button class="twt-reader-close" aria-label="Close">✕</button><div class="twt-reader-sheet" tabindex="-1"></div>';
    document.body.appendChild(box);
    sheet = box.querySelector('.twt-reader-sheet');
    box.querySelector('.twt-reader-close').addEventListener('click', close);
  }
  function close() {
    box.classList.remove('active');
    document.body.classList.remove('twt-reader-side');
    if (location.hash === '#read') history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus) lastFocus.focus();
  }
  function open(url) {
    if (!box) build();
    lastFocus = document.activeElement;
    sheet.innerHTML = '<p class="twt-reader-loading">Loading…</p>';
    box.classList.add('active');
    document.body.classList.add('twt-reader-side');
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
    // on phones, bring the player to the top so it stays visible above the sheet
    if (window.innerWidth <= 760) {
      var prev = a.closest('p') && a.closest('p').previousElementSibling;
      if (prev && prev.classList.contains('audio-track')) {
        window.scrollTo({ top: prev.getBoundingClientRect().top + window.scrollY - 8, behavior: 'smooth' });
      }
    }
    open(a.getAttribute('href')).catch(function () { location.href = a.getAttribute('href'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && box && box.classList.contains('active')) close();
  });
})();
