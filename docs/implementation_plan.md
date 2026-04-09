# Hoàn thiện chức năng Signed → Spoken

## Tổng quan

Hiện tại trang `SignedToSpokenPage.tsx` chỉ là placeholder với dummy data. Chức năng thực tế cần:
1. **Input:** Webcam live hoặc upload video
2. **Xử lý:** Phát hiện pose/tay qua MediaPipe (đã cài sẵn `@mediapipe/pose`, `@mediapipe/hands`)
3. **Output:** Hiển thị văn bản nói tương ứng

---

## Phân tích hiện trạng (Cập nhật 2026-04-09)

### ❌ sign.mt API KHÔNG có sẵn

Sau khi phân tích code của sign.mt:
- `signed-to-spoken.component.ts` chỉ là **placeholder với fake data** (hardcoded `FAKE_WORDS`)
- Không có API endpoint nào cho signed-to-spoken trong Firebase Functions
- Chỉ có `spoken-to-signed` endpoint hoạt động

### ✅ Pre-trained Models Có Sẵn

| Model | Loại | Input | Output | Độ chính xác |
|-------|------|-------|--------|--------------|
| **OpenHands BERT** | Isolated | Pose | Gloss | ~85% |
| **OpenHands SL-GCN** | Isolated | Pose | Gloss | ~80% |
| **CorrNet** | Continuous | Video | Gloss | Dev: 18.9%, Test: 19.7% WER |
| **WLASL I3D** | Isolated | Video | Gloss | ~66% |
| **WLASL TGCN** | Isolated | Pose | Gloss | ~70% |

**Vấn đề:** Các model này chỉ làm được **Pose → Gloss**, còn **Gloss → Text** thì không có pre-trained model.

---

## Pipeline Signed-to-Spoken Hoàn chỉnh

```
┌─────────────────────────────────────────────────────────────┐
│  VIDEO INPUT (Webcam/Upload)                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  POSE EXTRACTION (MediaPipe Holistic)                        │
│  ✅ Đã có trong project                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  SIGN RECOGNITION (Pose → Gloss)                             │
│  ✅ CÓ PRE-TRAINED MODELS (OpenHands, CorrNet, WLASL)       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  GLOSS → TEXT TRANSLATION                                    │
│  ❌ KHÔNG CÓ PRE-TRAINED MODEL (Cần tự phát triển)           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  SPOKEN TEXT OUTPUT                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Vấn đề Chính: Gloss ≠ Spoken Text

| Concept | Ví dụ | Giải thích |
|---------|-------|------------|
| **Gloss** | `HELLO WORLD` | Simplified representation, bỏ articles, grammar |
| **Spoken Text** | `Hello, how are you?` | Full sentence với grammar |

**Ví dụ thực tế:**
```
Sign Language: [HELLO] [YOU] [NAME] [WHAT]
Gloss:         HELLO YOU NAME WHAT
Spoken Text:   Hello, what's your name?
```

---

## Roadmap Phát Triển

### Phase 1: Tích hợp Pre-trained Model (Pose → Gloss)

**Độ khó:** ⭐⭐ (Dễ)
**Thời gian:** 1-2 tuần
**Tài nguyên:** 1 GPU, OpenHands library

**Bước thực hiện:**
1. Cài đặt OpenHands library
2. Download pre-trained checkpoint (WLASL BERT)
3. Tạo Python service với FastAPI
4. Tích hợp vào backend Spring Boot
5. Test với pose data từ MediaPipe

**Kết quả:** Có thể nhận diện isolated signs → gloss

---

### Phase 2: Gloss → Text Translation

**Độ khó:** ⭐⭐⭐ (Trung bình)
**Thời gian:** 2-4 tuần
**Tài nguyên:** 1 GPU, 1,000-5,000 gloss → text pairs

**Bước thực hiện:**
1. Thu thập dataset gloss → text cho VNSL
2. Fine-tune T5 hoặc MarianMT model
3. Tích hợp vào backend
4. Test và cải thiện

**Cách tiếp cận:**
```python
# Fine-tune T5
from transformers import T5ForConditionalGeneration, T5Tokenizer, Seq2SeqTrainer

model = T5ForConditionalGeneration.from_pretrained("t5-small")
tokenizer = T5Tokenizer.from_pretrained("t5-small")

# Dataset cần thiết:
# [
#   {"gloss": "HELLO YOU NAME WHAT", "text": "Hello, what's your name?"},
#   {"gloss": "THANK YOU", "text": "Thank you"},
#   ...
# ]

trainer = Seq2SeqTrainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    tokenizer=tokenizer,
)

trainer.train()
```

**Kết quả:** Có thể chuyển gloss → spoken text

---

### Phase 3: Continuous Sign Segmentation (Optional)

**Độ khó:** ⭐⭐⭐⭐ (Khó)
**Thời gian:** 2-3 tháng
**Tài nguyên:** Multi-GPU, 10,000+ videos với annotations

**Bước thực hiện:**
1. Thu thập dataset với sign boundaries
2. Train segmentation model (CNN + Transformer)
3. Tích hợp với sign recognition model
4. Optimize cho real-time

**Architecture:**
```python
class SegmentationModel(nn.Module):
    def __init__(self):
        super().__init__()
        # Stage 1: CNN for spatial compression
        self.unet = TwoStageUNet(...)

        # Stage 2: Transformer with RoPE
        self.transformer = TransformerEncoder(
            num_layers=4,
            d_model=384,
            nhead=8,
            rope=True
        )

        # Two output heads
        self.sign_head = BIOHead()  # Sign-level segmentation
        self.sentence_head = BIOHead()  # Sentence-level segmentation
```

**Kết quả:** Có thể xử lý continuous sign language

---

## So Sánh Tài Nguyên Cần Thiết

| Tài nguyên | Phase 1 (Pose→Gloss) | Phase 2 (Gloss→Text) | Phase 3 (Segmentation) |
|-----------|---------------------|---------------------|------------------------|
| **Dataset size** | Có sẵn (WLASL) | 1,000-5,000 pairs | 10,000+ videos |
| **GPU** | 1x RTX 3060 (6GB) | 1x RTX 3060 (6GB) | 4x V100 (32GB) |
| **Training time** | Không cần train | 1-3 ngày | 1-2 tuần |
| **Disk space** | 10-50GB | 10-50GB | 500GB-1TB |
| **Expertise** | Python basics | NLP basics | Deep learning + CV |

---

## Kiến trúc Đề xuất

### Frontend (React + Vite)

```
[Webcam/Video Upload]
    ↓
[MediaPipeService] - Trích xuất pose
    ↓
[Pose Data] - Gửi lên backend
    ↓
[Backend Spring Boot]
    ↓
[Python Service (FastAPI)]
    ↓
[OpenHands Model] - Pose → Gloss
    ↓
[T5 Model] - Gloss → Text
    ↓
[Spoken Text Output]
```

### Backend Components

#### 1. Spring Boot Controller
```java
@PostMapping("/signed-to-spoken")
public ResponseEntity<SignedToSpokenResponse> signedToSpoken(
    @RequestBody SignedToSpokenRequest request
)
```

#### 2. Python Service (FastAPI)
```python
@app.post("/signed-to-spoken")
async def signed_to_spoken(request: SignedToSpokenRequest):
    # 1. Load pose data
    pose = load_pose(request.pose_data)

    # 2. Sign recognition (OpenHands)
    glosses = openhands_model.predict(pose)

    # 3. Gloss to text (T5)
    text = t5_model.translate(" ".join(glosses))

    return {"text": text, "glosses": glosses}
```

---

## Thứ tự thực thi

```
1. [BE] Tạo Python service với FastAPI
2. [BE] Tích hợp OpenHands model (pose → gloss)
3. [BE] Tích hợp T5 model (gloss → text)
4. [BE] Tạo endpoint /signed-to-spoken trong Spring Boot
5. [FE] Rebuild SignedToSpokenPage với Webcam tab + Upload tab
6. [FE] Kết nối MediaPipeService vào usePoseDetection hook
7. [FE] Tạo useSignedToSpoken hook
8. [FE] Kết nối frontend gọi BE API, hiển thị text output + TTS
9. [FE] Thêm vào TranslatePage (khi mode sign→spoken)
10. Polish: animation, error states, loading states
```

---

## Verification Plan

### Phase 1 (Pose → Gloss)
- Test với isolated signs (100-500 signs)
- Độ chính xác > 80%
- Latency < 500ms

### Phase 2 (Gloss → Text)
- Test với 100 gloss → text pairs
- BLEU score > 0.6
- ROUGE score > 0.5

### Phase 3 (Continuous - Optional)
- Test với continuous sign videos
- WER < 30%
- Real-time latency < 1s

---

## Câu hỏi còn mở

1. **Dataset VNSL:** Có dataset gloss → text cho Vietnamese Sign Language không?
2. **Model selection:** Nên dùng OpenHands BERT hay SL-GCN cho pose → gloss?
3. **Gloss format:** Gloss nên ở format gì? (space-separated, comma-separated, etc.)
4. **Continuous signs:** Có cần xử lý continuous signs ngay từ đầu không?

---

## External Resources

### Pre-trained Models
- **OpenHands:** https://github.com/AI4Bharat/OpenHands
- **CorrNet:** https://github.com/hulianyuyy/CorrNet
- **WLASL:** https://github.com/dxli94/WLASL

### Datasets
- **WLASL:** 2,000 words ASL dataset
- **VSL:** 3,873 Vietnamese Sign Language signs
- **BOBSL:** 25K+ videos BSL dataset

### Libraries
- **pose-format:** https://github.com/sign-language-processing/pose
- **segmentation:** https://github.com/sign-language-processing/segmentation
- **signwriting-translation:** https://github.com/sign-language-processing/signwriting-translation
