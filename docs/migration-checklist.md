# Migration Checklist: Angular + Firebase → React + Spring Boot

## Overview

This document tracks the migration progress from the legacy stack (Angular + Firebase Functions) to the new stack (React + Spring Boot).

---

## Feature Comparison

### Translation Features

| Feature | Angular + Firebase | React + Spring Boot | Status |
|---------|-------------------|---------------------|--------|
| Text Normalization | ✅ `translate.service.ts` | ✅ `TextNormalizationService.java` | ✅ **Migrated** |
| Spoken-to-Signed (Pose) | ✅ `translate.service.ts` | ✅ `SpokenToSignedService.java` | ✅ **Migrated** |
| Spoken-to-Signed (Video) | ✅ `gateway/spoken-to-signed.ts` | ❌ Not implemented | ⚠️ **TODO** |
| SignWriting Description | ✅ `translate.service.ts` | ✅ `SignWritingService.java` | ✅ **Migrated** |
| Text-to-Text Translation | ✅ `text-to-text/controller.ts` | ⚠️ Placeholder only | ⚠️ **TODO** |

### Frontend Components

| Component | Angular | React | Status |
|-----------|---------|-------|--------|
| Spoken-to-Signed Page | ✅ `spoken-to-signed.component.ts` | ✅ `SpokenToSignedPage.tsx` | ✅ **Migrated** |
| Signed-to-Spoken Page | ✅ `signed-to-spoken.component.ts` | ✅ `SignedToSpokenPage.tsx` | ✅ **Migrated** |
| SignWriting Page | ✅ `sign-writing.component.ts` | ✅ `SignWritingPage.tsx` | ✅ **Migrated** |
| Settings Page | ❌ Not found | ✅ `SettingsPage.tsx` | ✅ **New** |
| Language Selector | ✅ `language-selector.component.ts` | ✅ `LanguageSelector.tsx` | ✅ **Migrated** |
| Pose Viewer (Human) | ✅ `human-pose-viewer.component.ts` | ✅ `HumanPoseViewer.tsx` | ✅ **Migrated** |
| Pose Viewer (Avatar) | ✅ `avatar-pose-viewer.component.ts` | ✅ `AvatarPoseViewer.tsx` | ✅ **Migrated** |
| Pose Viewer (Skeleton) | ✅ `skeleton-pose-viewer.component.ts` | ✅ `SkeletonPoseViewer.tsx` | ✅ **Migrated** |
| Video Player | ✅ `video.component.ts` | ✅ `VideoPlayer.tsx` | ✅ **Migrated** |
| Video Uploader | ✅ `upload.component.ts` | ✅ `VideoUploader.tsx` | ✅ **Migrated** |
| Speech-to-Text | ✅ `speech-to-text.component.ts` | ❌ Not found | ⚠️ **TODO** |
| Text-to-Speech | ✅ `text-to-speech.component.ts` | ❌ Not found | ⚠️ **TODO** |
| Animation | ✅ `animation.component.ts` | ❌ Not found | ⚠️ **TODO** |
| Flag Icon | ✅ `flag-icon.component.ts` | ❌ Not found | ⚠️ **TODO** |
| Map | ✅ `map.component.ts` | ❌ Not found | ⚠️ **TODO** |
| Stores | ✅ `stores.component.ts` | ❌ Not found | ⚠️ **TODO** |

### Backend Services

| Service | Firebase Functions | Spring Boot | Status |
|---------|-------------------|------------|--------|
| Text Normalization | ✅ `text-normalization/controller.ts` | ✅ `TextNormalizationService.java` | ✅ **Migrated** |
| Text-to-Text | ✅ `text-to-text/controller.ts` | ⚠️ Placeholder | ⚠️ **TODO** |
| Spoken-to-Signed Gateway | ✅ `gateway/spoken-to-signed.ts` | ✅ `SpokenToSignedService.java` | ✅ **Migrated** |
| Avatar Gateway | ✅ `gateway/avatars.ts` | ✅ `AvatarController.java` | ✅ **Migrated** |
| User Gateway | ✅ `gateway/me.ts` | ✅ `UserController.java` | ✅ **Migrated** |
| Prerender | ✅ `prerender/controller.ts` | ❌ Not implemented | ⚠️ **TODO** |

### Authentication & Security

| Feature | Angular + Firebase | React + Spring Boot | Status |
|---------|-------------------|---------------------|--------|
| AppCheck Integration | ✅ `app-check.ts` + `token-interceptor.service.ts` | ✅ `AppCheckController.java` + `AppCheckTokenService.java` | ✅ **Migrated** |
| User Authentication | ✅ Firebase Auth | ❌ Not implemented | ⚠️ **TODO** |
| Rate Limiting | ✅ `unkey-ratelimit.middleware.ts` | ❌ Not implemented | ⚠️ **TODO** |

---

## Shared Resources

### Firebase Resources

| Resource | Used By | Can Delete? |
|----------|---------|-------------|
| Firebase Auth | Angular (user auth) | ❌ **NO** - React needs this |
| Firebase AppCheck | Angular (API auth) | ❌ **NO** - React needs this |
| Firebase Storage | Angular (avatar storage) | ❌ **NO** - React needs this |
| Firebase Realtime Database | Angular (user data) | ❌ **NO** - React needs this |
| Google Cloud Storage (models) | Firebase Functions (text-to-text) | ⚠️ **MAYBE** - Spring Boot needs this for text-to-text |

### External APIs

| API | Used By | Can Delete? |
|-----|---------|-------------|
| sign.mt API | Both stacks | ❌ **NO** - Both need this |
| Firebase Functions | Angular | ⚠️ **MAYBE** - After migration |

---

## Migration Status Summary

### ✅ Completed (Ready to Delete Old Code)

| Component | Notes |
|-----------|-------|
| Text Normalization | Fully migrated to Spring Boot |
| Spoken-to-Signed (Pose) | Fully migrated to Spring Boot |
| SignWriting Description | Fully migrated to Spring Boot |
| Avatar Management | Fully migrated to Spring Boot |
| User Management | Fully migrated to Spring Boot |
| AppCheck Proxy | New solution implemented |

### ⚠️ In Progress / TODO

| Component | Notes |
|-----------|-------|
| Spoken-to-Signed (Video) | Not implemented in Spring Boot |
| Text-to-Text Translation | Placeholder only in Spring Boot |
| Speech-to-Text | Not in React |
| Text-to-Speech | Not in React |
| Animation | Not in React |
| Flag Icon | Not in React |
| Map | Not in React |
| Stores | Not in React |
| User Authentication | Not in Spring Boot |
| Rate Limiting | Not in Spring Boot |
| Prerender | Not in Spring Boot |

---

## Deletion Checklist

### Can Delete After Migration Complete

- [ ] Angular frontend (`src/` directory)
- [ ] Firebase Functions (`functions/` directory)
- [ ] Angular build artifacts (`dist/` directory)
- [ ] Angular configuration files (`angular.json`, `tsconfig.json`, etc.)

### Cannot Delete (Shared Resources)

- [ ] Firebase Auth (React needs this)
- [ ] Firebase AppCheck (React needs this)
- [ ] Firebase Storage (React needs this)
- [ ] Firebase Realtime Database (React needs this)
- [ ] Google Cloud Storage (Spring Boot needs this for text-to-text)
- [ ] sign.mt API (Both need this)

---

## Recommendations

### Phase 1: Complete Core Features

Before deleting old code, ensure:

1. ✅ **Text Normalization** - Done
2. ✅ **Spoken-to-Signed (Pose)** - Done
3. ✅ **SignWriting Description** - Done
4. ⚠️ **Spoken-to-Signed (Video)** - TODO
5. ⚠️ **Text-to-Text Translation** - TODO

### Phase 2: Complete Frontend Components

1. ⚠️ Speech-to-Text
2. ⚠️ Text-to-Speech
3. ⚠️ Animation
4. ⚠️ Flag Icon
5. ⚠️ Map
6. ⚠️ Stores

### Phase 3: Complete Backend Services

1. ⚠️ User Authentication
2. ⚠️ Rate Limiting
3. ⚠️ Prerender

### Phase 4: Testing & Validation

1. Run full test suite on React + Spring Boot
2. Compare results with Angular + Firebase
3. Performance testing
4. Security audit

### Phase 5: Deployment

1. Deploy React + Spring Boot to production
2. Monitor for issues
3. Gradually migrate users
4. Keep old system as fallback

### Phase 6: Cleanup

1. Delete Angular frontend
2. Delete Firebase Functions
3. Update documentation
4. Archive old code

---

## Conclusion

**Can you delete Angular + Firebase Functions?**

**Answer: NOT YET**

**Reasons:**
1. Several features are not yet migrated (video, text-to-text, speech-to-text, etc.)
2. Firebase resources are still needed by React
3. User authentication is not implemented in Spring Boot
4. Rate limiting and other middleware are missing

**Estimated completion:** 60-70% of core features are migrated.

**Next steps:**
1. Implement missing features in React + Spring Boot
2. Add user authentication to Spring Boot
3. Implement rate limiting
4. Complete text-to-text translation
5. Add video endpoint for spoken-to-signed
6. Test thoroughly before deletion
