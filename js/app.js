// Main application entry point
document.addEventListener('DOMContentLoaded', function() {
  // Check for auth callback first
  if (checkAuthCallback()) {
    return; // Auth callback is being handled, stop further execution
  }
  
  // Initialize UI based on current page
  const currentPage = getCurrentPage();
  
  // Common UI setup for all pages
  setupNavbar();
  
  // Page-specific initialization
  switch (currentPage) {
    case 'index':
      setupHomePage();
      break;
    case 'premium':
      setupPremiumPage();
      break;
    case 'about':
      setupAboutPage();
      break;
  }
});

// Determine current page
function getCurrentPage() {
  const path = window.location.pathname;
  if (path.includes('premium.html')) return 'premium';
  if (path.includes('about.html')) return 'about';
  return 'index'; // Default to home page
}

// Setup navbar based on login status
function setupNavbar() {
  const userLoggedIn = isUserLoggedIn();
  
  // Show/hide login button in navbar
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.style.display = userLoggedIn ? 'none' : 'block';
  }
  
  // Add logout button if user is logged in
  if (userLoggedIn && !document.getElementById('logout-btn')) {
    const navbarNav = document.getElementById('navbarNav');
    if (navbarNav) {
      const navList = navbarNav.querySelector('ul');
      const logoutItem = document.createElement('li');
      logoutItem.className = 'nav-item';
      logoutItem.innerHTML = `
        <button id="logout-btn" class="btn btn-outline-light" onclick="logout()">
          <i class="fas fa-sign-out-alt me-2"></i>Logout
        </button>
      `;
      navList.appendChild(logoutItem);
    }
  }
}

// Home page setup
function setupHomePage() {
  const userLoggedIn = isUserLoggedIn();
  
  // Show purchase container if logged in
  const purchaseContainer = document.getElementById('purchase-container');
  const notLoggedContainer = document.getElementById('not-logged-container');
  
  if (purchaseContainer && notLoggedContainer) {
    purchaseContainer.style.display = userLoggedIn ? 'block' : 'none';
    notLoggedContainer.style.display = userLoggedIn ? 'none' : 'block';
  }
}

// Premium page setup
function setupPremiumPage() {
  setupPremiumUI();
}

// About page setup
function setupAboutPage() {
  // Any about page specific initialization
}