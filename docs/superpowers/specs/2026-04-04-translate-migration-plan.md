# Translation Feature Migration Plan
## Angular + Firebase Functions → React + Spring Boot

---

## 1. Current Architecture

### Frontend (Angular)
```
src/app/modules/translate/
├── translate.service.ts          # Main translation service
├── translate.actions.ts          # State actions
├── translate.state.ts            # State management
├── language-detection/           # Language detection
│   ├── cld3.service.ts          # Compact Language Detection
│   ├── language-detection.service.ts
│   └── mediapipe.service.ts
└── signwriting-translation.service.ts

src/app/pages/translate/
├── spoken-to-signed/             # Text → Sign animation
├── signed-to-spoken/             # Video/Pose → Text
├── signwriting/                  # SignWriting conversion
├── pose-viewers/                 # Render pose data
│   ├── human-pose-viewer/
│   ├── skeleton-pose-viewer/
│   └── avatar-pose-viewer/
└── language-selectors/           # Language selection UI
```

### Backend (Firebase Functions)
```
functions/src/
├── text-normalization/           # Normalize input text
│   ├── controller.ts
│   ├── model/
│   └── README.md
├── text-to-text/                 # Spoken language translation
│   ├── controller.ts
│   ├── model/
│   └── README.md
├── gateway/                      # API Gateway
│   ├── controller.ts
│   ├── spoken-to-signed.ts
│   ├── avatars.ts
│   ├── me.ts
│   └── utils.ts
└── prerender/                    # SSR
```

---

## 2. Translation Features to Migrate

### Feature 1: Text Normalization
| Aspect | Details |
|--------|---------|
| **Input** | Text in spoken language + language code |
| **Output** | Normalized text (punctuation, numbers, etc.) |
| **API** | `GET /api/v1/translate/normalize?lang=en&text=hello` |
| **Status** | External API dependency (sign.mt) |

### Feature 2: Spoken-to-Signed Translation
| Aspect | Details |
|--------|---------|
| **Input** | Text, spoken language, signed language |
| **Output** | Pose JSON data for animation |
| **API** | `GET /api/v1/translate/spoken-to-signed?text=X&spoken=en&signed=ase` |
| **Status** | External API dependency (Firebase cloud function) |

### Feature 3: SignWriting Description
| Aspect | Details |
|--------|---------|
| **Input** | SignWriting notation (FSW) |
| **Output** | Human-readable description |
| **API** | `POST /api/v1/translate/signwriting/describe` |
| **Status** | External API dependency (sign.mt) |

### Feature 4: Language Detection
| Aspect | Details |
|--------|---------|
| **Input** | Text string |
| **Output** | Detected language code |
| **Implementation** | Client-side (CLD3) - keep in React |

---

## 3. Migration Strategy

### Phase 1: Setup Spring Boot Backend

#### Step 1.1: Create Spring Boot Project
```bash
# Use Spring Initializr or create manually
# Dependencies:
# - Spring Web
# - Spring Data JPA
# - Spring Security
# - PostgreSQL Driver
# - Firebase Admin SDK
# - Lombok
# - Validation
```

#### Step 1.2: Create Project Structure
```
backend/src/main/java/com/signlearn/
├── SignLearnApplication.java
├── config/
│   ├── SecurityConfig.java
│   ├── FirebaseConfig.java
│   └── CorsConfig.java
├── controller/
│   └── translate/
│       └── TranslateController.java
├── service/
│   └── translate/
│       ├── TextNormalizationService.java
│       ├── SpokenToSignedService.java
│       └── SignWritingService.java
├── dto/
│   ├── NormalizeRequest.java
│   ├── NormalizeResponse.java
│   ├── TranslateRequest.java
│   └── TranslateResponse.java
└── exception/
    └── TranslationException.java
```

#### Step 1.3: Implement Translation Endpoints
```java
// TranslateController.java
@RestController
@RequestMapping("/api/v1/translate")
public class TranslateController {

    @GetMapping("/normalize")
    public ResponseEntity<NormalizeResponse> normalize(
            @RequestParam String lang,
            @RequestParam String text) {
        // Call external normalization API
    }

    @GetMapping("/spoken-to-signed")
    public ResponseEntity<TranslateResponse> spokenToSigned(
            @RequestParam String text,
            @RequestParam String spoken,
            @RequestParam String signed) {
        // Proxy to existing Firebase function or new implementation
    }

    @PostMapping("/signwriting/describe")
    public ResponseEntity<SignWritingResponse> describeSignWriting(
            @RequestBody SignWritingRequest request) {
        // Call sign.mt API
    }
}
```

---

### Phase 2: Setup React Frontend

#### Step 2.1: Create React Project
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

#### Step 2.2: Install Dependencies
```bash
# Core
npm install react-router-dom @tanstack/react-query zustand

# UI
npm install tailwindcss postcss autoprefixer

# Translation related
# - Keep MediaPipe for pose detection
# - Keep existing animation libraries

# API
npm install axios
```

#### Step 2.3: Create Translation Module Structure
```
frontend/src/
├── components/
│   └── translate/
│       ├── LanguageSelector/
│       ├── TextInput/
│       ├── PoseViewer/
│       │   ├── HumanPoseViewer.tsx
│       │   ├── SkeletonPoseViewer.tsx
│       │   └── AvatarPoseViewer.tsx
│       └── TranslationResult/
├── pages/
│   └── translate/
│       ├── SpokenToSigned.tsx
│       ├── SignedToSpoken.tsx
│       ├── SignWriting.tsx
│       └── TranslatePage.tsx
├── services/
│   └── translate/
│       └── translationApi.ts
├── hooks/
│   └── useTranslation.ts
├── types/
│   └── translation.ts
└── utils/
    └── languageCodes.ts
```

---

## 4. API Mapping

### Old → New Endpoints

| Old (Firebase) | New (Spring Boot) | Method |
|----------------|-------------------|--------|
| `sign.mt/api/text-normalization` | `/api/v1/translate/normalize` | GET |
| `us-central1-sign-mt/spoken_text_to_signed_pose` | `/api/v1/translate/spoken-to-signed` | GET |
| `sign.mt/api/signwriting-description` | `/api/v1/translate/signwriting/describe` | POST |

### Frontend Service Changes

```typescript
// Old (Angular)
translateService.normalizeSpokenLanguageText(lang, text)
translateService.translateSpokenToSigned(text, spoken, signed)

// New (React)
translationApi.normalize(lang, text)
translationApi.spokenToSigned(text, spoken, signed)
```

---

## 5. Implementation Tasks

### Backend Tasks
| ID | Task | Priority |
|----|------|----------|
| B1 | Create Spring Boot project structure | P0 |
| B2 | Configure security (JWT + Firebase) | P0 |
| B3 | Implement normalize endpoint | P1 |
| B4 | Implement spoken-to-signed endpoint | P1 |
| B5 | Implement signwriting describe endpoint | P1 |
| B6 | Add rate limiting | P2 |
| B7 | Add request logging | P2 |

### Frontend Tasks
| ID | Task | Priority |
|----|------|----------|
| F1 | Setup React + Vite project | P0 |
| F2 | Configure routing | P0 |
| F3 | Create translation API service | P0 |
| F4 | Implement LanguageSelector component | P0 |
| F5 | Implement SpokenToSigned page | P0 |
| F6 | Implement PoseViewer components | P0 |
| F7 | Migrate SignWriting page | P1 |
| F8 | Migrate SignedToSpoken page | P1 |
| F9 | Add loading states & error handling | P1 |
| F10 | Style with TailwindCSS | P2 |

---

## 6. Data Types

### Translation Request/Response

```typescript
// types/translation.ts
export interface NormalizeRequest {
  lang: string;
  text: string;
}

export interface NormalizeResponse {
  text: string;
}

export interface TranslateRequest {
  text: string;
  spoken: string;  // e.g., 'en'
  signed: string;  // e.g., 'ase' (American Sign Language)
}

export interface TranslateResponse {
  poseData: PoseData;
  animationUrl?: string;
}

export interface PoseData {
  landmarks: Landmark[][];
  worldLandmarks: Landmark[][];
  transformation?: any;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface SignWritingRequest {
  fsw: string;
}

export interface SignWritingResponse {
  description: string;
}
```

### Language Options

```typescript
// Keep existing from Angular - migrate to TypeScript
export const SIGNED_LANGUAGES = [
  { code: 'ase', name: 'American Sign Language' },
  { code: 'gsg', name: 'German Sign Language' },
  { code: 'fsl', name: 'French Sign Language' },
  // ... more
];

export const SPOKEN_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  // ... more (100+ languages)
];
```

---

## 7. Pose Viewer Components

### Reuse Existing Implementation
The pose viewer components will be migrated with minimal changes:

| Component | Angular → React | Notes |
|-----------|-----------------|-------|
| HumanPoseViewer | Rewrite | Canvas rendering |
| SkeletonPoseViewer | Rewrite | SVG or Canvas |
| AvatarPoseViewer | Rewrite | Canvas + sprites |

### Key Changes
- Use React refs instead of Angular ElementRef
- Use useEffect for canvas initialization
- Convert RxJS observables to React hooks

---

## 8. External Dependencies

### Keep as-is (continue using)
| Service | Purpose | Migration |
|---------|---------|-----------|
| sign.mt API | Text normalization | Proxy through Spring Boot |
| sign.mt API | SignWriting description | Proxy through Spring Boot |
| Firebase Functions (temp) | Spoken-to-signed | Migrate to Spring Boot later |
| Firebase Storage | Media files | Keep using Firebase |

---

## 9. Testing Strategy

### Backend Tests
- Unit tests for services
- Integration tests for controllers
- Mock external API calls

### Frontend Tests
- Component tests with React Testing Library
- Integration tests for translation flow
- E2E with Cypress (optional)

---

## 10. Timeline Estimation

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Backend setup + normalize | 2 hours |
| Phase 2 | Frontend setup + routing | 2 hours |
| Phase 3 | Translation API + SpokenToSigned | 4 hours |
| Phase 4 | Pose viewers migration | 4 hours |
| Phase 5 | SignWriting + SignedToSpoken | 3 hours |
| Phase 6 | Testing + Polish | 2 hours |
| **Total** | | **17 hours** |

---

## 11. Notes

### Keep on Client-side
- MediaPipe loading and initialization
- Pose detection from video
- Animation rendering
- Language detection (CLD3)

### Move to Backend
- Text normalization API calls
- Translation API calls
- Future: ML model inference for signed-to-spoken

### Future Enhancements (Post-Migration)
- Cache translation results
- Add user translation history
- Implement signed-to-spoken ML backend
- Add offline support with service workers
