/* THIS WAS TOMORROW - supercharged.js
   Vanilla JS, no dependencies.
   Only includes what is actually wired up and used. */

'use strict';

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


// ============================================================================
// CUSTOM AUDIO PLAYER
// Replaces every <audio> element with a styled TWT player.
// Preserves the original <audio> for actual playback - just hides it.
// ============================================================================

(function () {
  function formatTime(s) {
    if (isNaN(s)) return '0:00';
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function buildPlayer(audio) {
    var wrap = document.createElement('div');
    wrap.className = 'twt-player';

    var btn = document.createElement('button');
    btn.className = 'twt-player-btn';
    btn.setAttribute('aria-label', 'Play');
    btn.innerHTML = '<span class="twt-play-icon">▶</span>';

    var progress = document.createElement('div');
    progress.className = 'twt-player-progress';

    var bar = document.createElement('div');
    bar.className = 'twt-player-bar';

    var fill = document.createElement('div');
    fill.className = 'twt-player-fill';

    var handle = document.createElement('div');
    handle.className = 'twt-player-handle';

    bar.appendChild(fill);
    bar.appendChild(handle);
    progress.appendChild(bar);

    var time = document.createElement('div');
    time.className = 'twt-player-time';
    time.textContent = '0:00 / 0:00';

    wrap.appendChild(btn);
    wrap.appendChild(progress);
    wrap.appendChild(time);

    // Play/pause
    var playing = false;
    btn.addEventListener('click', function () {
      if (playing) {
        audio.pause();
      } else {
        // Pause all other players first
        document.querySelectorAll('.twt-player-btn').forEach(function (b) {
          if (b !== btn) {
            b.closest('.twt-player').classList.remove('playing');
            b.querySelector('.twt-play-icon').textContent = '▶';
            b.setAttribute('aria-label', 'Play');
          }
        });
        document.querySelectorAll('audio').forEach(function (a) {
          if (a !== audio) a.pause();
        });
        audio.play();
      }
    });

    audio.addEventListener('play', function () {
      playing = true;
      wrap.classList.add('playing');
      btn.querySelector('.twt-play-icon').textContent = '❚❚';
      btn.setAttribute('aria-label', 'Pause');
    });

    audio.addEventListener('pause', function () {
      playing = false;
      wrap.classList.remove('playing');
      btn.querySelector('.twt-play-icon').textContent = '▶';
      btn.setAttribute('aria-label', 'Play');
    });

    audio.addEventListener('ended', function () {
      playing = false;
      wrap.classList.remove('playing');
      btn.querySelector('.twt-play-icon').textContent = '▶';
      fill.style.width = '0%';
      handle.style.left = '0%';
    });

    // Progress
    audio.addEventListener('timeupdate', function () {
      if (!audio.duration) return;
      var pct = (audio.currentTime / audio.duration) * 100;
      fill.style.width = pct + '%';
      handle.style.left = pct + '%';
      time.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration);
    });

    audio.addEventListener('loadedmetadata', function () {
      time.textContent = '0:00 / ' + formatTime(audio.duration);
    });

    // Scrub
    var scrubbing = false;
    function scrubTo(e) {
      var rect = bar.getBoundingClientRect();
      var pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = pct * audio.duration;
    }
    bar.addEventListener('mousedown', function (e) { scrubbing = true; scrubTo(e); });
    document.addEventListener('mousemove', function (e) { if (scrubbing) scrubTo(e); });
    document.addEventListener('mouseup', function () { scrubbing = false; });
    bar.addEventListener('touchstart', function (e) { scrubTo(e.touches[0]); }, { passive: true });
    bar.addEventListener('touchmove', function (e) { scrubTo(e.touches[0]); }, { passive: true });

    return wrap;
  }

  function initPlayers() {
    document.querySelectorAll('.audio-track audio').forEach(function (audio) {
      if (audio.dataset.playerBuilt) return;
      audio.dataset.playerBuilt = '1';
      audio.style.display = 'none';
      var player = buildPlayer(audio);
      audio.parentNode.insertBefore(player, audio);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayers);
  } else {
    initPlayers();
  }
})();
