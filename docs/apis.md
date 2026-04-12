# API 인덱스

전체 API 목록. 각 도메인별 상세 명세는 `docs/api/` 참조.

---

## Auth

| Method | Path | 설명 |
|--------|------|------|
| POST | /auth/login | 로그인 |

→ [auth-api.md](api/auth-api.md)

---

## Students

| Method | Path | 설명 |
|--------|------|------|
| POST | /students | 학생 등록 |
| GET | /students | 학생 목록 조회 |
| GET | /students/{student_id}/process-risk | 과정 중 위험도 조회 |
| GET | /students/{student_id}/interview-risk | 면접 기반 위험도 조회 |
| GET | /students/{student_id}/latest-analysis | 통합 분석 결과 조회 |
| GET | /students/{student_id}/progress | 나의 변화 조회 |
| GET | /students/{student_id}/care-message | 케어 메시지 조회 |

→ [student-api.md](api/student-api.md)

---

## Surveys

| Method | Path | 설명 |
|--------|------|------|
| POST | /surveys/daily | 일일 설문 제출 |

→ [survey-api.md](api/survey-api.md)

---

## Interviews

| Method | Path | 설명 |
|--------|------|------|
| POST | /interviews | 면접 평가 저장 |

→ [interview-api.md](api/interview-api.md)

---

## Mentor

| Method | Path | 설명 |
|--------|------|------|
| GET | /mentor/students/risks | 위험 학생 목록 조회 |
| GET | /mentor/alerts | 멘토 알림 조회 |

→ [mentor-api.md](api/mentor-api.md)

---

## Consultings

| Method | Path | 설명 |
|--------|------|------|
| POST | /consultings | 상담 이력 등록 |

→ [consulting-api.md](api/consulting-api.md)

---

## Messages

| Method | Path | 설명 |
|--------|------|------|
| POST | /messages/encouragement | 격려 메시지 전송 |

→ [message-api.md](api/message-api.md)

---

## Meetings

| Method | Path | 설명 |
|--------|------|------|
| POST | /meetings | 미팅 요청 생성 |
| GET | /meetings/student/{student_id} | 학생별 미팅 조회 |
| GET | /meetings/mentor/{mentor_id} | 멘토별 미팅 조회 |
| PUT | /meetings/{meeting_id}/slots | 슬롯 제안 |
| PUT | /meetings/{meeting_id}/confirm | 미팅 확정 |

→ [meeting-api.md](api/meeting-api.md)
