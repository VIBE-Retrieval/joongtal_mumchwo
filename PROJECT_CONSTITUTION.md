# PROJECT CONSTITUTION

## AI 기반 국비 교육생 중도탈락 방지 시스템

---

# 1. 프로젝트 목적

이 프로젝트는 국비 교육생의 **중도탈락을 사전에 감지하고 개입하여 방지하는 AI 운영 시스템**이다.

핵심은 단순 예측이 아니라, 아래의 **폐쇄형 루프를 자동화하는 것**이다.

데이터 수집 → ML 위험도 계산 → LLM 해석 → Agent 의사결정 → 개입 실행 → 결과 피드백 → 재학습

---

# 2. 시스템 핵심 구조

## 2.1 이중 예측 구조

본 시스템은 두 가지 예측을 수행한다.

### 1) 면접 단계 (입과 전)

- 면접 평가 데이터를 기반으로 중도탈락 가능성 예측
- 목적: 선발 단계에서 리스크 파악

### 2) 과정 단계 (입과 후)

- 일일 설문 데이터를 기반으로 현재 위험 상태 예측
- 목적: 실시간 개입

---

## 2.2 3단계 AI 파이프라인

모든 판단은 아래 순서를 따른다.

1. ML: 위험도 계산 (정량)
2. LLM: 위험 원인 해석 (정성)
3. Agent: 행동 결정 (실행)

---

# 3. 데이터 구조 핵심 정의

## 3.1 3축 고정 원칙 (절대 변경 금지)

모든 학생 상태는 반드시 아래 3가지로 표현한다.

- achievement (성취도)
- adaptation (학습 적응도)
- relationship (인간관계)

이 3축은 시스템 전반에서 동일한 이름으로 유지한다.

---

## 3.2 설문 점수 체계

- 1: 매우 아니다
- 2: 아니다
- 3: 보통이다
- 4: 그렇다
- 5: 매우 그렇다

---

## 3.3 위험도 관련 필드 표준

모든 위험 관련 값은 아래 네이밍을 따른다.

- risk_score (0~1)
- risk_level (LOW / MEDIUM / HIGH)
- risk_trend (UP / STABLE / DOWN)

---

# 4. 디렉토리 역할 정의

## frontend/

- 학생/멘토 UI
- 설문 입력
- 대시보드
- 상태 시각화 (🙂 😐 😟)
- 데이터는 backend API만 사용

---

## backend/

- API 서버
- 인증/인가
- 비즈니스 로직
- ML/LLM/Agent 호출 orchestration
- DB 접근

---

## AI/

- 면접 ML 모델
- 과정 ML 모델 (4-7-1 구조)
- feature engineering
- LLM 프롬프트
- Agent 판단 로직

---

## DB/

- 스키마 정의
- migration
- seed 데이터

---

## Docs/

- 시스템 설계 문서 (Single Source of Truth)
- API / DB / ML / Agent 명세

---

## AGENTS/

- 도메인별 AI 행동 지침
- 작업 시 반드시 참조되는 규칙 집합

---

# 5. ML 규칙

## 5.1 과정 ML 구조 (고정)

- Input: 4
- Hidden: 7
- Output: 1

구조:
4 → 7 → 1

## 5.2 설정

- optimizer: Adam
- activation: Logistic (sigmoid)
- output: risk_score (0~1)

---

## 5.3 입력 feature (고정)

- achievement_mean_7d
- adaptation_mean_7d
- relationship_mean_7d
- total_delta_7d

---

# 6. LLM 역할 정의

LLM은 계산을 하지 않는다.

LLM의 역할은 오직:

- 위험 상태 설명
- 원인 해석
- risk_type 분류

---

## LLM 출력 구조 (고정)

- state_summary
- risk_reason
- risk_type

---

# 7. Agent 역할 정의

Agent는 최종 행동을 결정하는 계층이다.

---

## 7.1 입력

- interview risk
- process risk
- risk_trend
- LLM 결과
- 과거 이력 (feedback 포함)

---

## 7.2 출력

- action_type
- priority
- action_reason

---

## 7.3 행동 유형

- NONE
- ENCOURAGE_MESSAGE
- ALERT_MENTOR
- REQUEST_MEETING
- EMERGENCY

---

## 7.4 핵심 원칙

Agent는 단순 규칙 기반이 아니라:

현재 상태 + 과거 유사 사례 + 피드백 결과

를 기반으로 판단한다.

---

# 8. API 설계 원칙

## 8.1 REST 규칙

- GET: 조회
- POST: 생성
- PUT/PATCH: 수정
- DELETE: 삭제

---

## 8.2 응답 형식 통일

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

---

## 8.3 역할 분리

### 학생

- 설문 제출
- 나의 상태 조회
- 메시지 수신

### 멘토

- 학생 등록
- 면접 평가
- 위험 학생 관리
- 상담 기록

---

# 9. 데이터 흐름 (절대 구조)

모든 데이터는 아래 흐름을 따른다.

1. 입력 (설문 / 면접)
2. DB 저장
3. ML 실행
4. risk_score 생성
5. LLM 해석
6. Agent 판단
7. action 실행
8. 결과 저장
9. feedback 저장

---

# 10. 중요 설계 원칙

## 10.1 단일 책임 원칙

- ML: 숫자 계산만
- LLM: 해석만
- Agent: 결정만

---

## 10.2 데이터 우선 원칙

이 시스템의 핵심은 모델이 아니라 데이터이다.

- 모든 판단은 기록된다
- 모든 개입은 저장된다
- 모든 결과는 피드백으로 돌아온다

---

## 10.3 피드백 학습 구조

시스템은 아래를 반복한다.

예측 → 개입 → 결과 → 학습

---

## 10.4 문서 = 코드급 중요도

Docs는 단순 참고가 아니라

AI가 판단하는 기준이다.

문서가 틀리면 시스템이 틀린다.

---

# 11. 오케스트레이션 규칙

작업 시 반드시 해당 Agent를 참고한다.

- frontend 작업 → frontend-agent
- backend 작업 → backend-agent
- ML/LLM/Agent 작업 → ai-agent
- DB 작업 → db-agent
- 문서 작업 → docs-agent

---

## 11.1 기본 규칙

- 작업 전: 어떤 Agent를 사용할지 결정
- 작업 중: 해당 Agent 규칙 준수
- 작업 후: Docs 업데이트

---

# 12. 금지 사항

- 3축 구조 변경 금지
- risk 필드 네이밍 변경 금지
- ML이 해석하는 구조 금지
- LLM이 계산하는 구조 금지
- Agent 없이 직접 개입 로직 작성 금지

---

# 13. 시스템 목표

이 시스템은 단순 예측 모델이 아니라

"스스로 학습하는 운영 시스템"

이다.

---

# END
