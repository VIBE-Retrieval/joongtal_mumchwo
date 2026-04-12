# Student API

---

## POST /students

**목적**: 멘토가 신규 학생을 등록.

### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | Y | 학생 이름 |
| email | string | Y | 이메일 (중복 불가) |
| birth_date | string | Y | 생년월일 (8자리, YYYYMMDD) |
| phone | string | N | 연락처 |
| course_name | string | N | 수강 과정명 |

```json
{
  "name": "홍길동",
  "email": "hong@example.com",
  "birth_date": "20000101",
  "phone": "010-1234-5678",
  "course_name": "AI 웹서비스 과정"
}
```

### Response

**201 성공**

```json
{
  "code": 201,
  "message": "학생 등록 성공",
  "data": {
    "student_id": 101
  }
}
```

**409 중복**

```json
{
  "code": 409,
  "message": "이미 등록된 이메일입니다."
}
```

---

## GET /students

**목적**: 전체 학생 목록 조회.

### Response

**200 성공**

```json
{
  "code": 200,
  "data": {
    "students": [
      {
        "student_id": 101,
        "name": "홍길동",
        "email": "hong@example.com",
        "birth_date": "20000101",
        "created_at": "2026-04-01T09:00:00",
        "has_interview": true
      }
    ]
  }
}
```

---

## GET /students/{student_id}/process-risk

**목적**: 일일 설문 기반 과정 중 위험도 조회.

### Response

**200 성공**

```json
{
  "code": 200,
  "data": {
    "student_id": 101,
    "date": "2026-04-13",
    "risk_score": 0.86,
    "risk_level": "HIGH",
    "risk_trend": "UP",
    "state_summary": "최근 7일 동안 성취도와 적응도가 동시에 하락하고 있습니다."
  }
}
```

**404**: 학생 없음

---

## GET /students/{student_id}/interview-risk

**목적**: 면접 평가 기반 탈락 위험도 조회.

### Response

**200 성공**

```json
{
  "code": 200,
  "data": {
    "student_id": 101,
    "dropout_risk_score": 0.42,
    "dropout_risk_level": "MEDIUM"
  }
}
```

**404**: 학생 없음

---

## GET /students/{student_id}/latest-analysis

**목적**: 면접 위험도 + 과정 위험도 + LLM 요약 + Agent 액션을 한 번에 반환. 대시보드용.

### Response

**200 성공**

```json
{
  "code": 200,
  "data": {
    "student_id": 101,
    "interview_risk": {
      "score": 0.42,
      "level": "MEDIUM"
    },
    "process_risk": {
      "score": 0.86,
      "level": "HIGH",
      "trend": "UP"
    },
    "llm_summary": "최근 성취와 적응도가 동시에 하락하고 있습니다.",
    "agent_action": {
      "action_type": "REQUEST_MEETING",
      "priority": "HIGH",
      "action_reason": "연속 위험 4일 + 회복 지연"
    }
  }
}
```

---

## GET /students/{student_id}/progress

**목적**: 학생 본인용 설문 이력 + 감정 상태 조회.

### Response

**200 성공**

```json
{
  "code": 200,
  "data": {
    "student_id": 101,
    "history": [
      {
        "survey_date": "2026-04-10",
        "achievement_score": 3,
        "adaptation_score": 3,
        "relationship_score": 4
      }
    ],
    "emotion_state": "주의",
    "emotion_label": "😟 주의"
  }
}
```

---

## GET /students/{student_id}/care-message

**목적**: Agent가 생성한 학생용 케어 메시지 조회.

### Response

**200 성공**

```json
{
  "code": 200,
  "data": {
    "student_id": 101,
    "message": "오늘도 충분히 잘하고 계십니다. 천천히 해도 괜찮습니다.",
    "has_message": true
  }
}
```

**비고**: `has_message: false`이면 message는 null.
