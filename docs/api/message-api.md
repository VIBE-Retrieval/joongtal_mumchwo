# Message API

---

## POST /messages/encouragement

**목적**: 멘토가 학생에게 격려 메시지를 전송.

### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| student_id | integer | Y | 학생 ID |
| message | string | Y | 메시지 본문 |
| mentor_id | integer | N | 멘토 ID |

```json
{
  "student_id": 101,
  "message": "요즘 많이 힘드시죠? 충분히 잘 해내고 있습니다.",
  "mentor_id": 3
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
