# Agent Graph

## Node

- Student
- Risk
- Trend
- RiskType
- History
- Action
- Outcome

---

## Edge

- state -> action
- action -> outcome

---

## 목적

유사 상황에서 최적 행동을 선택한다.

---

## Update Note (2026-04)

- `interview_risk_score`는 Agent 입력에 포함될 수 있지만, 추적/참고 용도다.
- `interview_risk_score`는 Agent action 점수 가중치 계산에 사용하지 않는다.
- Agent 판단의 직접 근거는 과정 데이터다.
- 핵심 신호: `process_risk_score`, `risk_level`, `risk_trend`, `consecutive_risk_days`, `past_high_risk_count`.
- 보정 신호: `false_alarm_rate`, `action_effective_rate`, 기타 과정 이력.
