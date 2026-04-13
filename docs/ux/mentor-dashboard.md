# Mentor Dashboard

## 1. 화면 구성

### 1) 오늘의 새로운 위험도
- 표시 조건: `action_type == "EMERGENCY"` AND `status == "PENDING"`
- 케어 완료 시 제거

### 2) 케어 필요
- 표시 조건: `action_type == "ENCOURAGE_MESSAGE"` AND `status == "PENDING"`
- 케어 완료 시 제거

### 3) 알림
- 표시 조건: `action_type in ("ALERT_MENTOR", "REQUEST_MEETING")` AND `status == "PENDING"`

### 4) 전체 학생 목록
- 위험도 높은 순 정렬
- risk_score, risk_level, risk_trend 표시

---

## 2. 케어 완료 흐름

1. 멘토가 "케어 완료" 버튼 클릭
2. 피드백 입력 (오탐 / 회복됨 / 지속관찰)
3. POST /consultings 호출
4. Backend: InterventionHistory.status = "COMPLETED"
5. 해당 학생이 케어 필요 / 위험도 목록에서 제거

---

## 3. 학생 상세

- 설문 추이 그래프 (14일)
- risk_score, risk_level, risk_trend
- LLM 요약 (state_summary, risk_reason)
- Agent 판단 결과 (action_type, priority)

---

## 4. API

- GET /mentor/students/risks — 전체 학생 위험도 목록
- GET /mentor/alerts — 알림 목록
- POST /consultings — 케어 완료 처리
