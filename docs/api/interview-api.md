# Interview API

---

## POST /interviews

**목적**: 면접관이 학생 면접 평가를 저장. 저장 후 interview risk ML 자동 실행.

### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| student_id | integer | Y | 학생 ID |
| achievement_score | integer | Y | 성취 종합 점수 (1~5) |
| achievement_problem_solving | integer | Y | 문제 해결력 (1~5) |
| achievement_self_learning | integer | Y | 자기 주도 학습 (1~5) |
| achievement_process_clarity | integer | Y | 학습 과정 명확성 (1~5) |
| adaptation_score | integer | Y | 적응 종합 점수 (1~5) |
| adaptation_accepts_difficulty | integer | Y | 어려움 수용도 (1~5) |
| adaptation_persistence | integer | Y | 지속성 (1~5) |
| adaptation_strategy_variety | integer | Y | 전략 다양성 (1~5) |
| relationship_score | integer | Y | 관계 종합 점수 (1~5) |
| relationship_collaboration | integer | Y | 협업 능력 (1~5) |
| relationship_conflict_handling | integer | Y | 갈등 처리 (1~5) |
| relationship_help_exchange | integer | Y | 도움 주고받기 (1~5) |
| note | string | N | 면접관 메모 |

```json
{
  "student_id": 101,
  "achievement_score": 4,
  "achievement_problem_solving": 4,
  "achievement_self_learning": 5,
  "achievement_process_clarity": 3,
  "adaptation_score": 3,
  "adaptation_accepts_difficulty": 4,
  "adaptation_persistence": 3,
  "adaptation_strategy_variety": 3,
  "relationship_score": 4,
  "relationship_collaboration": 4,
  "relationship_conflict_handling": 3,
  "relationship_help_exchange": 4,
  "note": "스스로 학습 경험이 뚜렷함"
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

**비고**: 저장 후 interview risk ML이 실행되어 `interview_risk_history`에 결과 저장. 결과 조회는 `GET /students/{student_id}/interview-risk` 사용.
