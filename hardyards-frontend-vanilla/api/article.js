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
    // Ensure image URL is absolute and properly formatted
    let articleImage = article.mainImage?.asset?.url || `${baseUrl}/default-og-image.jpg`;
    if (articleImage && !articleImage.startsWith('http')) {
      articleImage = `${baseUrl}${articleImage}`;
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
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${articleTitle}"/>
  <meta name="twitter:description" content="${articleDescription}"/>
  <meta name="twitter:image" content="${articleImage}"/>
  <link rel="stylesheet" href="/css/style.css"/>
  <script>
    // Redirect to query parameter URL for client-side routing (backward compatibility)
    // But we prefer clean URLs, so try clean URL first, fallback to query param
    if (window.location.pathname !== '/post.html') {
      window.location.href = '/post.html?slug=${encodeURIComponent(slug)}';
    }
  </script>
</head>
<body>
  <nav class="navbar">
    <a href="/index.html" class="logo"><span class="hard">Hard</span><span class="yards">Yards</span></a>
    <div class="nav-links">
      <a href="/sports.html">SPORTS</a>
      <a href="/urban.html">URBAN</a>
      <a href="/rural.html">RURAL</a>
      <a href="/life.html">LIFE</a>
    </div>
  </nav>
  <main class="container">
    <div id="article-container">Loading article...</div>
  </main>
  <footer>
    <div class="footer-links">
      <a href="/index.html">Home</a>
      <a href="/sports.html">Sports</a>
      <a href="/urban.html">Urban</a>
      <a href="/rural.html">Rural</a>
      <a href="/life.html">Life</a>
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

