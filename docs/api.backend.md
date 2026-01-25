# XDSEC 招新系统 API 文档

## 基本信息

- Base URL: `http://localhost:8080/api/v2`
- Content-Type: `application/json`
- 认证方式: `session_id` Cookie + `X-CSRF-Token` Header
- Cookie 设置: `HttpOnly`、`Secure`、`SameSite=Lax`
- Token 有效期: 7天

## 认证说明

### Cookie 认证

登录成功后会设置以下 Cookie：

```
Set-Cookie: session_id=<jwt_token>; Path=/; Max-Age=604800; HttpOnly
Set-Cookie: csrf_token=<csrf_token>; Path=/; Max-Age=604800
```

### CSRF Token

对于非 GET 请求，需要在请求头中携带 CSRF Token：

```http
X-CSRF-Token: <csrf_token>
```

CSRF Token 会在登录响应中返回，前端需要保存并在后续请求中使用。

## 响应格式

### 成功响应

```json
{
  "ok": true,
  "message": "optional message",
  "data": {}
}
```

### 失败响应

```json
{
  "ok": false,
  "message": "错误信息"
}
```

## 通用错误码

| 状态码 | 说明 |
|--------|------|
| 400 | 参数校验失败 |
| 401 | 未登录 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 冲突（id/email 重复） |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |

---

## API 接口

### 认证与账号

#### 1. 发送邮箱验证码

**接口地址:** `POST /api/auth/email-code`

**描述:** 向指定邮箱发送验证码

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| purpose | string | 是 | 用途：`register`（注册）、`reset`（重置密码）、`profile`（修改资料） |

**请求示例:**

```json
{
  "email": "user@example.com",
  "purpose": "register"
}
```

**响应示例:**

```json
{
  "ok": true,
  "message": "sent"
}
```

**说明:**
- 验证码有效期为 5 分钟
- 每次发送新验证码会清除该邮箱的旧验证码

---

#### 2. 用户注册

**接口地址:** `POST /api/auth/register`

**描述:** 注册新用户账户

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 用户 UUID（由前端生成） |
| password | string | 是 | 密码（至少8位） |
| email | string | 是 | 邮箱地址 |
| nickname | string | 是 | 昵称，3-20字符，仅支持ASCII字符 |
| signature | string | 是 | 签名，最大30字符 |
| emailCode | string | 是 | 邮箱验证码（6位数字） |

**请求示例:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "password": "password123",
  "email": "user@example.com",
  "nickname": "john_doe",
  "signature": "Hello world",
  "emailCode": "123456"
}
```

**响应示例:**

```json
{
  "ok": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**错误码:**

| 状态码 | 说明 |
|--------|------|
| 400 | 参数校验失败、验证码无效或已过期 |
| 409 | 邮箱已被注册、昵称已被使用 |

---

#### 3. 用户登录

**接口地址:** `POST /api/auth/login`

**描述:** 使用邮箱或UUID和密码登录

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 邮箱或 UUID |
| password | string | 是 | 密码 |

**请求示例:**

```json
{
  "id": "user@example.com",
  "password": "password123"
}
```

**响应示例:**

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "role": "interviewee",
      "nickname": "john_doe",
      "email": "user@example.com",
      "signature": "Hello world",
      "directions": ["Web", "Pwn"],
      "status": "r1_pending"
    },
    "csrfToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
  }
}
```

**说明:**
- 登录成功后会设置 `session_id` 和 `csrf_token` Cookie
- 返回的 `csrfToken` 需要在后续非 GET 请求中使用

---

#### 4. 用户登出

**接口地址:** `POST /api/auth/logout`

**认证:** 需要登录

**描述:** 登出当前用户

**响应示例:**

```json
{
  "ok": true
}
```

**说明:**
- 会清除 session_id 和 csrf_token Cookie

---

#### 5. 忘记密码

**接口地址:** `POST /api/auth/reset-password`

**描述:** 使用邮箱验证码重置密码

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| emailCode | string | 是 | 邮箱验证码 |
| newPassword | string | 是 | 新密码（至少8位） |

**请求示例:**

```json
{
  "email": "user@example.com",
  "emailCode": "123456",
  "newPassword": "newpassword123"
}
```

**响应示例:**

```json
{
  "ok": true
}
```

---

#### 6. 修改密码

**接口地址:** `POST /api/auth/change-password`

**认证:** 需要登录 + CSRF Token

**描述:** 修改当前登录用户的密码

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldPassword | string | 是 | 旧密码 |
| newPassword | string | 是 | 新密码（至少8位） |

**请求示例:**

```json
{
  "oldPassword": "password123",
  "newPassword": "newpassword123"
}
```

**响应示例:**

```json
{
  "ok": true
}
```

---

#### 7. 获取当前用户信息

**接口地址:** `GET /api/auth/me`

**认证:** 需要登录

**描述:** 获取当前登录用户的基本信息

**响应示例:**

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "role": "interviewee",
      "nickname": "john_doe",
      "email": "user@example.com",
      "signature": "Hello world",
      "directions": ["Web", "Pwn"],
      "status": "r1_pending"
    }
  }
}
```

---

### 用户与权限

#### 8. 获取用户列表

**接口地址:** `GET /api/users`

**认证:** 需要登录

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | string | 否 | 过滤角色：`interviewee` 或 `interviewer` |
| q | string | 否 | 关键词搜索（昵称或邮箱） |

**请求示例:**

```
GET /api/users?role=interviewee&q=john
```

**响应示例:**

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "nickname": "john_doe",
        "email": "user@example.com",
        "signature": "Hello world",
        "role": "interviewee",
        "status": "r1_pending",
        "directions": ["Web", "Pwn"],
        "passedDirections": ["Web"],
        "passedDirectionsBy": ["面试官A", "面试官B"]
      }
    ]
  }
}
```

**说明:**
- 公开视角：不显示邮箱和申请详情
- 面试官视角：显示邮箱和申请详情

---

#### 9. 获取用户详情

**接口地址:** `GET /api/users/:id`

**认证:** 需要登录 + 面试官权限

**描述:** 获取指定用户的详细信息（面试官视角）

**响应示例:**

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "nickname": "john_doe",
      "signature": "Hello world",
      "role": "interviewee",
      "status": "r1_pending",
      "directions": ["Web", "Pwn"],
      "passedDirections": ["Web"],
      "passedDirectionsBy": ["面试官A", "面试官B"],
      "application": {
        "realName": "张三",
        "phone": "13800138000",
        "gender": "male",
        "department": "计算机学院",
        "major": "计算机科学与技术",
        "studentId": "20240001",
        "directions": ["Web", "Pwn"],
        "resume": "简历内容..."
      }
    }
  }
}
```

---

#### 10. 更新个人资料

**接口地址:** `PATCH /api/users/me`

**认证:** 需要登录 + CSRF Token

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 用户 UUID（必须与当前登录用户一致） |
| email | string | 是 | 新邮箱地址 |
| nickname | string | 是 | 新昵称（3-20字符，仅支持ASCII） |
| signature | string | 是 | 新签名（最大30字符） |
| emailCode | string | 是 | 邮箱验证码 |

**请求示例:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newemail@example.com",
  "nickname": "john_new",
  "signature": "New signature",
  "emailCode": "123456"
}
```

**响应示例:**

```json
{
  "ok": true
}
```

---

#### 11. 授权角色

**接口地址:** `POST /api/users/:id/role`

**认证:** 需要登录 + 面试官权限 + CSRF Token

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | string | 是 | 角色：`interviewee` 或 `interviewer` |

**请求示例:**

```json
{
  "role": "interviewer"
}
```

**响应示例:**

```json
{
  "ok": true
}
```

---

#### 12. 更新通过方向

**接口地址:** `POST /api/users/:id/passed-directions`

**认证:** 需要登录 + 面试官权限 + CSRF Token

**描述:** 设置用户通过的方向，并自动添加当前面试官的昵称到通过列表

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| directions | array | 是 | 通过的方向列表 |

**请求示例:**

```json
{
  "directions": ["Web", "Pwn"]
}
```

**响应示例:**

```json
{
  "ok": true
}
```

**说明:**
- 服务端会自动将当前面试官的昵称添加到 `passedDirectionsBy` 数组中
- 如果该面试官已存在于数组中，则不会重复添加
- `passedDirectionsBy` 是一个数组，包含所有给出通过的面试官昵称

---

### 公告

#### 13. 获取公告列表

**接口地址:** `GET /api/announcements`

**描述:** 获取所有公告，按置顶和创建时间排序

**响应示例:**

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "面试通知",
        "content": "面试将于下周开始...",
        "pinned": true,
        "authorId": "660e8400-e29b-41d4-a716-446655440001",
        "createdAt": "2026-01-24T10:00:00Z",
        "updatedAt": "2026-01-24T10:00:00Z"
      }
    ]
  }
}
```

---

#### 14. 发布公告

**接口地址:** `POST /api/announcements`

**认证:** 需要登录 + 面试官权限 + CSRF Token

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 公告标题 |
| content | string | 是 | 公告内容（Markdown 格式） |

**请求示例:**

```json
{
  "title": "面试通知",
  "content": "面试将于下周开始，请做好准备..."
}
```

**响应示例:**

```json
{
  "ok": true
}
```

---

#### 15. 修改公告

**接口地址:** `PATCH /api/announcements/:id`

**认证:** 需要登录 + 面试官权限 + CSRF Token

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 公告标题 |
| content | string | 是 | 公告内容（Markdown 格式） |

**请求示例:**

```json
{
  "title": "面试通知（更新）",
  "content": "面试将于下周一开始..."
}
```

**响应示例:**

```json
{
  "ok": true
}
```

---

#### 16. 置顶公告

**接口地址:** `POST /api/announcements/:id/pin`

**认证:** 需要登录 + 面试官权限 + CSRF Token

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pinned | boolean | 是 | 是否置顶 |

**请求示例:**

```json
{
  "pinned": true
}
```

**响应示例:**

```json
{
  "ok": true
}
```

---

### 面试申请

#### 17. 提交申请

**接口地址:** `POST /api/applications`

**认证:** 需要登录 + CSRF Token

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| realName | string | 是 | 真实姓名 |
| phone | string | 是 | 手机号 |
| gender | string | 是 | 性别：`male` 或 `female` |
| department | string | 是 | 学院 |
| major | string | 是 | 专业 |
| studentId | string | 是 | 学号 |
| directions | array | 是 | 申请方向列表 |
| resume | string | 是 | 简历内容（Markdown 格式） |

**请求示例:**

```json
{
  "realName": "张三",
  "phone": "13800138000",
  "gender": "male",
  "department": "计算机学院",
  "major": "计算机科学与技术",
  "studentId": "20240001",
  "directions": ["Web", "Pwn"],
  "resume": "## 个人简介\n\n我是计算机学院的学生..."
}
```

**响应示例:**

```json
{
  "ok": true
}
```

---

#### 18. 获取我的申请

**接口地址:** `GET /api/applications/me`

**认证:** 需要登录

**描述:** 获取当前登录用户的申请信息

**响应示例:**

```json
{
  "ok": true,
  "data": {
    "realName": "张三",
    "phone": "13800138000",
    "gender": "male",
    "department": "计算机学院",
    "major": "计算机科学与技术",
    "studentId": "20240001",
    "directions": ["Web", "Pwn"],
    "resume": "## 个人简介\n\n我是计算机学院的学生...",
    "createdAt": "2026-01-24T10:00:00Z",
    "updatedAt": "2026-01-24T10:00:00Z"
  }
}
```

---

#### 19. 获取申请详情

**接口地址:** `GET /api/applications/:userId`

**认证:** 需要登录 + 面试官权限

**描述:** 获取指定用户的申请详情

**响应示例:**

```json
{
  "ok": true,
  "data": {
    "realName": "张三",
    "phone": "13800138000",
    "gender": "male",
    "department": "计算机学院",
    "major": "计算机科学与技术",
    "studentId": "20240001",
    "directions": ["Web", "Pwn"],
    "resume": "## 个人简介\n\n我是计算机学院的学生...",
    "createdAt": "2026-01-24T10:00:00Z",
    "updatedAt": "2026-01-24T10:00:00Z"
  }
}
```

---

#### 20. 修改面试状态

**接口地址:** `POST /api/applications/:userId/status`

**认证:** 需要登录 + 面试官权限 + CSRF Token

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 是 | 面试状态 |

**可选状态值:**
- `r1_pending`: 第一轮待面试
- `r1_passed`: 第一轮通过
- `r2_pending`: 第二轮待面试
- `r2_passed`: 第二轮通过
- `rejected`: 被拒绝
- `offer`: 发放offer

**请求示例:**

```json
{
  "status": "r1_passed"
}
```

**响应示例:**

```json
{
  "ok": true
}
```

---

### 面试任务

#### 21. 获取任务列表

**接口地址:** `GET /api/tasks`

**认证:** 需要登录

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| scope | string | 是 | 范围：`mine`（我的任务）或 `all`（所有任务） |

**说明:**
- `mine`: 返回分配给当前用户的任务
- `all`: 返回所有任务（仅面试官有权限）

**请求示例:**

```
GET /api/tasks?scope=mine
```

**响应示例:**

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Web漏洞分析",
        "description": "分析以下Web漏洞...",
        "targetUserId": "660e8400-e29b-41d4-a716-446655440001",
        "assignedBy": "770e8400-e29b-41d4-a716-446655440002",
        "report": "任务报告内容...",
        "createdAt": "2026-01-24T10:00:00Z",
        "updatedAt": "2026-01-24T10:00:00Z"
      }
    ]
  }
}
```

---

#### 22. 布置任务

**接口地址:** `POST /api/tasks`

**认证:** 需要登录 + 面试官权限 + CSRF Token

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 任务标题 |
| description | string | 是 | 任务描述（Markdown 格式） |
| targetUserId | string | 是 | 目标用户 UUID |

**请求示例:**

```json
{
  "title": "Web漏洞分析",
  "description": "## 任务要求\n\n请分析以下Web漏洞的成因和修复方法...",
  "targetUserId": "660e8400-e29b-41d4-a716-446655440001"
}
```

**响应示例:**

```json
{
  "ok": true
}
```

---

#### 23. 修改任务

**接口地址:** `PATCH /api/tasks/:id`

**认证:** 需要登录 + 面试官权限 + CSRF Token

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 任务标题 |
| description | string | 是 | 任务描述（Markdown 格式） |

**请求示例:**

```json
{
  "title": "Web漏洞分析（更新）",
  "description": "## 任务要求\n\n请分析以下Web漏洞的成因..."
}
```

**响应示例:**

```json
{
  "ok": true
}
```

---

#### 24. 提交任务报告

**接口地址:** `POST /api/tasks/:id/report`

**认证:** 需要登录 + CSRF Token

**描述:** 提交任务报告（仅任务的目标用户可以提交）

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| report | string | 是 | 报告内容（Markdown 格式） |

**请求示例:**

```json
{
  "report": "## 分析报告\n\n### 漏洞成因\n\n..."
}
```

**响应示例:**

```json
{
  "ok": true
}
```

---

## 数据模型

### User（用户）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 用户唯一标识 |
| email | string | 邮箱 |
| nickname | string | 昵称 |
| signature | string | 签名 |
| role | enum | 角色：`interviewee`（面试者）或 `interviewer`（面试官） |
| status | enum | 面试状态：`r1_pending`、`r1_passed`、`r2_pending`、`r2_passed`、`rejected`、`offer` |
| directions | array | 申请方向 |
| passedDirections | array | 通过的方向 |
| passedDirectionsBy | array | 给出通过的面试官昵称数组 |
| application | object | 关联的申请信息（仅面试官可见） |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 更新时间 |

### Application（申请）

| 字段 | 类型 | 说明 |
|------|------|------|
| realName | string | 真实姓名 |
| phone | string | 手机号 |
| gender | enum | 性别：`male`（男）或 `female`（女） |
| department | string | 学院 |
| major | string | 专业 |
| studentId | string | 学号 |
| directions | array | 申请方向 |
| resume | string | 简历内容（Markdown） |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 更新时间 |

### Announcement（公告）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 公告唯一标识 |
| title | string | 标题 |
| content | string | 内容（Markdown） |
| pinned | boolean | 是否置顶 |
| authorId | UUID | 作者ID |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 更新时间 |

### Task（任务）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 任务唯一标识 |
| title | string | 标题 |
| description | string | 描述（Markdown） |
| targetUserId | UUID | 目标用户ID |
| assignedBy | UUID | 分配人ID |
| report | string | 提交的报告（Markdown） |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 更新时间 |

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

---

## 安全说明

1. **密码传输**: 密码以明文形式传输（建议前端进行SHA256哈希）
2. **密码存储**: 后端使用bcrypt对密码进行哈希存储
3. **Session认证**: 使用JWT Token存储在HttpOnly Cookie中
4. **CSRF防护**: 非GET请求需要携带CSRF Token
5. **邮箱验证码**: 有效期为5分钟，验证后立即失效
6. **权限控制**: 所有接口按角色过滤字段与权限，严防IDOR（不安全的直接对象引用）
7. **XSS防护**: 存储原始Markdown，渲染时由前端统一净化
8. **SQLi防护**: 使用参数化查询

---

## 常见错误信息

| 错误信息 | 说明 |
|----------|------|
| 参数校验失败 | 请求参数格式错误、缺少必填字段或值不符合规范 |
| 未登录 | 未提供有效的session_id Cookie |
| 会话无效 | session_id已过期或格式错误 |
| 无权限 | 权限不足，无法执行该操作 |
| 缺少CSRF Token | 非GET请求未提供X-CSRF-Token头 |
| CSRF Token无效 | CSRF Token与Cookie中的不匹配 |
| 资源不存在 | 查询的用户、公告、申请或任务不存在 |
| 邮箱已被注册 | 该邮箱已被用于注册 |
| 昵称已被使用 | 该昵称已被其他用户使用 |
| 邮箱已被使用 | 该邮箱已被其他用户使用 |
| 验证码无效或已过期 | 邮箱验证码不正确或已超过有效期 |
| 旧密码错误 | 修改密码时提供的旧密码不正确 |
| 新密码长度不能少于8位 | 密码长度不符合要求 |
| 申请已存在 | 用户已提交过申请，不能重复提交 |
| 目标用户不存在 | 布置任务时目标用户不存在 |
| 服务器错误 | 服务器内部错误，请稍后重试 |
