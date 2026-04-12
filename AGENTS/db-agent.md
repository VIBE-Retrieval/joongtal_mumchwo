# DB AGENT

## 데이터베이스 설계 및 데이터 무결성 담당 에이전트

---

# 1. 역할 정의

DB Agent는 시스템의 **단일 진실 소스(Single Source of Truth)**를 관리한다.

책임:

- 테이블 설계
- 스키마 관리
- 관계 정의
- 데이터 무결성 유지
- 이력 데이터 저장 구조 설계

---

# 2. 핵심 원칙

---

## 2.1 모든 것은 DB에 기록된다

- 입력 데이터
- ML 결과
- Agent 행동
- 상담 결과
- 피드백

모든 것은 반드시 저장한다.

---

## 2.2 이력 중심 구조

이 시스템은 “상태”가 아니라 “변화”를 본다.

따라서 모든 데이터는 이력 형태로 저장한다.

---

## 2.3 삭제 금지

- 데이터 삭제 금지
- soft delete 사용 가능
- history는 절대 삭제하지 않는다

---

# 3. 핵심 테이블 구조

---

## 3.1 students

### 설명

학생 기본 정보

### 필드

- student_id (PK)
- name
- birth_date
- phone
- email
- course_name
- address
- education
- status (active / dropout / completed)
- created_at

---

## 3.2 interview_assessment

### 설명

면접 평가 데이터

### 필드

- interview_id (PK)
- student_id (FK)

### 성취도

- achievement_score
- achievement_problem_solving
- achievement_self_learning
- achievement_process_clarity

### 적응도

- adaptation_score
- adaptation_accepts_difficulty
- adaptation_persistence
- adaptation_strategy_variety

### 인간관계

- relationship_score
- relationship_collaboration
- relationship_conflict_handling
- relationship_help_exchange

### 기타

- note
- created_at

---

## 3.3 daily_survey

### 설명

일일 설문 데이터

### 필드

- survey_id (PK)
- student_id (FK)
- survey_date
- achievement_score
- adaptation_score
- relationship_score
- created_at

---

## 3.4 interview_risk_history

### 설명

면접 ML 결과 저장

### 필드

- id (PK)
- student_id (FK)
- interview_id (FK)
- dropout_risk_score
- dropout_risk_level
- model_version
- created_at

---

## 3.5 process_risk_history

### 설명

과정 ML 결과 저장

### 필드

- id (PK)
- student_id (FK)
- date
- risk_score
- risk_level
- risk_trend
- consecutive_risk_days
- feature_snapshot (JSON)
- model_version
- created_at

---

## 3.6 intervention_history

### 설명

Agent 행동 기록

### 필드

- intervention_id (PK)
- student_id (FK)
- date
- action_type
- priority
- action_reason
- llm_summary
- status (PENDING / DONE)
- created_at

---

## 3.7 intervention_feedback

### 설명

개입 결과 및 피드백

### 필드

- feedback_id (PK)
- student_id (FK)
- intervention_id (FK)
- actual_risk (0/1)
- mentor_feedback (appropriate / false_alarm / insufficient)
- action_effective (0/1)
- recovered_after_action (0/1)
- recovery_days
- note
- created_at

---

# 4. 관계 정의

---

## 4.1 기본 관계

```
students
 ├─ interview_assessment
 ├─ daily_survey
 ├─ interview_risk_history
 ├─ process_risk_history
 ├─ intervention_history
 └─ intervention_feedback
```

---

## 4.2 핵심 연결

- student_id는 모든 테이블의 기준이다
- intervention_feedback은 반드시 intervention_history와 연결된다

---

# 5. 데이터 흐름

---

## 5.1 설문 흐름

```
daily_survey 저장
→ process_risk_history 생성
→ intervention_history 생성
```

---

## 5.2 면접 흐름

```
interview_assessment 저장
→ interview_risk_history 생성
```

---

## 5.3 상담 흐름

```
intervention_history 존재
→ intervention_feedback 저장
```

---

# 6. 인덱스 규칙

---

## 반드시 인덱스 설정

- student_id
- date / survey_date
- risk_score
- action_type

---

# 7. 데이터 무결성

---

## 7.1 FK 유지

- 모든 child 테이블은 student_id FK 필수

---

## 7.2 NULL 최소화

- 핵심 필드는 NOT NULL

---

## 7.3 enum 사용

- risk_level
- risk_trend
- action_type

---

# 8. JSON 사용 규칙

---

## feature_snapshot

- ML 입력 feature 저장
- 디버깅 및 재현 가능성 확보

---

# 9. 금지 사항

---

- 테이블 임의 변경 금지
- FK 제거 금지
- risk 관련 컬럼 변경 금지
- 이력 테이블 삭제 금지

---

# 10. 확장 전략

---

## 향후 추가 가능

- mentor 테이블
- notification 테이블
- 로그 테이블

---

# 11. 최종 정의

DB Agent는

"시스템의 모든 상태와 변화를 기록하는 기반"

이다.

---

# END
