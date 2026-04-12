---

# 먼저 총평

## 좋은 점

### 1. 사용자 역할이 분명합니다

* 학생
* 멘토
* 시스템(ML / LLM / Agent)

이렇게 역할이 나뉘어 있어서 API 설계하기 좋습니다.

### 2. 핵심 흐름이 이미 있습니다

* 학생 등록
* 면접 저장
* 일일 설문 저장
* 위험 판단
* 멘토 알림
* 학생 케어
* 상담 결과 저장

이 흐름이면 백엔드 구조를 잡기 좋습니다.

### 3. 공모전 MVP로 적절합니다

너무 많은 기능을 넣지 않았고,
핵심 가치인 **“중탈 감지와 개입”**에 집중되어 있습니다.

---

# 보완이 필요한 점

## 1. 로그인은 지금 구조가 조금 약합니다

이름 + 생년월일만으로 로그인은
실제 서비스 기준으로는 보안이 약합니다.

MVP 데모용으로는 가능하지만,
API 설계할 때는 최소한 이렇게 나누는 게 좋습니다.

- 학생 로그인
- 멘토 로그인

그리고 내부적으로는

- role
- student_id 또는 mentor_id

가 구분되어야 합니다.

---

## 2. “입력 - Agent”는 사실 API 입력이 아닙니다

예를 들어:

- 멘토 - 학생 관리
- 학생 위로 메시지

이 부분은
“프론트가 입력하는 값”이 아니라
**백엔드 내부에서 생성된 결과를 프론트가 조회하는 구조**가 더 맞습니다.

즉,

❌ 입력 - Agent
⭕ 백엔드가 생성한 결과를 조회하는 API

로 바꾸는 게 좋습니다.

---

## 3. “학생 관리”와 “상담 이력”은 분리해야 합니다

멘토가 보는 학생 관리 화면에는 보통

- 현재 위험 학생 목록
- 학생 상세 상태
- 최근 설문 추세
- 권장 액션

이 들어가고,

상담 이력은 별도로

- 상담 등록
- 상담 목록 조회
- 상담 결과 업데이트

로 분리하는 게 좋습니다.

---

# 제가 보기엔 기능 구조를 이렇게 재정리하면 좋습니다

## 1. 인증(Auth)

- 로그인
- 로그아웃
- 내 정보 조회

## 2. 학생 관리(Student)

- 학생 등록
- 학생 상세 조회
- 학생 목록 조회

## 3. 면접(Interview)

- 면접 평가 저장
- 면접 결과 조회
- 면접 위험도 조회

## 4. 설문(Survey)

- 일일 설문 제출
- 내 설문 이력 조회

## 5. 위험도(Risk)

- 학생별 위험도 조회
- 멘토용 위험 학생 목록 조회

## 6. 상담(Consulting)

- 상담 이력 등록
- 상담 이력 조회
- 상담 결과 피드백 저장

## 7. Agent 결과(Action / Notification)

- 학생 케어 메시지 조회
- 멘토 알림 조회
- 개입 이력 조회

## 8. 통계/변화(My Progress / Dashboard)

- 학생용 나의 변화 조회
- 멘토용 위험 추이 조회

---

# 그래서 제 의견은

👉 지금 기능 자체는 좋습니다
👉 다만 API로 가려면 **“입력 API / 조회 API / 내부 처리 API”**로 다시 나눠야 합니다

---

# 추천하는 API 설계 방향

이제 사용자님이 적어주신 기능을 기준으로
실제로는 이런 식으로 REST API를 짜는 게 좋습니다.

---

# 1. 인증 API

## 1-1. 로그인

`POST /auth/login`

### 입력

```json
{
  "name": "홍길동",
  "birth_date": "2000-01-01",
  "role": "student"
}
```

### 출력 성공

```json
{
  "code": 200,
  "message": "로그인 성공",
  "user": {
    "id": 101,
    "name": "홍길동",
    "role": "student"
  },
  "token": "jwt-token"
}
```

### 출력 실패

```json
{
  "code": 401,
  "message": "로그인 실패"
}
```

---

# 2. 학생 등록 API

이건 멘토가 학생을 등록하는 기능입니다.

## 2-1. 학생 등록

`POST /students`

### 입력

```json
{
  "name": "홍길동",
  "birth_date": "2000-01-01",
  "phone": "010-1234-5678",
  "email": "hong@example.com",
  "course_name": "AI 웹서비스 과정",
  "address": "서울시 ...",
  "education": "대학교 졸업"
}
```

### 출력

```json
{
  "code": 201,
  "message": "학생 등록 성공",
  "student_id": 101
}
```

---

## 2-2. 학생 상세 조회

`GET /students/{student_id}`

---

## 2-3. 학생 목록 조회

`GET /students`

---

# 3. 학생 설문 API

## 3-1. 일일 설문 제출

`POST /surveys/daily`

### 입력

```json
{
  "student_id": 101,
  "survey_date": "2026-04-12",
  "achievement_score": 4,
  "adaptation_score": 3,
  "relationship_score": 2
}
```

### 출력

```json
{
  "code": 201,
  "message": "오늘도 고생 많으셨습니다!"
}
```

### DB 처리

- `daily_survey` 저장
- 이후 배치 또는 트리거로 ML 실행 가능

---

## 3-2. 학생 본인 설문 이력 조회

`GET /students/{student_id}/surveys`

### 출력 예시

```json
{
  "student_id": 101,
  "surveys": [
    {
      "survey_date": "2026-04-10",
      "achievement_score": 3,
      "adaptation_score": 3,
      "relationship_score": 4
    }
  ]
}
```

---

# 4. 면접 API

## 4-1. 면접 평가 저장

`POST /interviews`

### 입력

```json
{
  "student_id": 101,
  "interview_date": "2026-04-12",
  "achievement_score": 4,
  "achievement_problem_solving": 4,
  "achievement_self_learning": 5,
  "achievement_process_clarity": 3,
  "achievement_note": "스스로 학습 경험이 뚜렷함",

  "adaptation_score": 3,
  "adaptation_accepts_difficulty": 4,
  "adaptation_persistence": 3,
  "adaptation_strategy_variety": 3,
  "adaptation_note": "어려운 상황을 피하지는 않음",

  "relationship_score": 4,
  "relationship_collaboration": 4,
  "relationship_conflict_handling": 3,
  "relationship_help_exchange": 4,
  "relationship_note": "협업 경험이 있음",

  "overall_note": "전반적으로 안정적"
}
```

### 출력

```json
{
  "code": 201,
  "message": "면접 평가 저장 완료",
  "interview_id": 55
}
```

---

## 4-2. 면접 결과 조회

`GET /interviews/{interview_id}`

---

## 4-3. 면접 위험도 조회

`GET /students/{student_id}/interview-risk`

### 출력

```json
{
  "student_id": 101,
  "dropout_risk_score": 0.42,
  "dropout_risk_level": "MEDIUM"
}
```

---

# 5. 위험도 조회 API

## 5-1. 과정 중 위험도 조회

`GET /students/{student_id}/process-risk`

### 출력

```json
{
  "student_id": 101,
  "risk_score": 0.86,
  "risk_level": "HIGH",
  "risk_trend": "UP",
  "summary": "최근 7일 동안 성취도와 적응도가 동시에 하락하고 있습니다."
}
```

---

## 5-2. 멘토용 위험 학생 목록 조회

`GET /mentor/students/risks`

### 출력

```json
{
  "items": [
    {
      "student_id": 101,
      "name": "홍길동",
      "risk_score": 0.86,
      "risk_level": "HIGH",
      "risk_trend": "UP",
      "recommended_action": "REQUEST_MEETING"
    }
  ]
}
```

이 API가 사실 사용자님이 적으신
“멘토 - 학생 관리”의 핵심입니다.

---

# 6. Agent 결과 조회 API

이 부분은 “입력 - Agent”가 아니라
**생성된 결과를 조회하는 API**로 설계하는 게 맞습니다.

---

## 6-1. 멘토 알림 조회

`GET /mentor/alerts`

### 출력

```json
{
  "alerts": [
    {
      "student_id": 101,
      "name": "홍길동",
      "action_type": "REQUEST_MEETING",
      "priority": "HIGH",
      "reason": "연속 위험 4일 + 회복 지연",
      "summary": "최근 성취와 적응이 동시에 하락하고 있음"
    }
  ]
}
```

---

## 6-2. 학생 케어 메시지 조회

`GET /students/{student_id}/care-message`

### 출력

```json
{
  "student_id": 101,
  "message": "오늘도 충분히 잘하고 계십니다. 천천히 해도 괜찮습니다.",
  "emotion_state": "주의"
}
```

---

# 7. 상담 API

이 부분은 꼭 따로 빼는 게 좋습니다.

## 7-1. 상담 이력 등록

`POST /consultings`

### 입력

```json
{
  "student_id": 101,
  "mentor_id": 3,
  "consulting_date": "2026-04-12",
  "content": "최근 수업 적응 어려움 호소",
  "mentor_judgement": "appropriate",
  "actual_risk": true,
  "action_effective": true,
  "recovered_after_action": false
}
```

### 출력

```json
{
  "code": 201,
  "message": "상담 이력 저장 완료",
  "consulting_id": 88
}
```

---

## 7-2. 상담 이력 조회

`GET /students/{student_id}/consultings`

---

# 8. 학생용 “나의 변화” API

이건 사용자 경험상 꽤 좋습니다.

## 8-1. 나의 변화 조회

`GET /students/{student_id}/progress`

### 출력

```json
{
  "student_id": 101,
  "history": [
    {
      "date": "2026-04-10",
      "achievement_score": 3,
      "adaptation_score": 3,
      "relationship_score": 4
    },
    {
      "date": "2026-04-11",
      "achievement_score": 2,
      "adaptation_score": 2,
      "relationship_score": 3
    }
  ],
  "emotion_state": "주의",
  "emotion_label": "😟 주의"
}
```

여기서 감정 상태 변환은 예를 들어 이렇게 할 수 있습니다.

- HIGH + UP → 😟 주의
- MEDIUM → 😐 보통
- LOW + STABLE/DOWN → 🙂 안정

---

# 9. 꼭 추가했으면 하는 기능

지금 기능 구성에 제가 꼭 추가 추천드리는 API는 이것입니다.

## 9-1. 내 정보 조회

`GET /auth/me`

로그인 후 현재 사용자 정보 확인용

---

## 9-2. ML/Agent 실행 상태 조회

`GET /students/{student_id}/latest-analysis`

이 API 하나 있으면 프론트에서 편합니다.

### 출력 예시

```json
{
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
    "type": "REQUEST_MEETING",
    "priority": "HIGH"
  }
}
```

이건 대시보드 핵심 API가 됩니다.

---

# 10. 지금 설계에서 가장 중요한 수정 포인트

## 수정 포인트 1

“입력 - Agent”라는 표현은
API 기준으로는 “내부 처리 결과”입니다.

즉 프론트가 Agent에 넣는 게 아니라,
백엔드가 Agent 판단 결과를 프론트에 보여주는 구조입니다.

---

## 수정 포인트 2

학생 / 멘토 / 시스템 내부 API를 구분해야 합니다.

### 학생용

- 로그인
- 설문 제출
- 나의 변화 조회
- 케어 메시지 조회

### 멘토용

- 학생 등록
- 면접 저장
- 위험 학생 목록 조회
- 상담 등록
- 알림 조회

### 시스템 내부

- ML 실행
- LLM 해석 생성
- Agent 판단 생성

---

## 수정 포인트 3

실행 API와 조회 API를 나눠야 합니다.

예:

- 설문 제출 = POST
- 설문 이력 조회 = GET

이렇게요.

---

# 제 최종 의견

👉 지금 기능 구성은 아주 괜찮습니다
👉 다만 API 설계로 가려면 **화면 기능**을 **리소스 중심**으로 재정리해야 합니다

즉,

- 로그인
- 학생
- 설문
- 면접
- 위험도
- 알림
- 상담
- 변화 조회

이렇게 묶는 게 훨씬 깔끔합니다.

---
