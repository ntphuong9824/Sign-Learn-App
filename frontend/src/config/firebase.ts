// Firebase Configuration
// All values must be provided via environment variables
// The app will fail fast if required values are missing

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate required Firebase config
export function validateFirebaseConfig(): boolean {
  const required = ['apiKey', 'projectId', 'appId'];
  const missing = required.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

  if (missing.length > 0) {
    console.error(`Missing required Firebase config: ${missing.join(', ')}`);
    console.error('Please set the following environment variables:');
    missing.forEach(key => console.error(`  VITE_FIREBASE_${key.toUpperCase()}`));
    return false;
  }
  return true;
}

export const reCAPTCHAKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
