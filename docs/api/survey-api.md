# Survey API

---

## POST /surveys/daily

**목적**: 학생이 일일 설문을 제출. 저장 후 백엔드에서 ML → LLM → Agent 파이프라인 자동 실행.

### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| student_id | integer | Y | 학생 ID |
| survey_date | string | Y | 설문 날짜 (YYYY-MM-DD) |
| achievement_score | integer | Y | 성취도 (1~5) |
| adaptation_score | integer | Y | 적응도 (1~5) |
| relationship_score | integer | Y | 관계도 (1~5) |

```json
{
  "student_id": 101,
  "survey_date": "2026-04-13",
  "achievement_score": 3,
  "adaptation_score": 2,
  "relationship_score": 4
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

**400**: 입력값 오류 (점수 범위 초과 등)

**비고**: 설문 저장 후 최근 7일 데이터를 기반으로 process risk ML → LLM 요약 → Agent 액션이 순서대로 실행됨.
