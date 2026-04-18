/* THIS WAS TOMORROW - Supercharged JavaScript
   Vanilla JS, no dependencies, ~5KB minified */

// ============================================================================
// DARK MODE TOGGLE
// ============================================================================

(function() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;
  
  // Check for saved theme preference or default to system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);
  
  if (isDark) {
    document.documentElement.classList.add('dark-mode');
    toggle.textContent = '☀️ light';
  } else {
    toggle.textContent = '🌙 dark';
  }
  
  toggle.addEventListener('click', () => {
    const isDarkNow = document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
    toggle.textContent = isDarkNow ? '☀️ light' : '🌙 dark';
  });
  
  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem('theme') === null) {
      if (e.matches) {
        document.documentElement.classList.add('dark-mode');
        toggle.textContent = '☀️ light';
      } else {
        document.documentElement.classList.remove('dark-mode');
        toggle.textContent = '🌙 dark';
      }
    }
  });
})();

// ============================================================================
// READING TIME ESTIMATE
// ============================================================================

(function() {
  const article = document.querySelector('article');
  if (!article) return;
  
  const text = article.textContent;
  const words = text.trim().split(/\s+/).length;
  const readingTime = Math.ceil(words / 200); // Average 200 words per minute
  
  if (readingTime > 0) {
    const meta = document.querySelector('.meta');
    if (meta) {
      const timeEl = document.createElement('span');
      timeEl.textContent = ` · ${readingTime} min read`;
      meta.appendChild(timeEl);
    }
  }
})();

// ============================================================================
// LAZY LOADING (fallback for older browsers)
// ============================================================================

(function() {
  if ('IntersectionObserver' in window) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  }
})();

// ============================================================================
// SEARCH (Lunr.js integration)
// ============================================================================

(function() {
  const searchBox = document.querySelector('.search-box input');
  const searchResults = document.querySelector('.search-results');
  
  if (!searchBox || !searchResults) return;
  
  // Fetch search index (built by Hugo)
  let searchIndex = null;
  let searchPages = [];
  
  fetch('/search-index.json')
    .then(response => response.json())
    .then(data => {
      searchPages = data.pages;
      
      // Build Lunr index
      searchIndex = lunr(function() {
        this.ref('id');
        this.field('title', { boost: 10 });
        this.field('location');
        this.field('content');
        
        searchPages.forEach((page, idx) => {
          this.add({
            id: idx,
            title: page.title,
            location: page.location || '',
            content: page.content
          });
        });
      });
    })
    .catch(() => {
      console.log('Search index not available');
    });
  
  // Search input handler
  searchBox.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    if (!query || !searchIndex) {
      searchResults.innerHTML = '';
      return;
    }
    
    // Search
    const results = searchIndex.search(query).slice(0, 10);
    
    if (results.length === 0) {
      searchResults.innerHTML = '<li style="text-align: center; color: var(--text-muted);">No results found.</li>';
      return;
    }
    
    // Render results
    searchResults.innerHTML = results.map(result => {
      const page = searchPages[result.ref];
      const snippet = page.content.substring(0, 150) + '...';
      
      return `
        <li>
          <div class="search-result-title">
            <a href="${page.url}">${page.title}</a>
          </div>
          ${page.location ? `<div class="search-result-meta">${page.location}</div>` : ''}
          <div class="search-result-snippet">${snippet}</div>
        </li>
      `;
    }).join('');
  });
})();

// ============================================================================
// LIGHTBOX (for masonry galleries)
// ============================================================================

(function() {
  const lightbox = document.getElementById('dbxLightbox');
  if (!lightbox) return;
  
  const closeBtn = document.getElementById('dbxClose');
  const lightboxImg = document.getElementById('dbxLightboxImg');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      lightbox.classList.remove('active');
    });
  }
  
  lightbox.addEventListener('click', () => {
    lightbox.classList.remove('active');
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      lightbox.classList.remove('active');
    }
  });
})();

// ============================================================================
// SMOOTH SCROLL LINKS
// ============================================================================

(function() {
  document.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(e.target.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
})();

// ============================================================================
// TABLE OF CONTENTS (optional - auto-generate from H2/H3)
// ============================================================================

(function() {
  const article = document.querySelector('article');
  if (!article) return;
  
  const headings = article.querySelectorAll('h2, h3');
  if (headings.length < 3) return;
  
  // Create TOC
  const toc = document.createElement('nav');
  toc.className = 'table-of-contents';
  const tocList = document.createElement('ul');
  
  let lastLevel = 2;
  let currentList = tocList;
  const lists = { 2: tocList };
  
  headings.forEach((heading, idx) => {
    const level = parseInt(heading.tagName[1]);
    const id = heading.id || `heading-${idx}`;
    heading.id = id;
    
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${id}`;
    a.textContent = heading.textContent;
    li.appendChild(a);
    
    if (level > lastLevel) {
      for (let i = lastLevel; i < level; i++) {
        const newList = document.createElement('ul');
        if (lists[i]) {
          const lastItem = lists[i].lastElementChild;
          if (lastItem) {
            lastItem.appendChild(newList);
          }
        }
        lists[i + 1] = newList;
        currentList = newList;
      }
    } else if (level < lastLevel) {
      currentList = lists[level];
    }
    
    currentList.appendChild(li);
    lastLevel = level;
  });
  
  toc.appendChild(tocList);
  article.insertBefore(toc, article.firstChild);
})();

// ============================================================================
// ANALYTICS (minimal, privacy-focused)
// ============================================================================

(function() {
  // Only track page views if a simple beacon exists
  // This is super minimal - just sends page path to a log
  const trackPageView = () => {
    // Replace with your tracking endpoint
    // navigator.sendBeacon('/api/analytics', JSON.stringify({
    //   path: window.location.pathname,
    //   timestamp: new Date().toISOString()
    // }));
  };
  
  // Track on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageView);
  } else {
    trackPageView();
  }
})();
