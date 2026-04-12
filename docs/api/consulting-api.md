# Consulting API

---

## POST /consultings

**목적**: 멘토가 학생과의 상담 이력을 등록.

### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| student_id | integer | Y | 학생 ID |
| mentor_feedback | string | N | 멘토 피드백 내용 |
| action_effective | boolean | N | 개입 조치가 효과적이었는지 여부 |

```json
{
  "student_id": 101,
  "mentor_feedback": "최근 수업 적응 어려움 호소. 개인 학습 계획 조정 권유.",
  "action_effective": true
}
```

### Response

**200 성공**

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```
