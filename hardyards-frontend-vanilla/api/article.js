module.exports = async (req, res) => {
  // Handle both /post/:slug (via rewrite) and /post?slug=xxx formats
  let slug = req.query.slug;
  
  // If slug is not in query params, try to get it from URL path
  if (!slug && req.url) {
    const urlMatch = req.url.match(/\/post\/([^?]+)/);
    if (urlMatch) {
      slug = urlMatch[1];
    }
  }

  if (!slug) {
    return res.status(400).send('Slug is required');
  }
  
  // Decode slug if it's URL encoded
  slug = decodeURIComponent(slug);

  try {
    // Fetch article from Sanity - escape slug to prevent injection
    const escapedSlug = slug.replace(/"/g, '\\"');
    const query = `*[_type == "post" && slug.current == "${escapedSlug}"][0]{
      title,
      slug,
      mainImage{asset->{url, altText}},
      excerpt,
      publishedAt,
      author->{name}
    }`;
    
    const url = `https://cfblwn37.api.sanity.io/v2023-07-14/data/query/production?query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Sanity API error: ${response.status}`);
    }
    
    const data = await response.json();
    const article = data.result;
    
    if (!article) {
      return res.status(404).send('Article not found');
    }

    const baseUrl = req.headers.host ? `https://${req.headers.host}` : 'https://hardyards.org';
    const articleUrl = `${baseUrl}/post/${encodeURIComponent(slug)}`;
    const articleTitle = escapeHtml(article.title || 'HardYards - Article');
    const articleDescription = escapeHtml(article.excerpt || article.title || 'Read the latest articles and stories from HardYards.');
    
    // Ensure image URL is absolute and optimized for social sharing (1200x630 minimum recommended)
    let articleImage = article.mainImage?.asset?.url || `${baseUrl}/default-og-image.jpg`;
    if (articleImage && !articleImage.startsWith('http')) {
      articleImage = `${baseUrl}${articleImage}`;
    }
    
    // For Sanity CDN images, ensure optimal size for social sharing
    if (articleImage && articleImage.includes('cdn.sanity.io')) {
      // Sanity CDN URLs format: https://cdn.sanity.io/images/{projectId}/{dataset}/{imageId}-{width}x{height}.{format}?...
      // Add transformation parameters if not already present
      const url = new URL(articleImage);
      if (!url.searchParams.has('w') || !url.searchParams.has('h')) {
        url.searchParams.set('w', '1200');
        url.searchParams.set('h', '630');
        url.searchParams.set('fit', 'crop');
        url.searchParams.set('auto', 'format');
      }
      articleImage = url.toString();
    }
    
    // Generate HTML with proper meta tags for social sharing
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${articleTitle}</title>
  <meta name="description" content="${articleDescription}"/>
  <meta name="keywords" content="HardYards articles, news stories, sports coverage, urban stories, rural news, lifestyle articles"/>
  <meta name="author" content="HardYards"/>
  <meta property="og:title" content="${articleTitle}"/>
  <meta property="og:description" content="${articleDescription}"/>
  <meta property="og:type" content="article"/>
  <meta property="og:url" content="${articleUrl}"/>
  <meta property="og:image" content="${articleImage}"/>
  <meta property="og:image:secure_url" content="${articleImage}"/>
  <meta property="og:image:type" content="image/jpeg"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:site_name" content="HardYards"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${articleTitle}"/>
  <meta name="twitter:description" content="${articleDescription}"/>
  <meta name="twitter:image" content="${articleImage}"/>
  <meta name="twitter:image:alt" content="${articleTitle}"/>
  <link rel="stylesheet" href="/css/style.css"/>
</head>
<body>
  <nav class="navbar1">
    <a href="/" class="logo-centered"><span class="hard">Hard</span><span class="yards">Yards</span></a>
  </nav>
  <nav class="navbar navbar2">
    <div class="nav-links">
      <a href="/sports">SPORTS</a>
      <a href="/urban">URBAN</a>
      <a href="/rural">RURAL</a>
      <a href="/life">LIFE</a>
    </div>
  </nav>
  <main class="container">
    <div id="article-container">Loading article...</div>
  </main>
  <footer>
    <div class="footer-links">
      <a href="/">Home</a>
      <a href="/sports">Sports</a>
      <a href="/urban">Urban</a>
      <a href="/rural">Rural</a>
      <a href="/life">Life</a>
    </div>
    <p>&copy; 2025 HardYards. All rights reserved.</p>
  </footer>
  <script src="/js/main.js"></script>
  <script src="/js/post.js"></script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).send('Error loading article');
  }
};

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

