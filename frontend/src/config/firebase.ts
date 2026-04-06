// Firebase Configuration (defaults match current Angular environment)

const defaultFirebaseConfig = {
  apiKey: 'AIzaSyAtVDGmDVCwWunWW2ocgeHWnAsUhHuXvcg',
  authDomain: 'sign-mt.firebaseapp.com',
  projectId: 'sign-mt',
  storageBucket: 'sign-mt.appspot.com',
  messagingSenderId: '665830225099',
  appId: '1:665830225099:web:18e0669d5847a4b047974e',
  measurementId: 'G-1LXY5W5Z9H',
} as const;

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || defaultFirebaseConfig.measurementId,
};

export const reCAPTCHAKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6Ldsxb8oAAAAAGyUZbyd0QruivPSudqAWFygR-4t';
