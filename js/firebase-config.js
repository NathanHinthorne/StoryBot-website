// Firebase configuration
const FIREBASE_CONFIG = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();

// User-related Firebase functions
async function getUserData(userId) {
  try {
    const doc = await db.collection('users').doc(userId).get();
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

async function isUserPremium(userId) {
  const userData = await getUserData(userId);
  return userData && userData.isPremium;
}