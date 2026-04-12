# Auth API

## POST /auth/login

**목적**: 이메일 + 생년월일로 로그인. role에 따라 학생/멘토/면접관 구분.

### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| email | string | Y | 이메일 |
| birth_date | string | Y | 생년월일 (8자리, YYYYMMDD) |
| role | string | Y | `"student"` \| `"mentor"` \| `"interviewer"` |

```json
{
  "email": "hong@example.com",
  "birth_date": "20000101",
  "role": "student"
}
```

### Response

**200 성공**

```json
{
  "code": 200,
  "message": "로그인 성공",
  "data": {
    "user": {
      "id": 101,
      "name": "홍길동"
    }
  }
}
```

**401 실패**

```json
{
  "code": 401,
  "message": "이메일 또는 생년월일이 올바르지 않습니다."
}
```
