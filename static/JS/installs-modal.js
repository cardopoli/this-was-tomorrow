/* This Was Tomorrow - installs modal */

(function() {
  'use strict';

  var modal = document.getElementById('installModal');
  var closeBtn = document.getElementById('modalCloseBtn');
  var cards = document.querySelectorAll('.install-card');

  function openModal(installKey) {
    if (!window.installsData || !window.installsData[installKey]) return;

    var data = window.installsData[installKey];

    // Populate modal
    document.getElementById('modalTitle').textContent = data.title;
    document.getElementById('modalVenue').textContent = data.venue;
    document.getElementById('modalLocation').textContent = data.location;
    document.getElementById('modalDate').textContent = data.date_range;
    
    // Info (markdown rendered as HTML by Hugo, so innerHTML is safe)
    var infoEl = document.getElementById('modalInfo');
    infoEl.innerHTML = data.info;

    // Embed code (raw HTML from studio)
    var embedEl = document.getElementById('modalEmbed');
    if (data.embed_code && data.embed_code.trim()) {
      embedEl.innerHTML = data.embed_code;
      embedEl.style.display = 'block';
    } else {
      embedEl.style.display = 'none';
    }

    // Link to full site page
    var linkEl = document.getElementById('modalLink');
    if (data.site_link) {
      linkEl.innerHTML = '<a class="modal-link" href="/sites/' + data.site_link + '/">View full page →</a>';
    } else {
      linkEl.innerHTML = '';
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Card click handlers
  cards.forEach(function(card) {
    card.addEventListener('click', function() {
      var installKey = this.dataset.install;
      openModal(installKey);
    });

    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var installKey = this.dataset.install;
        openModal(installKey);
      }
    });
  });

  // Close modal
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
  });

  // ESC key to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
  });

  // Lazy load images
  var images = document.querySelectorAll('.install-card-lazy');
  images.forEach(function(img) {
    img.addEventListener('load', function() {
      this.classList.add('loaded');
    });
    img.addEventListener('error', function() {
      this.classList.add('loaded'); // still mark as loaded so placeholder doesn't persist
    });
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('loaded');
    }
  });

})();
