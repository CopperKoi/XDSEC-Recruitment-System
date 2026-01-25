# API 文档

## 基本信息

- Base URL: `/api/v2`
- Content-Type: `application/json`
- 认证方式: `session_id` Cookie + `X-CSRF-Token` Header
- 通用响应：`{ "ok": true/false, "message": "...", "data": {...} }`

---

## 认证与账号

### 发送邮箱验证码
- Method: `POST`
- Path: `/auth/email-code`
- Body:
```json
{
  "email": "string",
  "purpose": "register|reset|profile"
}
```
- Response:
```json
{ "ok": true, "message": "sent" }
```

### 用户注册
- Method: `POST`
- Path: `/auth/register`
- Body:
```json
{
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

### 用户登录
- Method: `POST`
- Path: `/auth/login`
- Body:
```json
{
  "id": "string",
  "password": "string"
}
```
- Response:
```json
{
  "ok": true,
  "data": {
    "user": { ... },
    "csrfToken": "string"
  }
}
```

### 用户登出
- Method: `POST`
- Path: `/auth/logout`
- 需要登录
- Response:
```json
{ "ok": true }
```

### 忘记密码
- Method: `POST`
- Path: `/auth/reset-password`
- Body:
```json
{
  "email": "string",
  "emailCode": "string",
  "newPassword": "string"
}
```
- Response:
```json
{ "ok": true }
```

### 修改密码
- Method: `POST`
- Path: `/auth/change-password`
- 需要登录
- Body:
```json
{
  "oldPassword": "string",
  "newPassword": "string"
}
```
- Response:
```json
{ "ok": true }
```

### 获取当前用户信息
- Method: `GET`
- Path: `/auth/me`
- 需要登录
- Response:
```json
{ "ok": true, "data": { "user": { ... } } }
```

---

## 用户与权限

### 获取用户列表
- Method: `GET`
- Path: `/users`
- 需要登录
- Query: `role` (可选), `q` (可选)
- Response:
```json
{ "ok": true, "data": { "items": [...] } }
```

### 获取用户详情（面试官）
- Method: `GET`
- Path: `/users/{id}`
- 需要面试官权限
- Response:
```json
{ "ok": true, "data": { "user": { ... } } }
```

### 更新个人资料
- Method: `PATCH`
- Path: `/users/me`
- 需要登录
- Body:
```json
{
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

### 授权角色（面试官）
- Method: `POST`
- Path: `/users/{id}/role`
- 需要面试官权限
- Body:
```json
{ "role": "interviewee|interviewer" }
```
- Response:
```json
{ "ok": true }
```

### 更新通过方向（面试官）
- Method: `POST`
- Path: `/users/{id}/passed-directions`
- 需要面试官权限
- 备注：服务端写入 `passedDirectionsBy` 为面试官昵称数组并更新时间戳
- Body:
```json
{ "directions": ["Web", "Pwn"] }
```
- Response:
```json
{ "ok": true }
```

### 删除用户（面试官）
- Method: `DELETE`
- Path: `/users/{id}`
- 需要面试官权限
- Response:
```json
{ "ok": true }
```

### 删除自己的账户
- Method: `DELETE`
- Path: `/users/me`
- 需要登录
- 备注：会级联删除关联的申请
- Response:
```json
{ "ok": true }
```

---

## 公告

### 获取公告列表
- Method: `GET`
- Path: `/announcements`
- Response:
```json
{ "ok": true, "data": { "items": [...] } }
```

### 发布公告（面试官）
- Method: `POST`
- Path: `/announcements`
- 需要面试官权限
- Body:
```json
{
  "title": "string",
  "content": "markdown"
}
```
- Response:
```json
{ "ok": true }
```

### 修改公告（面试官）
- Method: `PATCH`
- Path: `/announcements/{id}`
- 需要面试官权限
- Body:
```json
{
  "title": "string",
  "content": "markdown"
}
```
- Response:
```json
{ "ok": true }
```

### 置顶公告（面试官）
- Method: `POST`
- Path: `/announcements/{id}/pin`
- 需要面试官权限
- Body:
```json
{ "pinned": true/false }
```
- Response:
```json
{ "ok": true }
```

### 删除公告（面试官）
- Method: `DELETE`
- Path: `/announcements/{id}`
- 需要面试官权限
- Response:
```json
{ "ok": true }
```

---

## 面试申请

### 提交申请
- Method: `POST`
- Path: `/applications`
- 需要登录
- Body:
```json
{
  "realName": "string",
  "phone": "string",
  "gender": "male|female",
  "department": "string",
  "major": "string",
  "studentId": "string",
  "directions": ["Web", "Pwn"],
  "resume": "markdown"
}
```
- Response:
```json
{ "ok": true }
```

### 获取我的申请
- Method: `GET`
- Path: `/applications/me`
- 需要登录
- Response:
```json
{ "ok": true, "data": { ... } }
```

### 获取申请详情（面试官）
- Method: `GET`
- Path: `/applications/{userId}`
- 需要面试官权限
- Response:
```json
{ "ok": true, "data": { ... } }
```

### 修改面试状态（面试官）
- Method: `POST`
- Path: `/applications/{userId}/status`
- 需要面试官权限
- Body:
```json
{ "status": "r1_pending|r1_passed|r2_pending|r2_passed|rejected|offer" }
```
- Response:
```json
{ "ok": true }
```

### 删除申请（面试官）
- Method: `DELETE`
- Path: `/applications/{userId}`
- 需要面试官权限
- Response:
```json
{ "ok": true }
```

### 删除自己的申请
- Method: `DELETE`
- Path: `/applications/me`
- 需要登录
- Response:
```json
{ "ok": true }
```

---

## 面试任务

### 获取任务列表
- Method: `GET`
- Path: `/tasks`
- 需要登录
- Query: `scope` (必填: `mine|all`)
- 备注：scope 为 `all` 时仅面试官有权限
- Response:
```json
{ "ok": true, "data": { "items": [...] } }
```

### 布置任务（面试官）
- Method: `POST`
- Path: `/tasks`
- 需要面试官权限
- Body:
```json
{
  "title": "string",
  "description": "markdown",
  "targetUserId": "string"
}
```
- Response:
```json
{ "ok": true }
```

### 修改任务（面试官）
- Method: `PATCH`
- Path: `/tasks/{id}`
- 需要面试官权限
- Body:
```json
{
  "title": "string",
  "description": "markdown"
}
```
- Response:
```json
{ "ok": true }
```

### 提交任务报告
- Method: `POST`
- Path: `/tasks/{id}/report`
- 需要登录
- 备注：仅任务的目标用户可以提交
- Body:
```json
{ "report": "markdown" }
```
- Response:
```json
{ "ok": true }
```

### 删除任务（面试官）
- Method: `DELETE`
- Path: `/tasks/{id}`
- 需要面试官权限
- Response:
```json
{ "ok": true }
```

---

## 数据导出

### 导出申请信息（面试官）
- Method: `GET`
- Path: `/export/applications`
- 需要面试官权限
- 备注：导出所有面试者信息为Excel文件，在浏览器中下载
- Response: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (Excel文件)

---

## 枚举值

### Role（角色）
- `interviewee`: 面试者
- `interviewer`: 面试官

### EmailCodePurpose（邮箱验证码用途）
- `register`: 注册
- `reset`: 重置密码
- `profile`: 修改资料

### InterviewStatus（面试状态）
- `r1_pending`: 第一轮待面试
- `r1_passed`: 第一轮通过
- `r2_pending`: 第二轮待面试
- `r2_passed`: 第二轮通过
- `rejected`: 被拒绝
- `offer`: 发放offer

### Direction（方向）
- `Web`: Web安全
- `Pwn`: 二进制安全
- `Reverse`: 逆向工程
- `Crypto`: 密码学
- `Misc`: 杂项
- `Dev`: 开发
- `Art`: 设计

### Gender（性别）
- `male`: 男
- `female`: 女
