# Action Policy

## 1. action_type 정의

| action_type       | 의미                        | 멘토 대시보드 표시 위치  |
|-------------------|-----------------------------|--------------------------|
| NONE              | 개입 불필요                 | 표시 안 함               |
| ENCOURAGE_MESSAGE | 격려/위로 메시지 발송       | **케어 필요** 목록       |
| ALERT_MENTOR      | 멘토에게 알림               | 알림 목록                |
| REQUEST_MEETING   | 상담 요청                   | 알림 목록                |
| EMERGENCY         | 즉각 개입 필요 (긴급)       | **오늘의 새로운 위험도** 목록 |

---

## 2. 판단 기준

- risk_score 높음 → 개입
- trend UP → 강화
- 반복 위험 → 강화

---

## 3. 보정 요소

- false_alarm_rate 높음 → 완화
- 회복 빠름 → 완화
- 과거 실패 많음 → 행동 변경

---

## 4. 케어 완료 처리

케어 완료(InterventionHistory.status = "COMPLETED") 시:
- 케어 필요 목록에서 제거
- 오늘의 새로운 위험도 목록에서 제거
- 다음 설문으로 새 intervention이 생성되면 다시 표시
