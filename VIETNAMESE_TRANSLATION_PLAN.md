# Kế hoạch Triển khai Dịch Tiếng Việt - Ngôn ngữ Ký hiệu Việt Nam (VN-SL)

## Tổng quan
Triển khai chức năng dịch tiếng Việt sang ngôn ngữ ký hiệu Việt Nam sử dụng bộ dữ liệu VSL HamNoSys/SiGML và JASigning 3D avatar.

## Mục tiêu
- Thêm hỗ trợ dịch tiếng Việt (vi) → Ngôn ngữ ký hiệu Việt Nam (vnsl)
- Tương thích với cấu trúc `TranslateResponse` hiện tại
- Tích hợp vào kiến trúc Spring Boot + React hiện tại

## Phương pháp
Sử dụng bộ dữ liệu VSL (Vietnamese Sign Language) với HamNoSys/SiGML codes và JASigning 3D avatar để tạo animation URLs và pose data.

---

## Giai đoạn 1: Nghiên cứu và Chuẩn bị

### 1.1 Tải và Phân tích VSL Dataset
- [ ] Clone repository VSL: https://github.com/raianrido/VSL
- [ ] Phân tích cấu trúc dataset:
  - `DataTrain1.txt` - Training dataset Vietnamese → signed
  - `DataTrain2.txt` - Training dataset Vietnamese → unsigned
  - Synonyms list - Mapping text ↔ sign language
  - Dictionary VSL HamNoSys - 3,873 SiGML codes
- [ ] Hiểu format SiGML/HamNoSys codes
- [ ] Xác định số lượng và loại signs có sẵn

### 1.2 Nghiên cứu JASigning
- [ ] Tìm hiểu JASigning API và cách sử dụng
- [ ] Xác định cách tạo animation URLs từ SiGML codes
- [ ] Tìm hiểu cách extract pose data từ animations
- [ ] Kiểm tra tính tương thích với Spring Boot

### 1.3 Thiết kế Mapping Text → SiGML
- [ ] Phân tích synonyms list structure
- [ ] Thiết kế algorithm mapping text → SiGML codes
- [ ] Xác định cách xử lý từ không có trong dictionary
- [ ] Thiết kế fallback mechanism

---

## Giai đoạn 2: Backend Implementation

### 2.1 Tạo Data Models
- [ ] Tạo `SiGMLCode.java` - Model cho SiGML codes
- [ ] Tạo `VietnameseSignMapping.java` - Model cho mapping text → SiGML
- [ ] Tạo `VietnameseSignLanguageRequest.java` - Request DTO
- [ ] Cập nhật `TranslateResponse.java` (nếu cần)

### 2.2 Tạo Service Layer
- [ ] Tạo `VietnameseSignLanguageService.java`:
  - `translateVietnameseToSign(String text)` - Main translation method
  - `mapTextToSiGML(String text)` - Text to SiGML mapping
  - `createAnimationFromSiGML(String sigmlCode)` - Create animation URL
  - `extractPoseData(String animationUrl)` - Extract pose data
- [ ] Tạo `SiGMLDictionaryService.java`:
  - Load và cache SiGML dictionary
  - Search SiGML codes by text
  - Handle synonyms
- [ ] Tạo `JASigningService.java`:
  - Call JASigning API
  - Generate animation URLs
  - Handle errors

### 2.3 Tạo Controller Layer
- [ ] Cập nhật `TranslateController.java`:
  - Thêm endpoint `/api/v1/translate/vietnamese-to-sign`
  - Thêm endpoint `/api/v1/translate/sign-to-vietnamese` (optional)
- [ ] Thêm validation cho Vietnamese language requests

### 2.4 Configuration
- [ ] Cập nhật `application.properties`:
  - JASigning base URL
  - VSL dataset path
  - Cache configuration
- [ ] Tạo configuration class cho Vietnamese translation

---

## Giai đoạn 3: Frontend Implementation

### 3.1 Cập nhật Types
- [ ] Cập nhật `frontend/src/types/translation.ts`:
  - Thêm Vietnamese language code (`vi`)
  - Thêm VN-SL language code (`vnsl`)
  - Cập nhật `SPOKEN_LANGUAGES` array
  - Cập nhật `SIGNED_LANGUAGES` array

### 3.2 Cập nhật API Service
- [ ] Cập nhật `frontend/src/services/translationApi.ts`:
  - Thêm method `vietnameseToSign()`
  - Thêm method `signToVietnamese()` (optional)
- [ ] Thêm error handling cho Vietnamese translation

### 3.3 Cập nhật UI Components
- [ ] Cập nhật language selector components
- [ ] Thêm Vietnamese language options
- [ ] Cập nhật translation form
- [ ] Thêm loading states cho Vietnamese translation
- [ ] Thêm error messages specific to Vietnamese

---

## Giai đoạn 4: Testing

### 4.1 Unit Testing
- [ ] Test `SiGMLDictionaryService`:
  - Test loading dictionary
  - Test search functionality
  - Test synonym handling
- [ ] Test `VietnameseSignLanguageService`:
  - Test text to SiGML mapping
  - Test animation URL generation
  - Test pose data extraction
- [ ] Test `JASigningService`:
  - Test API calls
  - Test error handling

### 4.2 Integration Testing
- [ ] Test full translation flow:
  - Vietnamese text → SiGML → Animation URL → Pose data
- [ ] Test controller endpoints
- [ ] Test error scenarios

### 4.3 Manual Testing
- [ ] Test với các từ đơn giản
- [ ] Test với câu phức tạp
- [ ] Test với từ không có trong dictionary
- [ ] Test performance với nhiều requests

---

## Giai đoạn 5: Deployment

### 5.1 Preparation
- [ ] Package VSL dataset with application
- [ ] Configure production environment variables
- [ ] Set up JASigning service (if needed)

### 5.2 Deployment
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Verify production functionality

### 5.3 Monitoring
- [ ] Set up logging for Vietnamese translation
- [ ] Monitor performance metrics
- [ ] Track error rates

---

## Giai đoạn 6: Documentation

### 6.1 Technical Documentation
- [ ] Document Vietnamese translation architecture
- [ ] Document API endpoints
- [ ] Document data models
- [ ] Document configuration

### 6.2 User Documentation
- [ ] Update user guide with Vietnamese language support
- [ ] Add examples of Vietnamese translation
- [ ] Document limitations and known issues

---

## Rủi ro và Giải pháp

### Rủi ro 1: JASigning không tương thích
**Giải pháp:** Tìm alternative avatar systems hoặc build custom renderer

### Rủi ro 2: Dataset không đủ comprehensive
**Giải pháp:** Implement fallback mechanism và plan cho future expansion

### Rủi ro 3: Performance issues
**Giải pháp:** Implement caching, optimize algorithms, consider async processing

### Rủi ro 4: Mapping text → SiGML không chính xác
**Giải pháp:** Implement fuzzy matching, use ML for better mapping

---

## Timeline Ước tính

- **Giai đoạn 1:** 2-3 ngày
- **Giai đoạn 2:** 5-7 ngày
- **Giai đoạn 3:** 3-4 ngày
- **Giai đoạn 4:** 3-4 ngày
- **Giai đoạn 5:** 1-2 ngày
- **Giai đoạn 6:** 1-2 ngày

**Tổng cộng:** 15-22 ngày

---

## Resources

- VSL Dataset: https://github.com/raianrido/VSL
- JASigning: https://www.jasigning.org/
- HamNoSys: https://www.sign-lang.uni-hamburg.de/projekte/hamnosys.html
- SiGML: https://www.sign-lang.uni-hamburg.de/projekte/sigml.html

---

## Notes

- Plan này có thể được điều chỉnh tùy theo kết quả của giai đoạn nghiên cứu
- Cần xác định rõ requirements và scope trước khi bắt đầu implementation
- Cần test kỹ lưỡng với real data trước khi deploy
