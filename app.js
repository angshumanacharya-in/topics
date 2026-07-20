document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const logoToggle = document.getElementById('logoToggle');
  const articleList = document.getElementById('articleList');
  const articleContainer = document.getElementById('articleContainer');
  
  // Navigation elements
  const articleNav = document.getElementById('articleNav');
  const prevBtn = document.getElementById('prevArticleBtn');
  const nextBtn = document.getElementById('nextArticleBtn');
  const prevTitle = document.getElementById('prevArticleTitle');
  const nextTitle = document.getElementById('nextArticleTitle');

  // Recover state from GitHub Pages 404 redirect
  (function handleGitHubRedirect() {
    const redirect = sessionStorage.redirect;
    delete sessionStorage.redirect;
    if (redirect && redirect !== location.href) {
      history.replaceState(null, null, redirect);
    }
  })();

  // Toggle Sidebar on Logo Click
  logoToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // Helper to determine root path for fetching
  function getAppRoot() {
    const path = window.location.pathname;
    const articlesIndex = path.indexOf('/articles');
    if (articlesIndex !== -1) {
      return path.substring(0, articlesIndex);
    }
    return path.endsWith('/') ? path.slice(0, -1) : path;
  }

  // Load article asynchronously
  async function loadArticle(slug, pushToHistory = true) {
    if (!slug) return;
    
    slug = slug.replace(/^.*\/articles\//, '').replace(/\.html$/, '');

    const contentArea = document.getElementById('contentArea');
    if (contentArea) contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    
    articleContainer.innerHTML = '<p class="loading-text">Loading article...</p>';
    articleNav.style.display = 'none';

    const appRoot = getAppRoot();
    const fetchPath = `${appRoot}/articles/${slug}.html?t=${Date.now()}`;
    const displayUrl = `${appRoot}/articles/${slug}`;

    try {
      const response = await fetch(fetchPath);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }

      const htmlContent = await response.text();
      articleContainer.innerHTML = htmlContent;

      if (pushToHistory) {
        history.pushState({ slug }, '', displayUrl);
      }

      updateActiveLink(slug);
      updateNavigationButtons(slug);

    } catch (error) {
      articleContainer.innerHTML = `
        <div style="padding: 1rem 0;">
          <h2 style="color: #ff6d00;">Article Not Found</h2>
          <p style="margin-top: 0.5rem;">Failed to load <code>articles/${slug}.html</code>.</p>
        </div>
      `;
      console.error('Fetch Error:', error);
    }
  }

  // Update Next/Previous buttons
  function updateNavigationButtons(currentSlug) {
    const links = Array.from(articleList.querySelectorAll('.nav-link'));
    const currentIndex = links.findIndex(link => link.dataset.slug === currentSlug);

    if (currentIndex === -1) {
      articleNav.style.display = 'none';
      return;
    }

    articleNav.style.display = 'flex';

    if (currentIndex > 0) {
      const prevLink = links[currentIndex - 1];
      prevBtn.style.visibility = 'visible';
      prevTitle.textContent = prevLink.textContent;
      prevBtn.dataset.targetSlug = prevLink.dataset.slug;
    } else {
      prevBtn.style.visibility = 'hidden'; 
    }

    if (currentIndex < links.length - 1) {
      const nextLink = links[currentIndex + 1];
      nextBtn.style.visibility = 'visible';
      nextTitle.textContent = nextLink.textContent;
      nextBtn.dataset.targetSlug = nextLink.dataset.slug;
    } else {
      nextBtn.style.visibility = 'hidden';
    }
  }

  prevBtn.addEventListener('click', () => {
    if (prevBtn.dataset.targetSlug) loadArticle(prevBtn.dataset.targetSlug, true);
  });

  nextBtn.addEventListener('click', () => {
    if (nextBtn.dataset.targetSlug) loadArticle(nextBtn.dataset.targetSlug, true);
  });

  function updateActiveLink(slug) {
    const links = articleList.querySelectorAll('.nav-link');
    links.forEach(link => {
      if (link.dataset.slug === slug) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  articleList.addEventListener('click', (e) => {
    const targetLink = e.target.closest('.nav-link');
    if (!targetLink) return;

    e.preventDefault();
    const slug = targetLink.dataset.slug;
    if (slug) loadArticle(slug, true);
  });

  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.slug) {
      loadArticle(e.state.slug, false);
    } else {
      resolveInitialRoute();
    }
  });

  function resolveInitialRoute() {
    const path = window.location.pathname;
    const match = path.match(/\/articles\/([^\/\?#]+)/);

    if (match && match[1]) {
      loadArticle(match[1], false);
    } else {
      const firstLink = articleList.querySelector('.nav-link');
      if (firstLink && firstLink.dataset.slug) {
        loadArticle(firstLink.dataset.slug, false);
      }
    }
  }

  resolveInitialRoute();
});