const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const stripe = require('stripe')('your_stripe_secret_key');
const { Client, GatewayIntentBits } = require('discord.js');
const admin = require('firebase-admin');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  // Or use a service account:
  // credential: admin.credential.cert(require('./path/to/serviceAccountKey.json')),
  databaseURL: 'https://your-project-id.firebaseio.com'
});

const db = admin.firestore();
const premiumGuildsRef = db.collection('premium_guilds');

// Discord bot setup
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ] 
});

client.once('ready', () => {
  console.log('Discord bot is ready!');
});

// Handle guild join events
client.on('guildCreate', async (guild) => {
  try {
    // Get all premium users from a separate users collection
    const usersSnapshot = await db.collection('users').where('isPremium', '==', true).get();
    
    for (const userDoc of usersSnapshot.docs) {
      const user = userDoc.data();
      
      // Get user's guilds from Discord API
      const userGuilds = await getUserGuilds(user.discordUserId);
      
      // Check if user is in this guild and has manage permissions
      const userGuild = userGuilds.find(g => 
        g.id === guild.id && 
        (g.owner || (parseInt(g.permissions) & 0x20) === 0x20)
      );
      
      if (userGuild) {
        // Add guild to premium_guilds collection
        await premiumGuildsRef.doc(guild.id).set({
          granted_at: admin.firestore.FieldValue.serverTimestamp(),
          method: "stripe",
          premium: true,
          supporter: user.username || user.discordUserId
        });
        
        console.log(`Associated guild ${guild.id} with premium user ${user.discordUserId}`);
        break; // Found the owner/manager
      }
    }
  } catch (error) {
    console.error('Error handling guild join:', error);
  }
});

client.login('your_discord_bot_token');

// Express app setup
const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());

// Discord OAuth2 callback
app.post('/auth/discord', async (req, res) => {
  try {
    const { code } = req.body;
    
    // Exchange code for token
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: 'your_discord_client_id',
        client_secret: 'your_discord_client_secret',
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${req.protocol}://${req.get('host')}/auth/callback`,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    const { access_token } = tokenResponse.data;
    
    // Get user info
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    
    const userId = userResponse.data.id;
    const username = userResponse.data.username;
    
    // Check if user exists in database
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // Create new user
      await userRef.set({
        discordUserId: userId,
        username: username,
        isPremium: false,
        accessToken: access_token // Store for guild access
      });
    } else {
      // Update access token
      await userRef.update({
        accessToken: access_token
      });
    }
    
    res.json({ userId });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Helper function to get user guilds
async function getUserGuilds(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return [];
    
    const userData = userDoc.data();
    
    // Use stored access token to get guilds
    const response = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${userData.accessToken}`,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting user guilds:', error);
    return [];
  }
}

// Create Stripe checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { discordUserId } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'StoryBot Premium',
              description: 'Unlock premium features for StoryBot',
            },
            unit_amount: 999, // $9.99
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/cancel`,
      metadata: {
        discordUserId,
      },
    });
    
    res.json({ id: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook to handle successful payments
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, 'your_stripe_webhook_secret');
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const discordUserId = session.metadata.discordUserId;
    
    // Update user in Firestore
    const userRef = db.collection('users').doc(discordUserId);
    await userRef.update({
      stripeSessionId: session.id,
      isPremium: true
    });
    
    // Get user's guilds and add them to premium_guilds if user has manage permissions
    try {
      const userGuilds = await getUserGuilds(discordUserId);
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      
      // Get username for supporter field
      const username = userData.username || discordUserId;
      
      // Add all guilds where user has manage permissions
      for (const guild of userGuilds) {
        if (guild.owner || (parseInt(guild.permissions) & 0x20) === 0x20) {
          await premiumGuildsRef.doc(guild.id).set({
            granted_at: admin.firestore.FieldValue.serverTimestamp(),
            method: "stripe",
            premium: true,
            supporter: username
          });
        }
      }
    } catch (error) {
      console.error('Error processing guilds after payment:', error);
    }
  }
  
  res.json({ received: true });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
