# Sign Language Learning App - Backend Migration & Feature Expansion Design

## 1. Project Overview

### Project Name
Sign Language Learning Web Application (SignTranslate)

### Project Type
Full-stack web application for learning sign language

### Core Functionality
A web application that translates between spoken/written language and sign language, featuring user authentication, course management, community features, interactive practice mode, and admin dashboard.

### Target Users
- Learners wanting to learn sign language
- Instructors creating and managing courses
- Administrators managing the platform

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18+ | UI Framework |
| Vite | 5+ | Build tool |
| TypeScript | 5+ | Type safety |
| React Router | 6+ | Navigation |
| TanStack Query | 5+ | Data fetching |
| Zustand | 4+ | State management |
| TailwindCSS | 3+ | Styling |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 17+ | Runtime |
| Spring Boot | 3.x | Framework |
| Spring Security | 6.x | Authentication |
| Spring Data JPA | 3.x | ORM |
| Spring WebSocket | 6.x | Realtime |
| PostgreSQL | 15+ | Primary database |
| Firebase SDK | 11+ | Storage & Auth |

### Infrastructure
- Docker & Docker Compose for local development
- Git for version control

---

## 3. Architecture

### System Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│                   React Frontend                        │
│                  (Vite + TypeScript)                    │
└─────────────────────────┬───────────────────────────────┘
                          │
                    HTTPS/WSS
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Spring Boot Backend (v3.x)                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │                 REST Controllers                 │   │
│  │  Auth | Course | Community | Practice | Admin   │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │                  Services Layer                  │   │
│  │ AuthService | CourseService | CommunityService  │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │                Repository Layer                  │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────┬────────────────────┬────────────────────┘
               │                    │
               ▼                    ▼
    ┌──────────────────┐  ┌──────────────────┐
    │   PostgreSQL     │  │    Firebase      │
    │  (Primary DB)    │  │ (Auth, Storage)  │
    │                  │  │                  │
    │ - Users          │  │ - File storage   │
    │ - Courses        │  │ - Social auth    │
    │ - Lessons        │  │ - Push notifs    │
    │ - Progress       │  │                  │
    │ - Community      │  │                  │
    │ - Practice       │  │                  │
    └──────────────────┘  └──────────────────┘
```

### Data Distribution
| Data Type | Storage | Reason |
|-----------|---------|--------|
| User accounts | PostgreSQL + Firebase Auth | Relational queries, social login |
| Courses & Lessons | PostgreSQL | Complex relationships |
| Progress tracking | PostgreSQL | Analytics & queries |
| Community posts | PostgreSQL | Search & moderation |
| Videos & Images | Firebase Storage | Large file handling |
| Real-time notifs | Firebase Cloud Messaging | Push notifications |

---

## 4. Module Design

### 4.1 Authentication Module

#### Features
- User registration (email/password)
- Login with email/password
- JWT-based authentication
- Token refresh mechanism
- Role-based access control (USER, ADMIN)
- Firebase authentication integration for social login

#### Data Model
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String displayName;
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;
}

public enum Role {
    USER,
    ADMIN
}
```

#### API Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/v1/auth/register | Register new user | Public |
| POST | /api/v1/auth/login | Login | Public |
| POST | /api/v1/auth/refresh | Refresh token | Required |
| GET | /api/v1/auth/me | Get current user | Required |
| PUT | /api/v1/auth/me | Update profile | Required |
| POST | /api/v1/auth/logout | Logout | Required |

---

### 4.2 Course Module

#### Features
- Course CRUD operations
- Lesson management within courses
- Progress tracking per user
- Course publishing workflow (Draft/Published)
- Course categories and tags

#### Data Model
```java
@Entity
@Table(name = "courses")
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String thumbnailUrl;

    @Enumerated(EnumType.STRING)
    private CourseStatus status; // DRAFT, PUBLISHED

    @ManyToOne
    private User instructor;

    private String category;
    private String tags; // JSON array

    private Integer durationMinutes;
    private Integer lessonCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

@Entity
@Table(name = "lessons")
public class Lesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String videoUrl;
    private Integer orderIndex;
    private Integer durationMinutes;

    @ManyToOne
    private Course course;

    private LocalDateTime createdAt;
}

@Entity
@Table(name = "user_progress")
public class UserProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User user;

    @ManyToOne
    private Lesson lesson;

    private Boolean completed;
    private Integer watchTimeSeconds;
    private LocalDateTime completedAt;
}
```

#### API Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/v1/courses | List courses | Public |
| GET | /api/v1/courses/{id} | Get course details | Public |
| POST | /api/v1/courses | Create course | Admin |
| PUT | /api/v1/courses/{id} | Update course | Admin |
| DELETE | /api/v1/courses/{id} | Delete course | Admin |
| GET | /api/v1/courses/{id}/lessons | Get course lessons | Public |
| POST | /api/v1/lessons | Create lesson | Admin |
| PUT | /api/v1/lessons/{id} | Update lesson | Admin |
| POST | /api/v1/lessons/{id}/progress | Update progress | User |

---

### 4.3 Community Module

#### Features
- User profiles with avatars
- Post creation (text, images, videos)
- Comments on posts
- Reactions (like, love, etc.)
- Following system
- User activity feed

#### Data Model
```java
@Entity
@Table(name = "posts")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne
    private User author;

    private String mediaUrl; // Firebase Storage URL
    private String mediaType; // IMAGE, VIDEO

    private Integer likeCount;
    private Integer commentCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

@Entity
@Table(name = "comments")
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne
    private Post post;

    @ManyToOne
    private User author;

    private LocalDateTime createdAt;
}

@Entity
@Table(name = "reactions")
public class Reaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Post post;

    @ManyToOne
    private User user;

    @Enumerated(EnumType.STRING)
    private ReactionType type; // LIKE, LOVE, WOW

    private LocalDateTime createdAt;
}

@Entity
@Table(name = "follows")
public class Follow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User follower;

    @ManyToOne
    private User following;

    private LocalDateTime createdAt;
}
```

#### API Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/v1/community/posts | List posts | Public |
| GET | /api/v1/community/posts/{id} | Get post | Public |
| POST | /api/v1/community/posts | Create post | User |
| PUT | /api/v1/community/posts/{id} | Update post | Owner |
| DELETE | /api/v1/community/posts/{id} | Delete post | Owner |
| POST | /api/v1/community/posts/{id}/comments | Add comment | User |
| DELETE | /api/v1/community/comments/{id} | Delete comment | Owner |
| POST | /api/v1/community/posts/{id}/react | React to post | User |
| POST | /api/v1/community/users/{id}/follow | Follow user | User |
| DELETE | /api/v1/community/users/{id}/follow | Unfollow user | User |

---

### 4.4 Practice Module

#### Features
- Interactive practice sessions
- Pose comparison with ML models
- Session history and feedback
- Practice recommendations

#### Data Model
```java
@Entity
@Table(name = "practice_sessions")
public class PracticeSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private User user;

    private String targetSign; // Sign to practice

    @Column(columnDefinition = "TEXT")
    private String userVideoUrl; // Firebase Storage

    private Float similarityScore;

    @Enumerated(EnumType.STRING)
    private SessionStatus status; // IN_PROGRESS, COMPLETED

    private Integer durationSeconds;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}

@Entity
@Table(name = "practice_feedback")
public class PracticeFeedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private PracticeSession session;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    private Integer handPositionScore;
    private Integer movementScore;
    private Integer timingScore;

    private LocalDateTime createdAt;
}
```

#### API Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/v1/practice/sessions | Start session | User |
| GET | /api/v1/practice/sessions | Get session history | User |
| GET | /api/v1/practice/sessions/{id} | Get session details | User |
| PUT | /api/v1/practice/sessions/{id} | Update session | User |
| POST | /api/v1/practice/sessions/{id}/feedback | Submit feedback | User |
| GET | /api/v1/practice/recommendations | Get recommendations | User |

---

### 4.5 Admin Module

#### Features
- User management (view, update role, ban)
- Content moderation (view, delete posts/comments)
- Analytics dashboard
- Course management
- System settings

#### API Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/v1/admin/users | List users | Admin |
| GET | /api/v1/admin/users/{id} | Get user details | Admin |
| PUT | /api/v1/admin/users/{id}/role | Update user role | Admin |
| PUT | /api/v1/admin/users/{id}/ban | Ban/unban user | Admin |
| GET | /api/v1/admin/posts | List all posts | Admin |
| DELETE | /api/v1/admin/posts/{id} | Delete post | Admin |
| GET | /api/v1/admin/analytics | Get analytics | Admin |
| GET | /api/v1/admin/analytics/users | User analytics | Admin |
| GET | /api/v1/admin/analytics/courses | Course analytics | Admin |

---

## 5. Security Design

### Authentication Flow
```
1. User registers/logins
2. Server validates credentials
3. Server generates JWT (access token) + refresh token
4. Client stores tokens securely
5. Client includes access token in Authorization header
6. Server validates token on each request
7. Token expires → Client uses refresh token to get new access token
```

### JWT Configuration
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry
- Token contains: userId, email, role

### Security Measures
- Password hashing: BCrypt
- CORS configuration for frontend origin
- Rate limiting on auth endpoints
- Input validation with Jakarta Bean Validation
- SQL injection prevention via JPA parameterized queries

---

## 6. File Structure

### Backend Structure
```
backend/
├── src/
│   └── main/
│       ├── java/com/signtranslate/
│       │   ├── SignTranslateApplication.java
│       │   ├── config/
│       │   │   ├── SecurityConfig.java
│       │   │   ├── CorsConfig.java
│       │   │   ├── FirebaseConfig.java
│       │   │   ├── WebSocketConfig.java
│       │   │   └── DataSourceConfig.java
│       │   ├── controller/
│       │   │   ├── auth/
│       │   │   ├── course/
│       │   │   ├── community/
│       │   │   ├── practice/
│       │   │   └── admin/
│       │   ├── service/
│       │   │   ├── impl/
│       │   │   └── interfaces/
│       │   ├── repository/
│       │   ├── model/
│       │   │   ├── entity/
│       │   │   ├── dto/
│       │   │   └── enums/
│       │   ├── security/
│       │   │   ├── jwt/
│       │   │   └── filter/
│       │   └── exception/
│       │       ├── GlobalExceptionHandler.java
│       │       └── custom exceptions/
│       └── resources/
│           ├── application.yml
│           └── application-dev.yml
├── build.gradle
└── Dockerfile
```

### Frontend Structure (React)
```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   └── features/
│   ├── pages/
│   │   ├── auth/
│   │   ├── courses/
│   │   ├── community/
│   │   ├── practice/
│   │   └── admin/
│   ├── hooks/
│   ├── services/
│   │   └── api/
│   ├── stores/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── Dockerfile
```

### Docker Compose Structure
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: signtranslate
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: dev
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 7. Implementation Priorities

### Phase 1: Foundation
1. Setup Spring Boot project with dependencies
2. Configure PostgreSQL connection
3. Implement Authentication (register, login, JWT)
4. Setup Firebase integration

### Phase 2: Core Features
5. Course management (CRUD)
6. Lesson management
7. Progress tracking
8. User profile management

### Phase 3: Community
9. Post creation and feed
10. Comments and reactions
11. Follow system

### Phase 4: Practice
12. Practice session management
13. Video upload to Firebase
14. Feedback system

### Phase 5: Admin
15. User management
16. Content moderation
17. Analytics dashboard

### Phase 6: Polish
18. Real-time notifications
19. Testing
20. Documentation

---

## 8. Migration Notes

### From Firebase Functions to Spring Boot

| Firebase Functions | Spring Boot Equivalent |
|--------------------|------------------------|
| Express.js routes | @RestController |
| Firebase Auth | Spring Security + Firebase |
| Firestore | JPA + PostgreSQL |
| Cloud Storage | Firebase Storage SDK |
| onRequest | @RequestMapping |

### Keep on Frontend (replace Angular with React)
- MediaPipe integration (hand tracking, pose detection)
- Animation services
- Client-side ML models

---

## 9. Acceptance Criteria

### Authentication
- [x] Users can register with email/password
- [x] Users can login and receive JWT
- [x] Protected routes require valid token
- [x] Role-based access works correctly

### Courses
- [x] Admins can create/edit/delete courses
- [x] Users can view published courses
- [x] Progress is tracked per lesson

### Community
- [x] Users can create posts with media
- [x] Users can comment and react
- [x] Follow/unfollow works correctly

### Practice
- [x] Users can start practice sessions
- [x] Sessions are recorded in history
- [x] Feedback is stored

### Admin
- [x] Admins can manage users
- [x] Admins can moderate content
- [x] Analytics are viewable

---

## 10. Future Considerations

- Scale to microservices when user base grows
- Add video streaming for live sessions
- Implement AI-based pose correction suggestions
- Add certification system for completed courses
- Internationalization (i18n) support