// Category page functionality - Sanity CMS Integration
document.addEventListener("DOMContentLoaded", async () => {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const subcategory = urlParams.get('sub');
  
  console.log('Current subcategory:', subcategory);
  console.log('Current URL:', window.location.href);
  
     // Add click event listeners to subnav links for programmatic navigation
   const subnavLinks = document.querySelectorAll('.sports-subnav a');
   subnavLinks.forEach(link => {
     link.addEventListener('click', async (e) => {
       e.preventDefault(); // Prevent default navigation
       
       const href = link.getAttribute('href');
       console.log('Subnav link clicked:', href);
       console.log('Link text:', link.textContent);
       
       await handleSubcategoryNavigation(href);
     });
   });
   
   // Add click event listeners to mobile menu sports links for programmatic navigation
   const mobileSportsLinks = document.querySelectorAll('.sports-dropdown-content a');
   mobileSportsLinks.forEach(link => {
     link.addEventListener('click', async (e) => {
       e.preventDefault(); // Prevent default navigation
       
       const href = link.getAttribute('href');
       console.log('Mobile sports link clicked:', href);
       console.log('Link text:', link.textContent);
       
       await handleSubcategoryNavigation(href);
       
       // Close mobile menu after navigation
       const mobileMenu = document.getElementById('mobileMenu');
       if (mobileMenu) {
         mobileMenu.classList.remove('active');
       }
     });
   });
   
   // Function to handle subcategory navigation
   async function handleSubcategoryNavigation(href) {
     // Update URL without page reload
     let currentSub = null;
     if (href === '/sports' || href === 'sports.html') {
       window.history.pushState({}, '', '/sports');
       await loadCategoryArticles(null);
     } else {
       const urlParams = new URLSearchParams(href.split('?')[1]);
       currentSub = urlParams.get('sub');
       const cleanHref = href.replace('.html', '');
       window.history.pushState({}, '', cleanHref);
       await loadCategoryArticles(currentSub);
     }
     
     // Update active state
     updateActiveState(currentSub);
   }
  
  // Function to update active state
  function updateActiveState(currentSubcategory) {
    // Clear all active states first
    const allSubnavLinks = document.querySelectorAll('.sports-subnav a');
    allSubnavLinks.forEach(link => link.classList.remove('active'));
    
    // Set active state for subcategory navigation
    if (currentSubcategory) {
      const activeLink = document.querySelector(`.sports-subnav a[href="/sports?sub=${currentSubcategory}"], .sports-subnav a[href="sports.html?sub=${currentSubcategory}"]`);
      if (activeLink) {
        activeLink.classList.add('active');
        console.log('Set active link for:', currentSubcategory);
      }
    } else {
      // Set "All" as active if no subcategory
      const allLink = document.querySelector('.sports-subnav a[href="/sports"], .sports-subnav a[href="sports.html"]');
      if (allLink) {
        allLink.classList.add('active');
        console.log('Set active link for: All');
      }
    }
  }
  
  // Initial active state setup
  updateActiveState(subcategory);

  // Load articles based on category and subcategory
  await loadCategoryArticles(subcategory);
});

async function loadCategoryArticles(subcategory = null) {
  const container = document.getElementById("category-articles");
  if (!container) return;

  // Show loading placeholders immediately (3-2-4 pattern)
  container.innerHTML = `
    <div class="category-row category-row-3">
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
    <div class="category-row category-row-2">
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

  try {
    // Determine current page category
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    console.log('Current page:', currentPage);
    console.log('Subcategory filter:', subcategory);
    
         // Build Sanity query based on category and subcategory
     let categoryFilter = '';
     if (currentPage === 'sports') {
       categoryFilter = '"Sports" in categories[]->title';
       if (subcategory) {
         // Fix the subcategory filter - check if any subcategory title matches
         categoryFilter += ` && "${subcategory}" in subcategories[]->title`;
       }
     } else if (currentPage === 'urban') {
       categoryFilter = '"Urban" in categories[]->title';
     } else if (currentPage === 'rural') {
       categoryFilter = '"Rural" in categories[]->title';
     } else if (currentPage === 'life') {
       categoryFilter = '"Life" in categories[]->title';
     }

    const query = `*[_type == "post" && ${categoryFilter}] | order(publishedAt desc) {
      _id,
      title,
      slug,
      publishedAt,
      mainImage { asset->{url}, alt },
      categories[]-> { title },
      subcategories[]-> { title },
      excerpt,
      author->{name}
    }`;
    
    console.log('Sanity query:', query);
    
    const url = `https://cfblwn37.api.sanity.io/v2023-07-14/data/query/production?query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const articles = data.result || [];
    
         console.log('Articles found:', articles.length);
     console.log('Articles:', articles);
     
     // Debug: Log subcategories for each article
     articles.forEach((article, index) => {
       console.log(`Article ${index + 1} (${article.title}) subcategories:`, article.subcategories);
       console.log(`Article ${index + 1} (${article.title}) slug:`, article.slug);
     });

    if (articles.length === 0) {
      container.innerHTML = `
        <div class="error-message">
          <p>No articles found for this ${subcategory ? `subcategory: ${subcategory}` : 'category'}.</p>
          <a href="/">Return to homepage</a>
        </div>
      `;
      return;
    }

    // Group articles into rows: 3, 2 pattern (repeating)
    const rowPattern = [3, 2];
    let articleIndex = 0;
    let rowsHTML = '';
    
    while (articleIndex < articles.length) {
      for (let patternIndex = 0; patternIndex < rowPattern.length && articleIndex < articles.length; patternIndex++) {
        const articlesInRow = rowPattern[patternIndex];
        const rowArticles = articles.slice(articleIndex, articleIndex + articlesInRow);
        
        if (rowArticles.length > 0) {
          const articlesHTML = rowArticles.map(article => {
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
          
          rowsHTML += `
            <div class="category-row category-row-${articlesInRow}">
              ${articlesHTML}
            </div>
          `;
        }
        
        articleIndex += articlesInRow;
      }
    }

    container.innerHTML = rowsHTML;
  } catch (error) {
    console.error("Error loading articles:", error);
    container.innerHTML = `
      <div class="error-message">
        <p>Error loading articles. Please try again later.</p>
        <a href="index.html">Return to homepage</a>
        </div>
    `;
  }
}

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

// Helper function to format subcategories
function formatSubcategories(subcategories) {
  if (!subcategories || subcategories.length === 0) return '';
  return subcategories.map(subcat => subcat.title).join(', ');
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

