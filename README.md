# 중탈 멈춰 ! - 중도탈락 방지 AI 운영 시스템

국비 교육생의 중도탈락을 **사전에 감지하고 자동으로 개입**하는 AI 기반 운영 시스템입니다.

단순한 위험 예측을 넘어, 개입 결과를 학습하여 다음 판단에 반영하는 **자기 개선형 운영 루프**를 구현합니다.

> **어떤 LMS에도 붙일 필요 없습니다.** 설치 후 바로 실행되며, 기존 시스템을 전혀 건드리지 않고도 독립적으로 운영됩니다.

---

## 왜 이 시스템인가

국비 교육 현장에서 중도탈락은 늘 사후에 발견됩니다. 학생이 이미 포기한 뒤에야 멘토가 인지하는 구조입니다.

이 시스템은 그 흐름을 뒤집습니다.

- **면접 단계**부터 위험 신호를 감지합니다.
- **수업 중**에는 매일 학생 상태를 추적합니다.
- **AI가 직접** 위험도를 해석하고, 어떤 조치를 취할지 결정해 실행합니다.
- 멘토는 대시보드 하나로 전체 상황을 파악하고, 필요한 학생에게만 집중합니다.

그리고 이 모든 것이 **기존 시스템 연동 없이, 설치만 하면 바로 작동**합니다.

---

## 핵심 기능

### 1. 학습하는 AI Agent

> **"이전 개입의 결과가 다음 판단에 반영됩니다."**

Agent는 단순한 규칙(if-else)이 아니라 **과거 개입 이력과 그 결과**를 기반으로 행동을 결정합니다.

- 멘토가 상담 후 피드백(적절 / 과잉 경고 / 효과 없음)을 입력하면 DB에 누적됩니다.
- Agent는 다음에 유사한 위험 상황이 발생했을 때, 과거 사례를 참조합니다.
  - 이전에 같은 유형의 위험에 `REQUEST_MEETING`을 했는데 **false alarm**이었다면 → 다음엔 더 약한 `ENCOURAGE_MESSAGE`를 선택합니다.
  - 반대로 `ALERT_MENTOR`가 실제 위험 감지에 **효과적**이었다면 → 해당 행동의 점수가 높아집니다.
- 이 피드백 루프는 오탐(false alarm)을 줄이고 실질적인 개입 효과를 높입니다.

```
개입 실행 → 결과 저장 → 멘토 피드백 → Agent 보정 → 다음 판단에 반영
```

Agent 행동 유형:

| action_type | 설명 |
|---|---|
| `NONE` | 개입 없음, 모니터링만 |
| `ENCOURAGE_MESSAGE` | AI 생성 격려 메시지 학생에게 전달 |
| `ALERT_MENTOR` | 멘토 대시보드에 위험 알림 |
| `REQUEST_MEETING` | 자동 면담 요청 생성 |
| `EMERGENCY` | 긴급 면담 생성 + 멘토 즉시 알림 |

---

### 2. 면접 단계 사전 선별 ML

> **"중도탈락자의 면접 패턴을 학습해, 입과 전에 위험 가능성을 예측합니다."**

과정이 시작되기 전, **면접 평가 데이터만으로** 해당 지원자의 중도탈락 위험을 예측합니다.

- 기존 수료자 / 중도탈락자들의 면접 평가 결과로 RandomForest 모델을 학습합니다.
- 면접관이 3개 항목(성취도 / 학습 적응도 / 인간관계)을 1~5점으로 평가하면, 모델이 **dropout_risk_score**를 즉시 산출합니다.
- 면접관은 이 점수를 합격/보류/불합격 결정의 참고 지표로 활용합니다.

입력 → 출력 흐름:

```
면접 평가 (1~5점) → 12개 세부 feature + 파생 feature 계산
→ RandomForest 예측 → dropout_risk_score (0~1) + dropout_risk_level (LOW/MEDIUM/HIGH)
```

평가 3축:

| 축 | 의미 |
|---|---|
| **성취도** | 스스로 해내는 의지와 문제 해결 경험 |
| **학습 적응도** | 어려움에도 포기하지 않는 지속성 |
| **인간관계** | 팀 협력 및 고립 방지 역량 |

---

### 3. 과정 중 중도탈락 감지 AI 파이프라인

> **"학생이 매일 답하는 설문 3개로, AI가 위험을 먼저 알아채고 행동합니다."**

수업이 진행되는 동안, 학생이 느끼는 상태를 매일 간단한 설문(3개 질문)으로 수집합니다. 이 데이터가 ML → LLM → Agent 순서로 전달되며, 사람의 개입 없이 자동으로 분석과 조치가 이루어집니다.

#### 흐름 한눈에 보기

```
[학생] 오늘 설문 응답 (성취도 / 적응도 / 인간관계, 각 1~5점)
    │
    ▼
[ML 모델] 최근 7일치 응답을 평균 내어 위험도 점수 계산
    │   (숫자 4개 입력 → 4-7-1 신경망 → risk_score 0~100점)
    │
    ▼
[LLM / Claude] 위험도 점수와 등급을 받아 "왜 위험한가"를 사람 말로 해석
    │   (state_summary: 현재 상태 요약 / risk_reason: 위험 원인 / risk_type: 위험 유형)
    │
    ▼
[Agent] LLM 해석을 바탕으로 "어떻게 행동할지" 결정하고 실행
        (격려 메시지 전송 / 멘토 알림 / 긴급 면담 요청 등)
```

#### 각 단계가 하는 일

**① ML 모델 — 숫자로 위험을 측정한다**

AI가 "이 학생이 얼마나 위험한가"를 0~100점 숫자로 계산합니다. 최근 7일치 설문 응답의 평균값 4개를 입력받아, 학습된 신경망이 위험도 점수(`risk_score`)를 출력합니다. 점수가 높을수록 중도탈락 위험이 크고, `risk_level`(LOW / MEDIUM / HIGH)과 `risk_trend`(상승 / 하락 / 유지)도 함께 산출됩니다.

> ML은 오직 숫자 계산만 합니다. "왜 위험한가"는 다음 단계인 LLM이 담당합니다.

**② LLM — 숫자를 사람이 이해할 수 있는 언어로 번역한다**

ML이 계산한 위험도 점수와 등급을 받아, Claude(LLM)가 그 의미를 자연어로 풀어냅니다.

출력 예시:
- `state_summary`: *"최근 성취도와 적응도가 연속 하락 중입니다"*
- `risk_reason`: *"학습 이해 부족이 누적되어 자신감이 낮아지고 있습니다"*
- `risk_type`: *"composite_risk (복합 위험)"*

멘토는 이 해석을 보고 학생 상황을 즉시 파악할 수 있습니다.

**③ Agent — 해석을 받아 실제 행동으로 옮긴다**

LLM의 해석과 과거 개입 이력을 종합해, Agent가 지금 이 학생에게 어떤 조치가 필요한지 결정하고 직접 실행합니다. 단순히 알림을 보내는 것이 아니라, 과거에 같은 유형의 위험에 어떤 개입이 효과적이었는지를 참고하여 **더 정밀한 판단**을 내립니다.

---

## 전체 시스템 구조

```
면접 데이터 입력
    └── 면접 ML → dropout_risk_score 저장

일일 설문 입력 (성취도 / 적응도 / 인간관계, 1~5점)
    └── 과정 ML (4-7-1 신경망) → risk_score 계산
        └── LLM → 위험 원인 해석 (state_summary / risk_reason / risk_type)
            └── Agent → 개입 행동 결정 (action_type / priority)
                └── 개입 실행 → 결과 저장 → 피드백 → Agent 보정
```

---

## 독립 실행형 — 어떤 LMS에도 연동이 필요 없습니다

많은 AI 교육 솔루션은 기존 LMS(학습관리시스템)와 연동해야만 작동합니다. API 키 발급, 데이터 이전, 시스템 통합 작업에 몇 주가 걸리기도 합니다.

이 시스템은 다릅니다.

- **별도 연동 없음** — LMS, ERP, 기존 시스템과 연결하지 않아도 됩니다.
- **설치 후 즉시 운영** — `pip install` + `npm install` + 서버 실행, 끝입니다.
- **데이터는 자체 보유** — 학생 데이터가 외부 플랫폼으로 나가지 않습니다.
- **커스터마이징 자유** — 소스 코드가 전부 공개되어 있어 필요에 따라 수정 가능합니다.

기존 운영 방식을 그대로 유지하면서, 이 시스템만 옆에 붙이면 됩니다.

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | Next.js (TypeScript), Tailwind CSS, shadcn/ui |
| Backend | FastAPI (Python), SQLAlchemy |
| AI/ML | scikit-learn (RandomForest, MLP), pandas |
| LLM | Claude API (Anthropic) |
| DB | SQLite (개발) / PostgreSQL (운영) |

---

## 디렉토리 구조

```
├── frontend/        # Next.js UI (학생 / 멘토 / 면접관 대시보드)
├── backend/         # FastAPI 서버, AI 파이프라인 오케스트레이션
├── AI/
│   ├── predict/     # 면접 ML / 과정 ML 예측 모듈
│   ├── train/       # 모델 학습 스크립트
│   ├── features/    # feature engineering
│   ├── agent/       # Agent 의사결정 로직
│   ├── llm/         # LLM 해석 모듈
│   └── models/      # 학습된 모델 파일 (.pkl)
├── DB/              # 스키마 정의, 마이그레이션
├── AGENTS/          # 도메인별 AI 행동 지침
└── docs/            # 설계 문서 (Single Source of Truth)
```

---

## 데이터 모델 핵심

모든 판단과 개입은 반드시 DB에 기록됩니다. 이 기록이 Agent의 학습 데이터가 됩니다.

| 테이블 | 역할 |
|---|---|
| `daily_survey` | 학생 일일 설문 원본 |
| `interview_assessment` | 면접 평가 원본 |
| `process_risk_history` | 과정 ML 결과 이력 |
| `interview_risk_history` | 면접 ML 결과 이력 |
| `intervention_history` | Agent 개입 행동 기록 |
| `intervention_feedback` | 개입 결과 및 멘토 피드백 |

---

## 빠른 시작

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. ML 모델 학습

처음 실행 전 모델 파일을 생성해야 합니다.

```bash
# 면접 ML
python -m AI.train.train_interview_ml

# 과정 ML
python -m AI.train.train_process_ml
```

### 4. 환경변수 설정

`.env` 파일을 생성하고 Claude API 키를 입력합니다.

```
ANTHROPIC_API_KEY=your_api_key_here
```

이것으로 설치 완료입니다.

---

## 사용 흐름

### 파이프라인 1 — 면접 사전 선별

입과 전, 면접 단계에서 중도탈락 위험을 미리 예측합니다.

```
1. 멘토 페이지에서 학생 등록
        ↓
2. 면접관 페이지에서 면접 평가 입력
   (성취도 / 학습 적응도 / 인간관계, 각 3개 세부 항목 1~5점)
        ↓
3. 저장 즉시 면접 ML이 dropout_risk_score 산출
   (이전 수료자·중도탈락자 면접 데이터로 학습된 RandomForest)
        ↓
4. 결과 확인 탭에서 ML 예측 점수 및 위험 등급 확인
   (LOW / MEDIUM / HIGH)
        ↓
5. 면접관이 합격 / 보류 / 불합격 처리
        ↓
6. 합격 처리된 학생이 멘토 대시보드에 등장
```

---

### 파이프라인 2 — 과정 중 실시간 위험 감지

입과 후, 매일 학생 상태를 추적하여 자동으로 조치합니다.

```
1. 학생이 오늘의 설문 응답 (성취도 / 적응도 / 인간관계, 각 1~5점)
        ↓
2. 과정 ML이 최근 7일치 평균을 입력받아 risk_score 계산
   (4-7-1 신경망 → risk_score 0~1, risk_level, risk_trend 출력)
        ↓
3. LLM(Claude)이 위험도 수치를 자연어로 해석
   → state_summary: "최근 성취도와 적응도가 연속 하락 중입니다"
   → risk_reason: "학습 이해 부족이 누적되어 자신감이 저하된 것으로 보입니다"
   → risk_type: "composite_risk (복합 위험)"
        ↓
4. Agent가 LLM 해석 + 과거 개입 이력을 종합해 행동 결정
   → NONE / ENCOURAGE_MESSAGE / ALERT_MENTOR / REQUEST_MEETING / EMERGENCY
        ↓
5. 결정된 행동 즉시 실행 (메시지 발송 / 멘토 알림 / 면담 요청 생성)
        ↓
6. 멘토가 케어 완료 후 피드백 입력
   (recovered / false_alarm / 효과 없음)
        ↓
7. 피드백이 DB에 누적 → 다음 판단 시 Agent 보정에 반영
```

---

## 데모 데이터

`DB/seeds/demo_seed.sql`을 적용하면 5명의 학생 데이터(14일치)가 들어갑니다.

| 이름 | 이메일 | 생년월일 | 면접 위험도 |
|---|---|---|---|
| 김민준 | minjun.kim@demo.com | 1998-03-15 | LOW (0.18) |
| 이서연 | seoyeon.lee@demo.com | 2001-08-22 | HIGH (0.76) |
| 박도현 | dohyun.park@demo.com | 1999-05-07 | MEDIUM (0.42) |
| 최유진 | yujin.choi@demo.com | 2000-02-14 | LOW (0.06) |
| 정우성 | woosung.jung@demo.com | 1997-11-29 | MEDIUM (0.39) |

### 학생별 시나리오

**김민준 — 위기 후 회복**
- D1~D6: 안정 상태(LOW). Agent NONE.
- D7~D10: 점수 연속 하락. Agent가 `ENCOURAGE_MESSAGE` 발송.
- D11: HIGH 2일 연속 → Agent가 `ALERT_MENTOR` 실행. 멘토 직접 개입.
- D12~D14: 점수 회복, LOW 복귀. 멘토 피드백 "recovered" 기록 → Agent가 ALERT_MENTOR 효과 학습.

**이서연 — 고위험 지속 (EMERGENCY 대기 중)**
- D1~D4: 빠른 하락. Agent `ENCOURAGE_MESSAGE` 발송 → 효과 없음.
- D5~D7: HIGH 3일 연속 → `ALERT_MENTOR`. 멘토 확인했으나 개선 없음.
- D8~D10: `REQUEST_MEETING` 면담 요청. 면담 진행했으나 위험도 유지.
- D11~D14: 위험도 0.91 도달 → `EMERGENCY` PENDING 상태. 멘토 즉시 개입 필요.

**박도현 — 오탐(false alarm) 케이스**
- D1~D5: 소폭 하락. Agent `ENCOURAGE_MESSAGE` 발송.
- D6~D14: 자연 회복. 멘토가 "false_alarm" 피드백 입력 → Agent가 이 패턴을 과잉 경보로 학습.

**최유진 — 전 기간 안정**
- D1~D14: 4~5점 유지. Agent 계속 NONE. 별도 개입 없음.

**정우성 — 복합 위험 진행 (REQUEST_MEETING 대기 중)**
- D1~D5: 성취도·인간관계 동반 하락. `ENCOURAGE_MESSAGE` 발송.
- D6~D8: HIGH 3일 연속 → `ALERT_MENTOR`. 멘토 확인.
- D9~D14: HIGH 5일 연속 → `REQUEST_MEETING` PENDING 상태. 면담 대기 중.

---

## 개발 방법론

### 논문 기반 계층 설계 후 구현

이 시스템은 코딩을 먼저 시작하지 않았습니다. 순서는 다음과 같습니다.

**1단계 — 논문 기반 설계**

중도탈락 예측 관련 선행 연구를 분석해 3축 평가 모델(성취도 / 학습 적응도 / 인간관계)과 이중 예측 구조(면접 사전 선별 + 과정 중 실시간 감지)를 설계했습니다. 과정 ML의 4-7-1 신경망 구조와 RandomForest 면접 ML 모두 논문에서 검증된 접근법을 적용했습니다.

**2단계 — API 설계 및 계층 정의**

구현에 앞서 전체 데이터 흐름을 먼저 정의했습니다.

```
DB → ML → LLM → Agent → 실행 → 피드백
```

각 계층의 책임을 명확히 분리했습니다.
- ML: 숫자 계산만
- LLM: 해석만
- Agent: 행동 결정만

API 명세, DB 스키마, ML feature, Agent 행동 정책을 모두 `docs/` 문서로 먼저 작성했습니다. 이 문서들이 코드보다 먼저 존재하며, 이후 모든 구현의 기준이 됩니다.

**3단계 — 3시간 만에 전체 파이프라인 구현**

계층 설계와 API 명세가 완성된 상태에서 코딩을 시작했기 때문에 면접 ML → 과정 ML → LLM → Agent → 피드백 루프까지 전체 파이프라인을 단 3시간 만에 구현할 수 있었습니다.

---

### Claude Orchestrator 패턴

이 프로젝트는 **Claude Code + 멀티 에이전트 오케스트레이션** 방식으로 개발했습니다.

`AGENTS/` 디렉토리에 도메인별 전문 에이전트 지침이 정의되어 있습니다.

```
AGENTS/
├── orchestrator.md   # 작업 분류 및 에이전트 라우팅 규칙
├── frontend-agent.md # UI 작업 전담
├── backend-agent.md  # API/서버 작업 전담
├── ai-agent.md       # ML/LLM/Agent 로직 전담
├── db-agent.md       # 스키마/마이그레이션 전담
└── docs-agent.md     # 문서 동기화 전담
```

**오케스트레이터**는 직접 코드를 작성하지 않습니다. 요청이 들어오면:

1. 영향 범위 분석 (어느 계층에 영향이 있는가)
2. 필요한 에이전트 선택
3. 실행 순서 결정 (`DB → Backend → AI → Frontend → Docs`)
4. 각 에이전트에게 구체적인 프롬프트와 참고 문서를 전달

이 구조 덕분에 한 에이전트가 다른 계층을 침범하지 않으며, 변경이 발생하면 반드시 `docs/`에 반영되는 일관성이 유지됩니다.

---

### code-review-graph로 토큰 절감

코드베이스 탐색에는 [code-review-graph](https://github.com/agentic-labs/code-review-graph) MCP를 활용했습니다.

전체 파일을 매번 읽지 않고, 그래프 기반으로 함수 간 호출 관계, 영향 범위(impact radius), 관련 파일을 즉시 파악할 수 있습니다. 대규모 코드베이스에서도 필요한 컨텍스트만 정확히 로드하여 토큰 사용량을 크게 줄였습니다.

---

## 설계 원칙

- **ML은 숫자만 계산한다** — 해석은 LLM, 결정은 Agent가 담당
- **모든 것은 기록된다** — 판단, 개입, 결과, 피드백 전부 DB에 저장
- **데이터가 Agent를 개선한다** — 피드백 없이 학습 없음
- **문서 = 코드** — `docs/`는 AI 판단의 기준이며 항상 최신 상태 유지
- **연동 없이 독립 실행** — 외부 시스템 의존 없이 설치만으로 운영 가능
