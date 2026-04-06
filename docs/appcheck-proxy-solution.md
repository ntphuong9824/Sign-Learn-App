# Giải Pháp AppCheck Token Proxy

## Tổng Quan

Vì không có quyền truy cập Firebase project của sign.mt, chúng ta sử dụng giải pháp **Proxy Token**:

1. **Angular/React Frontend** lấy AppCheck token từ Firebase
2. **Frontend gửi token đến Spring Boot** để cache
3. **Spring Boot sử dụng token** khi gọi external APIs

---

## Kiến Trúc

```
┌─────────────────┐
│  Angular/React  │
│  (có AppCheck)  │
└────────┬────────┘
         │ 1. Lấy AppCheck token
         │ 2. Gửi token đến backend
         ▼
┌─────────────────┐
│  Spring Boot    │
│  (Cache token)  │
└────────┬────────┘
         │ 3. Sử dụng token khi gọi API
         ▼
┌─────────────────┐
│  sign.mt API    │
│  (cần AppCheck) │
└─────────────────┘
```

---

## Các File Đã Tạo

### Backend (Spring Boot)

| File | Mô tả |
|------|-------|
| `AppCheckTokenService.java` | Service quản lý cache AppCheck token |
| `AppCheckController.java` | Controller nhận và quản lý token |
| `AppCheckTokenRequest.java` | DTO cho request token |
| `TextNormalizationService.java` | Cập nhật để dùng token từ service |
| `SignWritingService.java` | Cập nhật để dùng token từ service |
| `SpokenToSignedService.java` | Cập nhật để dùng token từ service |

### Frontend (React)

| File | Mô tả |
|------|-------|
| `appCheckApi.ts` | API service để giao tiếp với backend |

---

## API Endpoints

### 1. Gửi AppCheck Token

**Endpoint:** `POST /api/v1/appcheck/token`

**Headers:**
```
X-Client-Source: react
Content-Type: application/json
```

**Body:**
```json
{
  "token": "your_app_check_token_here"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Token stored successfully",
  "source": "react"
}
```

### 2. Kiểm Tra Trạng Thái Token

**Endpoint:** `GET /api/v1/appcheck/status`

**Response:**
```json
{
  "hasValidToken": true,
  "tokenInfo": {
    "react": "2026-04-06T10:30:00",
    "angular": "2026-04-06T10:25:00"
  }
}
```

### 3. Xóa Token

**Endpoint:** `DELETE /api/v1/appcheck/token`

**Response:**
```json
{
  "status": "success",
  "message": "All tokens cleared"
}
```

---

## Cách Sử Dụng

### Bước 1: Frontend lấy AppCheck token

**Trong React:**

```typescript
import { appCheckApi } from '../services/appCheckApi';

// Lấy token từ Firebase AppCheck (cần cấu hình Firebase)
const getAppCheckToken = async () => {
  try {
    const { getToken } = await import('firebase/app-check');
    const appCheck = getToken();
    const result = await appCheck.getToken({ forceRefresh: false });
    return result.token;
  } catch (error) {
    console.error('Failed to get AppCheck token:', error);
    return null;
  }
};

// Gửi token đến backend
const sendTokenToBackend = async () => {
  const token = await getAppCheckToken();
  if (token) {
    await appCheckApi.sendToken(token, 'react');
    console.log('Token sent to backend successfully');
  }
};

// Gọi khi app khởi động
sendTokenToBackend();
```

**Trong Angular:**

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppCheckProxyService {
  constructor(private http: HttpClient) {}

  // Angular đã có AppCheck token, chỉ cần gửi đến backend
  sendTokenToBackend() {
    // Lấy token từ AppCheck service
    const token = this.getAppCheckToken();

    this.http.post('/api/v1/appcheck/token', { token }, {
      headers: { 'X-Client-Source': 'angular' }
    }).subscribe({
      next: (response) => console.log('Token sent:', response),
      error: (error) => console.error('Failed to send token:', error)
    });
  }

  private getAppCheckToken(): string {
    // Lấy token từ AppCheck service
    // ...
    return 'your_token_here';
  }
}
```

### Bước 2: Spring Boot tự động sử dụng token

Khi có token trong cache, các service sẽ tự động thêm vào headers:

```java
// TextNormalizationService, SignWritingService, SpokenToSignedService
String appCheckToken = appCheckTokenService.getToken();
if (appCheckToken != null && !appCheckToken.isEmpty()) {
    headers.set("X-Firebase-AppCheck", appCheckToken);
    headers.set("X-AppCheck-Token", appCheckToken);
}
```

### Bước 3: Làm mới token định kỳ

AppCheck token hết hạn sau khoảng 1 giờ. Cần làm mới:

```typescript
// Làm mới token mỗi 45 phút
setInterval(() => {
  sendTokenToBackend();
}, 45 * 60 * 1000);
```

---

## Cấu Hình Firebase AppCheck Cho React

### 1. Cài đặt Firebase

```bash
npm install firebase
```

### 2. Cấu hình AppCheck

```typescript
// firebase.ts
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  // Firebase config của bạn
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ...
};

const app = initializeApp(firebaseConfig);

// Cấu hình AppCheck
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('your-recaptcha-site-key'),
  isTokenAutoRefreshEnabled: true,
});

export { appCheck };
```

### 3. Lấy token

```typescript
import { appCheck } from './firebase';

const getToken = async () => {
  const result = await appCheck.getToken({ forceRefresh: false });
  return result.token;
};
```

---

## Test với Postman

### 1. Gửi token

```
POST http://localhost:8080/api/v1/appcheck/token
Headers:
  X-Client-Source: postman
  Content-Type: application/json
Body:
  {
    "token": "your_test_token_here"
  }
```

### 2. Kiểm tra trạng thái

```
GET http://localhost:8080/api/v1/appcheck/status
```

### 3. Test translation với token

```
GET http://localhost:8080/api/v1/translate/normalize?lang=en&text=Hello
```

---

## Lưu Ý Quan Trọng

### ⚠️ Security

1. **Token chỉ lưu trong memory** - không lưu vào database
2. **Token có thời hạn** - tự động hết hạn sau 50 phút
3. **Chỉ frontend có AppCheck** - backend không thể tự tạo token

### 🔧 Troubleshooting

**Lỗi: "No AppCheck token available"**

- Frontend chưa gửi token đến backend
- Token đã hết hạn
- Kiểm tra `/api/v1/appcheck/status`

**Lỗi: 401 Unauthenticated từ sign.mt**

- Token không hợp lệ
- Token đã hết hạn
- Gửi token mới từ frontend

**Lỗi: 403 Forbidden từ sign.mt**

- Token không đúng format
- Kiểm tra headers có đúng không

---

## So Sánh Với Các Giải Pháp Khác

| Giải Pháp | Ưu điểm | Nhược điểm |
|-----------|---------|------------|
| **Proxy Token** | ✅ Không cần Firebase credentials<br>✅ Frontend tự quản lý token<br>✅ Token tự động làm mới | ❌ Phụ thuộc vào frontend<br>❌ Cần frontend chạy để có token |
| **Environment Variable** | ✅ Đơn giản<br>✅ Không phụ thuộc frontend | ❌ Cần Firebase credentials<br>❌ Token hết hạn phải cập nhật thủ công |
| **Contact sign.mt** | ✅ Giải pháp chính thống<br>✅ Có thể dùng API key | ❌ Phụ thuộc vào bên thứ 3<br>❌ Có thể bị từ chối |

---

## Kết Luận

Giải pháp **Proxy Token** là cách tốt nhất khi:
- Không có quyền truy cập Firebase project
- Frontend đã có AppCheck được cấu hình
- Cần giải pháp tạm thời trong khi chờ API key chính thức

Nếu có thể liên hệ với sign.mt team, nên yêu cầu:
- API key thay thế cho AppCheck
- Service account credentials
- Hoặc whitelist IP của server
