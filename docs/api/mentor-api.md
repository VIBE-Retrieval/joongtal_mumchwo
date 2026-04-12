# Mentor API

---

## GET /mentor/students/risks

**목적**: 면접 평가가 완료된 학생들의 위험도 목록 조회. 멘토 대시보드 메인 화면용.

### Response

**200 성공**

```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "student_id": 101,
        "student_name": "홍길동",
        "birth_date": "20000101",
        "phone": "010-1234-5678",
        "email": "hong@example.com",
        "course_name": "AI 웹서비스 과정",
        "risk_score": 0.86,
        "risk_level": "HIGH",
        "risk_trend": "UP",
        "recommended_action": "REQUEST_MEETING"
      }
    ]
  }
}
```

**비고**: `interview_assessment` 레코드가 있는 학생(면접 완료)만 반환. 면접 미완료 학생은 포함되지 않음.

---

## GET /mentor/alerts

**목적**: Agent가 생성한 멘토용 개입 알림 목록 조회.

### Response

**200 성공**

```json
{
  "code": 200,
  "data": {
    "alerts": [
      {
        "student_id": 101,
        "student_name": "홍길동",
        "action_type": "REQUEST_MEETING",
        "priority": "HIGH",
        "action_reason": "연속 위험 4일 + 회복 지연",
        "llm_summary": "최근 성취와 적응도가 동시에 하락하고 있습니다.",
        "date": "2026-04-13"
      }
    ]
  }
}
```
