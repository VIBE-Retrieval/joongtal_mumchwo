# 중도탈락 방지 AI 운영 시스템

국비 교육생의 중도탈락을 **사전에 감지하고 자동으로 개입**하는 AI 기반 운영 시스템입니다.

단순한 위험 예측을 넘어, 개입 결과를 학습하여 다음 판단에 반영하는 **자기 개선형 운영 루프**를 구현합니다.

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

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### ML 모델 학습

```bash
# 면접 ML
python -m AI.train.train_interview_ml

# 과정 ML
python -m AI.train.train_process_ml
```

---

## 설계 원칙

- **ML은 숫자만 계산한다** — 해석은 LLM, 결정은 Agent가 담당
- **모든 것은 기록된다** — 판단, 개입, 결과, 피드백 전부 DB에 저장
- **데이터가 Agent를 개선한다** — 피드백 없이 학습 없음
- **문서 = 코드** — `docs/`는 AI 판단의 기준이며 항상 최신 상태 유지
