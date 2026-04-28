/* THIS WAS TOMORROW - gallery.js
   Handles Dropbox gallery loading + lightbox carousel.
   Vanilla JS, no dependencies.
   Called by: dropbox-gallery.html (gallery 1) and single.html (gallery 2) */

'use strict';

/* Global lightbox state - one object, shared across both galleries */
window._twt = window._twt || {
  images:  [],   /* array of { src, alt } for current gallery */
  index:   0,    /* current position */
  bound:   false /* whether lightbox controls are wired up */
};

/* ---- LIGHTBOX CONTROLS ---- */

window._twt.open = function(images, index) {
  var state = window._twt;
  state.images = images;
  state.index  = index;

  var lb    = document.getElementById('dbxLightbox');
  var img   = document.getElementById('dbxLightboxImg');
  var prev  = document.getElementById('dbxPrev');
  var next  = document.getElementById('dbxNext');
  var ctr   = document.getElementById('dbxCounter');

  img.src = images[index].src;
  img.alt = images[index].alt;
  ctr.textContent = (index + 1) + ' / ' + images.length;
  prev.disabled = (index === 0);
  next.disabled = (index === images.length - 1);

  lb.classList.add('active');
};

window._twt.show = function(newIndex) {
  var state = window._twt;
  if (newIndex < 0 || newIndex >= state.images.length) return;

  var img  = document.getElementById('dbxLightboxImg');
  var prev = document.getElementById('dbxPrev');
  var next = document.getElementById('dbxNext');
  var ctr  = document.getElementById('dbxCounter');

  /* Brief fade */
  img.classList.add('switching');
  setTimeout(function() {
    state.index = newIndex;
    img.src = state.images[newIndex].src;
    img.alt = state.images[newIndex].alt;
    ctr.textContent = (newIndex + 1) + ' / ' + state.images.length;
    prev.disabled = (newIndex === 0);
    next.disabled = (newIndex === state.images.length - 1);
    img.classList.remove('switching');
  }, 120);
};

window._twt.close = function() {
  document.getElementById('dbxLightbox').classList.remove('active');
};

window._twt.initControls = function() {
  if (window._twt.bound) return;
  window._twt.bound = true;

  var lb   = document.getElementById('dbxLightbox');
  var prev = document.getElementById('dbxPrev');
  var next = document.getElementById('dbxNext');
  var cls  = document.getElementById('dbxClose');

  prev.textContent = '←';
  next.textContent = '→';

  cls.addEventListener('click', function(e) {
    e.stopPropagation();
    window._twt.close();
  });

  prev.addEventListener('click', function(e) {
    e.stopPropagation();
    window._twt.show(window._twt.index - 1);
  });

  next.addEventListener('click', function(e) {
    e.stopPropagation();
    window._twt.show(window._twt.index + 1);
  });

  /* Click backdrop to close - but not the image or buttons */
  lb.addEventListener('click', function(e) {
    if (e.target === lb) window._twt.close();
  });

  /* Keyboard: arrows + escape */
  document.addEventListener('keydown', function(e) {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'Escape')      window._twt.close();
    if (e.key === 'ArrowLeft')   window._twt.show(window._twt.index - 1);
    if (e.key === 'ArrowRight')  window._twt.show(window._twt.index + 1);
  });

  /* Swipe support for mobile */
  var touchStartX = null;
  lb.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  lb.addEventListener('touchend', function(e) {
    if (touchStartX === null) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) < 40) return; /* too short - ignore */
    if (dx < 0) window._twt.show(window._twt.index + 1); /* swipe left = next */
    else         window._twt.show(window._twt.index - 1); /* swipe right = prev */
  }, { passive: true });
};

/* ---- GALLERY BUILDER ---- */
/* Called by each gallery with its Dropbox proxy URL and container element ID */

window._twt.buildGallery = function(proxyUrl, sharedLink, containerId) {
  var gallery = document.getElementById(containerId);
  if (!gallery || !sharedLink || sharedLink === '') {
    if (gallery) gallery.innerHTML = '';
    return;
  }

  function proxyFetch(endpoint, body) {
    return fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: endpoint, body: body })
    }).then(function(r) {
      if (!r.ok) throw new Error('Proxy ' + r.status);
      return r.json();
    });
  }

  function makeFadeImg(src, alt) {
    var img = document.createElement('img');
    img.alt = alt;
    img.setAttribute('loading', 'lazy');
    img.onload  = function() {
      img.classList.add('loaded');
      /* If landscape, span full width */
      if (img.naturalWidth > img.naturalHeight * 1.3) {
        var item = img.closest('.masonry-item');
        if (item) item.classList.add('masonry-wide');
      }
    };
    img.onerror = function() { img.classList.add('loaded'); };
    img.src = src;
    return img;
  }

  proxyFetch('files/list_folder', {
    path: '', shared_link: { url: sharedLink }, recursive: false
  })
  .then(function(data) {
    if (data.error) {
      gallery.innerHTML = '<div class="dbx-error">Could not load images.</div>';
      return;
    }

    var files = (data.entries || []).filter(function(f) {
      return f['.tag'] === 'file' && /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name);
    });

    if (files.length === 0) { gallery.innerHTML = ''; return; }

    /* Fetch all temp links in parallel */
    return Promise.all(
      files.map(function(f) {
        return proxyFetch('files/get_temporary_link', { path: f.path_lower })
          .then(function(d) { return d.link || null; });
      })
    ).then(function(links) {
      /* Build ordered image list for this gallery */
      var imageList = [];
      var grid = document.createElement('div');
      grid.className = 'masonry';

      files.forEach(function(f, i) {
        if (!links[i]) return;
        imageList.push({ src: links[i], alt: f.name });

        var item = document.createElement('div');
        item.className = 'masonry-item';
        item.dataset.index = imageList.length - 1;
        item.appendChild(makeFadeImg(links[i], f.name));
        grid.appendChild(item);
      });

      gallery.innerHTML = '';
      gallery.appendChild(grid);

      /* Open lightbox on click, passing this gallery's image list */
      gallery.addEventListener('click', function(e) {
        var item = e.target.closest('.masonry-item');
        var img  = item && item.querySelector('img');
        if (!img || !img.classList.contains('loaded')) return;
        var idx = parseInt(item.dataset.index, 10);
        window._twt.initControls();
        window._twt.open(imageList, idx);
      });
    });
  })
  .catch(function(err) {
    gallery.innerHTML = '<div class="dbx-error">Gallery unavailable.</div>';
    console.error(containerId + ' error:', err);
  });
};
