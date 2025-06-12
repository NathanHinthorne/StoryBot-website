// Premium page specific functionality
const STRIPE_CONFIG = {
  publishableKey: 'your_stripe_publishable_key'
};

// Setup UI based on user status
async function setupPremiumUI() {
  const userId = getCurrentUserId();
  
  if (userId) {
    document.getElementById('not-logged-container').style.display = 'none';
    document.getElementById('purchase-container').style.display = 'block';
    
    // Check if user is already premium
    const isPremium = await isUserPremium(userId);
    if (isPremium) {
      // User is already premium, show different UI
      document.getElementById('purchase-btn').textContent = 'Premium Active';
      document.getElementById('purchase-btn').classList.add('btn-secondary');
      document.getElementById('purchase-btn').disabled = true;
    } else {
      // Setup Stripe purchase button
      setupPurchaseButton(userId);
    }
  }
}

// Setup Stripe purchase button
function setupPurchaseButton(userId) {
  document.getElementById('purchase-btn').addEventListener('click', async () => {
    try {
      const response = await fetch('/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discordUserId: userId
        }),
      });
      
      const session = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = Stripe(STRIPE_CONFIG.publishableKey);
      stripe.redirectToCheckout({ sessionId: session.id });
    } catch (error) {
      console.error('Error:', error);
    }
  });
}