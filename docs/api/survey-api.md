# Survey API

## POST /surveys/daily

### 입력

- student_id
- achievement_score
- adaptation_score
- relationship_score

---

## 처리

- DB 저장
- 최근 7일 조회
- feature 생성
- ML 실행
- risk 저장
- LLM 실행
- Agent 실행

---

## 출력

{
"message": "오늘도 고생 많으셨습니다!"
}
