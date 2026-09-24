// 筛选字段的取值访问器 + 筛选状态 + 过滤执行。
// 这是「字段 → 用户对象」的唯一入口，页面和组件都只从这里取。

import {
  FILTER_FIELD_ORDER,
  isEnumField
} from "./recruitmentMeta.js";
import { evaluateAst, rowsToAst, stringifyFilterExpression } from "./filterExpression.js";

/**
 * 统一把「数组 | JSON 字符串 | 裸字符串 | number | null」归一到 string[]。
 *
 * 刻意不复用 src/api/users.js 里未导出的 parseJsonField：它对裸字符串 "Web"
 * 会走 JSON.parse 抛错路径返回 []，而这里需要保留它。
 */
export function toStringArray(value) {
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item : String(item ?? ""))).filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [trimmed];
      } catch {
        return [trimmed];
      }
    }
    return [trimmed];
  }
  if (typeof value === "number") return [String(value)];
  return [];
}

/** 某个字段在某个用户身上的取值，恒为 string[] */
export function getFieldValues(user, field) {
  if (!user) return [];
  switch (field) {
    case "direction": {
      // 按 length 而不是真值判断：normalizeUser 对 application.directions 跑了
      // parseJsonField（users.js:40），结果恒为数组且 [] 在 JS 里是真值，
      // 所以 `application.directions || user.directions` 这个回退永远走不到。
      const fromApplication = toStringArray(user.application?.directions);
      if (fromApplication.length) return fromApplication;
      return toStringArray(user.directions);
    }
    case "passed":
      return toStringArray(user.passedDirections);
    case "status":
      // 缺省 r1_pending，与列表卡片的渲染口径一致，否则 status:r1_pending
      // 会漏掉那些卡片上明明写着「一轮待定」的用户
      return toStringArray(user.status || "r1_pending");
    case "name":
      return toStringArray(user.application?.realName);
    case "phone":
      return toStringArray(user.application?.phone);
    case "studentId":
      return toStringArray(user.application?.studentId);
    default:
      return [];
  }
}

// ---- 条件行状态 ----

// 模块级自增，保证条件行 id 在初始行、表达式回填行、页面重挂载之间都不重复。
// 行 id 只用于 React key，本地唯一即可，全局单调递增最省事。
let rowSequence = 0;

export function nextRowId() {
  return `filter-row-${(rowSequence += 1)}`;
}

export function defaultOpFor(field) {
  return isEnumField(field) ? ":" : "~";
}

export function defaultRow(field = FILTER_FIELD_ORDER[0], connector = null) {
  return { id: nextRowId(), field, op: defaultOpFor(field), values: [], connector };
}

export function createFilterState() {
  return {
    rows: [defaultRow()],
    text: "",
    ast: null,
    mode: "rows",
    error: null,
    warnings: []
  };
}

/** 由条件行推导出完整状态（行是真相来源时使用） */
export function buildRowState(rows, extra = {}) {
  const ast = rowsToAst(rows);
  return {
    rows,
    text: ast ? stringifyFilterExpression(ast) : "",
    ast,
    mode: "rows",
    error: null,
    warnings: [],
    ...extra
  };
}

// ---- 过滤 ----

export function applyFilter(state, users) {
  const list = Array.isArray(users) ? users : [];
  const ast = state?.ast;
  if (!ast) return list;
  // 每次筛选一份缓存：把成本压到「每个用户 6 次取值」而不是「每个条件 × 每个用户」
  const cache = new Map();
  return list.filter((user) =>
    evaluateAst(ast, (field) => readFieldValues(cache, user, field))
  );
}

function readFieldValues(cache, user, field) {
  let byField = cache.get(user);
  if (!byField) {
    byField = new Map();
    cache.set(user, byField);
  }
  if (!byField.has(field)) byField.set(field, getFieldValues(user, field));
  return byField.get(field);
}

function collectFields(node, target) {
  if (!node) return;
  if (node.type === "condition") {
    target.add(node.field);
    return;
  }
  if (node.type === "not") {
    collectFields(node.child, target);
    return;
  }
  collectFields(node.left, target);
  collectFields(node.right, target);
}

/**
 * 找出「当前条件用到、但已拉取数据里一条都没有」的字段。
 *
 * 列表接口是否真的返回全部六个字段，文档并不可靠（assigned_by 就被文档写错过），
 * 所以后端某次少返回一个字段时，不能让用户看到「筛不到人」这种无声结果——
 * 面板上要把原因说出来。
 */
export function findUnavailableFields(state, users, fields = FILTER_FIELD_ORDER) {
  const ast = state?.ast;
  if (!ast) return [];
  const list = Array.isArray(users) ? users : [];
  if (!list.length) return [];
  const used = new Set();
  collectFields(ast, used);
  return fields.filter(
    (field) => used.has(field) && !list.some((user) => getFieldValues(user, field).length > 0)
  );
}
