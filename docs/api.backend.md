# API 文档

本文档描述了XDSEC面试系统的API接口。

## 基本信息

- Base URL: `http://localhost:8080/api/v2`
- 认证方式: Bearer Token (JWT)
- Token 有效期: 7天

## 认证说明

需要认证的接口需要在请求头中携带Token：

```http
Authorization: Bearer {token}
```

## 响应格式

### 成功响应

```json
{
  "ok": true,
  "data": { ... }
}
```

### 失败响应

```json
{
  "ok": false,
  "message": "错误信息"
}
```

---

## API 接口

### 1. 用户注册

**接口地址:** `POST /api/v2/auth/register`

**描述:** 注册新用户账户

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址（最大30字符），需符合RFC 5322标准 |
| password | string | 是 | 密码（需先在前端进行SHA256哈希），64位十六进制字符串 |
| nickname | string | 是 | 昵称，3-20字符，仅支持ASCII字符，不能包含空格 |
| signature | string | 是 | 签名，最大30字符 |

**请求示例:**

```json
{
  "email": "user@example.com",
  "password": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd27a73b5e5e8a0b123",
  "nickname": "john_doe",
  "signature": "Hello world"
}
```

**响应示例:**

```json
{
  "ok": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**错误码:**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求数据无效、密码/邮箱/昵称/签名格式错误 |
| 409 | 邮箱已被注册、昵称已被使用 |
| 500 | 服务器内部错误（UUID生成失败、密码加密失败、数据库操作失败） |

---

### 2. 用户登录

**接口地址:** `POST /api/v2/auth/login`

**描述:** 使用邮箱和密码登录

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码（需先在前端进行SHA256哈希），64位十六进制字符串 |

**请求示例:**

```json
{
  "email": "user@example.com",
  "password": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd27a73b5e5e8a0b123"
}
```

**响应示例:**

```json
{
  "ok": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "nickname": "john_doe",
      "role": "interviewee"
    }
  }
}
```

**错误码:**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求数据无效、密码格式错误、邮箱或密码错误 |
| 404 | 未找到用户 |
| 500 | 生成token时发生错误 |

---

### 3. 修改密码

**接口地址:** `POST /api/v2/auth/change-password`

**描述:** 修改当前登录用户的密码

**认证:** 需要 Bearer Token

**请求参数:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| old_password | string | 是 | 旧密码（SHA256哈希） |
| new_password | string | 是 | 新密码（SHA256哈希） |

**请求示例:**

```json
{
  "old_password": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd27a73b5e5e8a0b123",
  "new_password": "2c80e0e1e4f1d2e3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
}
```

**响应示例:**

```json
{
  "ok": true,
  "message": "更新密码成功"
}
```

**错误码:**

| 状态码 | 说明 |
|--------|------|
| 400 | 请求数据无效、旧密码验证失败 |
| 401 | 未登录 |
| 404 | 未找到用户 |
| 500 | 密码哈希失败、更新密码失败 |

---

### 4. 获取当前用户信息

**接口地址:** `GET /api/v2/auth/me`

**描述:** 获取当前登录用户的基本信息

**认证:** 需要 Bearer Token

**响应示例:**

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "role": "interviewee",
      "email": "user@example.com"
    }
  }
}
```

**错误码:**

| 状态码 | 说明 |
|--------|------|
| 401 | 未登录或Token无效 |

---

### 5. 获取所有用户列表

**接口地址:** `GET /api/v2/users/`

**描述:** 获取系统中所有用户的信息（包含关联的申请信息）

**认证:** 无需认证（当前版本）

**响应示例:**

```json
{
  "ok": true,
  "data": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "nickname": "john_doe",
      "signature": "Hello world",
      "role": "interviewee",
      "status": null,
      "passed_directions": null,
      "passed_directions_by": null,
      "application": {
        "id": 1,
        "real_name": "张三",
        "phone": "13800138000",
        "gender": "male",
        "department": "计算机学院",
        "major": "计算机科学与技术",
        "student_id": "20240001",
        "directions": null,
        "resume": "简历内容...",
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "created_at": "2026-01-24T10:00:00Z",
        "updated_at": "2026-01-24T10:00:00Z"
      },
      "created_at": "2026-01-24T10:00:00Z",
      "updated_at": "2026-01-24T10:00:00Z",
      "pass_word": "$2a$10$..."
    }
  ]
}
```

**错误码:**

| 状态码 | 说明 |
|--------|------|
| 500 | 数据库查询失败 |

---

## 数据模型

### User（用户）

| 字段 | 类型 | 说明 |
|------|------|------|
| uuid | UUID | 用户唯一标识 |
| email | string | 邮箱 |
| nickname | string | 昵称 |
| signature | string | 签名 |
| role | enum | 角色：`interviewee`（面试者）或 `interviewer`（面试官），默认为 `interviewee` |
| status | string | 用户状态 |
| passed_directions | json | 通过的方向 |
| passed_directions_by | json | 通过方向的面试官信息 |
| application | object | 关联的申请信息 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |
| pass_word | string | 密码（bcrypt哈希） |

### Application（申请）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 申请ID |
| real_name | string | 真实姓名 |
| phone | string | 手机号 |
| gender | enum | 性别：`male`（男）或 `female`（女） |
| department | string | 学院 |
| major | string | 专业 |
| student_id | string | 学号 |
| directions | json | 申请方向 |
| resume | text | 简历内容 |
| user_id | UUID | 关联用户ID |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### Announcement（公告）

| 字段 | 类型 | 说明 |
|------|------|------|
| uuid | UUID | 公告唯一标识 |
| title | string | 标题 |
| content | string | 内容 |
| pinned | boolean | 是否置顶 |
| author_id | UUID | 作者ID |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### Task（任务）

| 字段 | 类型 | 说明 |
|------|------|------|
| uuid | UUID | 任务唯一标识 |
| title | string | 标题 |
| description | string | 描述 |
| target_user_id | UUID | 目标用户ID |
| assigned_by | UUID | 分配人ID |
| report | string | 提交的报告（markdown格式） |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

---

## 安全说明

1. **密码传输**: 密码必须在前端先进行SHA256哈希，然后再传输到后端
2. **密码存储**: 后端使用bcrypt对密码进行二次哈希存储
3. **Token认证**: JWT Token有效期7天，过期后需重新登录
4. **数据验证**:
   - 邮箱必须符合RFC 5322标准，最大30字符
   - 昵称仅支持ASCII字符（0-127），长度3-20，不能包含空格
   - 签名最大30字符
   - 密码必须是64位十六进制字符串（SHA256格式）

---

## 常见错误信息

| 错误信息 | 说明 |
|----------|------|
| 请求数据无效 | 请求参数格式错误或缺少必填字段 |
| 传入的密码非法 | 密码不是64位十六进制字符串 |
| 传入的邮箱过长或非法 | 邮箱格式错误或超过30字符 |
| 传入的昵称非法 | 昵称包含非ASCII字符、长度不在3-20范围内或包含空格 |
| 传入的签名过长 | 签名超过30字符 |
| 邮箱已被注册 | 该邮箱已被用于注册 |
| 昵称已被使用 | 该昵称已被其他用户使用 |
| 未找到用户 | 用户不存在 |
| 邮箱或密码错误 | 登录凭证错误 |
| 未登录 | 未提供有效的Token |
| Token expired | Token已过期 |
| Invalid token | Token无效或格式错误 |
| 数据库操作时出现错误 | 服务器内部错误，数据库操作失败 |
