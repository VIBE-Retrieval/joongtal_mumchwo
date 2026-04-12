0. 전체 시스템 한 줄 정의

이 시스템은 두 개의 예측 축으로 구성됩니다.

면접 ML: 입과 전 면접 데이터를 기반으로 중도탈락 가능성을 예측
과정 ML: 입과 후 일일 설문 데이터를 기반으로 현재 중도탈락 위험을 예측

그리고 그 뒤에

LLM: 왜 위험한지 설명
Agent: 지금 어떤 개입을 해야 하는지 결정
DB: 전체 상태, 결과, 개입, 피드백을 누적 저장

이 이어지는 구조입니다.

즉 전체 워크플로우는 아래와 같습니다.

면접 데이터 저장 → 면접 ML 예측 → 입과 후 일일 설문 저장 → 과정 ML 예측 → LLM 해석 → Agent 의사결정 → 실행 → 결과 저장 → 피드백 반영

1. 전체 영역 구조
   A. DB

전체 시스템의 기억 저장소

B. 면접 ML

입과 전 위험 가능성 예측

C. 과정 ML

입과 후 현재 위험 상태 예측

D. LLM

위험 원인 설명 및 상태 해석

E. Agent

현재 상황과 과거 결과를 종합하여 개입 행동 결정

2. DB 관점 해설

DB는 이 시스템의 중심입니다.
원본 입력, 예측 결과, 개입 결과, 피드백 결과를 모두 저장해야
각 모델과 Agent가 같은 기준으로 움직일 수 있습니다.

2-1. DB의 핵심 역할

1. 면접 단계 데이터 저장

면접관이 체크한 평가 결과 저장

2. 과정 중 설문 저장

학생이 매일 입력한 3문항 설문 저장

3. 예측 결과 저장

면접 ML / 과정 ML 결과 저장

4. 개입 이력 저장

어떤 학생에게 어떤 행동을 했는지 저장

5. 피드백 저장

실제 위험 여부, 과잉 경고 여부, 개입 효과 저장

2-2. 핵심 테이블 구조

최소 기준으로 아래 7개 테이블을 추천드립니다.

students
interview_assessment
daily_survey
interview_risk_history
process_risk_history
intervention_history
intervention_feedback
2-3. 테이블별 상세 설명

1. students

학생 기본 정보 테이블입니다.

입력값
student_id
name
course_id
application_date
admission_status
(applied, accepted, enrolled, dropout, completed)
출력값
학생 고유 식별자
다른 테이블과 연결할 기준 key 2) interview_assessment

면접관이 체크한 면접 평가 결과 저장 테이블입니다.

이 테이블은 면접 ML의 핵심 입력 테이블입니다.

입력값
기본 정보
interview_id
student_id
interview_date
interviewer_id
성취도 평가
achievement_score (1~5)
achievement_problem_solving (1~5)
achievement_self_learning (1~5)
achievement_process_clarity (1~5)
achievement_note (text)
학습 적응도 평가
adaptation_score (1~5)
adaptation_accepts_difficulty (1~5)
adaptation_persistence (1~5)
adaptation_strategy_variety (1~5)
adaptation_note (text)
인간관계 평가
relationship_score (1~5)
relationship_collaboration (1~5)
relationship_conflict_handling (1~5)
relationship_help_exchange (1~5)
relationship_note (text)
종합
interview_overall_note
created_at
출력값
면접 ML 학습용 feature 원본
면접관 평가 히스토리
특정 학생의 입과 전 성향 요약 3) daily_survey

과정 중 학생이 매일 입력하는 설문 데이터 저장 테이블입니다.

입력값
survey_id
student_id
survey_date
achievement_score (1~5)
adaptation_score (1~5)
relationship_score (1~5)
created_at
출력값
최근 7일 설문 시계열
과정 ML feature 생성용 원본 데이터 4) interview_risk_history

면접 ML의 예측 결과 저장 테이블입니다.

입력값
interview_risk_id
student_id
interview_id
dropout_risk_score (0~1)
dropout_risk_level (LOW, MEDIUM, HIGH)
model_version
created_at
출력값
입과 전 중도탈락 가능성
면접관 참고용 예측 결과
과정 중 위험도와 비교할 초기 기준점 5) process_risk_history

과정 ML의 예측 결과 저장 테이블입니다.

입력값
process_risk_id
student_id
date
risk_score (0~1)
risk_level (LOW, MEDIUM, HIGH)
risk_trend (UP, STABLE, DOWN)
consecutive_risk_days
feature_snapshot (json)
model_version
created_at
출력값
현재 위험도 히스토리
연속 위험 상태
trend 변화
Agent 판단용 과거 상태 6) intervention_history

Agent가 결정한 행동과 실제 실행 결과 저장 테이블입니다.

입력값
intervention_id
student_id
date
trigger_source (interview_ml, process_ml, agent_review)
action_type (NONE, ENCOURAGE_MESSAGE, ALERT_MENTOR, REQUEST_MEETING, EMERGENCY_CASE)
priority (LOW, MEDIUM, HIGH)
action_reason
llm_summary
status (PENDING, DONE, SKIPPED)
created_at
출력값
개입 이력
개입 강도
개입 유형 통계
후속 추적 대상 7) intervention_feedback

실제 개입 결과와 멘토 피드백을 저장합니다.

이 테이블이 있어야 Agent가 “과잉 경고를 줄이는 방향”으로 학습할 수 있습니다.

입력값
feedback_id
student_id
intervention_id
feedback_date
actual_risk (0/1)
mentor_feedback (appropriate, false_alarm, insufficient)
action_effective (0/1)
recovered_after_action (0/1)
recovery_days
note
출력값
false alarm 비율
실제 위험 여부
개입 효과성
Agent 판단 보정 데이터 3. 면접 ML 관점 해설

면접 ML은 입과 전 예측 모델입니다.

핵심 질문은 이것입니다.

이 지원자는 입과 후 중도탈락 가능성이 높은 편인가?

즉, 아직 과정 데이터가 없을 때
면접관이 체크한 구조화된 평가로 초기에 위험도를 추정하는 모델입니다.

3-1. 면접 ML의 역할
면접관 평가를 정량화
과거 중탈자들의 면접 특성과 비교
지원자별 초기 이탈 가능성 점수 산출

이 모델은 어디까지나 초기 스크리닝용입니다.
최종 판단은 면접관이 하고, 시스템은 참고 점수를 제공합니다.

3-2. 면접 ML 입력값

입력은 interview_assessment 테이블에서 옵니다.

핵심 입력 feature
성취도 관련
achievement_score
achievement_problem_solving
achievement_self_learning
achievement_process_clarity
학습 적응도 관련
adaptation_score
adaptation_accepts_difficulty
adaptation_persistence
adaptation_strategy_variety
인간관계 관련
relationship_score
relationship_collaboration
relationship_conflict_handling
relationship_help_exchange
파생 feature
achievement_sub_mean
adaptation_sub_mean
relationship_sub_mean
overall_interview_mean
interview_balance_score
(세 축 간 편차)
3-3. 면접 ML 처리

이 모델은 일반적인 분류 모델이면 충분합니다.

추천:

Logistic Regression
Random Forest
LightGBM
라벨
dropout_label = 1 : 실제 중도탈락
dropout_label = 0 : 수료/정상 유지

즉, 과거 입과자 중 실제 중탈 여부를 기준으로 학습합니다.

3-4. 면접 ML 출력값
출력
dropout_risk_score (0~1)
dropout_risk_level (LOW, MEDIUM, HIGH)
예시
0.21 → LOW
0.58 → MEDIUM
0.81 → HIGH
3-5. 면접 ML의 출력 사용처
면접관 참고용 리스크 표시
입과 후 초기 집중관리 대상 지정
과정 ML의 초기 prior 정보로 활용 가능 4. 과정 ML 관점 해설

과정 ML은 입과 후 현재 상태 예측 모델입니다.

핵심 질문은 이것입니다.

이 학생은 지금 중도탈락 위험 상태인가?

사용자님 요청대로, 이 모델은 아래 구조를 따릅니다.

입력 노드 수: 4
은닉층 노드 수: 7
출력 노드 수: 1
모델 구조: 4-7-1
optimizer: Adam
activation: Logistic activation(sigmoid)
4-1. 과정 ML의 역할
최근 7일 설문 데이터를 요약
현재 위험도를 실수값으로 계산
운영자가 보기 쉽게 level과 trend 생성
4-2. 과정 ML 입력값

사용자님이 4-7-1을 원하셨기 때문에,
과정 ML의 입력은 4개 feature로 고정하는 것이 가장 자연스럽습니다.

추천 4개 입력 feature

1. achievement_mean_7d

최근 7일 성취도 평균

2. adaptation_mean_7d

최근 7일 적응도 평균

3. relationship_mean_7d

최근 7일 인간관계 평균

4. total_delta_7d

최근 7일 종합 상태 변화량
= (오늘 3개 평균) - (7일 전 3개 평균)

즉, 입력 벡터는 아래처럼 됩니다.

X = [
achievement_mean_7d,
adaptation_mean_7d,
relationship_mean_7d,
total_delta_7d
]
4-3. 과정 ML 모델 구조
구조
Input Layer: 4
Hidden Layer: 7
Output Layer: 1

즉:

4 → 7 → 1
활성함수
Hidden layer: Logistic activation (sigmoid)
Output layer: Logistic activation (sigmoid)
optimizer
Adam
loss
Binary cross entropy
출력 의미

출력 노드 1개의 값이 바로 중도탈락 위험 확률입니다.

예:

0.18
0.47
0.86
4-4. 과정 ML 처리 과정
Step 1

DB에서 최근 7일 daily_survey 조회

Step 2

4개 입력 feature 생성

achievement_mean_7d
adaptation_mean_7d
relationship_mean_7d
total_delta_7d
Step 3

4-7-1 MLP 모델에 입력

Step 4

출력 노드에서 risk_score 생성

Step 5

후처리로 risk_level, risk_trend 생성

4-5. 과정 ML 출력값

1. risk_score

0~1 위험도

2. risk_level

구간화된 위험 수준

예:

0.00 ~ 0.33 → LOW
0.34 ~ 0.66 → MEDIUM
0.67 ~ 1.00 → HIGH 3) risk_trend

위험 방향성

추천 계산 방식:

최근 3일 평균 vs 이전 3일 평균 비교
차이가 커지면 UP
차이가 작으면 STABLE
줄어들면 DOWN
4-6. 과정 ML 출력의 다음 사용처
process_risk_history 저장
LLM 해석 입력
Agent 의사결정 입력 5. LLM 관점 해설

LLM은 설명 계층입니다.

핵심 질문은 이것입니다.

왜 위험한지, 운영자와 멘토가 이해할 수 있는 언어로 설명할 수 있는가?

5-1. LLM의 역할
risk_score를 다시 계산하지 않음
숫자 결과를 문장으로 바꿈
어떤 위험 유형인지 해석
Agent가 읽기 좋은 구조화 문장 생성
5-2. LLM 입력값

LLM 입력은 크게 두 경로가 있습니다.

A. 면접 단계 LLM 입력
interview_dropout_risk_score
면접 3축 평균
각 체크 항목 요약
면접관 메모 요약
B. 과정 단계 LLM 입력
risk_score
risk_level
risk_trend
achievement_mean_7d
adaptation_mean_7d
relationship_mean_7d
total_delta_7d
필요 시 과거 위험 요약
5-3. LLM 출력값

추천 구조는 아래 3개입니다.

1. state_summary

현재 상태 한 줄 요약

2. risk_reason

왜 위험한지 설명

3. risk_type

위험 유형 분류

예:

achievement_decline
adaptation_breakdown
relationship_isolation
composite_risk
5-4. 예시 출력
state_summary:
최근 7일 동안 성취도와 적응도가 동시에 하락하고 있습니다.

risk_reason:
학습 이해 부족과 성취 경험 감소가 동시에 나타나고 있으며, 현재 위험은 악화 추세입니다.

risk_type:
composite_risk
5-5. LLM 출력의 사용처
멘토가 보는 대시보드
개입 알림 메시지
Agent 의사결정 입력 6. Agent 관점 해설

Agent는 이 시스템의 행동 결정 계층입니다.

핵심 질문은 이것입니다.

지금 이 학생에게 어떤 개입을 해야 하는가?

그리고 사용자님이 원하시는 방향대로,
Agent는 단순 if문이 아니라 그래프 구조 위에서 동작하는 의사결정 시스템으로 설계할 수 있습니다.

6-1. Agent의 역할

Agent는 아래 정보를 종합합니다.

면접 단계 위험도
과정 중 현재 위험도
현재 위험 추세
LLM 해석 결과
과거 개입 결과
false alarm 기록
회복 패턴

그리고 최종적으로

경고를 보낼지
격려만 할지
면담 요청까지 갈지
를 결정합니다.
6-2. Agent 입력값
현재 상태 입력
interview_dropout_risk_score
process_risk_score
process_risk_level
process_risk_trend
current_consecutive_risk_days
해석 입력
state_summary
risk_reason
risk_type
과거 이력 입력
past_high_risk_count
avg_recovery_days
false_alarm_rate
last_action_type
action_effective_rate
6-3. Agent 출력값
필수 출력
action_type
priority
action_reason
action_type 예시
NONE
ENCOURAGE_MESSAGE
ALERT_MENTOR
REQUEST_MEETING
EMERGENCY_CASE
priority 예시
LOW
MEDIUM
HIGH 7. Agent의 노드-그래프 구조

이제 핵심입니다.
Agent를 그래프 기반 구조로 설명하겠습니다.

여기서는 단순한 지식 그래프가 아니라,
의사결정 그래프 + 상태 그래프를 함께 쓰는 구조가 좋습니다.

7-1. Agent 그래프의 기본 노드 종류

Agent는 아래 종류의 노드를 가집니다.

1. Student Node

학생 자체를 나타내는 중심 노드

예:

Student(101) 2) Interview State Node

면접 상태를 나타내는 노드

예:

InterviewRisk(HIGH)
InterviewAchievement(LOW)
InterviewAdaptation(MEDIUM) 3) Process State Node

과정 중 현재 상태를 나타내는 노드

예:

ProcessRisk(HIGH)
Trend(UP)
RiskType(composite_risk)
ConsecutiveRisk(4) 4) History Node

과거 이력 관련 노드

예:

PastHighRiskCount(3)
AvgRecoveryDays(5)
FalseAlarmRate(0.2) 5) Action Node

가능한 행동을 나타내는 노드

예:

Action(ENCOURAGE_MESSAGE)
Action(ALERT_MENTOR)
Action(REQUEST_MEETING) 6) Outcome Node

과거 행동의 결과 노드

예:

Outcome(Recovered)
Outcome(FalseAlarm)
Outcome(NotRecovered)
7-2. Agent 그래프의 엣지 구조

노드들은 관계로 연결됩니다.

예시 엣지
Student → InterviewRisk
Student → ProcessRisk
Student → RiskType
Student → PastHighRiskCount
Action → Outcome

그리고 과거 케이스를 학습하기 위해 아래 엣지가 중요합니다.

RiskType(composite_risk) → Action(REQUEST_MEETING) → Outcome(Recovered)
RiskType(adaptation_breakdown) → Action(REQUEST_MEETING) → Outcome(FalseAlarm)

즉 Agent는
**“비슷한 상태 노드에서 어떤 행동이 어떤 결과를 냈는가”**를 그래프로 축적할 수 있습니다.

7-3. Agent 의사결정 그래프 흐름

실행 흐름은 아래처럼 구성됩니다.

Node 1. Current State Aggregation

현재 학생 상태를 하나의 상태 묶음으로 정리

입력:

interview risk
process risk
trend
risk type
history

출력:

CurrentStateBundle
Node 2. Similar Case Retrieval

그래프에서 현재 상태와 비슷한 과거 케이스 탐색

입력:

CurrentStateBundle

출력:

SimilarCases
Node 3. Outcome Evaluation

비슷한 과거 케이스에서 어떤 행동이 효과 있었는지 평가

입력:

SimilarCases

출력:

각 action별 성공 확률
ENCOURAGE_MESSAGE success_rate
ALERT_MENTOR success_rate
REQUEST_MEETING success_rate
Node 4. Decision Scoring

현재 상태와 과거 결과를 결합하여 행동 점수 계산

예:

encourage_score
mentor_alert_score
meeting_score

출력:

최종 행동 우선순위
Node 5. Final Action Selection

가장 적절한 행동 선택

출력:

action_type
priority
action_reason
7-4. Agent 그래프 예시
Student(101)
├─ InterviewRisk(HIGH)
├─ ProcessRisk(HIGH)
├─ Trend(UP)
├─ RiskType(composite_risk)
├─ PastHighRiskCount(3)
├─ AvgRecoveryDays(5)
└─ FalseAlarmRate(0.1)

RiskType(composite_risk)
├─ Action(ENCOURAGE_MESSAGE) → Outcome(NotRecovered)
├─ Action(ALERT_MENTOR) → Outcome(Recovered)
└─ Action(REQUEST_MEETING) → Outcome(Recovered)

Decision:
현재 상태가 composite_risk + HIGH + UP + 반복위험이므로
Action(REQUEST_MEETING) 선택
7-5. Agent가 결과를 반영하는 방식

사용자님이 원하셨던 핵심이 이 부분입니다.

예를 들어

어떤 상태에서 REQUEST_MEETING을 했는데
실제로는 FalseAlarm이었다면

그래프에는 이렇게 기록됩니다.

RiskType(adaptation_breakdown)
→ Action(REQUEST_MEETING)
→ Outcome(FalseAlarm)

이 케이스가 쌓이면 다음에 비슷한 상태가 와도
Agent는 REQUEST_MEETING의 점수를 낮추고
ALERT_MENTOR나 ENCOURAGE_MESSAGE를 더 선호하게 됩니다.

즉 Agent는 다음처럼 학습합니다.

“이 상태에서는 너무 강한 개입은 과잉이었구나.”

이게 바로 피드백 기반 적응형 Agent입니다.

8. 전체 입출력 연결표
   8-1. DB
   입력
   학생 정보
   면접 평가
   일일 설문
   ML 결과
   Agent 행동 결과
   멘토 피드백
   출력
   면접 원본 데이터
   최근 7일 설문 데이터
   과거 위험 이력
   과거 개입 결과
   8-2. 면접 ML
   입력
   interview_assessment
   출력
   dropout_risk_score
   dropout_risk_level
   8-3. 과정 ML
   입력
   최근 7일 daily_survey
   4개 feature
   achievement_mean_7d
   adaptation_mean_7d
   relationship_mean_7d
   total_delta_7d
   출력
   risk_score
   risk_level
   risk_trend
   8-4. LLM
   입력
   면접 ML 결과 또는 과정 ML 결과
   각종 평균/변화량/해석 대상 feature
   필요 시 메모 요약
   출력
   state_summary
   risk_reason
   risk_type
   8-5. Agent
   입력
   면접 위험도
   과정 위험도
   trend
   LLM 해석
   past_high_risk_count
   avg_recovery_days
   false_alarm_rate
   action_effective_rate
   출력
   action_type
   priority
   action_reason
9. 최종 시스템 설명 문장

이 프로젝트를 가장 깔끔하게 설명하면 이렇게 됩니다.

본 시스템은 입과 전 면접 데이터와 입과 후 일일 설문 데이터를 각각 별도의 머신러닝 모델로 분석하여, 지원자의 잠재적 중도탈락 위험과 재학 중 현재 위험 상태를 동시에 추적한다. 과정 중 모델은 최근 7일 설문 데이터를 4개의 feature로 요약한 뒤 4-7-1 구조의 신경망을 통해 위험도를 계산하며, LLM은 그 결과를 자연어로 해석한다. 이후 Agent는 현재 위험도, 추세, 해석 결과, 과거 개입 효과, false alarm 이력 등을 그래프 구조로 결합해 가장 적절한 개입 행동을 선택한다. 실행 결과와 멘토 피드백은 다시 DB에 저장되어, 이후 유사한 상황에서 더 정교한 판단이 가능하도록 시스템을 지속적으로 보정한다.

결론

이번 구조를 한 줄로 정리하면 이렇습니다.

DB는 시스템의 기억
면접 ML은 입과 전 위험 예측
과정 ML은 현재 위험 예측
LLM은 위험의 의미 해석
Agent는 그래프 기반 개입 결정 및 피드백 반영

즉, 이 시스템은 단순 경고 모델이 아니라

“선발 단계부터 운영 단계까지 연결된 적응형 중도탈락 예방 시스템”
