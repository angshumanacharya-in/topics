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

  // Recover from GitHub Pages 404 redirect script
  (function handleGitHubRedirect() {
    const redirect = sessionStorage.redirect;
    delete sessionStorage.redirect;
    if (redirect && redirect !== location.href) {
      history.replaceState(null, null, redirect);
    }
  })();

  // 1. Toggle Sidebar when clicking Header Logo
  logoToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // Helper: Get clean repository base path for GitHub Pages
  function getAppRoot() {
    const path = window.location.pathname;
    const articlesIndex = path.indexOf('/articles');
    if (articlesIndex !== -1) {
      return path.substring(0, articlesIndex);
    }
    // Remove trailing slash if present
    return path.endsWith('/') ? path.slice(0, -1) : path;
  }

  // 2. Dynamic Article Loader
  async function loadArticle(slug, pushToHistory = true) {
    if (!slug) return;
    
    // Clean up slug in case a full path was passed
    slug = slug.replace(/^.*\/articles\//, '').replace(/\.html$/, '');

    // Reset view & scroll to top of content
    const contentArea = document.getElementById('contentArea');
    if (contentArea) contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    
    articleContainer.innerHTML = '<p class="loading-text">Loading article...</p>';
    articleNav.style.display = 'none';

    const appRoot = getAppRoot();
    
    // Path used for fetching actual HTML file
    const fetchPath = `${appRoot}/articles/${slug}.html?t=${Date.now()}`;
    // Clean URL displayed in the browser bar (No #)
    const displayUrl = `${appRoot}/articles/${slug}`;

    try {
      const response = await fetch(fetchPath);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }

      const htmlContent = await response.text();
      articleContainer.innerHTML = htmlContent;

      // Update browser URL bar cleanly
      if (pushToHistory) {
        history.pushState({ slug }, '', displayUrl);
      }

      updateActiveLink(slug);
      updateNavigationButtons(slug);

    } catch (error) {
      articleContainer.innerHTML = `
        <div style="padding: 1rem 0;">
          <h2>Article Not Found</h2>
          <p>Failed to load <code>articles/${slug}.html</code>.</p>
          <p style="color: #71717a; font-size: 0.9rem; margin-top: 0.5rem;">
            Please check that the file exists inside your <strong>articles/</strong> folder and matches the name exact casing.
          </p>
        </div>
      `;
      console.error('Fetch Error:', error);
    }
  }

  // 3. Update Previous / Next Buttons Based on Sidebar Order
  function updateNavigationButtons(currentSlug) {
    const links = Array.from(articleList.querySelectorAll('.nav-link'));
    const currentIndex = links.findIndex(link => link.dataset.slug === currentSlug);

    if (currentIndex === -1) {
      articleNav.style.display = 'none';
      return;
    }

    articleNav.style.display = 'flex';

    // Setup Previous Button
    if (currentIndex > 0) {
      const prevLink = links[currentIndex - 1];
      prevBtn.style.visibility = 'visible';
      prevTitle.textContent = prevLink.textContent;
      prevBtn.dataset.targetSlug = prevLink.dataset.slug;
    } else {
      prevBtn.style.visibility = 'hidden'; 
    }

    // Setup Next Button
    if (currentIndex < links.length - 1) {
      const nextLink = links[currentIndex + 1];
      nextBtn.style.visibility = 'visible';
      nextTitle.textContent = nextLink.textContent;
      nextBtn.dataset.targetSlug = nextLink.dataset.slug;
    } else {
      nextBtn.style.visibility = 'hidden';
    }
  }

  // Prev / Next Click Handlers
  prevBtn.addEventListener('click', () => {
    if (prevBtn.dataset.targetSlug) loadArticle(prevBtn.dataset.targetSlug, true);
  });

  nextBtn.addEventListener('click', () => {
    if (nextBtn.dataset.targetSlug) loadArticle(nextBtn.dataset.targetSlug, true);
  });

  // 4. Highlight Active Link in Sidebar
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

  // 5. Intercept Sidebar Link Clicks
  articleList.addEventListener('click', (e) => {
    const targetLink = e.target.closest('.nav-link');
    if (!targetLink) return;

    e.preventDefault();
    const slug = targetLink.dataset.slug;
    if (slug) {
      loadArticle(slug, true);
    }
  });

  // 6. Handle Browser Back / Forward Navigation
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.slug) {
      loadArticle(e.state.slug, false);
    } else {
      resolveInitialRoute();
    }
  });

  // 7. Route Resolver for Direct Loads & Refreshes
  function resolveInitialRoute() {
    const path = window.location.pathname;
    // Look for /articles/slug pattern in the URL
    const match = path.match(/\/articles\/([^\/\?#]+)/);

    if (match && match[1]) {
      loadArticle(match[1], false);
    } else {
      // Default to the first article listed in sidebar
      const firstLink = articleList.querySelector('.nav-link');
      if (firstLink && firstLink.dataset.slug) {
        loadArticle(firstLink.dataset.slug, false);
      }
    }
  }

  // Execute on load
  resolveInitialRoute();
});