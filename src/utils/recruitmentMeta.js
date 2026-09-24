// 招募相关的共享常量与筛选字段元数据。
// 本模块不依赖任何其他模块，可以被任意新模块安全导入。
//
// 说明：仓库里原本在多处重复定义了 DIRECTIONS / STATUSES / STATUS_LABELS，
// 本次只让新代码统一从这里取，不去改动既有调用点（那是独立的重构）。

export const DIRECTIONS = ["Web", "Pwn", "Reverse", "Crypto", "Misc", "Dev", "Art"];

export const STATUSES = [
  "r1_pending",
  "r1_passed",
  "r2_pending",
  "r2_passed",
  "rejected",
  "offer"
];

export const STATUS_LABELS = {
  r1_pending: "一轮待定",
  r1_passed: "一轮通过",
  r2_pending: "二轮待定",
  r2_passed: "二轮通过",
  rejected: "已拒绝",
  offer: "已录取"
};

// 由中文标签反查枚举键，供表达式里的 status:已拒绝 使用
export const STATUS_LABEL_TO_KEY = Object.fromEntries(
  Object.entries(STATUS_LABELS).map(([key, label]) => [label, key])
);

export function formatStatus(status) {
  return STATUS_LABELS[status] || status || "一轮待定";
}

// ---- 筛选字段 ----

export const FILTER_FIELD_ORDER = [
  "direction",
  "passed",
  "status",
  "name",
  "phone",
  "studentId"
];

export const FILTER_FIELD_LABELS = {
  direction: "申请方向",
  passed: "通过方向",
  status: "面试状态",
  name: "真实姓名",
  phone: "手机号码",
  studentId: "学号"
};

export const FILTER_FIELD_HINTS = {
  name: "输入姓名关键词",
  phone: "输入手机号",
  studentId: "输入学号"
};

/** 枚举字段：取值来自固定选项集合，用多选标签交互 */
export const ENUM_FIELD_KEYS = ["direction", "passed", "status"];

const ENUM_FIELD_SET = new Set(ENUM_FIELD_KEYS);

export function isEnumField(field) {
  return ENUM_FIELD_SET.has(field);
}

/** 枚举字段的可选值；文本字段返回空数组 */
export function enumOptionsFor(field) {
  if (field === "status") return STATUSES;
  if (field === "direction" || field === "passed") return DIRECTIONS;
  return [];
}

/** 枚举取值在 UI 上的显示文案（状态用中文标签，方向直接用值） */
export function enumOptionLabel(field, value) {
  return field === "status" ? STATUS_LABELS[value] || value : value;
}

/**
 * 把用户在表达式里手写的枚举取值归一到标准写法：
 * web → Web、已拒绝 → rejected。无法识别时原样返回（由调用方给警告），
 * 这样「输错了」不会被静默改写成一个看似有效的值。
 */
export function canonicalEnumValue(field, value) {
  if (!isEnumField(field)) return value;
  const options = enumOptionsFor(field);
  const hit = options.find((option) => option.toLowerCase() === value.toLowerCase());
  if (hit) return hit;
  if (field === "status" && STATUS_LABEL_TO_KEY[value]) return STATUS_LABEL_TO_KEY[value];
  return value;
}

/** 枚举取值是否合法（大小写不敏感，状态接受中文标签） */
export function isKnownEnumValue(field, value) {
  if (!isEnumField(field)) return true;
  if (enumOptionsFor(field).some((option) => option.toLowerCase() === value.toLowerCase())) return true;
  return field === "status" && Boolean(STATUS_LABEL_TO_KEY[value]);
}
