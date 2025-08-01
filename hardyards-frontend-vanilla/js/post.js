document.addEventListener("DOMContentLoaded", function() {
  // Get slug from hash instead of query parameters
  const slug = window.location.hash.substring(1); // Remove the # symbol
  
  console.log('Post.js - Current URL:', window.location.href);
  console.log('Post.js - Slug from hash:', slug);
  
  if (slug) {
    loadArticle(slug);
  } else {
    console.log('Post.js - No slug found, showing error');
    document.getElementById("article-container").innerHTML = `
      <div class="error-message">
        <p>Article not found</p>
        <a href="index.html" class="back-button">Return to Homepage</a>
      </div>
    `;
  }
  
  // Listen for hash changes to reload article when navigation buttons are clicked
  window.addEventListener('hashchange', function() {
    const newSlug = window.location.hash.substring(1);
    console.log('Hash changed to:', newSlug);
    if (newSlug) {
      loadArticle(newSlug);
    }
  });
});

async function loadArticle(slug) {
  console.log('loadArticle called with slug:', slug);
  console.log('loadArticle slug type:', typeof slug);
  console.log('loadArticle slug length:', slug ? slug.length : 0);
  
  // Decode the slug in case it's URL encoded
  const decodedSlug = decodeURIComponent(slug);
  console.log('Decoded slug:', decodedSlug);
  
  const container = document.getElementById("article-container");
  container.innerHTML = `
    <div class="article-loading">
      <div class="spinner"></div>
      <p>Loading article...</p>
    </div>
  `;

  try {
    // First, fetch all articles ordered by publishedAt desc to get navigation data
    const allArticlesQuery = `*[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      publishedAt
    }`;
    
    const allArticlesUrl = `https://cfblwn37.api.sanity.io/v2023-07-14/data/query/production?query=${encodeURIComponent(allArticlesQuery)}`;
    const allArticlesResponse = await fetch(allArticlesUrl);
    
    if (!allArticlesResponse.ok) {
      throw new Error(`HTTP error! status: ${allArticlesResponse.status}`);
    }
    
    const allArticlesData = await allArticlesResponse.json();
    const allArticles = allArticlesData.result || [];
    
    // Find current article position
    let currentArticleIndex = -1;
    let currentArticle = null;
    
    for (let i = 0; i < allArticles.length; i++) {
      if (allArticles[i].slug?.current === decodedSlug) {
        currentArticleIndex = i;
        currentArticle = allArticles[i];
        break;
      }
    }
    
    // If not found by slug, try by title
    if (currentArticleIndex === -1) {
      for (let i = 0; i < allArticles.length; i++) {
        if (allArticles[i].title === decodedSlug) {
          currentArticleIndex = i;
          currentArticle = allArticles[i];
          break;
        }
      }
    }
    
    if (currentArticleIndex === -1) {
      throw new Error("Article not found");
    }
    
    // Get previous and next articles
    const previousArticle = currentArticleIndex < allArticles.length - 1 ? allArticles[currentArticleIndex + 1] : null;
    const nextArticle = currentArticleIndex > 0 ? allArticles[currentArticleIndex - 1] : null;
    
    // Now fetch the full article data for the current article
    let query = `*[_type == "post" && slug.current == "${decodedSlug}"][0]{
      title,
      slug,
      mainImage{asset->{url, altText}},
      publishedAt,
      categories[]->{title},
      excerpt,
      body,
      author->{name}
    }`;
    
    console.log('Post.js - First attempt query:', query);
    
    const url = `https://cfblwn37.api.sanity.io/v2023-07-14/data/query/production?query=${encodeURIComponent(query)}`;
    console.log('Post.js - Fetching from URL:', url);
    
    let response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let { result: article } = await response.json();
    
    // If not found by slug, try to find by title (fallback)
    if (!article) {
      console.log('Article not found by slug, trying to find by title...');
      query = `*[_type == "post" && title == "${decodedSlug}"][0]{
        title,
        slug,
        mainImage{asset->{url, altText}},
        publishedAt,
        categories[]->{title},
        excerpt,
        body,
        author->{name}
      }`;
      
      console.log('Post.js - Fallback query by title:', query);
      
      const fallbackUrl = `https://cfblwn37.api.sanity.io/v2023-07-14/data/query/production?query=${encodeURIComponent(query)}`;
      response = await fetch(fallbackUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const fallbackResult = await response.json();
      article = fallbackResult.result;
    }

    if (!article) {
      throw new Error("Article not found");
    }

    // Create navigation HTML
    const navigationHTML = createNavigationHTML(previousArticle, nextArticle);

    container.innerHTML = `
      <article class="article-detail">
        <div class="article-header">
          <div class="back-navigation">
            <a href="javascript:history.back()" class="back-button">
              ← Back to Previous Page
            </a>
          </div>
          <h1>${article.title}</h1>
          ${article.mainImage ? `
            <img src="${article.mainImage.asset.url}" 
                 alt="${article.mainImage.asset.altText || article.title}" 
                 class="article-image">
          ` : ''}
          <div class="article-meta">
            <time datetime="${article.publishedAt}">
              ${new Date(article.publishedAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </time>
            <span class="article-author">• ${article.author?.name || 'HardYards Team'}</span>
          </div>
        </div>
        <div class="article-content">
          ${article.excerpt ? `<p class="article-excerpt">${article.excerpt}</p>` : ''}
          ${renderArticleContent(article.body)}
        </div>
        ${navigationHTML}
      </article>
    `;
  } catch (error) {
    console.error("Error loading article:", error);
    container.innerHTML = `
      <div class="error-message">
        <p>Error loading article: ${error.message}</p>
        <a href="index.html" class="back-button">Return to Homepage</a>
      </div>
    `;
  }
}

function createNavigationHTML(previousArticle, nextArticle) {
  let navigationHTML = '<div class="article-navigation">';
  let hasPrev = false;
  let hasNext = false;
  
  if (previousArticle && previousArticle.slug?.current) {
    const prevSlug = encodeURIComponent(previousArticle.slug.current);
    navigationHTML += `
      <a href="post.html#${prevSlug}" class="nav-button prev-button">
        <span class="nav-arrow">←</span>
        <div class="nav-content">
          <span class="nav-label">Previous Article</span>
          <span class="nav-title">${previousArticle.title}</span>
        </div>
      </a>
    `;
    hasPrev = true;
  }
  
  if (nextArticle && nextArticle.slug?.current) {
    const nextSlug = encodeURIComponent(nextArticle.slug.current);
    navigationHTML += `
      <a href="post.html#${nextSlug}" class="nav-button next-button">
        <div class="nav-content">
          <span class="nav-label">Next Article</span>
          <span class="nav-title">${nextArticle.title}</span>
        </div>
        <span class="nav-arrow">→</span>
      </a>
    `;
    hasNext = true;
  }
  
  // Only add the navigation container if there are actual buttons
  if (!hasPrev && !hasNext) {
    return ''; // Return empty string if no navigation buttons
  }
  
  // Add positioning classes
  if (hasPrev && !hasNext) {
    navigationHTML = navigationHTML.replace('class="article-navigation"', 'class="article-navigation only-prev"');
  } else if (!hasPrev && hasNext) {
    navigationHTML = navigationHTML.replace('class="article-navigation"', 'class="article-navigation only-next"');
  }
  
  navigationHTML += '</div>';
  return navigationHTML;
}

function renderArticleContent(body) {
  if (!body || !Array.isArray(body)) return '';
  
  return body.map(block => {
    if (block._type !== 'block') return '';
    
    // Handle different text styles within the block
    const text = block.children.map(child => {
      let textContent = child.text || '';
      
      // Apply marks (bold, italic, etc.)
      if (child.marks && child.marks.length > 0) {
        child.marks.forEach(mark => {
          switch (mark) {
            case 'strong':
            case 'bold':
              textContent = `<strong>${textContent}</strong>`;
              break;
            case 'em':
            case 'italic':
              textContent = `<em>${textContent}</em>`;
              break;
            case 'underline':
              textContent = `<u>${textContent}</u>`;
              break;
            case 'code':
              textContent = `<code>${textContent}</code>`;
              break;
          }
        });
      }
      
      return textContent;
    }).join('');
    
    // Handle different block styles
    switch (block.style) {
      case 'h1':
        return `<h1>${text}</h1>`;
      case 'h2':
        return `<h2>${text}</h2>`;
      case 'h3':
        return `<h3>${text}</h3>`;
      case 'h4':
        return `<h4>${text}</h4>`;
      case 'blockquote':
        return `<blockquote>${text}</blockquote>`;
      case 'normal':
      default:
        // Only create paragraph if there's actual text content
        return text.trim() ? `<p>${text}</p>` : '';
    }
  }).join('');
}