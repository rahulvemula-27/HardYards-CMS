document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const sportsToggle = document.querySelector('.mobile-menu .sports-toggle');
  const sportsDropdown = document.querySelector('.mobile-menu .sports-dropdown-content');
  
  // Always show menu toggle button on all devices
  menuToggle.style.display = "flex";
  
  // Ensure mobile menu is hidden by default
  if (mobileMenu) {
    mobileMenu.classList.remove("active");
  }

  // Toggle mobile menu
  const toggleMenu = (e) => {
    if (e) e.stopPropagation();
    mobileMenu.classList.toggle("active");
    
    // Close sports dropdown when closing menu
    if (!mobileMenu.classList.contains("active") && sportsDropdown) {
      sportsDropdown.classList.remove("active");
      if (sportsToggle) {
        sportsToggle.querySelector('.dropdown-arrow').textContent = '▼';
      }
    }
  };

  // Toggle sports dropdown (mobile only)
  const toggleSportsDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    sportsDropdown.classList.toggle("active");
    if (sportsToggle) {
      sportsToggle.querySelector('.dropdown-arrow').textContent = 
        sportsDropdown.classList.contains("active") ? '▲' : '▼';
    }
  };

  // Close all menus when clicking outside
  const closeAllMenus = (e) => {
    if (!mobileMenu.contains(e.target) && e.target !== menuToggle) {
      mobileMenu.classList.remove("active");
      if (sportsDropdown) {
        sportsDropdown.classList.remove("active");
        if (sportsToggle) {
          sportsToggle.querySelector('.dropdown-arrow').textContent = '▼';
        }
      }
    }
  };

  // Event listeners
  menuToggle.addEventListener("click", (e) => {
    toggleMenu(e);
  });
  
  // Sports dropdown toggle
  if (sportsToggle) {
    sportsToggle.addEventListener("click", toggleSportsDropdown);
  }

  // Close menus when clicking outside
  document.addEventListener("click", closeAllMenus);

  // Close menu when mouse leaves (for larger touch devices)
  mobileMenu.addEventListener("mouseleave", () => {
    mobileMenu.classList.remove("active");
    if (sportsDropdown) {
      sportsDropdown.classList.remove("active");
      if (sportsToggle) {
        sportsToggle.querySelector('.dropdown-arrow').textContent = '▼';
      }
    }
  });

  // Responsive cleanup
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      mobileMenu.classList.remove("active");
      if (sportsDropdown) {
        sportsDropdown.classList.remove("active");
        if (sportsToggle) {
          sportsToggle.querySelector('.dropdown-arrow').textContent = '▼';
        }
      }
    }
  });

  // Close menu when navigating (except sports dropdown toggle)
  mobileMenu.querySelectorAll('a:not(.sports-toggle)').forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
    });
  });

  // Hide navbar1 when scrolling down, show when at top
  const navbar1 = document.querySelector('.navbar1');
  if (navbar1) {
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop === 0) {
        // At the top - show navbar1
        navbar1.classList.remove('hidden');
      } else if (scrollTop > lastScrollTop && scrollTop > 50) {
        // Scrolling down - hide navbar1
        navbar1.classList.add('hidden');
      } else if (scrollTop < lastScrollTop) {
        // Scrolling up - show navbar1
        navbar1.classList.remove('hidden');
      }
      
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });
  }
});