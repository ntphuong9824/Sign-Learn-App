import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from 'firebase/app-check';
import type { AppCheck } from 'firebase/app-check';
import { firebaseConfig, reCAPTCHAKey } from '../config/firebase';

let appCheckInstance: AppCheck | null = null;

const appCheckDebugToken = import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN;
const isProduction = import.meta.env.PROD;

function configureDebugToken(): void {
  // Never enable debug token implicitly in production builds.
  if (isProduction) {
    if (appCheckDebugToken) {
      console.warn('VITE_APP_CHECK_DEBUG_TOKEN is ignored in production build');
    }
    return;
  }

  const debugTokenValue: string | boolean = appCheckDebugToken || true;
  (window as typeof window & { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = debugTokenValue;
}

/**
 * Initialize Firebase AppCheck
 * This should be called once when the app starts
 */
export const initializeFirebaseAppCheck = (): AppCheck => {
  if (appCheckInstance) {
    return appCheckInstance;
  }

  configureDebugToken();

  // Check if Firebase app is already initialized
  const existingApps = getApps();
  let app: FirebaseApp;

  if (existingApps.length > 0) {
    app = existingApps[0];
  } else {
    app = initializeApp(firebaseConfig);
  }

  // Initialize AppCheck with reCAPTCHA v3
  appCheckInstance = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(reCAPTCHAKey),
    isTokenAutoRefreshEnabled: true,
  });

  return appCheckInstance;
};

/**
 * Get AppCheck token
 * @param forceRefresh - Force refresh the token (default: false)
 * @returns The AppCheck token or null if failed
 */
export const getAppCheckToken = async (forceRefresh: boolean = false): Promise<string | null> => {
  try {
    const appCheck = initializeFirebaseAppCheck();
    const result = await getToken(appCheck, forceRefresh);
    return result.token;
  } catch (error) {
    console.error('Failed to get AppCheck token:', error);
    return null;
  }
};

/**
 * Get AppCheck instance
 */
export const getAppCheck = (): AppCheck => {
  return initializeFirebaseAppCheck();
};

export default {
  initializeFirebaseAppCheck,
  getAppCheckToken,
  getAppCheck,
};
