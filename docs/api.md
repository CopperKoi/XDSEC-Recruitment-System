# API Design (Apifox Ready) - XDSEC 招新系统

Base URL: `/api`

## Global Settings
- Content-Type: `application/json`
- Auth: Session cookie `session_id` + CSRF header `X-CSRF-Token`
- Cookies: `HttpOnly`, `Secure`, `SameSite=Lax`

## Common Response
```json
{
  "ok": true,
  "message": "optional",
  "data": {}
}
```

## Common Error Codes
- `400` validation error
- `401` unauthenticated
- `403` forbidden (RBAC)
- `404` not found
- `409` conflict (duplicate id/email)
- `429` rate limited
- `500` server error

## Enums
- Role: `interviewee | interviewer`
- EmailCodePurpose: `register | reset | profile`
- InterviewStatus: `r1_pending | r1_passed | r2_pending | r2_passed | rejected | offer`
- Direction: `Web | Pwn | Reverse | Crypto | Misc | Dev | Art`

## Schemas
### User (public)
```json
{
  "nickname": "string",
  "email": "string",
  "signature": "string",
  "directions": ["Web"],
  "passedDirections": ["Web"],
  "passedDirectionsBy": "string",
  "status": "r1_pending"
}
```

### User (interviewer view)
```json
{
  "id": "string",
  "email": "string",
  "nickname": "string",
  "signature": "string",
  "role": "interviewee",
  "email": "string",
  "passedDirections": ["Web"],
  "passedDirectionsBy": "string",
  "status": "r1_pending",
  "application": {
    "realName": "string",
    "phone": "string",
    "gender": "string",
    "department": "string",
    "major": "string",
    "studentId": "string",
    "directions": ["Web"],
    "resume": "markdown"
  }
}
```

### Announcement
```json
{
  "id": "uuid",
  "title": "string",
  "content": "markdown",
  "pinned": false,
  "authorId": "string",
  "createdAt": "iso8601",
  "updatedAt": "iso8601"
}
```

### Task
```json
{
  "id": "uuid",
  "title": "string",
  "description": "markdown",
  "targetUserId": "string",
  "assignedBy": "string",
  "report": "markdown",
  "createdAt": "iso8601",
  "updatedAt": "iso8601"
}
```

## Auth
### Send Email Code
- Method: `POST`
- Path: `/auth/email-code`
- Body:
```json
{ "email": "string", "purpose": "register" }
```
- Response:
```json
{ "ok": true, "message": "sent" }
```

### Register
- Method: `POST`
- Path: `/auth/register`
- Body:
```json
{
  "id": "string",
  "password": "string",
  "email": "string",
  "nickname": "string",
  "signature": "string",
  "emailCode": "string"
}
```
- Response:
```json
{ "ok": true, "data": { "userId": "string" } }
```

### Login
- Method: `POST`
- Path: `/auth/login`
- Body:
```json
{ "id": "string", "password": "string" }
```
- Response:
```json
{ "ok": true, "data": { "user": { "id": "string", "role": "interviewee" } } }
```

### Logout
- Method: `POST`
- Path: `/auth/logout`
- Response:
```json
{ "ok": true }
```

### Reset Password
- Method: `POST`
- Path: `/auth/reset-password`
- Body:
```json
{ "email": "string", "emailCode": "string", "newPassword": "string" }
```
- Response:
```json
{ "ok": true }
```

### Change Password
- Method: `POST`
- Path: `/auth/change-password`
- Body:
```json
{ "oldPassword": "string", "newPassword": "string" }
```
- Response:
```json
{ "ok": true }
```

### Current User
- Method: `GET`
- Path: `/auth/me`
- Response:
```json
{ "ok": true, "data": { "user": { "id": "string", "role": "interviewee" } } }
```

## Users & Roles
### List Users
- Method: `GET`
- Path: `/users`
- Query:
  - `role` (optional): `interviewee|interviewer`
  - `q` (optional): keyword
- Response:
```json
{ "ok": true, "data": { "items": [/* User (public or interviewer view) */] } }
```

### Get User (Interviewer)
- Method: `GET`
- Path: `/users/{id}`
- Response:
```json
{ "ok": true, "data": { "user": {/* User (interviewer view) */} } }
```

### Update My Profile
- Method: `PATCH`
- Path: `/users/me`
- Body:
```json
{
  "id": "string",
  "email": "string",
  "nickname": "string",
  "signature": "string",
  "emailCode": "string"
}
```
- Response:
```json
{ "ok": true }
```

### Update Role (Interviewer)
- Method: `POST`
- Path: `/users/{id}/role`
- Body:
```json
{ "role": "interviewer" }
```
- Response:
```json
{ "ok": true }
```

### Update Passed Directions (Interviewer)
- Method: `POST`
- Path: `/users/{id}/passed-directions`
- Notes: server records `passedDirectionsBy` as interviewer nickname and updates timestamp.
- Body:
```json
{ "directions": ["Web"] }
```
- Response:
```json
{ "ok": true }
```

## Announcements
### List Announcements
- Method: `GET`
- Path: `/announcements`
- Response:
```json
{ "ok": true, "data": { "items": [/* Announcement */] } }
```

### Create Announcement (Interviewer)
- Method: `POST`
- Path: `/announcements`
- Body:
```json
{ "title": "string", "content": "markdown" }
```

### Update Announcement (Interviewer)
- Method: `PATCH`
- Path: `/announcements/{id}`
- Body:
```json
{ "title": "string", "content": "markdown" }
```

### Pin Announcement (Interviewer)
- Method: `POST`
- Path: `/announcements/{id}/pin`
- Body:
```json
{ "pinned": true }
```

## Applications
### Get My Application
- Method: `GET`
- Path: `/applications/me`

### Submit Application
- Method: `POST`
- Path: `/applications`
- Body:
```json
{
  "realName": "string",
  "phone": "string",
  "gender": "string",
  "department": "string",
  "major": "string",
  "studentId": "string",
  "directions": ["Web"],
  "resume": "markdown"
}
```

### Get Application (Interviewer)
- Method: `GET`
- Path: `/applications/{userId}`

### Update Application Status (Interviewer)
- Method: `POST`
- Path: `/applications/{userId}/status`
- Body:
```json
{ "status": "r1_pending" }
```

## Tasks
### List Tasks
- Method: `GET`
- Path: `/tasks`
- Query:
  - `scope` (required): `mine|all`

### Create Task (Interviewer)
- Method: `POST`
- Path: `/tasks`
- Body:
```json
{ "title": "string", "description": "markdown", "targetUserId": "string" }
```

### Update Task (Interviewer)
- Method: `PATCH`
- Path: `/tasks/{id}`
- Body:
```json
{ "title": "string", "description": "markdown" }
```

### Submit Task Report (Interviewee)
- Method: `POST`
- Path: `/tasks/{id}/report`
- Body:
```json
{ "report": "markdown" }
```

## Security Notes
- Use UUIDs as primary keys; frontend stores only opaque `uuid`.
- Enforce RBAC on every endpoint and filter fields by role.
- CSRF: `SameSite=Lax` cookies + `X-CSRF-Token` header.
- XSS: store raw Markdown, sanitize on render.
- IDOR: verify ownership for interviewee endpoints.
- SQLi/SSRF: parameterized queries + allowlist outbound hosts.
