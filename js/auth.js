// Authentication related functionality
const AUTH_CONFIG = {
  CLIENT_ID: 'your_discord_client_id',
  REDIRECT_URI: `${window.location.origin}/auth/callback`,
  SCOPES: 'identify guilds'
};

// Discord OAuth2 login
function redirectToDiscordAuth() {
  const redirectUri = encodeURIComponent(AUTH_CONFIG.REDIRECT_URI);
  const scopes = encodeURIComponent(AUTH_CONFIG.SCOPES);
  
  window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${AUTH_CONFIG.CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}`;
}

// Check URL for auth callback
function checkAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const authCode = urlParams.get('code');

  if (authCode) {
    // Exchange code for token
    exchangeCodeForToken(authCode);
    return true;
  }
  return false;
}

async function exchangeCodeForToken(code) {
  try {
    const response = await fetch('/auth/discord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    
    const data = await response.json();
    
    if (data.userId) {
      localStorage.setItem('discordUserId', data.userId);
      window.location.href = '/'; // Redirect to home page
    }
  } catch (error) {
    console.error('Auth error:', error);
  }
}

// Check if user is logged in
function isUserLoggedIn() {
  return !!localStorage.getItem('discordUserId');
}

// Get current user ID
function getCurrentUserId() {
  return localStorage.getItem('discordUserId');
}

// Logout function
function logout() {
  localStorage.removeItem('discordUserId');
  window.location.reload();
}