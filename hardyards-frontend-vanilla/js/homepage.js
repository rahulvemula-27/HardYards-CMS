// Homepage functionality - Sanity CMS Integration
// Preload the font to ensure text renders quickly
const fontLink = document.createElement('link');
fontLink.rel = 'preload';
fontLink.href = 'https://db.onlinewebfonts.com/t/27169bf8399d2c8e67d55e0c623bd8e4.woff2';
fontLink.as = 'font';
fontLink.type = 'font/woff2';
fontLink.crossOrigin = 'anonymous';
document.head.appendChild(fontLink);

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Show loading state immediately
    const featuredContainerEl = document.getElementById("featured-article");
    const secondaryContainerEl = document.getElementById("secondary-articles");
    const moreArticlesContainerEl = document.getElementById("more-articles");
    const newsFeedEl = document.getElementById("news-feed-items");
    
    if (featuredContainerEl) {
      featuredContainerEl.innerHTML = `
        <div class="featured-content">
          <div class="featured-text-content">
            <h2 class="featured-title-placeholder"></h2>
            <div class="featured-date-placeholder"></div>
          </div>
          <div class="featured-image-content">
            <div class="featured-image-placeholder"></div>
          </div>
        </div>
      `;
    }
    
    const featuredBelowEl = document.getElementById("featured-below-articles");
    if (featuredBelowEl) {
      featuredBelowEl.innerHTML = `
        <div class="featured-below-articles-grid">
          ${Array(2).fill().map(() => `
            <article class="article-card horizontal">
              <div class="article-content">
                <h3 class="article-title-placeholder"></h3>
                <div class="article-date-placeholder"></div>
              </div>
              <div class="article-image">
                <div class="article-image-placeholder"></div>
              </div>
            </article>
          `).join('')}
        </div>
      `;
    }
    
    if (secondaryContainerEl) {
      secondaryContainerEl.innerHTML = `
        <div class="secondary-articles-container">
          ${Array(3).fill().map(() => `
            <article class="article-card horizontal">
              <div class="article-content">
                <h3 class="article-title-placeholder"></h3>
                <div class="article-date-placeholder"></div>
              </div>
              <div class="article-image">
                <div class="article-image-placeholder"></div>
              </div>
            </article>
          `).join('')}
        </div>
      `;
    }
    
    if (moreArticlesContainerEl) {
      moreArticlesContainerEl.innerHTML = `
        <div class="secondary-articles-grid">
          ${Array(2).fill().map(() => `
            <article class="article-card horizontal">
              <div class="article-content">
                <h3 class="article-title-placeholder"></h3>
                <div class="article-date-placeholder"></div>
              </div>
              <div class="article-image">
                <div class="article-image-placeholder"></div>
              </div>
            </article>
          `).join('')}
        </div>
      `;
    }
    
    if (newsFeedEl) {
      newsFeedEl.innerHTML = `
        ${Array(6).fill().map(() => `
          <div class="news-feed-item">
            <div class="news-feed-date-placeholder"></div>
            <div class="news-feed-title-placeholder"></div>
          </div>
        `).join('')}
      `;
    }

    // Fetch latest articles from Sanity (need at least 7: 1 featured + 3 latest + 3 more)
    const query = `*[_type == "post"] | order(publishedAt desc)[0...10] {
      _id,
      title,
      slug,
      publishedAt,
      mainImage { asset->{url}, alt },
      categories[]-> { title },
      excerpt,
      author->{name}
    }`;
    
    const url = `https://cfblwn37.api.sanity.io/v2023-07-14/data/query/production?query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const articles = data.result || [];

    if (articles.length === 0) {
      document.getElementById("featured-article").innerHTML = `
        <div class="error-message">
          <p>No articles found.</p>
        </div>
      `;
      document.getElementById("secondary-articles").innerHTML = `
        <div class="error-message">
          <p>No articles found.</p>
        </div>
      `;
      const moreArticlesContainer = document.getElementById("more-articles");
      if (moreArticlesContainer) {
        moreArticlesContainer.innerHTML = '';
      }
      return;
    }

    // Featured article (first article) - Horizontal layout (text left, image right)
    const featuredArticle = articles[0];
    console.log('Featured article slug:', featuredArticle.slug);
    console.log('Featured article slug.current:', featuredArticle.slug?.current);
    
    const featuredContainer = document.getElementById("featured-article");
    if (featuredContainer) {
        const featuredUrl = `/post/${featuredArticle.slug?.current || ''}`;
        console.log('Featured article URL:', featuredUrl);
      
      featuredContainer.innerHTML = `
        <div class="featured-content">
          <div class="featured-text-content">
            <h2 class="featured-title">
              <a href="#" onclick="navigateToArticle('${featuredArticle.slug?.current || ''}'); return false;">${featuredArticle.title}</a>
            </h2>
            ${featuredArticle.excerpt ? `<p class="featured-excerpt">${featuredArticle.excerpt}</p>` : ''}
            <div class="featured-date">${formatDate(featuredArticle.publishedAt)} • ${featuredArticle.author?.name || 'HardYards Team'}</div>
          </div>
          <div class="featured-image-content">
            <img src="${featuredArticle.mainImage?.asset?.url || ''}" alt="${featuredArticle.title}" class="featured-image">
          </div>
        </div>
      `;
    }

    // Articles below featured article (beside news feed) - 2 articles horizontally
    const featuredBelowArticles = articles.slice(1, 3); // Show 2 articles side by side
    const featuredBelowContainer = document.getElementById("featured-below-articles");
    if (featuredBelowContainer && featuredBelowArticles.length > 0) {
      const articlesHTML = featuredBelowArticles.map(article => {
        return `
          <article class="article-card horizontal">
            <div class="article-content">
              <h3 class="article-title">
                <a href="#" onclick="navigateToArticle('${article.slug?.current || ''}'); return false;">${article.title}</a>
              </h3>
              ${article.excerpt ? `<p class="article-excerpt">${article.excerpt}</p>` : ''}
              <div class="article-date">${formatDate(article.publishedAt)} • ${article.author?.name || 'HardYards Team'}</div>
            </div>
            <div class="article-image">
              <img src="${article.mainImage?.asset?.url || ''}" alt="${article.title}">
            </div>
          </article>
        `;
      }).join('');

      featuredBelowContainer.innerHTML = `
        <div class="featured-below-articles-grid">
          ${articlesHTML}
        </div>
      `;
    }

    // Latest Articles section - Vertical layout with 3 articles
    const latestArticles = articles.slice(3, 6); // Show next 3 articles vertically
    const secondaryContainer = document.getElementById("secondary-articles");
    if (secondaryContainer) {
      const articlesHTML = latestArticles.map(article => {
        console.log(`Latest article "${article.title}" slug:`, article.slug);
        console.log(`Latest article "${article.title}" slug.current:`, article.slug?.current);
        const articleUrl = `/post/${article.slug?.current || ''}`;
        console.log(`Latest article "${article.title}" URL:`, articleUrl);
        
        return `
          <article class="article-card horizontal">
            <div class="article-content">
              <h3 class="article-title">
                <a href="#" onclick="navigateToArticle('${article.slug?.current || ''}'); return false;">${article.title}</a>
              </h3>
              ${article.excerpt ? `<p class="article-excerpt">${article.excerpt}</p>` : ''}
              <div class="article-date">${formatDate(article.publishedAt)} • ${article.author?.name || 'HardYards Team'}</div>
            </div>
            <div class="article-image">
              <img src="${article.mainImage?.asset?.url || ''}" alt="${article.title}">
            </div>
          </article>
        `;
      }).join('');

      secondaryContainer.innerHTML = `
        <div class="secondary-articles-container">
          ${articlesHTML}
        </div>
      `;
    }

    // More articles section - Show next 2 articles horizontally
    const moreArticles = articles.slice(5, 7); // Show next 2 articles (articles 5-6)
    const moreArticlesContainer = document.getElementById("more-articles");
    if (moreArticlesContainer && moreArticles.length > 0) {
      const moreArticlesHTML = moreArticles.map(article => {
        return `
          <article class="article-card horizontal">
            <div class="article-content">
              <h3 class="article-title">
                <a href="#" onclick="navigateToArticle('${article.slug?.current || ''}'); return false;">${article.title}</a>
              </h3>
              ${article.excerpt ? `<p class="article-excerpt">${article.excerpt}</p>` : ''}
              <div class="article-date">${formatDate(article.publishedAt)} • ${article.author?.name || 'HardYards Team'}</div>
            </div>
            <div class="article-image">
              <img src="${article.mainImage?.asset?.url || ''}" alt="${article.title}">
            </div>
          </article>
        `;
      }).join('');

      moreArticlesContainer.innerHTML = `
        <div class="secondary-articles-grid">
          ${moreArticlesHTML}
        </div>
      `;
    }
     
           // Populate news feed with latest 6 articles
      const newsFeedContainer = document.getElementById("news-feed-items");
      if (newsFeedContainer) {
        const newsFeedHTML = articles.slice(0, 6).map(article => {
          const date = new Date(article.publishedAt);
          const dateString = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
          
          return `
            <div class="news-feed-item">
              <div class="news-feed-date">${dateString}</div>
              <div class="news-feed-title">
                <a href="#" onclick="navigateToArticle('${article.slug?.current || ''}'); return false;">${article.title}</a>
              </div>
            </div>
          `;
        }).join('');
        
        newsFeedContainer.innerHTML = newsFeedHTML;
      }
  } catch (error) {
    console.error("Error loading articles:", error);
    document.getElementById("featured-article").innerHTML = `
      <div class="error-message">
        <p>Error loading articles. Please try again later.</p>
      </div>
    `;
    document.getElementById("secondary-articles").innerHTML = `
      <div class="error-message">
        <p>Error loading articles. Please try again later.</p>
      </div>
    `;
  }
});

// Helper function to format dates
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Helper function to format categories
function formatCategories(categories) {
  if (!categories || categories.length === 0) return 'Uncategorized';
  return categories.map(cat => cat.title).join(', ');
}

// Function to navigate to article
function navigateToArticle(slug) {
  console.log('Navigating to article with slug:', slug);
  if (slug) {
    // Use clean URL format
    const targetUrl = `${window.location.origin}/post/${slug}`;
    console.log('Attempting navigation to:', targetUrl);
    window.location.href = targetUrl;
  } else {
    console.error('No slug provided for navigation');
  }
}

