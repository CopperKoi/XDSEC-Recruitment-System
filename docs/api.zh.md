# API 设计（Apifox 适配）- XDSEC 招新系统

基础地址：`/api`

## 全局设置
- Content-Type：`application/json`
- 鉴权：`session_id` Cookie + `X-CSRF-Token` 头
- Cookies：`HttpOnly`、`Secure`、`SameSite=Lax`

## 通用响应
```json
{
  "ok": true,
  "message": "optional",
  "data": {}
}
```

## 通用错误码
- `400` 参数校验失败
- `401` 未登录
- `403` 无权限
- `404` 资源不存在
- `409` 冲突（id/email 重复）
- `429` 请求过于频繁
- `500` 服务器错误

## 枚举
- Role：`interviewee | interviewer`
- EmailCodePurpose：`register | reset | profile`
- InterviewStatus：`r1_pending | r1_passed | r2_pending | r2_passed | rejected | offer`
- Direction：`Web | Pwn | Reverse | Crypto | Misc | Dev | Art`

## 数据结构
### User（公开视角）
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

### User（面试官视角）
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

## 认证与账号
### 发送邮箱验证码
- Method：`POST`
- Path：`/auth/email-code`
- Body：
```json
{ "email": "string", "purpose": "register" }
```
- Response：
```json
{ "ok": true, "message": "sent" }
```

### 注册
- Method：`POST`
- Path：`/auth/register`
- Body：
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
- Response：
```json
{ "ok": true, "data": { "userId": "string" } }
```

### 登录
- Method：`POST`
- Path：`/auth/login`
- Body：
```json
{ "id": "string", "password": "string" }
```
- Response：
```json
{ "ok": true, "data": { "user": { "id": "string", "role": "interviewee" } } }
```

### 登出
- Method：`POST`
- Path：`/auth/logout`
- Response：
```json
{ "ok": true }
```

### 忘记密码
- Method：`POST`
- Path：`/auth/reset-password`
- Body：
```json
{ "email": "string", "emailCode": "string", "newPassword": "string" }
```
- Response：
```json
{ "ok": true }
```

### 修改密码
- Method：`POST`
- Path：`/auth/change-password`
- Body：
```json
{ "oldPassword": "string", "newPassword": "string" }
```
- Response：
```json
{ "ok": true }
```

### 当前用户
- Method：`GET`
- Path：`/auth/me`
- Response：
```json
{ "ok": true, "data": { "user": { "id": "string", "role": "interviewee" } } }
```

## 用户与权限
### 获取用户列表
- Method：`GET`
- Path：`/users`
- Query：
  - `role`（可选）：`interviewee|interviewer`
  - `q`（可选）：关键词
- Response：
```json
{ "ok": true, "data": { "items": [/* User（公开或面试官视角） */] } }
```

### 获取用户详情（面试官）
- Method：`GET`
- Path：`/users/{id}`
- Response：
```json
{ "ok": true, "data": { "user": {/* User（面试官视角） */} } }
```

### 更新个人资料
- Method：`PATCH`
- Path：`/users/me`
- Body：
```json
{
  "id": "string",
  "email": "string",
  "nickname": "string",
  "signature": "string",
  "emailCode": "string"
}
```
- Response：
```json
{ "ok": true }
```

### 授权角色（面试官）
- Method：`POST`
- Path：`/users/{id}/role`
- Body：
```json
{ "role": "interviewer" }
```
- Response：
```json
{ "ok": true }
```

### 更新通过方向（面试官）
- Method：`POST`
- Path：`/users/{id}/passed-directions`
- 备注：服务端写入 `passedDirectionsBy` 为面试官昵称并更新时间戳
- Body：
```json
{ "directions": ["Web"] }
```
- Response：
```json
{ "ok": true }
```

## 公告
### 公告列表
- Method：`GET`
- Path：`/announcements`
- Response：
```json
{ "ok": true, "data": { "items": [/* Announcement */] } }
```

### 发布公告（面试官）
- Method：`POST`
- Path：`/announcements`
- Body：
```json
{ "title": "string", "content": "markdown" }
```

### 修改公告（面试官）
- Method：`PATCH`
- Path：`/announcements/{id}`
- Body：
```json
{ "title": "string", "content": "markdown" }
```

### 置顶公告（面试官）
- Method：`POST`
- Path：`/announcements/{id}/pin`
- Body：
```json
{ "pinned": true }
```

## 面试申请
### 获取我的申请
- Method：`GET`
- Path：`/applications/me`

### 提交申请
- Method：`POST`
- Path：`/applications`
- Body：
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

### 获取申请详情（面试官）
- Method：`GET`
- Path：`/applications/{userId}`

### 修改面试状态（面试官）
- Method：`POST`
- Path：`/applications/{userId}/status`
- Body：
```json
{ "status": "r1_pending" }
```

## 面试任务
### 获取任务列表
- Method：`GET`
- Path：`/tasks`
- Query：
  - `scope`（必填）：`mine|all`

### 布置任务（面试官）
- Method：`POST`
- Path：`/tasks`
- Body：
```json
{ "title": "string", "description": "markdown", "targetUserId": "string" }
```

### 修改任务（面试官）
- Method：`PATCH`
- Path：`/tasks/{id}`
- Body：
```json
{ "title": "string", "description": "markdown" }
```

### 提交任务报告（面试者）
- Method：`POST`
- Path：`/tasks/{id}/report`
- Body：
```json
{ "report": "markdown" }
```

## 安全相关
- 主键使用 UUID，前端仅持有不透明 `uuid`。
- 所有接口按角色过滤字段与权限，严防 IDOR。
- XSS：存储原始 Markdown，渲染时统一净化。
- SQLi/SSRF：使用参数化查询并限制外联白名单。
