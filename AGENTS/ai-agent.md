# AI AGENT

## ML / LLM / Agent 판단 로직 담당 에이전트

---

# 1. 역할 정의

AI Agent는 시스템의 핵심 판단 계층이다.

책임:

- 면접 ML 모델
- 과정 ML 모델
- feature engineering
- LLM 해석
- Agent 의사결정 로직

---

# 2. 핵심 원칙

---

## 2.1 역할 분리 (절대 규칙)

- ML → 숫자 계산
- LLM → 해석
- Agent → 행동 결정

이 역할은 절대 섞지 않는다.

---

## 2.2 데이터 기반 판단

모든 판단은 데이터 기반이어야 한다.

- 직관 금지
- 하드코딩 최소화
- 기록 기반 학습

---

# 3. 면접 ML

---

## 3.1 목적

입과 전 중도탈락 가능성 예측

---

## 3.2 입력

### 성취도

- achievement_score
- problem_solving
- self_learning
- process_clarity

### 적응도

- adaptation_score
- accepts_difficulty
- persistence
- strategy_variety

### 인간관계

- relationship_score
- collaboration
- conflict_handling
- help_exchange

---

## 3.3 출력

- dropout_risk_score (0~1)
- dropout_risk_level (LOW / MEDIUM / HIGH)

---

## 3.4 특징

- 정적 모델
- 입과 전 1회 실행
- 초기 위험 판단 기준

---

# 4. 과정 ML

---

## 4.1 구조 (고정)

```
Input: 4
Hidden: 7
Output: 1

4 → 7 → 1
```

---

## 4.2 설정

- optimizer: Adam
- activation: Logistic (sigmoid)
- loss: binary cross entropy

---

## 4.3 입력 feature (고정)

```
achievement_mean_7d
adaptation_mean_7d
relationship_mean_7d
total_delta_7d
```

---

## 4.4 feature 정의

### 7일 평균

- 각 항목 평균

### total_delta_7d

- (오늘 평균) - (7일 전 평균)

---

## 4.5 출력

- risk_score (0~1)

---

## 4.6 후처리

### risk_level

- 0 ~ 0.33 → LOW
- 0.34 ~ 0.66 → MEDIUM
- 0.67 ~ 1 → HIGH

---

### risk_trend

- 최근 3일 vs 이전 3일 비교
- 증가 → UP
- 감소 → DOWN
- 유지 → STABLE

---

# 5. LLM

---

## 5.1 역할

LLM은 설명만 한다.

- 계산 금지
- 판단 금지

---

## 5.2 입력

- risk_score
- risk_level
- risk_trend
- 3축 평균
- 변화량

---

## 5.3 출력

```
state_summary
risk_reason
risk_type
```

---

## 5.4 risk_type 정의

- achievement_decline
- adaptation_breakdown
- relationship_isolation
- composite_risk

---

# 6. Agent

---

## 6.1 역할

최종 행동 결정

---

## 6.2 입력

- interview_risk_score
- process_risk_score
- risk_trend
- risk_type
- past_high_risk_count
- avg_recovery_days
- false_alarm_rate
- action_effective_rate

---

## 6.3 출력

```
action_type
priority
action_reason
```

---

## 6.4 action_type

- NONE
- ENCOURAGE_MESSAGE
- ALERT_MENTOR
- REQUEST_MEETING
- EMERGENCY

---

# 7. Agent 판단 구조

---

## 7.1 기본 판단

- risk_score 높음 → 개입
- trend UP → 강화
- 반복 위험 → 강화

---

## 7.2 보정 요소

- false_alarm_rate 높음 → 약화
- 회복 빠름 → 약화
- 과거 실패 많음 → 행동 변경

---

# 8. 그래프 기반 구조

---

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

- 상태 → 행동
- 행동 → 결과

---

## 목적

유사 상황에서 최적 행동 선택

---

# 9. 학습 구조

---

## 9.1 피드백 데이터

- actual_risk
- mentor_feedback
- action_effective
- recovered_after_action

---

## 9.2 학습 방식

- false alarm 감소
- 성공 행동 강화

---

# 10. 금지 사항

---

- ML이 설명 생성 금지
- LLM이 점수 계산 금지
- Agent 없이 행동 결정 금지
- feature 변경 시 Docs 미반영 금지

---

# 11. 최종 정의

AI Agent는

"데이터를 기반으로 위험을 계산하고,
의미를 해석하고,
최적의 행동을 선택하는 시스템"

이다.

---

# END
