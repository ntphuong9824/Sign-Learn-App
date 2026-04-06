# Translation Pipeline Test Results

## Pipeline 1: Angular + Firebase Functions

### 1.1 Text Normalization

| Field | Value |
|-------|-------|
| **Endpoint** | `https://sign.mt/api/text-normalization` |
| **Method** | `GET` |
| **Test Input** | `lang=en&text=Hello world!` |
| **Status** | ❌ FAIL |
| **Response Time** | `___ ms` |
| **Expected Output** | `{"text": "Hello world!"}` |
| **Actual Output** | 401 Unauthorized
``` |
| **Error Details** |`{"message": "Missing App Check token"}` |
| **Notes** | |

---

### 1.2 SignWriting Description

| Field | Value                                                                  |
|-------|------------------------------------------------------------------------|
| **Endpoint** | `https://sign.mt/api/signwriting-description`                          |
| **Method** | `POST`                                                                 |
| **Test Input** | `{"data": {"fsw": "AS14c20S15a04S2e704M525x535S2e704483x510"}}`        |
| **Status** | ❌ FAIL                                                        |
| **Response Time** | `___ ms`                                                               |
| **Expected Output** | `{"result": {"description": "..."}}`                                   |
| **Actual Output** | 401 Unauthorized                                                        
``` |
| **Error Details** | `{ "error": { "message": "Unauthenticated", "status": "UNAUTHENTICATED" }}` |
| **Notes** |                                                                        |

---

### 1.3 Spoken-to-Signed (Pose)

| Field | Value |
|-------|-------|
| **Endpoint** | `https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose` |
| **Method** | `GET` |
| **Test Input** | `text=Hello&spoken=en&signed=ase` |
| **Status** | ⬜ PASS |
| **Response Time** | `___ ms` |
| **Expected Output** | `{"poseData": {...}, "animationUrl": "..."}` |
| **Actual Output** | FlatBuffers (.pose format)
``` |
| **Error Details** | |
| **Notes** | |

---

### 1.4 Spoken-to-Signed (Video)

| Field | Value                                                                        |
|-------|------------------------------------------------------------------------------|
| **Endpoint** | `https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_video` |
| **Method** | `GET`                                                                        |
| **Test Input** | `text=Hello&spoken=en&signed=ase`                                            |
| **Status** | ⬜ PASS                                                                       |
| **Response Time** | `___ ms`                                                                     |
| **Expected Output** | Binary video data (MP4)                                                      |
| **Actual Output** | Binary video data (MP4)                                                      |
| **Error Details** |                                                                              |
| **Notes** |                                                                              |

---

---

## Pipeline 2: React + Spring Boot

### 2.1 Text Normalization

| Field | Value |
|-------|-------|
| **Endpoint** | `http://localhost:8080/api/v1/translate/normalize` |
| **Method** | `GET` |
| **Test Input** | `lang=en&text=Hello world!` |
| **Status** | ⬜ PASS |
| **Response Time** | `___ ms` |
| **Expected Output** | `{"text": "Hello world!"}` |
| **Actual Output** | `{"text": "Hello world!"}` |
| **Error Details** | |
| **Notes** | |

---

### 2.2 Spoken-to-Signed

| Field | Value                                                    |
|-------|----------------------------------------------------------|
| **Endpoint** | `http://localhost:8080/api/v1/translate/spoken-to-signed` |
| **Method** | `GET`                                                    |
| **Test Input** | `text=Hello&spoken=en&signed=ase`                        |
| **Status** | ❌ FAIL                                                   |
| **Response Time** | `___ ms`                                                 |
| **Expected Output** | `{"poseData": {...}, "animationUrl": "..."}`             |
| **Actual Output** | 403 Forbidden                                            |
| **Error Details** |                                                          |
| **Notes** |                                                          |

---

### 2.3 SignWriting Description

| Field | Value |
|-------|-------|
| **Endpoint** | `http://localhost:8080/api/v1/translate/signwriting/describe` |
| **Method** | `POST` |
| **Test Input** | `{"fsw": "AS14c20S15a04S2e704M525x535S2e704483x510"}` |
| **Status** | ❌ FAIL |
| **Response Time** | `___ ms` |
| **Expected Output** | `{"description": "..."}` |
| **Actual Output** | `{"description": ""}` |
| **Error Details** | |
| **Notes** | |
