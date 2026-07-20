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

  // 1. Toggle Sidebar when clicking Header Logo
  logoToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // 2. Dynamic Article Loader with Live Cache-Busting
  async function loadArticle(slug, pushToHistory = true) {
    if (!slug) return;
    
    // Reset view & scroll to top of content
    document.getElementById('contentArea').scrollTo({ top: 0, behavior: 'smooth' });
    articleContainer.innerHTML = '<p class="loading-text">Loading article...</p>';
    articleNav.style.display = 'none';

    // Prevent caching so topic updates display immediately
    const articlePath = `/articles/${slug}.html?t=${Date.now()}`;
    const cleanUrl = `/articles/${slug}`;

    try {
      const response = await fetch(articlePath);

      if (!response.ok) {
        throw new Error(`Article not found (${response.status})`);
      }

      const htmlContent = await response.text();
      articleContainer.innerHTML = htmlContent;

      // Update URL without hashes (#)
      if (pushToHistory) {
        history.pushState({ slug }, '', cleanUrl);
      }

      updateActiveLink(slug);
      updateNavigationButtons(slug);

    } catch (error) {
      articleContainer.innerHTML = `
        <h2>Article Not Found</h2>
        <p>Could not load the requested topic. Please select another article from the sidebar.</p>
      `;
      console.error('Fetch error:', error);
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

  // 5. Sidebar Link Clicks
  articleList.addEventListener('click', (e) => {
    const targetLink = e.target.closest('.nav-link');
    if (!targetLink) return;

    e.preventDefault();
    loadArticle(targetLink.dataset.slug, true);
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
    const match = path.match(/\/articles\/([^\/]+)/);

    if (match && match[1]) {
      loadArticle(match[1], false);
    } else {
      const firstLink = articleList.querySelector('.nav-link');
      if (firstLink) {
        loadArticle(firstLink.dataset.slug, true);
      }
    }
  }

  // Execute on initial page load
  resolveInitialRoute();
});