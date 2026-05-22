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

  function hexToRgb(hex) {
    hex = hex.replace('#','');
    if(hex.length===3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    var n = parseInt(hex,16);
    return ((n>>16)&255)+','+(((n>>8)&255))+','+(n&255);
  }

  function buildPlayer(audio) {
    var track = audio.closest('.audio-track') || audio.parentNode;
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
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '6px';

    // ---- ROW 1: skip-back | play | skip-forward | progress | time ----
    var row1 = document.createElement('div');
    row1.style.cssText = 'display:flex;align-items:center;gap:10px;width:100%';

    var skipBack = document.createElement('button');
    skipBack.setAttribute('aria-label', 'Skip back 15 seconds');
    skipBack.style.cssText = 'background:none;border:none;cursor:pointer;padding:0;flex-shrink:0;color:'+fg+';font-size:11px;opacity:0.7;line-height:1';
    skipBack.innerHTML = '&#8630;15';

    var btn = document.createElement('button');
    btn.className = 'twt-player-btn';
    btn.setAttribute('aria-label', 'Play');
    btn.innerHTML = '<span class="twt-play-icon">&#9654;</span>';
    btn.querySelector('.twt-play-icon').style.color = fg;
    btn.querySelector('.twt-play-icon').style.fontSize = btnSize;

    var skipFwd = document.createElement('button');
    skipFwd.setAttribute('aria-label', 'Skip forward 15 seconds');
    skipFwd.style.cssText = 'background:none;border:none;cursor:pointer;padding:0;flex-shrink:0;color:'+fg+';font-size:11px;opacity:0.7;line-height:1';
    skipFwd.innerHTML = '15&#8631;';

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
    time.style.color = 'rgba('+hexToRgb(fg)+',0.6)';
    if (!showTimer) time.style.display = 'none';

    row1.appendChild(skipBack);
    row1.appendChild(btn);
    row1.appendChild(skipFwd);
    row1.appendChild(progress);
    row1.appendChild(time);
    wrap.appendChild(row1);

    // ---- ROW 2: volume | speed ----
    var row2 = document.createElement('div');
    row2.style.cssText = 'display:flex;align-items:center;gap:10px;padding-top:4px';

    var volIcon = document.createElement('span');
    volIcon.innerHTML = '&#128266;';
    volIcon.style.cssText = 'color:'+fg+';font-size:11px;opacity:0.6;flex-shrink:0';

    var volSlider = document.createElement('input');
    volSlider.type = 'range';
    volSlider.min = '0'; volSlider.max = '1'; volSlider.step = '0.05'; volSlider.value = '1';
    volSlider.style.cssText = 'flex:1;max-width:90px;accent-color:'+fg+';cursor:pointer';
    volSlider.setAttribute('aria-label', 'Volume');

    var speedSel = document.createElement('select');
    speedSel.style.cssText = 'background:transparent;border:1px solid rgba('+hexToRgb(fg)+',0.3);color:'+fg+';font-size:10px;font-family:monospace;padding:2px 6px;cursor:pointer;flex-shrink:0;margin-left:auto';
    speedSel.setAttribute('aria-label', 'Playback speed');
    [['0.5','0.5x'],['0.75','0.75x'],['1','1x'],['1.25','1.25x'],['1.5','1.5x'],['2','2x']].forEach(function(o) {
      var opt = document.createElement('option');
      opt.value = o[0]; opt.textContent = o[1];
      if (o[0] === '1') opt.selected = true;
      speedSel.appendChild(opt);
    });

    row2.appendChild(volIcon);
    row2.appendChild(volSlider);
    row2.appendChild(speedSel);
    wrap.appendChild(row2);

    // ---- EVENTS ----
    var playing = false;

    btn.addEventListener('click', function () {
      if (playing) {
        audio.pause();
      } else {
        document.querySelectorAll('.twt-player-btn').forEach(function (b) {
          if (b !== btn) {
            b.closest('.twt-player').classList.remove('playing');
            b.querySelector('.twt-play-icon').textContent = '\u25B6';
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
      icon.innerHTML = '&#10074;&#10074;'; icon.style.color = fg;
      btn.setAttribute('aria-label', 'Pause');
    });

    audio.addEventListener('pause', function () {
      playing = false;
      wrap.classList.remove('playing');
      var icon = btn.querySelector('.twt-play-icon');
      icon.innerHTML = '&#9654;'; icon.style.color = fg;
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

    // Skip
    skipBack.addEventListener('click', function () {
      audio.currentTime = Math.max(0, audio.currentTime - 15);
    });
    skipFwd.addEventListener('click', function () {
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15);
    });

    // Volume
    volSlider.addEventListener('input', function () {
      audio.volume = parseFloat(volSlider.value);
    });

    // Speed
    speedSel.addEventListener('change', function () {
      audio.playbackRate = parseFloat(speedSel.value);
    });

    return wrap;
  }

  window._twtInitPlayers = function initPlayers() {
    document.querySelectorAll('.audio-track audio').forEach(function (audio) {
      if (audio.dataset.playerBuilt) return;
      audio.dataset.playerBuilt = '1';
      audio.style.display = 'none';
      var player = buildPlayer(audio);
      audio.parentNode.insertBefore(player, audio);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window._twtInitPlayers);
  } else {
    window._twtInitPlayers();
  }
})();


// ============================================================================
// AUDIO PLAYLIST
// Fetches a Dropbox folder via the proxy, filters audio files, renders
// a track list using the same TWT custom player for each track.
// Called by embed code generated in the embed tool's Audio tab (folder mode).
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

    console.log('[TWT playlist] calling proxyFetch for', sharedLink);
    proxyFetch('files/list_folder', {
      path: '', shared_link: { url: sharedLink }, recursive: false
    })
    .then(function(data) {
      console.log('[TWT playlist] list_folder response:', JSON.stringify(data).slice(0, 300));
      if (data.error) {
        container.innerHTML = '<p style="color:'+fg+';font-family:monospace;font-size:11px;padding:16px;background:'+bg+'">Could not load playlist.</p>';
        return;
      }

      var files = (data.entries || []).filter(function(f) {
        return f['.tag'] === 'file' && /\.(mp3|wav|m4a|ogg|aac)$/i.test(f.name);
      });

      console.log('[TWT playlist] audio files found:', files.length);

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
        // Build track data
        var tracks = [];
        files.forEach(function(f, i) {
          if (!links[i]) return;
          tracks.push({
            name: f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
            src: links[i]
          });
        });

        if (!tracks.length) return;

        // Build UI
        container.style.background = bg;
        container.style.color = fg;
        container.innerHTML = '';

        // Hidden audio element - one for the whole playlist
        var audio = document.createElement('audio');
        audio.preload = 'none';
        audio.src = tracks[0].src;
        audio.style.display = 'none';
        container.appendChild(audio);

        // Now playing label
        var nowPlaying = document.createElement('div');
        nowPlaying.className = 'twt-playlist-now';
        nowPlaying.style.color = fg;
        nowPlaying.textContent = tracks[0].name;
        container.appendChild(nowPlaying);

        // Player bar
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
        bar.appendChild(fill); bar.appendChild(handle);
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

        // Track list
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
            var playIcon = item.querySelector('.twt-playlist-item-play');
            if (playIcon) playIcon.textContent = i === idx ? '&#9654;' : '';
          });
        }

        function playPause() {
          if (playing) {
            audio.pause();
          } else {
            audio.play();
          }
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
          // Auto-advance
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
          // Update duration in list
          var items = list.querySelectorAll('.twt-playlist-item');
          if (items[currentIdx]) {
            var durEl = items[currentIdx].querySelector('.twt-playlist-item-dur');
            if (durEl) durEl.textContent = formatTime(audio.duration);
          }
        });

        // Scrub
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
            if (i === currentIdx) {
              playPause();
            } else {
              loadTrack(i);
              audio.play();
            }
          });

          list.appendChild(item);
        });

        container.appendChild(list);

        // Preload duration of first track
        audio.load();
      });
    })
    .catch(function(err) {
      container.innerHTML = '<p style="color:'+fg+';font-family:monospace;font-size:11px;padding:16px;background:'+bg+'">Playlist unavailable.</p>';
      console.error('TWT playlist error:', err);
    });
  };
})();


// ============================================================================
// AUDIO PLAYLIST
// Same proxy pattern as buildGallery but filters for audio files.
// Called by embed code generated in the embed tool's Audio tab (folder mode).
// ============================================================================
