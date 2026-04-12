# BACKEND AGENT

## API / 비즈니스 로직 / AI 오케스트레이션 담당 에이전트

---

# 1. 역할 정의

Backend Agent는 시스템의 핵심 실행 계층이다.

책임:

- API 설계 및 구현
- 인증 / 인가 처리
- DB 접근
- ML / LLM / Agent 호출 orchestration
- 전체 데이터 흐름 관리

---

# 2. 핵심 원칙

---

## 2.1 Backend는 "흐름을 연결"한다

Backend는 직접 판단하지 않는다.

- ML이 계산한다
- LLM이 해석한다
- Agent가 결정한다

Backend는 **순서를 실행**한다.

---

## 2.2 단일 책임 구조

- Controller: 요청/응답
- Service: 비즈니스 로직
- Repository: DB 접근
- AI Module: ML/LLM/Agent 호출

---

## 2.3 AI 파이프라인 순서 (절대 고정)

```
DB 조회
→ feature 생성
→ ML 실행
→ risk_score 생성
→ LLM 해석
→ Agent 판단
→ 결과 저장
```

---

# 3. 주요 기능

---

## 3.1 인증

### 로그인

- 이름 + 생년월일 기반
- 역할: student / mentor

---

## 3.2 학생 관리

- 학생 등록
- 학생 조회
- 학생 목록 조회

---

## 3.3 설문 처리

### 흐름

1. 설문 저장
2. 최근 7일 데이터 조회
3. feature 생성
4. ML 실행
5. risk 저장
6. LLM 실행
7. Agent 실행
8. intervention_history 저장

---

## 3.4 면접 처리

### 흐름

1. 면접 데이터 저장
2. feature 생성
3. 면접 ML 실행
4. 결과 저장 (interview_risk_history)

---

## 3.5 위험도 조회

- process risk 조회
- interview risk 조회
- 멘토용 위험 학생 목록

---

## 3.6 상담 처리

- 상담 기록 저장
- feedback 저장
- intervention_feedback 생성

---

## 3.7 Agent 결과 처리

- 알림 생성
- 메시지 생성
- action 실행

---

# 4. API 설계 규칙

---

## 4.1 REST 원칙

- GET: 조회
- POST: 생성
- PUT/PATCH: 수정
- DELETE: 삭제

---

## 4.2 응답 형식 통일

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

---

## 4.3 에러 처리

```json
{
  "code": 400,
  "message": "invalid request"
}
```

---

# 5. 서비스 구조

---

## Controller

- 요청 받기
- DTO 변환
- Service 호출

---

## Service

- 비즈니스 로직 처리
- AI 호출
- DB 저장

---

## Repository

- DB CRUD

---

## AI Module

- ML 호출
- LLM 호출
- Agent 호출

---

# 6. 데이터 흐름 상세

---

## 6.1 설문 입력 흐름

```
POST /surveys/daily

→ DB 저장
→ 최근 7일 조회
→ feature 생성
→ ML 실행
→ risk_score 생성
→ process_risk_history 저장
→ LLM 실행
→ Agent 실행
→ intervention_history 저장
```

---

## 6.2 면접 입력 흐름

```
POST /interviews

→ DB 저장
→ feature 생성
→ 면접 ML 실행
→ interview_risk_history 저장
```

---

## 6.3 상담 입력 흐름

```
POST /consultings

→ 상담 저장
→ intervention_feedback 저장
→ Agent 학습 데이터 누적
```

---

# 7. 중요 로직

---

## 7.1 feature 생성

- 7일 평균
- 변화량
- trend 계산

---

## 7.2 trend 계산

- 최근 3일 vs 이전 3일 비교
- 증가 → UP
- 감소 → DOWN
- 유지 → STABLE

---

## 7.3 risk_level 계산

- 0 ~ 0.33 → LOW
- 0.34 ~ 0.66 → MEDIUM
- 0.67 ~ 1 → HIGH

---

# 8. Agent 실행 조건

Agent는 항상 실행된다.

단, action_type이 NONE일 수 있다.

---

# 9. DB 연동 규칙

---

## 반드시 저장해야 하는 것

- daily_survey
- process_risk_history
- interview_risk_history
- intervention_history
- intervention_feedback

---

## 저장 순서

1. 입력 저장
2. ML 결과 저장
3. Agent 결과 저장
4. 피드백 저장

---

# 10. 금지 사항

---

- ML 계산을 backend에서 구현 금지
- LLM 해석 로직 backend에 구현 금지
- Agent 판단 로직 하드코딩 금지
- DB 없이 상태 유지 금지

---

# 11. 성능 규칙

---

- ML은 비동기 가능
- LLM은 캐싱 가능
- Agent는 빠르게 실행

---

# 12. 최종 정의

Backend Agent는

"데이터를 흐르게 하고, AI를 순서대로 실행시키는 엔진"

이다.

---

# END
