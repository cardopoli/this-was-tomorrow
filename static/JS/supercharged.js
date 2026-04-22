/* THIS WAS TOMORROW - supercharged.js
   Vanilla JS, no dependencies.
   Only includes what is actually wired up and used. */

'use strict';

// ============================================================================
// DARK MODE
// Reads system preference, respects user override, persists across sessions.
// Toggle button: class="theme-toggle" anywhere in HTML.
// ============================================================================

(function() {
  var toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  var saved      = localStorage.getItem('twt-theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var isDark     = saved === 'dark' || (saved === null && prefersDark);

  if (isDark) {
    document.documentElement.classList.add('dark-mode');
    toggle.textContent = '☀ light';
  } else {
    toggle.textContent = '◑ dark';
  }

  toggle.addEventListener('click', function() {
    var nowDark = document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem('twt-theme', nowDark ? 'dark' : 'light');
    toggle.textContent = nowDark ? '☀ light' : '◑ dark';
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    if (localStorage.getItem('twt-theme') === null) {
      if (e.matches) {
        document.documentElement.classList.add('dark-mode');
        toggle.textContent = '☀ light';
      } else {
        document.documentElement.classList.remove('dark-mode');
        toggle.textContent = '◑ dark';
      }
    }
  });
})();


// ============================================================================
// SMOOTH SCROLL
// Intercepts anchor clicks and scrolls smoothly.
// ============================================================================

(function() {
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    var target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  });
})();


// ============================================================================
// STATIC IMAGE FADE-IN
// For local images (hero + grid) that aren't in the Dropbox gallery.
// Adds .loaded class once the image fires onload.
// ============================================================================

(function() {
  var images = document.querySelectorAll('.photo-hero img, .photos-grid img');
  images.forEach(function(img) {
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.4s ease';

    if (img.complete && img.naturalWidth > 0) {
      img.style.opacity = '1';
    } else {
      img.addEventListener('load',  function() { img.style.opacity = '1'; });
      img.addEventListener('error', function() { img.style.opacity = '1'; });
    }
  });
})();
