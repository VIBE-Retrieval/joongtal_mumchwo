# DB Schema Overview

## 핵심 테이블

- students
- interview_assessment
- daily_survey
- interview_risk_history
- process_risk_history
- intervention_history
- intervention_feedback

---

## 구조 특징

- 모든 데이터는 이력 저장
- student_id 중심 연결
- 삭제 금지

---

## students 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| student_id | INTEGER PK | 학생 고유 ID |
| name | VARCHAR | 학생 이름 |
| email | VARCHAR | 이메일 (unique) |
| birth_date | VARCHAR | 생년월일 (8자리) |
| phone | VARCHAR(32) | 연락처 |
| course_name | VARCHAR(128) | 수강 과정명 |
| created_at | DATETIME | 등록일시 |

**비고**: `phone`, `course_name`은 선택 입력값. `GET /mentor/students/risks` 응답에 포함됨.
