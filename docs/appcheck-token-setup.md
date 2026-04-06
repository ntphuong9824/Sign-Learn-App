# Hướng Dẫn Cấu Hình Firebase AppCheck Token

## Tổng Quan

API `sign.mt` yêu cầu Firebase AppCheck token để xác thực. Tài liệu này hướng dẫn cách lấy và cấu hình AppCheck token.

---

## AppCheck Token Là Gì?

Firebase AppCheck giúp bảo vệ hệ thống khỏi việc bị lạm dụng bằng cách đảm bảo các request đến tài nguyên backend của bạn đến từ ứng dụng hợp lệ, không bị sửa đổi.

---

## Các Cách Lấy AppCheck Token

### Cách 1: Lấy Từ Ứng Dụng Angular (Khuyến Nghị Cho Môi Trường Phát Triển)

Ứng dụng Angular đã được cấu hình AppCheck. Bạn có thể lấy token từ console của trình duyệt:

1. Mở ứng dụng Angular trên trình duyệt
2. Mở Developer Tools (F12)
3. Chuyển sang tab Console
4. Chạy lệnh:

```javascript
// Get AppCheck token
import('firebase/app-check').then(({getAppCheck}) => {
  const appCheck = getAppCheck();
  appCheck.getToken({forceRefresh: false}).then(result => {
    console.log('AppCheck Token:', result.token);
  });
});
```

Hoặc đơn giản hơn:

```javascript
// If AppCheck is already initialized
firebase.appCheck().getToken().then(result => {
  console.log('AppCheck Token:', result.token);
});
```

### Cách 2: Sử Dụng Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Get AppCheck token (requires project setup)
firebase appcheck:serversitesecret get --project <your-project-id>
```

### Cách 3: Sử Dụng cURL Với Debug Token (Chỉ Dành Cho Môi Trường Phát Triển)

Trong quá trình phát triển, bạn có thể sử dụng debug token của Firebase:

```bash
# Get debug token from Firebase Console
# Firebase Console → App Check → Your App → Debug Tokens

# Use the token in your request
curl -X POST https://sign.mt/api/signwriting-description \
  -H "Content-Type: application/json" \
  -H "X-AppCheck-Token: <your-debug-token>" \
  -d '{"data":{"fsw":"AS14c20S15a04S2e704M525x535S2e704483x510"}}'
```

### Cách 4: Lấy Từ Tab Network

1. Mở ứng dụng Angular
2. Mở Developer Tools (F12)
3. Chuyển sang tab Network
4. Gửi một request có gọi đến API sign.mt
5. Chọn request đó
6. Kiểm tra phần Request Headers để tìm `X-AppCheck-Token` hoặc `X-Firebase-AppCheck`

---

## Cấu Hình Trong Spring Boot

### Lựa Chọn 1: Sử Dụng File .env

```bash
# .env file
APP_CHECK_TOKEN=your_app_check_token_here
```

### Lựa Chọn 2: Sử Dụng Biến Môi Trường

```bash
# Linux/Mac
export APP_CHECK_TOKEN=your_app_check_token_here

# Windows
set APP_CHECK_TOKEN=your_app_check_token_here
```

### Lựa Chọn 3: Sử Dụng application.yaml

```yaml
external-api:
  app-check:
    token: your_app_check_token_here
```

---

## Kiểm Thử Token

### Kiểm Thử Bằng cURL

```bash
# Test text normalization
curl.exe -X GET "https://sign.mt/api/text-normalization?lang=en&text=Hello" \
-H "X-AppCheck-Token: 412956f0-35ab-460e-a08d-1c5eb49cba3b"

# Test signwriting description
curl -X POST https://sign.mt/api/signwriting-description \
  -H "Content-Type: application/json" \
  -H "X-AppCheck-Token: <your-token>" \
  -d '{"data":{"fsw":"AS14c20S15a04S2e704M525x535S2e704483x510"}}'
```

### Kiểm Thử Bằng Postman

1. Tạo request mới
2. Thêm header: `X-AppCheck-Token` với giá trị token của bạn
3. Thêm header: `X-Firebase-AppCheck` với giá trị token của bạn
4. Gửi request

---

## Thời Hạn Token

- **Production tokens**: Hết hạn định kỳ (thường là 1 giờ)
- **Debug tokens**: Chỉ hợp lệ cho phát triển, thời gian hết hạn dài hơn

Trong môi trường production, bạn cần:
1. Triển khai logic làm mới token
2. Lưu trữ token an toàn
3. Xoay vòng token định kỳ

---

## Triển Khai Trong Spring Boot

Các service Spring Boot hiện tại tự động thêm AppCheck token:

### TextNormalizationService
```java
@Value("${external-api.app-check.token:}")
private String appCheckToken;

// Adds headers if token is available
if (appCheckToken != null && !appCheckToken.isEmpty()) {
    headers.set("X-Firebase-AppCheck", appCheckToken);
    headers.set("X-AppCheck-Token", appCheckToken);
}
```

### SignWritingService
```java
// Same implementation as above
```

### SpokenToSignedService
```java
// Same implementation as above
```

---

## Khắc Phục Sự Cố

### Lỗi: 401 Unauthenticated

**Nguyên nhân:** Thiếu AppCheck token hoặc token không hợp lệ

**Cách xử lý:**
1. Xác minh token đã được set trong môi trường
2. Kiểm tra token có bị hết hạn không
3. Đảm bảo headers được gửi đúng cách

### Lỗi: 403 Forbidden

**Nguyên nhân:** Token không hợp lệ hoặc đã hết hạn

**Cách xử lý:**
1. Lấy token mới
2. Kiểm tra định dạng token
3. Kiểm tra cấu hình Firebase AppCheck

### Lỗi: 400 Bad Request

**Nguyên nhân:** Định dạng request không đúng

**Cách xử lý:**
1. Kiểm tra định dạng request body có khớp kỳ vọng của API
2. Kiểm tra header Content-Type là `application/json`

---

## Lưu Ý Bảo Mật

⚠️ **Quan trọng:**

- Không bao giờ commit AppCheck token lên hệ thống quản lý mã nguồn
- Sử dụng biến môi trường để lưu trữ token
- Xoay vòng token định kỳ trong môi trường production
- Sử dụng token khác nhau cho từng môi trường
- Tuyệt đối KHÔNG dùng debug token trong production

---

## Tài Liệu Tham Khảo

- [Firebase AppCheck Documentation](https://firebase.google.com/docs/app-check)
- [Angular AppCheck Integration](https://firebase.google.com/docs/app-check/web)
- [Spring Boot Environment Variables](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.external-config)
