# Meeting API

---

## POST /meetings

**목적**: 멘토 또는 학생이 미팅을 요청. 희망 슬롯을 함께 제안.

### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| student_id | integer | Y | 학생 ID |
| mentor_id | integer | Y | 멘토 ID |
| mentor_name | string | Y | 멘토 이름 |
| student_name | string | Y | 학생 이름 |
| purpose | string | Y | 미팅 목적 |
| message | string | N | 추가 메시지 |
| proposed_slots | array | Y | 희망 시간 슬롯 목록 |
| proposed_slots[].date | string | Y | 날짜 (YYYY-MM-DD) |
| proposed_slots[].time | string | Y | 시간 (HH:MM) |

```json
{
  "student_id": 101,
  "mentor_id": 3,
  "mentor_name": "김멘토",
  "student_name": "홍길동",
  "purpose": "학습 진도 점검",
  "message": "최근 어려운 점이 있어서 상담 요청드립니다.",
  "proposed_slots": [
    { "date": "2026-04-15", "time": "14:00" },
    { "date": "2026-04-16", "time": "10:00" }
  ]
}
```

### Response

**200 성공**

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

---

## GET /meetings/student/{student_id}

**목적**: 특정 학생의 미팅 목록 조회.

### Response

**200 성공**

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

---

## GET /meetings/mentor/{mentor_id}

**목적**: 특정 멘토의 미팅 목록 조회.

### Response

**200 성공**

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

---

## PUT /meetings/{meeting_id}/slots

**목적**: 상대방이 희망 시간 슬롯을 제안.

### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| selected_slots | array | Y | 제안 슬롯 목록 |
| selected_slots[].date | string | Y | 날짜 (YYYY-MM-DD) |
| selected_slots[].time | string | Y | 시간 (HH:MM) |

```json
{
  "selected_slots": [
    { "date": "2026-04-15", "time": "14:00" }
  ]
}
```

### Response

**200 성공**

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

**404**: 미팅 없음

---

## PUT /meetings/{meeting_id}/confirm

**목적**: 최종 미팅 시간을 확정.

### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| confirmed_slot | object | Y | 확정 슬롯 |
| confirmed_slot.date | string | Y | 날짜 (YYYY-MM-DD) |
| confirmed_slot.time | string | Y | 시간 (HH:MM) |

```json
{
  "confirmed_slot": { "date": "2026-04-15", "time": "14:00" }
}
```

### Response

**200 성공**

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

**404**: 미팅 없음
