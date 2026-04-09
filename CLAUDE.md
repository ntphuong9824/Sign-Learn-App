# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sign Language Translator - A full-stack application for translating between spoken languages and sign languages. The app uses MediaPipe for pose/hand detection, Firebase AppCheck for security, and external translation APIs for sign language generation.

## Architecture

### Frontend (React + TypeScript + Vite)
- **Location**: `frontend/`
- **Framework**: React 19 with TypeScript
- **State Management**: Zustand for settings, TanStack Query for API calls
- **Styling**: Tailwind CSS v4
- **Key Libraries**:
  - `@mediapipe/pose` and `@mediapipe/hands` for pose detection
  - `pose-viewer` for rendering sign language animations
  - `firebase` for AppCheck integration
  - `react-router-dom` for routing

### Backend (Spring Boot + Java)
- **Location**: `backend/`
- **Framework**: Spring Boot
- **Database**: PostgreSQL (configured via environment variables)
- **Key Services**:
  - `SpokenToSignedService` - Translates spoken text to sign language poses
  - `SignWritingService` - Describes SignWriting notation
  - `TextToTextService` - Text-to-text translation (placeholder)
  - `AppCheckTokenService` - Manages Firebase AppCheck tokens

### External APIs
- **Firebase Functions**: `https://us-central1-sign-mt.cloudfunctions.net` - Spoken-to-signed translation
- **Sign.MT**: `https://sign.mt` - SignWriting description

## Development Commands

### Frontend
```bash
cd frontend
npm install              # Install dependencies
npm run dev             # Start dev server (http://localhost:5173)
npm run build           # Build for production
npm run lint            # Run ESLint
npm run preview         # Preview production build
```

### Backend
```bash
cd backend
./mvnw spring-boot:run  # Start Spring Boot server (http://localhost:8080)
./mvnw clean install    # Build and install
./mvnw test             # Run tests
```

### Environment Setup

**Frontend** (copy `frontend/.env.example` to `frontend/.env`):
```bash
VITE_SPRING_BOOT_API_URL=/api/v1/translate
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=sign-mt
VITE_RECAPTCHA_SITE_KEY=...
```

**Backend** (create `.env` in project root):
```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=signlearn
POSTGRES_USER=...
POSTGRES_PASSWORD=...
SERVER_PORT=8080
SPRING_JPA_HIBERNATE_DDL_AUTO=update
SPRING_JPA_SHOW_SQL=false
SIGN_MT_API_URL=https://sign.mt
FIREBASE_FUNCTIONS_URL=https://us-central1-sign-mt.cloudfunctions.net
APP_CHECK_TOKEN=...
```

## Key Architecture Patterns

### AppCheck Token Flow
1. Frontend initializes Firebase AppCheck (`firebaseAppCheck.ts`)
2. `appCheckTokenManager` sends tokens to backend periodically (45 min)
3. Backend caches tokens in `AppCheckTokenService`
4. Backend uses cached tokens for external API calls

### Translation Flow
1. User enters text in `TranslatePage.tsx`
2. `useSpokenToSigned` hook calls `translationApi.spokenToSigned()`
3. Request goes to Spring Boot `TranslateController`
4. `SpokenToSignedService` calls Firebase Functions API
5. Response contains `poseUrl` for sign language animation
6. `PoseViewer` or `SkeletonPoseViewer` renders the animation

### MediaPipe Integration
- `MediaPipeService` combines Pose and Hands detection
- Returns `CombinedPoseResult` with pose landmarks and hand landmarks
- Used for real-time sign language detection (placeholder implementation)

## Language Support

**Spoken Languages**: en, vi, de, fr, ja
**Sign Languages**: ase (ASL), bfi (BSL), gsg (DGS), fsl (LSF), jsl (JSL), vnsl (VNSL)

Language compatibility is defined in `TranslatePage.tsx`:
- `SPOKEN_TO_SIGN_COMPAT` - Which sign languages each spoken language can translate to
- `SIGN_TO_SPOKEN_COMPAT` - Which spoken languages each sign language can translate from

## Signed-to-Spoken Translation (In Progress)

### Overview
Signed-to-spoken translation allows users to translate sign language (via webcam or video upload) to spoken text. This feature uses MediaPipe for pose/hand detection.

### Implementation Status

#### Completed Components

1. **MediaPipe Integration** (`frontend/src/services/mediaPipeService.ts`)
   - ✅ Migrated from `@mediapipe/pose` and `@mediapipe/hands` to `@mediapipe/tasks-vision`
   - ✅ Fixed ES module export issues
   - ✅ Implemented `FilesetResolver` for proper WASM initialization
   - ✅ Combined Pose and Hands detection for full skeleton tracking
   - ✅ Added drawing utilities for pose visualization
   - ✅ Implemented pose normalization based on shoulder distance
   - ✅ **Fixed hand handedness detection** - Now uses `results.handedness[i][0].index` (0=Left, 1=Right)
   - ✅ **Added GPU fallback** - Tries GPU first, falls back to CPU if initialization fails
   - ✅ **Added null checks** - Replaced unsafe non-null assertions with explicit validation

2. **Camera Hook** (`frontend/src/hooks/useCamera.ts`)
   - ✅ Webcam capture with configurable constraints
   - ✅ Proper stream cleanup on unmount
   - ✅ Error handling for camera access failures

3. **Pose Detection Hook** (`frontend/src/hooks/usePoseDetection.ts`)
   - ✅ Real-time pose detection from video stream
   - ✅ Frame rate limiting (configurable, default 30fps)
   - ✅ Dimension validation before processing
   - ✅ **Fixed race condition** - Added check after async operation to prevent stale state updates

4. **Pose Canvas Component** (`frontend/src/components/PoseCanvas.tsx`)
   - ✅ Canvas-based pose visualization
   - ✅ Video frame rendering with mirror effect
   - ✅ Pose landmarks overlay
   - ✅ **Added mirror prop** - Control mirror effect (default: true for webcam, false for uploaded video)
   - ✅ **Fixed transparent background** - No longer draws white background when `drawVideo=false`

5. **TranslatePage Integration** (`frontend/src/pages/translate/TranslatePage.tsx`)
   - ✅ Integrated signed-to-spoken into main translation page
   - ✅ **Manual camera start** - Camera only starts when user clicks camera icon or video area
   - ✅ **Video upload support** - Upload video files for pose analysis
   - ✅ **Pose detection on uploaded video** - Real-time pose detection while video plays
   - ✅ **Circular buffer for pose history** - Optimized memory usage (no new array per frame)
   - ✅ **File upload validation** - Validates file type (MP4, WebM, OGG, MOV) and size (max 100MB)
   - ✅ **Auto-stop camera on upload** - Camera stops automatically when uploading video

6. **Backend Security** (`backend/src/main/java/com/signlearn/controller/AppCheckController.java`)
   - ✅ **Added rate limiting** - 10 requests per minute per IP to prevent DoS
   - ✅ **IP tracking** - Uses X-Forwarded-For and X-Real-IP headers

7. **Backend Token Validation** (`backend/src/main/java/com/signlearn/service/AppCheckTokenService.java`)
   - ✅ **Added token validation** - Validates token length (10-1000 chars) and source length (max 100 chars)

8. **Frontend Security** (`frontend/src/config/firebase.ts`)
   - ✅ **Removed hardcoded API key** - No longer has fallback hardcoded values
   - ✅ **Added validation function** - `validateFirebaseConfig()` to check required env vars

9. **API Client** (`frontend/src/services/appCheckApi.ts`)
   - ✅ **Added AbortController support** - All API methods accept optional `signal` parameter for cancellation

10. **Dependencies** (`frontend/package.json`, `frontend/vite.config.ts`)
    - ✅ **Removed unused MediaPipe packages** - Cleaned up old `@mediapipe/*` dependencies
    - ✅ **Updated Vite config** - Only includes `@mediapipe/tasks-vision` in optimizeDeps

#### Pending Components

1. **Pose-to-Gloss Translation** (Not Started)
   - Need to implement ML model for pose sequence to gloss translation
   - Available models: OpenHands, CorrNet, WLASL
   - This is the core translation logic

2. **Gloss-to-Text Translation** (Not Started)
   - Need to implement gloss to natural language text conversion
   - Could use existing translation APIs or custom models

3. **Backend Integration** (Not Started)
   - Need to create backend endpoints for signed-to-spoken translation
   - Model hosting and inference on server side

### Important Decisions

1. **MediaPipe Library Choice**
   - **Decision**: Switched from `@mediapipe/pose` + `@mediapipe/hands` to `@mediapipe/tasks-vision`
   - **Reason**: The old packages don't have proper ES module exports, causing Vite build failures. The new `tasks-vision` package has proper ES module support and a cleaner API.

2. **Model Selection**
   - **Decision**: Use "heavy" pose model as default (mapped from "full" option)
   - **Reason**: The "full" model doesn't exist in MediaPipe Tasks Vision. Only "lite" and "heavy" are available. Heavy provides better accuracy for sign language detection.

3. **Camera Frame Rate**
   - **Decision**: Default to 30fps for pose detection (not 120fps)
   - **Reason**: 120fps is not supported by most webcams and causes unnecessary processing overhead. 30fps is sufficient for sign language detection.

4. **Pose History Management**
   - **Decision**: Use circular buffer instead of creating new arrays
   - **Reason**: At 30fps, creating new arrays every frame causes GC pressure. Circular buffer with pre-allocated array is more efficient.

5. **Integration Approach**
   - **Decision**: Integrate signed-to-spoken into existing `TranslatePage.tsx` instead of separate page
   - **Reason**: User clarified that `TranslatePage.tsx` is the main translation page. This provides a unified interface for both translation directions.

6. **Camera Auto-Start Behavior**
   - **Decision**: Camera does NOT auto-start when selecting sign language
   - **Reason**: User requested manual control. Camera only starts when user clicks camera icon or video area. This prevents unexpected camera activation and respects user privacy.

7. **Video Upload with Pose Detection**
   - **Decision**: Support both webcam and video upload for pose detection
   - **Reason**: Users may want to analyze pre-recorded videos. Pose detection runs in real-time while video plays, with canvas overlay showing landmarks.

8. **Mirror Effect Control**
   - **Decision**: Add `mirror` prop to PoseCanvas (default: true)
   - **Reason**: Webcam needs mirror effect (like a mirror), but uploaded videos should display in original orientation. This prop allows control per use case.

9. **Rate Limiting Strategy**
   - **Decision**: Implement in-memory rate limiting (10 req/min per IP)
   - **Reason**: Simple, effective protection against abuse without external dependencies. Uses IP headers for client identification.

10. **Security - No Hardcoded Secrets**
    - **Decision**: Remove all hardcoded API keys and fallback values
    - **Reason**: Hardcoded secrets in source code are a security anti-pattern. App should fail fast with clear error messages if required env vars are missing.

### Known Issues

1. **Error Recovery**
   - No retry mechanism for camera failures
   - User needs to manually retry after camera error

2. **Performance**
   - Pose detection on uploaded video runs continuously while playing
   - Could add frame skipping for very long videos

### Next Steps

1. **Implement Pose-to-Gloss Translation**
   - Research and select appropriate ML model (OpenHands, CorrNet, or WLASL)
   - Set up model inference pipeline
   - Test with sample pose sequences

2. **Implement Gloss-to-Text Translation**
   - Integrate with existing translation APIs
   - Handle language-specific gloss-to-text conversion
   - Test with various sign languages

3. **Backend Integration**
   - Create Spring Boot endpoints for signed-to-spoken translation
   - Host ML models on server
   - Implement proper error handling and rate limiting

4. **Testing**
   - Test with real sign language videos
   - Validate accuracy across different sign languages
   - Performance testing and optimization

5. **User Experience Improvements**
   - Add retry mechanism for camera failures
   - Add frame rate control for video analysis
   - Add export/import pose data for debugging

### Files Modified

- `frontend/src/services/mediaPipeService.ts` - Complete rewrite for tasks-vision
- `frontend/src/hooks/useCamera.ts` - New file
- `frontend/src/hooks/usePoseDetection.ts` - Updated for tasks-vision
- `frontend/src/components/PoseCanvas.tsx` - New file
- `frontend/src/pages/translate/TranslatePage.tsx` - Integrated signed-to-spoken
- `frontend/vite.config.ts` - Added MediaPipe optimization
- `frontend/package.json` - Added `@mediapipe/tasks-vision`

### References

- `docs/implementation_plan.md` - Detailed roadmap for signed-to-spoken implementation
- MediaPipe Tasks Vision: https://developers.google.com/mediapipe/solutions/vision
- Sign.MT: https://sign.mt - Reference implementation (Angular)

## Important Files

### Frontend
- `frontend/src/pages/translate/TranslatePage.tsx` - Main translation UI
- `frontend/src/services/translationApi.ts` - API client for translation endpoints
- `frontend/src/services/mediaPipeService.ts` - MediaPipe integration
- `frontend/src/hooks/useTranslation.ts` - React Query hooks for translation
- `frontend/src/components/translate/PoseViewer.tsx` - Sign language animation viewer
- `frontend/src/store/settingsStore.ts` - User settings persistence

### Backend
- `backend/src/main/java/com/signlearn/controller/TranslateController.java` - Translation endpoints
- `backend/src/main/java/com/signlearn/service/translate/SpokenToSignedService.java` - Spoken-to-signed logic
- `backend/src/main/java/com/signlearn/service/AppCheckTokenService.java` - Token caching
- `backend/src/main/resources/application.yaml` - Spring Boot configuration

## Testing

- Frontend tests: Run `npm test` (if configured)
- Backend tests: Run `./mvnw test` in backend directory

## CORS Configuration

The backend allows CORS from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000`
- `http://localhost` and `http://127.0.0.1`

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **sign-learn-app** (1910 symbols, 4660 relationships, 137 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/sign-learn-app/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/sign-learn-app/context` | Codebase overview, check index freshness |
| `gitnexus://repo/sign-learn-app/clusters` | All functional areas |
| `gitnexus://repo/sign-learn-app/processes` | All execution flows |
| `gitnexus://repo/sign-learn-app/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->