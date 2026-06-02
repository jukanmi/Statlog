

## 1. 엔드포인트 요약

| Method | Path | 설명 |
|--------|------|------|
| POST | `/generate_stats` | 학습 로그 → 6대 능력치 백분율 분배 |
| POST | `/generate_quiz` | 학습 로그 → 4지선다 복습 퀴즈 (관대한 응답) |

---

## 2. POST `/generate_stats`

**Summary**: Generate Stats
**Description**: 학습 로그 → 6대 능력치 백분율 분배.

### Request Body (`application/json`, required)

`LogRequest` 스키마

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `text` | string | ✅ | 학습 로그 본문 |
| `instruction` | string \| null | ❌ | 추가 지시문 (선택) |

**예시**
```json
{
  "text": "오늘 미적분 극한 단원을 공부하고 예제 5문제를 풀었다.",
  "instruction": null
}
```

### Responses

#### 200 OK — `StatResponse`

7개 능력치 카테고리별 정수값 (기본값 0). 실제로는 백분율 분배 결과.

| 필드 | 타입 | 기본값 | 의미(추정) |
|------|------|--------|-----------|
| `HUM` | integer | 0 | Humanities (인문) |
| `SOC` | integer | 0 | Social (사회) |
| `NAT` | integer | 0 | Natural Science (자연) |
| `COL` | integer | 0 | Collaboration/Collective |
| `PER` | integer | 0 | Personal/Performance |
| `ART` | integer | 0 | Art (예술) |
| `EXP` | integer | 0 | Experience (경험) |


**예시**
```json
{
  "HUM": 20, "SOC": 10, "NAT": 50,
  "COL": 0,  "PER": 10, "ART": 0,  "EXP": 10
}
```

#### 422 Validation Error — `HTTPValidationError`

---

## 3. POST `/generate_quiz`

**Summary**: Generate Quiz
**Description**:
> 학습 로그 → 4지선다 복습 퀴즈 (관대한 응답).

### Request Body (`application/json`, required)

`LogRequest` (위와 동일)

### Responses

#### 200 OK — 자유 JSON (스키마 미정)

서버가 strict 검증을 의도적으로 생략. 응답 본문은 `application/json`이지만 OpenAPI 상 스키마는 비어 있음 (`{}`).

관례적 예시 형태:
```json
{
  "items": [
    {
      "question": "다음 중 미분의 정의에 해당하는 것은?",
      "choices": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "B",
      "explanation": "..."
    }
  ]
}
```
> 실제 키 이름·구조는 `ai_service._validate_quiz_items` 구현을 따름. 클라이언트는 관대하게 파싱해야 함.

#### 422 Validation Error — `HTTPValidationError`

---

## 4. 공통 스키마

### `LogRequest`
```json
{
  "type": "object",
  "required": ["text"],
  "properties": {
    "text":        { "type": "string" },
    "instruction": { "type": ["string", "null"] }
  }
}
```

### `StatResponse`
```json
{
  "type": "object",
  "properties": {
    "HUM": { "type": "integer", "default": 0 },
    "SOC": { "type": "integer", "default": 0 },
    "NAT": { "type": "integer", "default": 0 },
    "COL": { "type": "integer", "default": 0 },
    "PER": { "type": "integer", "default": 0 },
    "ART": { "type": "integer", "default": 0 },
    "EXP": { "type": "integer", "default": 0 }
  }
}
```

### `HTTPValidationError`
```json
{
  "type": "object",
  "properties": {
    "detail": {
      "type": "array",
      "items": { "$ref": "#/components/schemas/ValidationError" }
    }
  }
}
```

### `ValidationError`
| 필드 | 타입 | 필수 |
|------|------|------|
| `loc` | (string \| integer)[] | ✅ |
| `msg` | string | ✅ |
| `type` | string | ✅ |
| `input` | any | ❌ |
| `ctx` | object | ❌ |

**예시**
```json
{
  "detail": [
    {
      "loc": ["body", "text"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## 5. 호출 예시 (curl)

```bash
# Stats 생성
curl -X POST http://34.64.46.227:8000/generate_stats \
  -H "Content-Type: application/json" \
  -d '{"text":"오늘 자료구조 트리 단원 학습","instruction":null}'

# Quiz 생성
curl -X POST http://34.64.46.227:8000/generate_quiz \
  -H "Content-Type: application/json" \
  -d '{"text":"오늘 자료구조 트리 단원 학습"}'
```