-- ============================================================
-- DEMO SEED DATA
-- 5명 학생, 14일치 (2026-03-31 ~ 2026-04-13)
--
-- 학생 시나리오:
--   STU_DEMO_001 김민준 : 안정 → 악화 → ALERT_MENTOR → 멘토 개입 후 회복
--   STU_DEMO_002 이서연 : 처음부터 고위험 → EMERGENCY (현재 PENDING)
--   STU_DEMO_003 박도현 : 일시 하락 → ENCOURAGE_MESSAGE → 오탐(false_alarm) 피드백
--   STU_DEMO_004 최유진 : 전 기간 안정 (NONE 계속)
--   STU_DEMO_005 정우성 : 복합 위험 악화 → REQUEST_MEETING (현재 PENDING)
-- ============================================================


-- ============================================================
-- 1. 학생 등록
-- ============================================================
INSERT OR IGNORE INTO students
  (student_id, name, email, birth_date, phone, course_name, education_level, interview_status, created_at)
VALUES
  ('STU_DEMO_001','김민준','minjun.kim@demo.com',  '19980315','010-1111-2222','AI 개발자 양성 과정','대학교 졸업','PASSED','2026-03-25 09:00:00'),
  ('STU_DEMO_002','이서연','seoyeon.lee@demo.com', '20010822','010-2222-3333','AI 개발자 양성 과정','대학교 재학','PASSED','2026-03-25 09:00:00'),
  ('STU_DEMO_003','박도현','dohyun.park@demo.com', '19990507','010-3333-4444','AI 개발자 양성 과정','대학교 졸업','PASSED','2026-03-25 09:00:00'),
  ('STU_DEMO_004','최유진','yujin.choi@demo.com',  '20000214','010-4444-5555','AI 개발자 양성 과정','대학교 재학','PASSED','2026-03-25 09:00:00'),
  ('STU_DEMO_005','정우성','woosung.jung@demo.com','19971129','010-5555-6666','AI 개발자 양성 과정','대학원 졸업','PASSED','2026-03-25 09:00:00');


-- ============================================================
-- 2. 면접 평가 (interview_assessment)
-- ============================================================
INSERT OR IGNORE INTO interview_assessment
  (student_id, achievement_score, achievement_problem_solving, achievement_self_learning, achievement_process_clarity,
   adaptation_score, adaptation_accepts_difficulty, adaptation_persistence, adaptation_strategy_variety,
   relationship_score, relationship_collaboration, relationship_conflict_handling, relationship_help_exchange,
   note, created_at)
VALUES
  -- 김민준: 전반적으로 높은 점수 (LOW risk 예상)
  ('STU_DEMO_001', 4,4,4,4, 5,4,5,4, 4,4,5,4,
   '문제 해결 의지가 강하고 협업 경험 풍부. 어려운 상황에서도 포기하지 않는 태도가 인상적.',
   '2026-03-20 10:00:00'),
  -- 이서연: 낮은 점수 (HIGH risk 예상)
  ('STU_DEMO_002', 2,2,3,2, 2,2,2,3, 3,3,2,3,
   '자기 주도 학습 경험 부족. 어려움 앞에서 쉽게 포기하는 경향. 개인 작업 위주로 협업 경험 제한적.',
   '2026-03-20 10:30:00'),
  -- 박도현: 중간 점수 (MEDIUM risk 예상)
  ('STU_DEMO_003', 3,3,4,3, 4,3,4,3, 3,3,3,4,
   '기본적인 성취 경험 있음. 적응력은 양호하나 관계 형성에 다소 소극적. 지속 관찰 필요.',
   '2026-03-20 11:00:00'),
  -- 최유진: 높은 점수 (LOW risk 예상)
  ('STU_DEMO_004', 5,5,4,5, 5,5,4,5, 5,4,5,5,
   '탁월한 자기 주도 학습 능력. 어떤 어려움에도 다양한 전략으로 돌파. 팀 내 리더십 우수.',
   '2026-03-20 11:30:00'),
  -- 정우성: 중간 점수 (MEDIUM risk 예상)
  ('STU_DEMO_005', 3,4,3,3, 3,3,3,4, 2,2,3,3,
   '성취도와 적응도는 평균 수준. 인간관계 영역에서 갈등 회피 경향 보임. 팀 활동에서 소극적.',
   '2026-03-20 14:00:00');


-- ============================================================
-- 3. 면접 ML 결과 (interview_risk_history)
-- ============================================================
INSERT OR IGNORE INTO interview_risk_history
  (student_id, interview_id, dropout_risk_score, model_version, created_at)
VALUES
  ('STU_DEMO_001', '1', 0.1820, 'interview_ml_v1', '2026-03-20 10:05:00'),
  ('STU_DEMO_002', '2', 0.7640, 'interview_ml_v1', '2026-03-20 10:35:00'),
  ('STU_DEMO_003', '3', 0.4210, 'interview_ml_v1', '2026-03-20 11:05:00'),
  ('STU_DEMO_004', '4', 0.0580, 'interview_ml_v1', '2026-03-20 11:35:00'),
  ('STU_DEMO_005', '5', 0.3890, 'interview_ml_v1', '2026-03-20 14:05:00');


-- ============================================================
-- 4. 일일 설문 (daily_survey)
--    날짜: 2026-03-31(D1) ~ 2026-04-13(D14)
-- ============================================================

-- STU_DEMO_001 김민준: 안정→악화(D7~D11)→회복(D12~D14)
INSERT OR IGNORE INTO daily_survey (student_id, survey_date, achievement_score, adaptation_score, relationship_score, created_at) VALUES
  ('STU_DEMO_001','2026-03-31', 5, 5, 4, '2026-03-31 18:00:00'),
  ('STU_DEMO_001','2026-04-01', 5, 4, 4, '2026-04-01 18:00:00'),
  ('STU_DEMO_001','2026-04-02', 4, 5, 5, '2026-04-02 18:00:00'),
  ('STU_DEMO_001','2026-04-03', 5, 4, 4, '2026-04-03 18:00:00'),
  ('STU_DEMO_001','2026-04-04', 4, 4, 4, '2026-04-04 18:00:00'),
  ('STU_DEMO_001','2026-04-05', 4, 3, 4, '2026-04-05 18:00:00'),
  ('STU_DEMO_001','2026-04-06', 3, 3, 3, '2026-04-06 18:00:00'),
  ('STU_DEMO_001','2026-04-07', 3, 2, 3, '2026-04-07 18:00:00'),
  ('STU_DEMO_001','2026-04-08', 2, 2, 3, '2026-04-08 18:00:00'),
  ('STU_DEMO_001','2026-04-09', 2, 2, 2, '2026-04-09 18:00:00'),
  ('STU_DEMO_001','2026-04-10', 2, 1, 2, '2026-04-10 18:00:00'),
  ('STU_DEMO_001','2026-04-11', 3, 3, 3, '2026-04-11 18:00:00'),
  ('STU_DEMO_001','2026-04-12', 3, 4, 3, '2026-04-12 18:00:00'),
  ('STU_DEMO_001','2026-04-13', 4, 4, 4, '2026-04-13 18:00:00');

-- STU_DEMO_002 이서연: 처음부터 하락→고위험 지속
INSERT OR IGNORE INTO daily_survey (student_id, survey_date, achievement_score, adaptation_score, relationship_score, created_at) VALUES
  ('STU_DEMO_002','2026-03-31', 3, 4, 3, '2026-03-31 18:30:00'),
  ('STU_DEMO_002','2026-04-01', 3, 3, 3, '2026-04-01 18:30:00'),
  ('STU_DEMO_002','2026-04-02', 2, 3, 3, '2026-04-02 18:30:00'),
  ('STU_DEMO_002','2026-04-03', 2, 2, 3, '2026-04-03 18:30:00'),
  ('STU_DEMO_002','2026-04-04', 2, 2, 2, '2026-04-04 18:30:00'),
  ('STU_DEMO_002','2026-04-05', 1, 2, 2, '2026-04-05 18:30:00'),
  ('STU_DEMO_002','2026-04-06', 1, 1, 2, '2026-04-06 18:30:00'),
  ('STU_DEMO_002','2026-04-07', 1, 2, 1, '2026-04-07 18:30:00'),
  ('STU_DEMO_002','2026-04-08', 2, 2, 2, '2026-04-08 18:30:00'),
  ('STU_DEMO_002','2026-04-09', 1, 1, 1, '2026-04-09 18:30:00'),
  ('STU_DEMO_002','2026-04-10', 1, 2, 1, '2026-04-10 18:30:00'),
  ('STU_DEMO_002','2026-04-11', 1, 1, 1, '2026-04-11 18:30:00'),
  ('STU_DEMO_002','2026-04-12', 2, 1, 1, '2026-04-12 18:30:00'),
  ('STU_DEMO_002','2026-04-13', 1, 1, 2, '2026-04-13 18:30:00');

-- STU_DEMO_003 박도현: 소폭 하락(D6~D7)→자연 회복 (오탐 케이스)
INSERT OR IGNORE INTO daily_survey (student_id, survey_date, achievement_score, adaptation_score, relationship_score, created_at) VALUES
  ('STU_DEMO_003','2026-03-31', 4, 3, 4, '2026-03-31 19:00:00'),
  ('STU_DEMO_003','2026-04-01', 3, 3, 4, '2026-04-01 19:00:00'),
  ('STU_DEMO_003','2026-04-02', 3, 4, 3, '2026-04-02 19:00:00'),
  ('STU_DEMO_003','2026-04-03', 4, 3, 3, '2026-04-03 19:00:00'),
  ('STU_DEMO_003','2026-04-04', 3, 3, 3, '2026-04-04 19:00:00'),
  ('STU_DEMO_003','2026-04-05', 2, 3, 3, '2026-04-05 19:00:00'),
  ('STU_DEMO_003','2026-04-06', 2, 3, 3, '2026-04-06 19:00:00'),
  ('STU_DEMO_003','2026-04-07', 3, 3, 4, '2026-04-07 19:00:00'),
  ('STU_DEMO_003','2026-04-08', 4, 4, 3, '2026-04-08 19:00:00'),
  ('STU_DEMO_003','2026-04-09', 4, 3, 4, '2026-04-09 19:00:00'),
  ('STU_DEMO_003','2026-04-10', 3, 4, 4, '2026-04-10 19:00:00'),
  ('STU_DEMO_003','2026-04-11', 4, 4, 4, '2026-04-11 19:00:00'),
  ('STU_DEMO_003','2026-04-12', 4, 3, 4, '2026-04-12 19:00:00'),
  ('STU_DEMO_003','2026-04-13', 3, 4, 3, '2026-04-13 19:00:00');

-- STU_DEMO_004 최유진: 전 기간 안정
INSERT OR IGNORE INTO daily_survey (student_id, survey_date, achievement_score, adaptation_score, relationship_score, created_at) VALUES
  ('STU_DEMO_004','2026-03-31', 5, 4, 5, '2026-03-31 17:00:00'),
  ('STU_DEMO_004','2026-04-01', 4, 5, 4, '2026-04-01 17:00:00'),
  ('STU_DEMO_004','2026-04-02', 5, 5, 4, '2026-04-02 17:00:00'),
  ('STU_DEMO_004','2026-04-03', 4, 4, 5, '2026-04-03 17:00:00'),
  ('STU_DEMO_004','2026-04-04', 5, 4, 4, '2026-04-04 17:00:00'),
  ('STU_DEMO_004','2026-04-05', 4, 5, 5, '2026-04-05 17:00:00'),
  ('STU_DEMO_004','2026-04-06', 5, 4, 4, '2026-04-06 17:00:00'),
  ('STU_DEMO_004','2026-04-07', 4, 4, 5, '2026-04-07 17:00:00'),
  ('STU_DEMO_004','2026-04-08', 5, 5, 4, '2026-04-08 17:00:00'),
  ('STU_DEMO_004','2026-04-09', 4, 4, 4, '2026-04-09 17:00:00'),
  ('STU_DEMO_004','2026-04-10', 5, 4, 5, '2026-04-10 17:00:00'),
  ('STU_DEMO_004','2026-04-11', 4, 5, 4, '2026-04-11 17:00:00'),
  ('STU_DEMO_004','2026-04-12', 5, 4, 4, '2026-04-12 17:00:00'),
  ('STU_DEMO_004','2026-04-13', 4, 4, 5, '2026-04-13 17:00:00');

-- STU_DEMO_005 정우성: 중반부터 복합 위험 악화
INSERT OR IGNORE INTO daily_survey (student_id, survey_date, achievement_score, adaptation_score, relationship_score, created_at) VALUES
  ('STU_DEMO_005','2026-03-31', 4, 4, 3, '2026-03-31 18:00:00'),
  ('STU_DEMO_005','2026-04-01', 4, 3, 3, '2026-04-01 18:00:00'),
  ('STU_DEMO_005','2026-04-02', 3, 3, 4, '2026-04-02 18:00:00'),
  ('STU_DEMO_005','2026-04-03', 3, 4, 3, '2026-04-03 18:00:00'),
  ('STU_DEMO_005','2026-04-04', 3, 3, 3, '2026-04-04 18:00:00'),
  ('STU_DEMO_005','2026-04-05', 3, 2, 2, '2026-04-05 18:00:00'),
  ('STU_DEMO_005','2026-04-06', 2, 2, 2, '2026-04-06 18:00:00'),
  ('STU_DEMO_005','2026-04-07', 2, 3, 2, '2026-04-07 18:00:00'),
  ('STU_DEMO_005','2026-04-08', 2, 2, 1, '2026-04-08 18:00:00'),
  ('STU_DEMO_005','2026-04-09', 2, 2, 2, '2026-04-09 18:00:00'),
  ('STU_DEMO_005','2026-04-10', 1, 2, 2, '2026-04-10 18:00:00'),
  ('STU_DEMO_005','2026-04-11', 2, 2, 2, '2026-04-11 18:00:00'),
  ('STU_DEMO_005','2026-04-12', 2, 1, 2, '2026-04-12 18:00:00'),
  ('STU_DEMO_005','2026-04-13', 2, 2, 1, '2026-04-13 18:00:00');


-- ============================================================
-- 5. 과정 ML 위험도 이력 (process_risk_history)
-- ============================================================

-- STU_DEMO_001 김민준
INSERT OR IGNORE INTO process_risk_history
  (student_id, date, risk_score, risk_level, risk_trend, consecutive_risk_days, feature_snapshot, model_version, created_at)
VALUES
  ('STU_DEMO_001','2026-03-31',0.0720,'LOW','STABLE', 0,'{"achievement_mean_7d":5.0,"adaptation_mean_7d":5.0,"relationship_mean_7d":4.0,"total_delta_7d":0.0}','process_ml_v1','2026-03-31 18:01:00'),
  ('STU_DEMO_001','2026-04-01',0.0830,'LOW','STABLE', 0,'{"achievement_mean_7d":5.0,"adaptation_mean_7d":4.5,"relationship_mean_7d":4.0,"total_delta_7d":0.0}','process_ml_v1','2026-04-01 18:01:00'),
  ('STU_DEMO_001','2026-04-02',0.0690,'LOW','STABLE', 0,'{"achievement_mean_7d":4.67,"adaptation_mean_7d":4.67,"relationship_mean_7d":4.33,"total_delta_7d":0.0}','process_ml_v1','2026-04-02 18:01:00'),
  ('STU_DEMO_001','2026-04-03',0.0780,'LOW','STABLE', 0,'{"achievement_mean_7d":4.75,"adaptation_mean_7d":4.5,"relationship_mean_7d":4.25,"total_delta_7d":0.0}','process_ml_v1','2026-04-03 18:01:00'),
  ('STU_DEMO_001','2026-04-04',0.1050,'LOW','STABLE', 0,'{"achievement_mean_7d":4.6,"adaptation_mean_7d":4.4,"relationship_mean_7d":4.2,"total_delta_7d":0.0}','process_ml_v1','2026-04-04 18:01:00'),
  ('STU_DEMO_001','2026-04-05',0.1620,'LOW','STABLE', 0,'{"achievement_mean_7d":4.5,"adaptation_mean_7d":4.17,"relationship_mean_7d":4.17,"total_delta_7d":-0.17}','process_ml_v1','2026-04-05 18:01:00'),
  ('STU_DEMO_001','2026-04-06',0.3810,'MEDIUM','UP',  0,'{"achievement_mean_7d":4.14,"adaptation_mean_7d":3.86,"relationship_mean_7d":4.0,"total_delta_7d":-0.43}','process_ml_v1','2026-04-06 18:01:00'),
  ('STU_DEMO_001','2026-04-07',0.4650,'MEDIUM','UP',  0,'{"achievement_mean_7d":4.0,"adaptation_mean_7d":3.57,"relationship_mean_7d":4.0,"total_delta_7d":-0.67}','process_ml_v1','2026-04-07 18:01:00'),
  ('STU_DEMO_001','2026-04-08',0.5510,'MEDIUM','UP',  0,'{"achievement_mean_7d":3.71,"adaptation_mean_7d":3.29,"relationship_mean_7d":3.86,"total_delta_7d":-0.86}','process_ml_v1','2026-04-08 18:01:00'),
  ('STU_DEMO_001','2026-04-09',0.7240,'HIGH','UP',    1,'{"achievement_mean_7d":3.43,"adaptation_mean_7d":3.0,"relationship_mean_7d":3.57,"total_delta_7d":-1.0}','process_ml_v1','2026-04-09 18:01:00'),
  ('STU_DEMO_001','2026-04-10',0.8120,'HIGH','UP',    2,'{"achievement_mean_7d":3.0,"adaptation_mean_7d":2.71,"relationship_mean_7d":3.43,"total_delta_7d":-1.17}','process_ml_v1','2026-04-10 18:01:00'),
  ('STU_DEMO_001','2026-04-11',0.5380,'MEDIUM','DOWN',0,'{"achievement_mean_7d":2.86,"adaptation_mean_7d":2.71,"relationship_mean_7d":3.14,"total_delta_7d":-0.67}','process_ml_v1','2026-04-11 18:01:00'),
  ('STU_DEMO_001','2026-04-12',0.3740,'MEDIUM','DOWN',0,'{"achievement_mean_7d":2.86,"adaptation_mean_7d":2.86,"relationship_mean_7d":3.0,"total_delta_7d":-0.33}','process_ml_v1','2026-04-12 18:01:00'),
  ('STU_DEMO_001','2026-04-13',0.2050,'LOW','DOWN',   0,'{"achievement_mean_7d":3.0,"adaptation_mean_7d":3.0,"relationship_mean_7d":3.14,"total_delta_7d":0.17}','process_ml_v1','2026-04-13 18:01:00');

-- STU_DEMO_002 이서연
INSERT OR IGNORE INTO process_risk_history
  (student_id, date, risk_score, risk_level, risk_trend, consecutive_risk_days, feature_snapshot, model_version, created_at)
VALUES
  ('STU_DEMO_002','2026-03-31',0.2790,'LOW','STABLE', 0,'{"achievement_mean_7d":3.0,"adaptation_mean_7d":4.0,"relationship_mean_7d":3.0,"total_delta_7d":0.0}','process_ml_v1','2026-03-31 18:31:00'),
  ('STU_DEMO_002','2026-04-01',0.3830,'MEDIUM','UP',  0,'{"achievement_mean_7d":3.0,"adaptation_mean_7d":3.5,"relationship_mean_7d":3.0,"total_delta_7d":-0.33}','process_ml_v1','2026-04-01 18:31:00'),
  ('STU_DEMO_002','2026-04-02',0.4720,'MEDIUM','UP',  0,'{"achievement_mean_7d":2.67,"adaptation_mean_7d":3.33,"relationship_mean_7d":3.0,"total_delta_7d":-0.33}','process_ml_v1','2026-04-02 18:31:00'),
  ('STU_DEMO_002','2026-04-03',0.5680,'MEDIUM','UP',  0,'{"achievement_mean_7d":2.5,"adaptation_mean_7d":3.0,"relationship_mean_7d":3.0,"total_delta_7d":-0.5}','process_ml_v1','2026-04-03 18:31:00'),
  ('STU_DEMO_002','2026-04-04',0.7110,'HIGH','UP',    1,'{"achievement_mean_7d":2.4,"adaptation_mean_7d":2.8,"relationship_mean_7d":2.8,"total_delta_7d":-0.6}','process_ml_v1','2026-04-04 18:31:00'),
  ('STU_DEMO_002','2026-04-05',0.7830,'HIGH','UP',    2,'{"achievement_mean_7d":2.17,"adaptation_mean_7d":2.67,"relationship_mean_7d":2.67,"total_delta_7d":-0.83}','process_ml_v1','2026-04-05 18:31:00'),
  ('STU_DEMO_002','2026-04-06',0.8390,'HIGH','UP',    3,'{"achievement_mean_7d":1.86,"adaptation_mean_7d":2.43,"relationship_mean_7d":2.57,"total_delta_7d":-1.0}','process_ml_v1','2026-04-06 18:31:00'),
  ('STU_DEMO_002','2026-04-07',0.8220,'HIGH','STABLE',4,'{"achievement_mean_7d":1.71,"adaptation_mean_7d":2.29,"relationship_mean_7d":2.43,"total_delta_7d":-1.0}','process_ml_v1','2026-04-07 18:31:00'),
  ('STU_DEMO_002','2026-04-08',0.7940,'HIGH','STABLE',5,'{"achievement_mean_7d":1.71,"adaptation_mean_7d":2.14,"relationship_mean_7d":2.29,"total_delta_7d":-1.0}','process_ml_v1','2026-04-08 18:31:00'),
  ('STU_DEMO_002','2026-04-09',0.8810,'HIGH','UP',    6,'{"achievement_mean_7d":1.57,"adaptation_mean_7d":1.86,"relationship_mean_7d":2.0,"total_delta_7d":-1.17}','process_ml_v1','2026-04-09 18:31:00'),
  ('STU_DEMO_002','2026-04-10',0.8530,'HIGH','STABLE',7,'{"achievement_mean_7d":1.43,"adaptation_mean_7d":1.86,"relationship_mean_7d":1.86,"total_delta_7d":-1.17}','process_ml_v1','2026-04-10 18:31:00'),
  ('STU_DEMO_002','2026-04-11',0.9120,'HIGH','UP',    8,'{"achievement_mean_7d":1.29,"adaptation_mean_7d":1.71,"relationship_mean_7d":1.71,"total_delta_7d":-1.33}','process_ml_v1','2026-04-11 18:31:00'),
  ('STU_DEMO_002','2026-04-12',0.8750,'HIGH','STABLE',9,'{"achievement_mean_7d":1.29,"adaptation_mean_7d":1.57,"relationship_mean_7d":1.57,"total_delta_7d":-1.33}','process_ml_v1','2026-04-12 18:31:00'),
  ('STU_DEMO_002','2026-04-13',0.8490,'HIGH','STABLE',10,'{"achievement_mean_7d":1.29,"adaptation_mean_7d":1.57,"relationship_mean_7d":1.57,"total_delta_7d":-1.17}','process_ml_v1','2026-04-13 18:31:00');

-- STU_DEMO_003 박도현 (오탐 케이스)
INSERT OR IGNORE INTO process_risk_history
  (student_id, date, risk_score, risk_level, risk_trend, consecutive_risk_days, feature_snapshot, model_version, created_at)
VALUES
  ('STU_DEMO_003','2026-03-31',0.2220,'LOW','STABLE', 0,'{"achievement_mean_7d":4.0,"adaptation_mean_7d":3.0,"relationship_mean_7d":4.0,"total_delta_7d":0.0}','process_ml_v1','2026-03-31 19:01:00'),
  ('STU_DEMO_003','2026-04-01',0.2710,'LOW','STABLE', 0,'{"achievement_mean_7d":3.5,"adaptation_mean_7d":3.0,"relationship_mean_7d":4.0,"total_delta_7d":0.0}','process_ml_v1','2026-04-01 19:01:00'),
  ('STU_DEMO_003','2026-04-02',0.2490,'LOW','STABLE', 0,'{"achievement_mean_7d":3.33,"adaptation_mean_7d":3.33,"relationship_mean_7d":3.67,"total_delta_7d":0.0}','process_ml_v1','2026-04-02 19:01:00'),
  ('STU_DEMO_003','2026-04-03',0.2630,'LOW','STABLE', 0,'{"achievement_mean_7d":3.5,"adaptation_mean_7d":3.25,"relationship_mean_7d":3.5,"total_delta_7d":0.0}','process_ml_v1','2026-04-03 19:01:00'),
  ('STU_DEMO_003','2026-04-04',0.3550,'MEDIUM','UP',  0,'{"achievement_mean_7d":3.4,"adaptation_mean_7d":3.2,"relationship_mean_7d":3.4,"total_delta_7d":-0.33}','process_ml_v1','2026-04-04 19:01:00'),
  ('STU_DEMO_003','2026-04-05',0.4210,'MEDIUM','UP',  0,'{"achievement_mean_7d":3.17,"adaptation_mean_7d":3.17,"relationship_mean_7d":3.33,"total_delta_7d":-0.67}','process_ml_v1','2026-04-05 19:01:00'),
  ('STU_DEMO_003','2026-04-06',0.4480,'MEDIUM','STABLE',0,'{"achievement_mean_7d":3.0,"adaptation_mean_7d":3.14,"relationship_mean_7d":3.29,"total_delta_7d":-0.67}','process_ml_v1','2026-04-06 19:01:00'),
  ('STU_DEMO_003','2026-04-07',0.3020,'LOW','DOWN',   0,'{"achievement_mean_7d":3.14,"adaptation_mean_7d":3.14,"relationship_mean_7d":3.43,"total_delta_7d":-0.33}','process_ml_v1','2026-04-07 19:01:00'),
  ('STU_DEMO_003','2026-04-08',0.1970,'LOW','DOWN',   0,'{"achievement_mean_7d":3.29,"adaptation_mean_7d":3.29,"relationship_mean_7d":3.43,"total_delta_7d":0.0}','process_ml_v1','2026-04-08 19:01:00'),
  ('STU_DEMO_003','2026-04-09',0.2080,'LOW','STABLE', 0,'{"achievement_mean_7d":3.43,"adaptation_mean_7d":3.29,"relationship_mean_7d":3.57,"total_delta_7d":0.0}','process_ml_v1','2026-04-09 19:01:00'),
  ('STU_DEMO_003','2026-04-10',0.1850,'LOW','STABLE', 0,'{"achievement_mean_7d":3.43,"adaptation_mean_7d":3.43,"relationship_mean_7d":3.57,"total_delta_7d":0.0}','process_ml_v1','2026-04-10 19:01:00'),
  ('STU_DEMO_003','2026-04-11',0.1490,'LOW','STABLE', 0,'{"achievement_mean_7d":3.57,"adaptation_mean_7d":3.43,"relationship_mean_7d":3.71,"total_delta_7d":0.17}','process_ml_v1','2026-04-11 19:01:00'),
  ('STU_DEMO_003','2026-04-12',0.1720,'LOW','STABLE', 0,'{"achievement_mean_7d":3.57,"adaptation_mean_7d":3.43,"relationship_mean_7d":3.71,"total_delta_7d":0.0}','process_ml_v1','2026-04-12 19:01:00'),
  ('STU_DEMO_003','2026-04-13',0.1930,'LOW','STABLE', 0,'{"achievement_mean_7d":3.43,"adaptation_mean_7d":3.57,"relationship_mean_7d":3.57,"total_delta_7d":0.0}','process_ml_v1','2026-04-13 19:01:00');

-- STU_DEMO_004 최유진 (전 기간 안정)
INSERT OR IGNORE INTO process_risk_history
  (student_id, date, risk_score, risk_level, risk_trend, consecutive_risk_days, feature_snapshot, model_version, created_at)
VALUES
  ('STU_DEMO_004','2026-03-31',0.0510,'LOW','STABLE', 0,'{"achievement_mean_7d":5.0,"adaptation_mean_7d":4.0,"relationship_mean_7d":5.0,"total_delta_7d":0.0}','process_ml_v1','2026-03-31 17:01:00'),
  ('STU_DEMO_004','2026-04-01',0.0580,'LOW','STABLE', 0,'{"achievement_mean_7d":4.5,"adaptation_mean_7d":4.5,"relationship_mean_7d":4.5,"total_delta_7d":0.0}','process_ml_v1','2026-04-01 17:01:00'),
  ('STU_DEMO_004','2026-04-02',0.0430,'LOW','STABLE', 0,'{"achievement_mean_7d":4.67,"adaptation_mean_7d":4.67,"relationship_mean_7d":4.33,"total_delta_7d":0.0}','process_ml_v1','2026-04-02 17:01:00'),
  ('STU_DEMO_004','2026-04-03',0.0650,'LOW','STABLE', 0,'{"achievement_mean_7d":4.5,"adaptation_mean_7d":4.5,"relationship_mean_7d":4.5,"total_delta_7d":0.0}','process_ml_v1','2026-04-03 17:01:00'),
  ('STU_DEMO_004','2026-04-04',0.0590,'LOW','STABLE', 0,'{"achievement_mean_7d":4.6,"adaptation_mean_7d":4.4,"relationship_mean_7d":4.4,"total_delta_7d":0.0}','process_ml_v1','2026-04-04 17:01:00'),
  ('STU_DEMO_004','2026-04-05',0.0520,'LOW','STABLE', 0,'{"achievement_mean_7d":4.5,"adaptation_mean_7d":4.5,"relationship_mean_7d":4.5,"total_delta_7d":0.0}','process_ml_v1','2026-04-05 17:01:00'),
  ('STU_DEMO_004','2026-04-06',0.0680,'LOW','STABLE', 0,'{"achievement_mean_7d":4.57,"adaptation_mean_7d":4.43,"relationship_mean_7d":4.43,"total_delta_7d":0.0}','process_ml_v1','2026-04-06 17:01:00'),
  ('STU_DEMO_004','2026-04-07',0.0610,'LOW','STABLE', 0,'{"achievement_mean_7d":4.57,"adaptation_mean_7d":4.43,"relationship_mean_7d":4.57,"total_delta_7d":0.0}','process_ml_v1','2026-04-07 17:01:00'),
  ('STU_DEMO_004','2026-04-08',0.0490,'LOW','STABLE', 0,'{"achievement_mean_7d":4.57,"adaptation_mean_7d":4.57,"relationship_mean_7d":4.43,"total_delta_7d":0.0}','process_ml_v1','2026-04-08 17:01:00'),
  ('STU_DEMO_004','2026-04-09',0.0870,'LOW','STABLE', 0,'{"achievement_mean_7d":4.43,"adaptation_mean_7d":4.43,"relationship_mean_7d":4.43,"total_delta_7d":0.0}','process_ml_v1','2026-04-09 17:01:00'),
  ('STU_DEMO_004','2026-04-10',0.0560,'LOW','STABLE', 0,'{"achievement_mean_7d":4.57,"adaptation_mean_7d":4.43,"relationship_mean_7d":4.57,"total_delta_7d":0.0}','process_ml_v1','2026-04-10 17:01:00'),
  ('STU_DEMO_004','2026-04-11',0.0480,'LOW','STABLE', 0,'{"achievement_mean_7d":4.57,"adaptation_mean_7d":4.57,"relationship_mean_7d":4.43,"total_delta_7d":0.0}','process_ml_v1','2026-04-11 17:01:00'),
  ('STU_DEMO_004','2026-04-12',0.0630,'LOW','STABLE', 0,'{"achievement_mean_7d":4.57,"adaptation_mean_7d":4.43,"relationship_mean_7d":4.43,"total_delta_7d":0.0}','process_ml_v1','2026-04-12 17:01:00'),
  ('STU_DEMO_004','2026-04-13',0.0550,'LOW','STABLE', 0,'{"achievement_mean_7d":4.43,"adaptation_mean_7d":4.43,"relationship_mean_7d":4.57,"total_delta_7d":0.0}','process_ml_v1','2026-04-13 17:01:00');

-- STU_DEMO_005 정우성 (복합 위험 진행)
INSERT OR IGNORE INTO process_risk_history
  (student_id, date, risk_score, risk_level, risk_trend, consecutive_risk_days, feature_snapshot, model_version, created_at)
VALUES
  ('STU_DEMO_005','2026-03-31',0.2140,'LOW','STABLE', 0,'{"achievement_mean_7d":4.0,"adaptation_mean_7d":4.0,"relationship_mean_7d":3.0,"total_delta_7d":0.0}','process_ml_v1','2026-03-31 18:01:00'),
  ('STU_DEMO_005','2026-04-01',0.2620,'LOW','STABLE', 0,'{"achievement_mean_7d":4.0,"adaptation_mean_7d":3.5,"relationship_mean_7d":3.0,"total_delta_7d":0.0}','process_ml_v1','2026-04-01 18:01:00'),
  ('STU_DEMO_005','2026-04-02',0.3170,'LOW','STABLE', 0,'{"achievement_mean_7d":3.67,"adaptation_mean_7d":3.33,"relationship_mean_7d":3.33,"total_delta_7d":0.0}','process_ml_v1','2026-04-02 18:01:00'),
  ('STU_DEMO_005','2026-04-03',0.2940,'LOW','STABLE', 0,'{"achievement_mean_7d":3.5,"adaptation_mean_7d":3.5,"relationship_mean_7d":3.25,"total_delta_7d":0.0}','process_ml_v1','2026-04-03 18:01:00'),
  ('STU_DEMO_005','2026-04-04',0.3820,'MEDIUM','UP',  0,'{"achievement_mean_7d":3.4,"adaptation_mean_7d":3.2,"relationship_mean_7d":3.0,"total_delta_7d":-0.33}','process_ml_v1','2026-04-04 18:01:00'),
  ('STU_DEMO_005','2026-04-05',0.5430,'MEDIUM','UP',  0,'{"achievement_mean_7d":3.33,"adaptation_mean_7d":3.0,"relationship_mean_7d":2.83,"total_delta_7d":-0.67}','process_ml_v1','2026-04-05 18:01:00'),
  ('STU_DEMO_005','2026-04-06',0.6920,'HIGH','UP',    1,'{"achievement_mean_7d":3.14,"adaptation_mean_7d":2.86,"relationship_mean_7d":2.71,"total_delta_7d":-1.0}','process_ml_v1','2026-04-06 18:01:00'),
  ('STU_DEMO_005','2026-04-07',0.7050,'HIGH','STABLE',2,'{"achievement_mean_7d":3.0,"adaptation_mean_7d":2.86,"relationship_mean_7d":2.57,"total_delta_7d":-1.0}','process_ml_v1','2026-04-07 18:01:00'),
  ('STU_DEMO_005','2026-04-08',0.7480,'HIGH','UP',    3,'{"achievement_mean_7d":2.86,"adaptation_mean_7d":2.71,"relationship_mean_7d":2.43,"total_delta_7d":-1.17}','process_ml_v1','2026-04-08 18:01:00'),
  ('STU_DEMO_005','2026-04-09',0.7210,'HIGH','STABLE',4,'{"achievement_mean_7d":2.71,"adaptation_mean_7d":2.71,"relationship_mean_7d":2.43,"total_delta_7d":-1.0}','process_ml_v1','2026-04-09 18:01:00'),
  ('STU_DEMO_005','2026-04-10',0.7830,'HIGH','UP',    5,'{"achievement_mean_7d":2.57,"adaptation_mean_7d":2.57,"relationship_mean_7d":2.29,"total_delta_7d":-1.17}','process_ml_v1','2026-04-10 18:01:00'),
  ('STU_DEMO_005','2026-04-11',0.7540,'HIGH','STABLE',6,'{"achievement_mean_7d":2.43,"adaptation_mean_7d":2.43,"relationship_mean_7d":2.29,"total_delta_7d":-1.17}','process_ml_v1','2026-04-11 18:01:00'),
  ('STU_DEMO_005','2026-04-12',0.7690,'HIGH','STABLE',7,'{"achievement_mean_7d":2.29,"adaptation_mean_7d":2.29,"relationship_mean_7d":2.14,"total_delta_7d":-1.17}','process_ml_v1','2026-04-12 18:01:00'),
  ('STU_DEMO_005','2026-04-13',0.7420,'HIGH','STABLE',8,'{"achievement_mean_7d":2.14,"adaptation_mean_7d":2.14,"relationship_mean_7d":1.86,"total_delta_7d":-1.17}','process_ml_v1','2026-04-13 18:01:00');


-- ============================================================
-- 6. Agent 개입 이력 (intervention_history)
-- ============================================================

INSERT OR IGNORE INTO intervention_history
  (intervention_id, student_id, date, action_type, priority, action_reason, llm_summary, status, created_at)
VALUES

  -- ── STU_DEMO_001 김민준 ─────────────────────────────────────────
  (101, 'STU_DEMO_001', '2026-04-06', 'NONE', 'MEDIUM',
   'MEDIUM 위험 / STABLE 추세 / achievement_decline → NONE 결정',
   '최근 7일간 전반적인 점수 하락이 시작되고 있습니다. 아직 임계치 이하이나 추이를 모니터링할 필요가 있습니다.',
   'COMPLETED', '2026-04-06 18:02:00'),

  (102, 'STU_DEMO_001', '2026-04-09', 'ENCOURAGE_MESSAGE', 'HIGH',
   'HIGH 위험 / UP 추세 / achievement_decline → ENCOURAGE_MESSAGE 결정',
   '성취도와 적응도가 동시에 하락하며 위험 수위에 도달했습니다. 학습 이해 부족이 누적되어 자신감이 저하된 것으로 보입니다.',
   'COMPLETED', '2026-04-09 18:02:00'),

  (103, 'STU_DEMO_001', '2026-04-10', 'ALERT_MENTOR', 'HIGH',
   'HIGH 위험 / UP 추세 / achievement_decline → ALERT_MENTOR 결정',
   '성취도, 적응도, 인간관계 전 항목이 하락 중입니다. 특히 적응도가 최저치(1점)를 기록하며 학습 지속 의지에 심각한 위기 신호가 감지됩니다.',
   'COMPLETED', '2026-04-10 18:02:00'),

  (104, 'STU_DEMO_001', '2026-04-11', 'NONE', 'MEDIUM',
   'MEDIUM 위험 / DOWN 추세 / achievement_decline → NONE 결정',
   '멘토 개입 후 전반적인 점수가 회복되고 있습니다. 위험 수위가 감소 추세로 전환되어 현재는 추가 개입 없이 경과를 관찰합니다.',
   'COMPLETED', '2026-04-11 18:02:00'),

  (105, 'STU_DEMO_001', '2026-04-13', 'NONE', 'LOW',
   'LOW 위험 / DOWN 추세 / achievement_decline → NONE 결정',
   '위험도가 LOW로 안정화되었습니다. 이전 개입이 효과적으로 작용한 것으로 보입니다.',
   'COMPLETED', '2026-04-13 18:02:00'),

  -- ── STU_DEMO_002 이서연 ─────────────────────────────────────────
  (201, 'STU_DEMO_002', '2026-04-04', 'ENCOURAGE_MESSAGE', 'HIGH',
   'HIGH 위험 / UP 추세 / adaptation_breakdown → ENCOURAGE_MESSAGE 결정',
   '적응도를 중심으로 학습 의욕이 급격히 저하되고 있습니다. 전 항목이 하락세를 보이며, 초기 단계의 심리적 지지가 필요합니다.',
   'COMPLETED', '2026-04-04 18:32:00'),

  (202, 'STU_DEMO_002', '2026-04-06', 'ALERT_MENTOR', 'HIGH',
   'HIGH 위험 / UP 추세 / adaptation_breakdown → ALERT_MENTOR 결정',
   '3일 연속 HIGH 위험 상태가 지속되고 있습니다. 격려 메시지 이후에도 개선이 없어 멘토의 직접 확인이 필요합니다.',
   'COMPLETED', '2026-04-06 18:32:00'),

  (203, 'STU_DEMO_002', '2026-04-08', 'REQUEST_MEETING', 'HIGH',
   'HIGH 위험 / STABLE 추세 / composite_risk → REQUEST_MEETING 결정',
   '5일 연속 HIGH 위험이 지속되며 과거 유사 케이스에서 격려와 알림만으로는 효과가 없었습니다.',
   'COMPLETED', '2026-04-08 18:32:00'),

  (204, 'STU_DEMO_002', '2026-04-11', 'EMERGENCY', 'HIGH',
   'HIGH 위험 / UP 추세 / composite_risk → EMERGENCY 결정',
   '8일 연속 HIGH 위험 상태로, 면담 실시 이후에도 위험도가 0.91까지 상승했습니다. 긴급 면담 및 즉시 개입이 필요합니다.',
   'PENDING', '2026-04-11 18:32:00'),

  -- ── STU_DEMO_003 박도현 (오탐 케이스) ──────────────────────────
  (301, 'STU_DEMO_003', '2026-04-06', 'ENCOURAGE_MESSAGE', 'MEDIUM',
   'MEDIUM 위험 / UP 추세 / achievement_decline → ENCOURAGE_MESSAGE 결정',
   '최근 이틀간 성취도 점수가 일시 하락했습니다. 과거 이력 상 이 학생은 회복력이 높으나 현재 패턴이 우려 수준입니다.',
   'COMPLETED', '2026-04-06 19:02:00'),

  -- ── STU_DEMO_004 최유진 (안정) ─────────────────────────────────
  (401, 'STU_DEMO_004', '2026-04-06', 'NONE', 'LOW',
   'LOW 위험 / STABLE 추세 / no_risk → NONE 결정',
   '전반적으로 매우 안정적인 상태를 유지하고 있습니다.',
   'COMPLETED', '2026-04-06 17:02:00'),

  -- ── STU_DEMO_005 정우성 (복합 위험 진행) ───────────────────────
  (501, 'STU_DEMO_005', '2026-04-06', 'ENCOURAGE_MESSAGE', 'HIGH',
   'HIGH 위험 / UP 추세 / composite_risk → ENCOURAGE_MESSAGE 결정',
   '성취도와 적응도의 동반 하락에 인간관계 저하까지 겹쳐 복합 위험으로 분류됩니다.',
   'COMPLETED', '2026-04-06 18:02:00'),

  (502, 'STU_DEMO_005', '2026-04-08', 'ALERT_MENTOR', 'HIGH',
   'HIGH 위험 / UP 추세 / composite_risk → ALERT_MENTOR 결정',
   '3일 연속 HIGH 위험이 지속되며 격려 메시지 이후에도 인간관계 점수가 1점까지 하락했습니다.',
   'COMPLETED', '2026-04-08 18:02:00'),

  (503, 'STU_DEMO_005', '2026-04-10', 'REQUEST_MEETING', 'HIGH',
   'HIGH 위험 / UP 추세 / composite_risk → REQUEST_MEETING 결정',
   '5일 연속 HIGH 위험이 지속되며 성취도, 적응도, 인간관계 모두 2점 이하로 추락했습니다.',
   'PENDING', '2026-04-10 18:02:00');


-- ============================================================
-- 7. 멘토 피드백 (intervention_feedback)
-- ============================================================

INSERT OR IGNORE INTO intervention_feedback
  (feedback_id, student_id, intervention_id, mentor_feedback, action_effective, recovery_days, created_at)
VALUES
  (1001, 'STU_DEMO_001', 102, NULL,          1, NULL, '2026-04-11 10:00:00'),
  (1002, 'STU_DEMO_001', 103, 'recovered',   1, 3,    '2026-04-13 11:00:00'),
  (2001, 'STU_DEMO_002', 202, NULL,          0, NULL, '2026-04-08 09:00:00'),
  (2002, 'STU_DEMO_002', 203, NULL,          0, NULL, '2026-04-10 09:00:00'),
  (3001, 'STU_DEMO_003', 301, 'false_alarm', 0, NULL, '2026-04-08 10:00:00'),
  (5001, 'STU_DEMO_005', 501, NULL,          1, NULL, '2026-04-08 10:00:00');
