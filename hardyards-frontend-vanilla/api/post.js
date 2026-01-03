module.exports = async (req, res) => {
  const { slug } = req.query;

  // If no slug, serve the static HTML (let it fall through)
  // But we can't actually serve static files from a serverless function
  // So we'll redirect to the article handler if slug exists
  if (slug) {
    // Redirect to clean URL which uses article.js serverless function
    return res.redirect(301, `/post/${encodeURIComponent(slug)}`);
  }

  // No slug provided - this shouldn't happen in normal flow
  // But if it does, redirect to homepage
  return res.redirect(301, '/');
};


