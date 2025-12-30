document.addEventListener("DOMContentLoaded", function() {
  // Get slug from query parameter (clean URLs use ?slug=)
  const urlParams = new URLSearchParams(window.location.search);
  let slug = urlParams.get('slug');
  
  // Fallback to hash for backward compatibility with old links
  if (!slug) {
    slug = window.location.hash.substring(1);
  }
  
  console.log('Post.js - Current URL:', window.location.href);
  console.log('Post.js - Slug:', slug);
  
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
  
  // Listen for hash changes to reload article when navigation buttons are clicked (backward compatibility)
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
      photoCredit,
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
        photoCredit,
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

    // Update Open Graph and Twitter meta tags for social sharing
    updateMetaTags(article, decodedSlug);

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
            ${article.photoCredit ? `<div class="photo-credit">Photo: ${article.photoCredit}</div>` : ''}
            <time datetime="${article.publishedAt}">
              ${new Date(article.publishedAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </time>
            <span class="article-author">• ${article.author?.name || 'HardYards Team'}</span>
          </div>
          ${article.mainImage ? `
            <div class="share-image-button-container">
              <button onclick="shareArticleImage('${article.mainImage.asset.url}', '${article.title.replace(/'/g, "\\'")}')" class="share-image-button">
                Share Article
              </button>
            </div>
          ` : ''}
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

// Function to update meta tags for social sharing
function updateMetaTags(article, slug) {
  const baseUrl = window.location.origin;
  const currentUrl = `${baseUrl}/post/${slug}`;
  const articleTitle = article.title || 'HardYards - Article';
  const articleDescription = article.excerpt || 'Read the latest articles and stories from HardYards.';
  const articleImage = article.mainImage?.asset?.url || `${baseUrl}/default-og-image.jpg`;
  
  // Update or create meta tags
  const metaTags = {
    'title': articleTitle,
    'description': articleDescription,
    'og:title': articleTitle,
    'og:description': articleDescription,
    'og:type': 'article',
    'og:url': currentUrl,
    'og:image': articleImage,
    'twitter:card': 'summary_large_image',
    'twitter:title': articleTitle,
    'twitter:description': articleDescription,
    'twitter:image': articleImage
  };
  
  // Update title
  document.title = articleTitle;
  
  // Update or create meta tags
  Object.keys(metaTags).forEach(key => {
    let meta = document.querySelector(`meta[property="${key}"], meta[name="${key}"]`);
    
    if (!meta) {
      // Create new meta tag
      meta = document.createElement('meta');
      if (key.startsWith('og:') || key.startsWith('twitter:')) {
        meta.setAttribute('property', key);
      } else {
        meta.setAttribute('name', key);
      }
      document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', metaTags[key]);
  });
  
  // Note: URL updating happens via Vercel rewrite, so we don't need to pushState here
}

function createNavigationHTML(previousArticle, nextArticle) {
  let navigationHTML = '<div class="article-navigation">';
  let hasPrev = false;
  let hasNext = false;
  
  if (previousArticle && previousArticle.slug?.current) {
    const prevSlug = encodeURIComponent(previousArticle.slug.current);
      navigationHTML += `
      <a href="/post/${prevSlug}" class="nav-button prev-button">
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
      <a href="/post/${nextSlug}" class="nav-button next-button">
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

// Function to share article image
function shareArticleImage(imageUrl, articleTitle) {
  // Try Web Share API first (mobile devices)
  if (navigator.share) {
    navigator.share({
      title: articleTitle,
      text: `Check out this article: ${articleTitle}`,
      url: window.location.href,
    }).catch(err => {
      console.log('Error sharing:', err);
      // Fallback to opening image in new tab
      window.open(imageUrl, '_blank');
    });
  } else {
    // Fallback: Copy image URL to clipboard or open in new tab
    if (navigator.clipboard) {
      navigator.clipboard.writeText(imageUrl).then(() => {
        alert('Image URL copied to clipboard! You can now paste it to share.');
      }).catch(() => {
        // If clipboard fails, open image in new tab
        window.open(imageUrl, '_blank');
      });
    } else {
      // Final fallback: open image in new tab
      window.open(imageUrl, '_blank');
    }
  }
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