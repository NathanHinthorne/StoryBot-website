// Initialize Firebase on the client side
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Check if user is logged in
const discordUserId = localStorage.getItem('discordUserId');
const userLoggedIn = !!discordUserId;

// Show purchase button only if logged in
if (userLoggedIn) {
  document.getElementById('login-btn').style.display = 'none';
  document.getElementById('purchase-container').style.display = 'block';
  
  // Check if user is already premium
  firebase.firestore().collection('users').doc(discordUserId).get()
    .then(doc => {
      if (doc.exists && doc.data().isPremium) {
        // User is already premium, show different UI
        document.getElementById('purchase-btn').textContent = 'Premium Active';
        document.getElementById('purchase-btn').classList.add('btn-secondary');
        document.getElementById('purchase-btn').disabled = true;
      }
    })
    .catch(error => {
      console.error("Error checking premium status:", error);
    });
  
  // Setup Stripe purchase button
  document.getElementById('purchase-btn').addEventListener('click', async () => {
    try {
      const response = await fetch('/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discordUserId: discordUserId
        }),
      });
      
      const session = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = Stripe('your_stripe_publishable_key');
      stripe.redirectToCheckout({ sessionId: session.id });
    } catch (error) {
      console.error('Error:', error);
    }
  });
}

// Discord OAuth2 login
function redirectToDiscordAuth() {
  const CLIENT_ID = 'your_discord_client_id';
  const REDIRECT_URI = encodeURIComponent(`${window.location.origin}/auth/callback`);
  const SCOPES = encodeURIComponent('identify guilds');
  
  window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPES}`;
}

// Check URL for auth callback
const urlParams = new URLSearchParams(window.location.search);
const authCode = urlParams.get('code');

if (authCode) {
  // Exchange code for token
  exchangeCodeForToken(authCode);
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
