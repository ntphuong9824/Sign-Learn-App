# Translation Pipeline API Comparison

## Overview

This document compares the API calls made by two different translation pipeline implementations:

1. **Angular + Firebase Functions** (Legacy)
2. **React + Spring Boot** (New)

---

## 1. Angular + Firebase Functions Pipeline

### Frontend (Angular) API Calls

**File:** `src/app/modules/translate/translate.service.ts`

| Function | API Endpoint | Method | Purpose |
|----------|--------------|--------|---------|
| `normalizeSpokenLanguageText()` | `https://sign.mt/api/text-normalization` | GET | Normalize spoken language text |
| `describeSignWriting()` | `https://sign.mt/api/signwriting-description` | POST | Get description of SignWriting (FSW) |
| `translateSpokenToSigned()` | `https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose` | GET | Translate spoken text to signed pose |

### Backend (Firebase Functions) API Calls

**File:** `functions/src/gateway/spoken-to-signed.ts`

| Function | API Endpoint | Method | Purpose |
|----------|--------------|--------|---------|
| `spokenToSigned()` - pose | `https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose` | GET | Proxy for spoken-to-signed pose translation |
| `spokenToSigned()` - video | `https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_video` | GET | Proxy for spoken-to-signed video translation |

**File:** `functions/src/text-to-text/controller.ts`

| Function | API Endpoint | Method | Purpose |
|----------|--------------|--------|---------|
| `TextToTextTranslationEndpoint` | `/api/:direction` | GET | Text-to-text translation using models from Google Cloud Storage |

**File:** `functions/src/text-normalization/controller.ts`

| Function | API Endpoint | Method | Purpose |
|----------|--------------|--------|---------|
| Text normalization endpoint | `/api/text-normalization` | GET | Normalize text using local models |

---

## 2. React + Spring Boot Pipeline

### Frontend (React) API Calls

**File:** `frontend/src/services/translationApi.ts`

| Function | API Endpoint | Method | Purpose |
|----------|--------------|--------|---------|
| `normalize()` | `/api/v1/translate/normalize` | GET | Normalize spoken language text |
| `spokenToSigned()` | `/api/v1/translate/spoken-to-signed` | GET | Translate spoken text to signed pose |
| `describeSignWriting()` | `/api/v1/translate/signwriting/describe` | POST | Get description of SignWriting (FSW) |
| `textToText()` | `/api/v1/translate/text-to-text/{direction}` | GET | Text-to-text translation |

### Backend (Spring Boot) API Calls

**Controller:** `backend/src/main/java/com/signlearn/controller/TranslateController.java`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/translate/normalize` | GET | Text normalization |
| `/api/v1/translate/spoken-to-signed` | GET | Spoken-to-signed translation |
| `/api/v1/translate/signwriting/describe` | POST | SignWriting description |
| `/api/v1/translate/text-to-text/{direction}` | GET | Text-to-text translation |

**Services:**

| Service | External API Called | Purpose |
|---------|---------------------|---------|
| `TextNormalizationService` | `https://sign.mt/api/text-normalization` | Proxies to sign.mt API |
| `SignWritingService` | `https://sign.mt/api/signwriting-description` | Proxies to sign.mt API |
| `SpokenToSignedService` | `https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose` | Proxies to Firebase Functions |
| `TextToTextService` | *(Not yet implemented)* | TODO: Load models from GCS and perform translation |

---

## 3. API Flow Comparison

### Text Normalization

```
Angular Pipeline:
Angular → https://sign.mt/api/text-normalization

React Pipeline:
React → Spring Boot (/api/v1/translate/normalize) → https://sign.mt/api/text-normalization
```

### Spoken-to-Signed Translation

```
Angular Pipeline:
Angular → https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose

React Pipeline:
React → Spring Boot (/api/v1/translate/spoken-to-signed) → https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose
```

### SignWriting Description

```
Angular Pipeline:
Angular → https://sign.mt/api/signwriting-description

React Pipeline:
React → Spring Boot (/api/v1/translate/signwriting/describe) → https://sign.mt/api/signwriting-description
```

### Text-to-Text Translation

```
Angular Pipeline:
Angular → Firebase Functions (/api/:direction) → Google Cloud Storage (models)

React Pipeline:
React → Spring Boot (/api/v1/translate/text-to-text/{direction}) → *(TODO: Implement)*
```

---

## 4. Key Differences

| Aspect | Angular + Firebase Functions | React + Spring Boot |
|--------|----------------------------|---------------------|
| **Architecture** | Direct API calls from frontend | Frontend → Backend → External APIs |
| **Text Normalization** | Direct to sign.mt | Proxied through Spring Boot |
| **Spoken-to-Signed** | Direct to Firebase Functions | Proxied through Spring Boot |
| **SignWriting** | Direct to sign.mt | Proxied through Spring Boot |
| **Text-to-Text** | Firebase Functions with GCS models | Spring Boot (placeholder, TODO) |
| **Error Handling** | Client-side | Backend with fallbacks |
| **CORS** | Handled by Firebase Functions | Handled by Spring Boot |

---

## 5. External APIs Used

Both pipelines ultimately call these external APIs:

| API | Base URL | Purpose |
|-----|----------|---------|
| **sign.mt** | `https://sign.mt` | Text normalization, SignWriting description |
| **Firebase Functions** | `https://us-central1-sign-mt.cloudfunctions.net` | Spoken-to-signed pose/video translation |
| **Google Cloud Storage** | *(via Firebase Functions)* | Translation model files storage |

---

## 6. Configuration

### Spring Boot Configuration

The Spring Boot backend uses configurable base URLs via `application.yaml`:

```yaml
external-api:
  sign-mt:
    base-url: https://sign.mt
  firebase-functions:
    base-url: https://us-central1-sign-mt.cloudfunctions.net
```

### React Configuration

The React frontend uses environment variables:

```bash
VITE_SPRING_BOOT_API_URL=/api/v1/translate
```

---

## 7. Implementation Status

| Feature | Angular + Firebase Functions | React + Spring Boot |
|---------|----------------------------|---------------------|
| Text Normalization | ✅ Complete | ✅ Complete |
| Spoken-to-Signed (Pose) | ✅ Complete | ✅ Complete |
| Spoken-to-Signed (Video) | ✅ Complete | ❌ Not implemented |
| SignWriting Description | ✅ Complete | ✅ Complete |
| Text-to-Text Translation | ✅ Complete | ⚠️ Placeholder (TODO) |

---

## 8. Notes

- The Spring Boot `TextToTextService` currently returns a placeholder response and needs to be implemented with actual model loading from Google Cloud Storage.
- The React pipeline does not yet support the video endpoint for spoken-to-signed translation.
- Both pipelines share the same external APIs (sign.mt and Firebase Functions), but the React pipeline adds a Spring Boot proxy layer for better control and error handling.