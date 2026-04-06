# React Firebase AppCheck Integration Guide

## Overview

This guide explains how to integrate Firebase AppCheck into the React frontend to automatically obtain and send AppCheck tokens to the Spring Boot backend.

---

## Prerequisites

### 1. Install Firebase SDK

```bash
npm install firebase
```

### 2. Firebase Configuration

The Firebase configuration is already available in `frontend/src/config/firebase.ts`:

```typescript
export const firebaseConfig = {
  apiKey: 'AIzaSyAtVDGmDVCwWunWW2ocgeHWnAsUhHuXvcg',
  authDomain: 'sign-mt.firebaseapp.com',
  projectId: 'sign-mt',
  storageBucket: 'sign-mt.appspot.com',
  messagingSenderId: '665830225099',
  appId: '1:665830225099:web:18e0669d5847a4b047974e',
  measurementId: 'G-1LXY5W5Z9H',
};

export const reCAPTCHAKey = '6Ldsxb8oAAAAAGyUZbyd0QruivPSudqAWFygR-4t';
```

---

## Files Created

| File | Purpose |
|------|---------|
| `config/firebase.ts` | Firebase configuration |
| `services/firebaseAppCheck.ts` | Firebase AppCheck initialization |
| `services/appCheckApi.ts` | API to communicate with backend |
| `services/appCheckTokenManager.ts` | Token lifecycle management |

---

## Usage

### 1. Initialize AppCheck in App Root

```typescript
// src/main.tsx or src/App.tsx
import { appCheckTokenManager } from './services/appCheckTokenManager';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Initialize AppCheck when app starts
appCheckTokenManager.initialize().catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### 2. Manual Token Refresh (Optional)

```typescript
import { appCheckTokenManager } from './services/appCheckTokenManager';

// Force refresh token
await appCheckTokenManager.sendToken();

// Check backend status
const hasValidToken = await appCheckTokenManager.checkBackendStatus();
console.log('Backend has valid token:', hasValidToken);

// Clear backend tokens
await appCheckTokenManager.clearBackendTokens();
```

### 3. Direct Token Access (Optional)

```typescript
import { getAppCheckToken } from './services/firebaseAppCheck';

// Get token directly
const token = await getAppCheckToken();
console.log('AppCheck token:', token);
```

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    React App                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. App starts                                    │  │
│  │  2. Initialize Firebase AppCheck                 │  │
│  │  3. Get token from Firebase                       │  │
│  │  4. Send token to Spring Boot                     │  │
│  │  5. Refresh every 45 minutes                      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ POST /api/v1/appcheck/token
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Spring Boot Backend                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. Receive token                                 │  │
│  │  2. Cache token (50 minutes)                      │  │
│  │  3. Use token for external API calls              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Send Token

```typescript
POST /api/v1/appcheck/token
Headers:
  X-Client-Source: react
  Content-Type: application/json
Body:
  {
    "token": "your_app_check_token"
  }
```

### Check Status

```typescript
GET /api/v1/appcheck/status
Response:
  {
    "hasValidToken": true,
    "tokenInfo": {
      "react": "2026-04-06T10:30:00"
    }
  }
```

### Clear Tokens

```typescript
DELETE /api/v1/appcheck/token
```

---

## Troubleshooting

### Error: "Firebase: Error (auth/app-check-token)"

**Cause:** Firebase AppCheck not initialized properly

**Solution:**
```typescript
// Make sure to call initializeFirebaseAppCheck() first
import { initializeFirebaseAppCheck } from './services/firebaseAppCheck';

const appCheck = initializeFirebaseAppCheck();
```

### Error: "Failed to get AppCheck token"

**Cause:** reCAPTCHA key is invalid or network issue

**Solution:**
1. Check reCAPTCHA key in `config/firebase.ts`
2. Check browser console for reCAPTCHA errors
3. Ensure Firebase project is configured correctly

### Error: "No AppCheck token available" (Backend)

**Cause:** Frontend hasn't sent token yet

**Solution:**
1. Check if `appCheckTokenManager.initialize()` was called
2. Check browser console for errors
3. Verify backend status: `GET /api/v1/appcheck/status`

---

## Testing

### 1. Test Token Generation

```typescript
import { getAppCheckToken } from './services/firebaseAppCheck';

const token = await getAppCheckToken();
console.log('Token:', token);
// Should print a long token string
```

### 2. Test Backend Communication

```typescript
import { appCheckApi } from './services/appCheckApi';

const status = await appCheckApi.checkStatus();
console.log('Backend status:', status);
// Should show hasValidToken: true after sending token
```

### 3. Test Token Refresh

```typescript
import { appCheckTokenManager } from './services/appCheckTokenManager';

// Send token
await appCheckTokenManager.sendToken();

// Check status
const hasToken = await appCheckTokenManager.checkBackendStatus();
console.log('Has token:', hasToken);
```

---

## Security Notes

⚠️ **Important:**

1. **Never commit Firebase secrets** - The config in `firebase.ts` is public (apiKey, authDomain, etc.) and is safe to commit
2. **reCAPTCHA key is public** - This is expected for reCAPTCHA v3
3. **Tokens are short-lived** - AppCheck tokens expire after ~1 hour
4. **Auto-refresh is enabled** - Tokens are automatically refreshed every 45 minutes

---

## Comparison with Angular

| Feature | Angular | React |
|---------|---------|-------|
| Firebase Config | `environment.ts` | `config/firebase.ts` |
| AppCheck Init | `app-check.ts` | `firebaseAppCheck.ts` |
| Token Interceptor | `token-interceptor.service.ts` | `appCheckTokenManager.ts` |
| Auto Refresh | ✅ Yes | ✅ Yes |
| Backend Communication | ❌ Direct API calls | ✅ Via proxy |

---

## Next Steps

1. ✅ Firebase configuration copied from Angular
2. ✅ AppCheck service created
3. ✅ Token manager created
4. ⚠️ Initialize in App root
5. ⚠️ Test with real Firebase project
6. ⚠️ Monitor token refresh in production

---

## References

- [Firebase AppCheck Documentation](https://firebase.google.com/docs/app-check)
- [React Firebase Integration](https://firebase.google.com/docs/web/setup)
- [reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3)
