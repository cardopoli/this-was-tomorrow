/* THIS WAS TOMORROW - supercharged.js
   Vanilla JS, no dependencies. */

'use strict';

// ============================================================================
// SMOOTH SCROLL
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
// INLINE IMAGE LIGHTBOX
// ============================================================================

(function() {
  function initInlineLightbox() {
    var lb      = document.getElementById('dbxLightbox');
    var lbImg   = document.getElementById('dbxLightboxImg');
    var lbClose = document.getElementById('dbxClose');
    var lbPrev  = document.getElementById('dbxPrev');
    var lbNext  = document.getElementById('dbxNext');
    var lbCount = document.getElementById('dbxCounter');
    if (!lb || !lbImg) return;

    var triggers = Array.from(document.querySelectorAll('a.twt-lb'));
    if (!triggers.length) return;

    var current = 0;

    function openAt(idx) {
      current = idx;
      var a = triggers[idx];
      lbImg.src = a.href;
      lbImg.alt = a.dataset.alt || '';
      lbCount.textContent = (idx + 1) + ' / ' + triggers.length;
      lbPrev.disabled = idx === 0;
      lbNext.disabled = idx === triggers.length - 1;
      lb.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      lb.classList.remove('active');
      document.body.style.overflow = '';
      lbImg.src = '';
    }

    triggers.forEach(function(a, i) {
      a.addEventListener('click', function(e) {
        e.preventDefault();
        openAt(i);
      });
    });

    if (!lb.dataset.inlineBound) {
      lb.dataset.inlineBound = '1';
      lbClose.addEventListener('click', close);
      lb.addEventListener('click', function(e) { if (e.target === lb) close(); });
      document.addEventListener('keydown', function(e) {
        if (!lb.classList.contains('active')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft'  && !lbPrev.disabled) openAt(current - 1);
        if (e.key === 'ArrowRight' && !lbNext.disabled) openAt(current + 1);
      });
      lbPrev.addEventListener('click', function() { if (current > 0) openAt(current - 1); });
      lbNext.addEventListener('click', function() { if (current < triggers.length - 1) openAt(current + 1); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInlineLightbox);
  } else {
    initInlineLightbox();
  }
})();


// ============================================================================
// CUSTOM AUDIO PLAYER - simple: play/pause, scrub, timer
// ============================================================================

(function () {
  // Global scrub state - shared across all players to avoid listener accumulation
  var _scrubbing = false;
  var _scrubFn = null;

  document.addEventListener('mousemove', function(e) {
    if (_scrubbing && _scrubFn) _scrubFn(e);
  });
  document.addEventListener('mouseup', function() {
    _scrubbing = false;
    _scrubFn = null;
  });

  function formatTime(s) {
    if (isNaN(s)) return '0:00';
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    var n = parseInt(hex, 16);
    return ((n>>16)&255)+','+(((n>>8)&255))+','+(n&255);
  }

  function buildPlayer(audio) {
    var track    = audio.closest('.audio-track') || audio.parentNode;
    var bg       = track.dataset.twtBg       || '#111111';
    var fg       = track.dataset.twtFg       || '#f7f5f0';
    var pad      = track.dataset.twtPad      || '14px 18px';
    var btnSize  = track.dataset.twtBtnSize  || '14px';
    var timeSize = track.dataset.twtTimeSize || '11px';
    var showTimer = track.dataset.twtShowTimer !== '0';

    var wrap = document.createElement('div');
    wrap.className = 'twt-player';
    wrap.style.background = bg;
    wrap.style.padding = pad;

    var btn = document.createElement('button');
    btn.className = 'twt-player-btn';
    btn.setAttribute('aria-label', 'Play');
    btn.innerHTML = '<span class="twt-play-icon">&#9654;</span>';
    btn.querySelector('.twt-play-icon').style.color = fg;
    btn.querySelector('.twt-play-icon').style.fontSize = btnSize;

    var progress = document.createElement('div');
    progress.className = 'twt-player-progress';

    var bar = document.createElement('div');
    bar.className = 'twt-player-bar';

    var fill = document.createElement('div');
    fill.className = 'twt-player-fill';
    fill.style.background = fg;

    var handle = document.createElement('div');
    handle.className = 'twt-player-handle';
    handle.style.background = fg;

    bar.appendChild(fill);
    bar.appendChild(handle);
    progress.appendChild(bar);

    var time = document.createElement('div');
    time.className = 'twt-player-time';
    time.textContent = '0:00 / 0:00';
    time.style.fontSize = timeSize;
    time.style.color = 'rgba(' + hexToRgb(fg) + ',0.6)';
    if (!showTimer) time.style.display = 'none';

    wrap.appendChild(btn);
    wrap.appendChild(progress);
    wrap.appendChild(time);

    var playing = false;

    btn.addEventListener('click', function () {
      if (playing) {
        audio.pause();
      } else {
        document.querySelectorAll('.twt-player-btn').forEach(function (b) {
          if (b !== btn) {
            b.closest('.twt-player').classList.remove('playing');
            b.querySelector('.twt-play-icon').innerHTML = '&#9654;';
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
      var icon = btn.querySelector('.twt-play-icon');
      icon.innerHTML = '&#10074;&#10074;';
      icon.style.color = fg;
      btn.setAttribute('aria-label', 'Pause');
    });

    audio.addEventListener('pause', function () {
      playing = false;
      wrap.classList.remove('playing');
      var icon = btn.querySelector('.twt-play-icon');
      icon.innerHTML = '&#9654;';
      icon.style.color = fg;
      btn.setAttribute('aria-label', 'Play');
    });

    audio.addEventListener('ended', function () {
      playing = false;
      wrap.classList.remove('playing');
      btn.querySelector('.twt-play-icon').innerHTML = '&#9654;';
      fill.style.width = '0%';
      handle.style.left = '0%';
    });

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

    function scrubTo(e) {
      var rect = bar.getBoundingClientRect();
      var pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = pct * audio.duration;
    }
    bar.addEventListener('mousedown', function (e) {
      if (e.target === btn || btn.contains(e.target)) return;
      _scrubbing = true;
      _scrubFn = scrubTo;
      scrubTo(e);
    });
    bar.addEventListener('touchstart', function (e) { scrubTo(e.touches[0]); }, { passive: true });
    bar.addEventListener('touchmove', function (e) { scrubTo(e.touches[0]); }, { passive: true });

    return wrap;
  }

  window._twtInitPlayers = function initPlayers() {
    document.querySelectorAll('.audio-track audio').forEach(function (audio) {
      if (audio.closest('.twt-playlist')) return;
      if (audio.dataset.playerBuilt) return;
      audio.dataset.playerBuilt = '1';
      audio.style.display = 'none';
      var player = buildPlayer(audio);
      audio.parentNode.insertBefore(player, audio);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window._twtInitPlayers);
  } else {
    window._twtInitPlayers();
  }
})();


// ============================================================================
// AUDIO PLAYLIST - single player bar + clickable track list
// ============================================================================

(function() {
  window._twt = window._twt || {};

  window._twt.buildAudioPlaylist = function(proxyUrl, sharedLink, containerId) {
    var container = document.getElementById(containerId);
    if (!container || !sharedLink) return;

    var bg       = container.dataset.twtBg       || '#111111';
    var fg       = container.dataset.twtFg       || '#f7f5f0';
    var pad      = container.dataset.twtPad      || '14px 18px';
    var btnSize  = container.dataset.twtBtnSize  || '14px';
    var timeSize = container.dataset.twtTimeSize || '11px';
    var showTimer = container.dataset.twtShowTimer !== '0';

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

    function formatTime(s) {
      if (!s || isNaN(s)) return '0:00';
      var m = Math.floor(s / 60);
      var sec = Math.floor(s % 60);
      return m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    proxyFetch('files/list_folder', {
      path: '', shared_link: { url: sharedLink }, recursive: false
    })
    .then(function(data) {
      if (data.error) {
        container.innerHTML = '<p style="color:'+fg+';font-family:monospace;font-size:11px;padding:16px;background:'+bg+'">Could not load playlist.</p>';
        return;
      }

      var files = (data.entries || []).filter(function(f) {
        return f['.tag'] === 'file' && /\.(mp3|wav|m4a|ogg|aac)$/i.test(f.name);
      });

      if (!files.length) {
        container.innerHTML = '<p style="color:'+fg+';font-family:monospace;font-size:11px;padding:16px;background:'+bg+'">No audio files found.</p>';
        return;
      }

      return Promise.all(
        files.map(function(f) {
          return proxyFetch('files/get_temporary_link', { path: f.path_lower })
            .then(function(d) { return d.link || null; });
        })
      ).then(function(links) {
        var tracks = [];
        files.forEach(function(f, i) {
          if (!links[i]) return;
          tracks.push({
            name: f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
            src: links[i]
          });
        });

        if (!tracks.length) return;

        container.style.background = bg;
        container.style.color = fg;
        container.innerHTML = '';

        var audio = document.createElement('audio');
        audio.preload = 'none';
        audio.src = tracks[0].src;
        audio.style.display = 'none';
        container.appendChild(audio);

        var nowPlaying = document.createElement('div');
        nowPlaying.className = 'twt-playlist-now';
        nowPlaying.style.color = fg;
        nowPlaying.textContent = tracks[0].name;
        container.appendChild(nowPlaying);

        var playerBar = document.createElement('div');
        playerBar.className = 'twt-playlist-player';

        var btn = document.createElement('button');
        btn.className = 'twt-player-btn';
        btn.innerHTML = '<span class="twt-play-icon" style="color:'+fg+';font-size:'+btnSize+'">&#9654;</span>';

        var progress = document.createElement('div');
        progress.className = 'twt-player-progress';
        var bar = document.createElement('div');
        bar.className = 'twt-player-bar';
        var fill = document.createElement('div');
        fill.className = 'twt-player-fill';
        fill.style.background = fg;
        var handle = document.createElement('div');
        handle.className = 'twt-player-handle';
        handle.style.background = fg;
        bar.appendChild(fill);
        bar.appendChild(handle);
        progress.appendChild(bar);

        var time = document.createElement('div');
        time.className = 'twt-player-time';
        time.style.fontSize = timeSize;
        time.style.color = 'rgba(247,245,240,0.6)';
        time.textContent = '0:00 / 0:00';
        if (!showTimer) time.style.display = 'none';

        playerBar.appendChild(btn);
        playerBar.appendChild(progress);
        playerBar.appendChild(time);
        container.appendChild(playerBar);

        var list = document.createElement('ul');
        list.className = 'twt-playlist-list';

        var currentIdx = 0;
        var playing = false;

        function loadTrack(idx) {
          currentIdx = idx;
          audio.src = tracks[idx].src;
          nowPlaying.textContent = tracks[idx].name;
          fill.style.width = '0%';
          handle.style.left = '0%';
          time.textContent = '0:00 / 0:00';
          list.querySelectorAll('.twt-playlist-item').forEach(function(item, i) {
            item.classList.toggle('active', i === idx);
            var pi = item.querySelector('.twt-playlist-item-play');
            if (pi) pi.innerHTML = i === idx ? '&#9654;' : '';
          });
        }

        function playPause() {
          if (playing) { audio.pause(); } else { audio.play(); }
        }

        audio.addEventListener('play', function() {
          playing = true;
          btn.querySelector('.twt-play-icon').innerHTML = '&#10074;&#10074;';
        });
        audio.addEventListener('pause', function() {
          playing = false;
          btn.querySelector('.twt-play-icon').innerHTML = '&#9654;';
        });
        audio.addEventListener('ended', function() {
          playing = false;
          btn.querySelector('.twt-play-icon').innerHTML = '&#9654;';
          fill.style.width = '0%';
          handle.style.left = '0%';
          if (currentIdx < tracks.length - 1) {
            loadTrack(currentIdx + 1);
            audio.play();
          }
        });
        audio.addEventListener('timeupdate', function() {
          if (!audio.duration) return;
          var pct = (audio.currentTime / audio.duration) * 100;
          fill.style.width = pct + '%';
          handle.style.left = pct + '%';
          time.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration);
        });
        audio.addEventListener('loadedmetadata', function() {
          time.textContent = '0:00 / ' + formatTime(audio.duration);
          var items = list.querySelectorAll('.twt-playlist-item');
          if (items[currentIdx]) {
            var durEl = items[currentIdx].querySelector('.twt-playlist-item-dur');
            if (durEl) durEl.textContent = formatTime(audio.duration);
          }
        });

        var scrubbing = false;
        bar.addEventListener('mousedown', function(e) {
          scrubbing = true;
          var rect = bar.getBoundingClientRect();
          audio.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * audio.duration;
        });
        document.addEventListener('mousemove', function(e) {
          if (!scrubbing) return;
          var rect = bar.getBoundingClientRect();
          audio.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * audio.duration;
        });
        document.addEventListener('mouseup', function() { scrubbing = false; });

        btn.addEventListener('click', playPause);

        tracks.forEach(function(track, i) {
          var item = document.createElement('li');
          item.className = 'twt-playlist-item' + (i === 0 ? ' active' : '');
          item.style.color = fg;

          var num = document.createElement('span');
          num.className = 'twt-playlist-item-num';
          num.textContent = (i + 1);

          var playIcon = document.createElement('span');
          playIcon.className = 'twt-playlist-item-play';
          playIcon.innerHTML = i === 0 ? '&#9654;' : '';
          playIcon.style.color = fg;

          var name = document.createElement('span');
          name.className = 'twt-playlist-item-name';
          name.textContent = track.name;

          var dur = document.createElement('span');
          dur.className = 'twt-playlist-item-dur';
          dur.style.color = fg;

          item.appendChild(num);
          item.appendChild(playIcon);
          item.appendChild(name);
          item.appendChild(dur);

          item.addEventListener('click', function() {
            if (i === currentIdx) { playPause(); } else { loadTrack(i); audio.play(); }
          });

          list.appendChild(item);
        });

        container.appendChild(list);
        audio.load();
      });
    })
    .catch(function(err) {
      container.innerHTML = '<p style="color:'+fg+';font-family:monospace;font-size:11px;padding:16px;background:'+bg+'">Playlist unavailable.</p>';
      console.error('TWT playlist error:', err);
    });
  };
})();
