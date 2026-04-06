# Translation Pipeline Test Guide

## Overview

This guide provides complete testing instructions for both translation pipelines:

1. **Angular + Firebase Functions** (Legacy)
2. **React + Spring Boot** (New)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pipeline 1: Angular + Firebase Functions](#pipeline-1-angular--firebase-functions)
3. [Pipeline 2: React + Spring Boot](#pipeline-2-react--spring-boot)
4. [Postman Collection](#postman-collection)
5. [Common Test Cases](#common-test-cases)

---

## Prerequisites

### For Firebase Functions Testing

- Firebase Functions deployed or running locally
- Access to `https://sign.mt` API
- Access to Firebase Functions endpoints

### For Spring Boot Testing

- Spring Boot application running on port `8080` (default)
- Access to `https://sign.mt` API
- Access to Firebase Functions endpoints

### For Frontend Testing

- Angular application running on port `4200`
- React application running on port `5173`

---

## Pipeline 1: Angular + Firebase Functions

### 1.1 Text Normalization

**Frontend Service:** `src/app/modules/translate/translate.service.ts`

#### INPUT

```typescript
// Method: normalizeSpokenLanguageText(language: string, text: string)
language: "en"
text: "Hello world! How are you?"
```

#### OUTPUT

```json
{
  "text": "Hello world! How are you?"
}
```

#### POSTMAN Test

**Request:**

```
GET https://sign.mt/api/text-normalization?lang=en&text=Hello%20world!%20How%20are%20you%3F
```

**Headers:**

```
Content-Type: application/json
```

**Expected Response:**

```json
{
  "text": "Hello world! How are you?"
}
```

---

### 1.2 SignWriting Description

**Frontend Service:** `src/app/modules/translate/translate.service.ts`

#### INPUT

```typescript
// Method: describeSignWriting(fsw: string)
fsw: "AS14c20S15a04S2e704M525x535S2e704483x510"
```

#### OUTPUT

```json
{
  "result": {
    "description": "A person signing with both hands..."
  }
}
```

#### POSTMAN Test

**Request:**

```
POST https://sign.mt/api/signwriting-description
```

**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "data": {
    "fsw": "AS14c20S15a04S2e704M525x535S2e704483x510"
  }
}
```

**Expected Response:**

```json
{
  "result": {
    "description": "A person signing with both hands..."
  }
}
```

---

### 1.3 Spoken-to-Signed Translation (Pose)

**Frontend Service:** `src/app/modules/translate/translate.service.ts`

#### INPUT

```typescript
// Method: translateSpokenToSigned(text: string, spokenLanguage: string, signedLanguage: string)
text: "Hello"
spokenLanguage: "en"
signedLanguage: "ase"
```

#### OUTPUT

```json
{
  "poseData": {
    "landmarks": [
      [
        {
          "x": 0.5,
          "y": 0.5,
          "z": 0.0,
          "visibility": 0.9
        }
      ]
    ],
    "worldLandmarks": [
      [
        {
          "x": 0.5,
          "y": 0.5,
          "z": 0.0,
          "visibility": 0.9
        }
      ]
    ],
    "transformation": {}
  },
  "animationUrl": "https://storage.googleapis.com/..."
}
```

#### POSTMAN Test

**Request:**

```
GET https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose?text=Hello&spoken=en&signed=ase
```

**Headers:**

```
Content-Type: application/json
```

**Expected Response:**

```json
{
  "poseData": {
    "landmarks": [...],
    "worldLandmarks": [...],
    "transformation": {}
  },
  "animationUrl": "https://storage.googleapis.com/..."
}
```

---

### 1.4 Spoken-to-Signed Translation (Video)

**Backend Gateway:** `functions/src/gateway/spoken-to-signed.ts`

#### INPUT

```typescript
text: "Hello"
spokenLanguage: "en"
signedLanguage: "ase"
```

#### OUTPUT

Binary video stream (MP4 format)

#### POSTMAN Test

**Request:**

```
GET https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_video?text=Hello&spoken=en&signed=ase
```

**Headers:**

```
Content-Type: application/json
```

**Expected Response:**

Binary video data (MP4)

---


## Pipeline 2: React + Spring Boot

### 2.1 Text Normalization

**Frontend Service:** `frontend/src/services/translationApi.ts`
**Backend Controller:** `backend/src/main/java/com/signlearn/controller/TranslateController.java`
**Backend Service:** `backend/src/main/java/com/signlearn/service/translate/TextNormalizationService.java`

#### INPUT

```typescript
// Method: normalize(lang: string, text: string)
lang: "en"
text: "Hello world! How are you?"
```

#### OUTPUT

```json
{
  "text": "Hello world! How are you?"
}
```

#### POSTMAN Test

**Request:**

```
GET http://localhost:8080/api/v1/translate/normalize?lang=en&text=Hello%20world!%20How%20are%20you%3F
```

**Headers:**

```
Content-Type: application/json
```

**Expected Response:**

```json
{
  "text": "Hello world! How are you?"
}
```

---

### 2.2 Spoken-to-Signed Translation

**Frontend Service:** `frontend/src/services/translationApi.ts`
**Backend Controller:** `backend/src/main/java/com/signlearn/controller/TranslateController.java`
**Backend Service:** `backend/src/main/java/com/signlearn/service/translate/SpokenToSignedService.java`

#### INPUT

```typescript
// Method: spokenToSigned(text: string, spoken: string, signed: string)
text: "Hello"
spoken: "en"
signed: "ase"
```

#### OUTPUT

```json
{
  "poseData": {
    "landmarks": [
      [
        {
          "x": 0.5,
          "y": 0.5,
          "z": 0.0,
          "visibility": 0.9
        }
      ]
    ],
    "worldLandmarks": [
      [
        {
          "x": 0.5,
          "y": 0.5,
          "z": 0.0,
          "visibility": 0.9
        }
      ]
    ],
    "transformation": {}
  },
  "animationUrl": "https://storage.googleapis.com/..."
}
```

#### POSTMAN Test

**Request:**

```
GET http://localhost:8080/api/v1/translate/spoken-to-signed?text=Hello&spoken=en&signed=ase
```

**Headers:**

```
Content-Type: application/json
```

**Expected Response:**

```json
{
  "poseData": {
    "landmarks": [...],
    "worldLandmarks": [...],
    "transformation": {}
  },
  "animationUrl": "https://storage.googleapis.com/..."
}
```

---

### 2.3 SignWriting Description

**Frontend Service:** `frontend/src/services/translationApi.ts`
**Backend Controller:** `backend/src/main/java/com/signlearn/controller/TranslateController.java`
**Backend Service:** `backend/src/main/java/com/signlearn/service/translate/SignWritingService.java`

#### INPUT

```typescript
// Method: describeSignWriting(fsw: string)
fsw: "AS14c20S15a04S2e704M525x535S2e704483x510"
```

#### OUTPUT

```json
{
  "description": "A person signing with both hands..."
}
```

#### POSTMAN Test

**Request:**

```
POST http://localhost:8080/api/v1/translate/signwriting/describe
```

**Headers:**

```
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "fsw": "AS14c20S15a04S2e704M525x535S2e704483x510"
}
```

**Expected Response:**

```json
{
  "description": "A person signing with both hands..."
}
```

---

## Postman Collection

### Import Collection

Create a new Postman collection with the following structure:

```
Sign Learn Translation API
├── Firebase Functions (Legacy)
│   ├── Text Normalization
│   ├── SignWriting Description
│   ├── Spoken-to-Signed (Pose)
│   ├── Spoken-to-Signed (Video)
│   └── Text-to-Text
└── Spring Boot (New)
    ├── Text Normalization
    ├── Spoken-to-Signed
    ├── SignWriting Description
    └── Text-to-Text
```

### Environment Variables

Create an environment with the following variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `firebase_url` | `https://us-central1-sign-mt.cloudfunctions.net` | Firebase Functions base URL |
| `sign_mt_url` | `https://sign.mt` | sign.mt API base URL |
| `spring_boot_url` | `http://localhost:8080` | Spring Boot base URL |
| `api_version` | `v1` | API version |

### Postman Request Templates

#### Firebase Functions - Text Normalization

```json
{
  "info": {
    "name": "Text Normalization",
    "request": {
      "method": "GET",
      "header": [],
      "url": {
        "raw": "{{sign_mt_url}}/api/text-normalization?lang=en&text=Hello",
        "host": ["{{sign_mt_url}}"],
        "path": ["api", "text-normalization"],
        "query": [
          {"key": "lang", "value": "en"},
          {"key": "text", "value": "Hello"}
        ]
      }
    }
  }
}
```

#### Spring Boot - Text Normalization

```json
{
  "info": {
    "name": "Text Normalization",
    "request": {
      "method": "GET",
      "header": [],
      "url": {
        "raw": "{{spring_boot_url}}/api/{{api_version}}/translate/normalize?lang=en&text=Hello",
        "host": ["{{spring_boot_url}}"],
        "path": ["api", "{{api_version}}", "translate", "normalize"],
        "query": [
          {"key": "lang", "value": "en"},
          {"key": "text", "value": "Hello"}
        ]
      }
    }
  }
}
```

#### Spring Boot - SignWriting Description

```json
{
  "info": {
    "name": "SignWriting Description",
    "request": {
      "method": "POST",
      "header": [
        {"key": "Content-Type", "value": "application/json"}
      ],
      "body": {
        "mode": "raw",
        "raw": "{\n  \"fsw\": \"AS14c20S15a04S2e704M525x535S2e704483x510\"\n}"
      },
      "url": {
        "raw": "{{spring_boot_url}}/api/{{api_version}}/translate/signwriting/describe",
        "host": ["{{spring_boot_url}}"],
        "path": ["api", "{{api_version}}", "translate", "signwriting", "describe"]
      }
    }
  }
}
```

---

## Common Test Cases

### Test Case 1: Basic English to ASL Translation

**Input:**
- Text: "Hello"
- Spoken Language: "en"
- Signed Language: "ase"

**Expected:**
- Valid pose data with landmarks
- Animation URL (if available)

### Test Case 2: Text Normalization

**Input:**
- Language: "en"
- Text: "Hello world! How are you?"

**Expected:**
- Normalized text returned

### Test Case 3: SignWriting Description

**Input:**
- FSW: "AS14c20S15a04S2e704M525x535S2e704483x510"

**Expected:**
- Description of the sign

### Test Case 4: Error Handling - Missing Parameters

**Input:**
- Missing required query parameters

**Expected:**
- HTTP 400 Bad Request
- Error message indicating missing parameters

### Test Case 5: Error Handling - Invalid Language

**Input:**
- Invalid language code

**Expected:**
- HTTP 400 Bad Request or upstream error

---

## Testing Checklist

### Firebase Functions Pipeline

- [ ] Text Normalization API
- [ ] SignWriting Description API
- [ ] Spoken-to-Signed (Pose) API
- [ ] Spoken-to-Signed (Video) API
- [ ] Text-to-Text Translation API

### Spring Boot Pipeline

- [ ] Text Normalization API
- [ ] Spoken-to-Signed API
- [ ] SignWriting Description API
- [ ] Text-to-Text Translation API

### Frontend Testing

- [ ] Angular frontend integration
- [ ] React frontend integration
- [ ] Error handling in UI
- [ ] Loading states

---

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure CORS is configured on backend
   - Check browser console for CORS errors

2. **Timeout Errors**
   - External APIs may be slow
   - Increase timeout settings in Postman

3. **Invalid Response Format**
   - Verify API response matches expected DTO structure
   - Check backend logs for errors

4. **Connection Refused**
   - Ensure Spring Boot is running on port 8080
   - Check firewall settings

---

## Additional Resources

- [Postman Documentation](https://learning.postman.com/)
- [Spring Boot REST API Guide](https://spring.io/guides/gs/rest-service/)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
