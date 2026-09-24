// 列表筛选器的表达式引擎：分词 → 递归下降解析 → AST → 生成 / 求值。
//
// 文法：
//   expression := unary ( ("AND"|"OR") unary )*
//   unary      := "NOT" unary | primary
//   primary    := "(" expression ")" | condition
//   condition  := FIELD op VALUE ("|" VALUE)*
//   op         := ":" | "~" | "="
//
// 关键决定：AND 与 OR **同优先级、严格左结合**。
// 条件行区本质就是一条从左到右、每行带「和/或」的连接链，只有同优先级左结合，
// 两个编辑器才完全同构（行 ↔ 文本 双向无损）。若按常规的「AND 比 OR 紧」，
// 同一串 `a AND b OR c` 在表达式里是 a AND (b OR c)、在条件行里是 (a AND b) OR c，
// 含义相反——这种静默反转正是要避免的。代价由 UI 上的一行常驻提示说明。
//
// 本模块不依赖 React / DOM，可以单独用 node 跑用例。

import {
  DIRECTIONS,
  STATUSES,
  STATUS_LABELS,
  STATUS_LABEL_TO_KEY,
  FILTER_FIELD_ORDER,
  isEnumField
} from "./recruitmentMeta.js";

const MAX_EXPRESSION_LENGTH = 500;
const MAX_PAREN_DEPTH = 20;

const KEYWORDS = { AND: "and", OR: "or", NOT: "not" };
const OP_CHARS = ":~=";
const DELIMITERS = new Set(["(", ")", "|"]);

const EXAMPLE = {
  direction: "direction:Web",
  passed: "passed:Pwn",
  status: "status:rejected",
  name: "name:张三",
  phone: "phone:13800000000",
  studentId: "studentId:20230001"
};

const FIELD_BY_LOWER = new Map(FILTER_FIELD_ORDER.map((field) => [field.toLowerCase(), field]));

const OP_CHAR = { ":": ":", "~": "~", "=": "=" };

// ---- 分词 ----

// 取值 token 在空白、|、(、) 处终止，所以取值里不能有空格。
// 需要支持 name:"张 三" 这类引号语法时，扩展点就是这个循环。
function tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (/\s/.test(char)) {
      i += 1;
      continue;
    }
    if (DELIMITERS.has(char)) {
      tokens.push({
        type: char === "(" ? "lparen" : char === ")" ? "rparen" : "pipe",
        value: char,
        start: i,
        end: i + 1
      });
      i += 1;
      continue;
    }
    const start = i;
    while (i < text.length && !/\s/.test(text[i]) && !DELIMITERS.has(text[i])) {
      i += 1;
    }
    const word = text.slice(start, i);
    const keyword = KEYWORDS[word.toUpperCase()];
    if (keyword) {
      tokens.push({ type: keyword, value: word, start, end: i });
      continue;
    }
    let opIndex = -1;
    for (let k = 0; k < word.length; k += 1) {
      if (OP_CHARS.includes(word[k])) {
        opIndex = k;
        break;
      }
    }
    if (opIndex === -1) {
      tokens.push({ type: "word", value: word, start, end: i });
      continue;
    }
    tokens.push({
      type: "cond",
      rawField: word.slice(0, opIndex),
      opChar: word[opIndex],
      rawValue: word.slice(opIndex + 1),
      start,
      end: i,
      valueStart: start + opIndex + 1
    });
  }
  tokens.push({ type: "eof", value: "", start: text.length, end: text.length });
  return tokens;
}

// ---- 解析 ----

function parseFailed(message, offset, length = 1) {
  const thrown = new Error(message);
  thrown.__filterError = { message, offset, length: Math.max(1, length) };
  return thrown;
}

function parseTokens(tokens) {
  const state = { pos: 0, parenStack: [], warnings: [], sawCondition: false };
  const ast = parseExpression(state, tokens);
  expectEnd(state, tokens);
  return { ast, warnings: state.warnings };
}

function peek(state, tokens) {
  return tokens[state.pos];
}

function advance(state, tokens) {
  const token = tokens[state.pos];
  state.pos += 1;
  return token;
}

function parseExpression(state, tokens) {
  let node = parseUnary(state, tokens);
  for (;;) {
    const token = peek(state, tokens);
    if (token.type !== "and" && token.type !== "or") break;
    advance(state, tokens);
    // 同优先级、左结合：直接折叠成左倾二叉树
    node = { type: token.type, left: node, right: parseUnary(state, tokens) };
  }
  return node;
}

function parseUnary(state, tokens) {
  const token = peek(state, tokens);
  if (token.type === "not") {
    advance(state, tokens);
    return { type: "not", child: parseUnary(state, tokens), offset: token.start };
  }
  return parsePrimary(state, tokens);
}

function parsePrimary(state, tokens) {
  const token = peek(state, tokens);

  if (token.type === "lparen") {
    state.parenStack.push(token.start);
    if (state.parenStack.length > MAX_PAREN_DEPTH) {
      throw parseFailed(`括号嵌套过深，最多 ${MAX_PAREN_DEPTH} 层。`, token.start);
    }
    advance(state, tokens);
    const inner = parseExpression(state, tokens);
    if (peek(state, tokens).type !== "rparen") {
      throw parseFailed(
        "括号未闭合，缺少右括号「)」。",
        state.parenStack[state.parenStack.length - 1]
      );
    }
    state.parenStack.pop();
    advance(state, tokens);
    return inner;
  }

  if (token.type === "rparen") throw parseFailed("多余的右括号「)」。", token.start);
  if (token.type === "pipe") {
    throw parseFailed("「|」前缺少字段名，条件格式应为 字段:值。", token.start);
  }
  if (token.type === "eof") throw parseFailed("表达式不完整，末尾缺少条件。", token.start);
  if (token.type === "cond") return parseCondition(state, tokens);

  // 剩下的只可能是 word / and / or，都说明当前位置缺少条件
  if (token.type === "and" || token.type === "or") {
    throw parseFailed(
      `「${token.value}」前缺少条件，或出现了连续的连接符。`,
      token.start,
      token.end - token.start
    );
  }
  if (state.sawCondition) {
    throw parseFailed(
      `第 ${token.start + 1} 个字符处缺少 AND 或 OR 连接符；若想为同一个字段添加多个取值，请使用「|」分隔。`,
      token.start,
      token.end - token.start
    );
  }
  throw parseFailed(
    `无法识别「${token.value}」，条件格式应为 字段:值（例如 direction:Web）。`,
    token.start,
    token.end - token.start
  );
}

function parseCondition(state, tokens) {
  const token = advance(state, tokens);
  state.sawCondition = true;

  if (!token.rawField) {
    throw parseFailed("缺少字段名，条件格式应为 字段:值（例如 direction:Web）。", token.start);
  }
  const field = FIELD_BY_LOWER.get(token.rawField.toLowerCase());
  if (!field) {
    throw parseFailed(
      `未知字段「${token.rawField}」，可用字段：${FILTER_FIELD_ORDER.join("、")}。`,
      token.start,
      token.rawField.length
    );
  }
  if (!token.rawValue) {
    throw parseFailed(`字段「${field}」缺少取值，例如 ${EXAMPLE[field]}。`, token.end);
  }

  const op = canonicalOp(field, token.opChar);
  const values = [collectValue(state, field, token.rawValue, token.valueStart)];

  for (;;) {
    const separator = peek(state, tokens);
    if (separator.type !== "pipe") break;
    advance(state, tokens);
    const next = peek(state, tokens);
    if (next.type === "word") {
      advance(state, tokens);
      values.push(collectValue(state, field, next.value, next.start));
      continue;
    }
    if (next.type === "cond") {
      throw parseFailed("多个取值之间只能用「|」分隔，不能出现新的字段。", next.start);
    }
    throw parseFailed("「|」后缺少取值。", next.start);
  }

  return { type: "condition", field, op, values, offset: token.start };
}

function expectEnd(state, tokens) {
  const token = peek(state, tokens);
  if (token.type === "eof") return;
  if (token.type === "rparen") throw parseFailed("多余的右括号「)」。", token.start);
  if (token.type === "lparen") throw parseFailed("缺少 AND 或 OR 连接符（括号前）。", token.start);
  if (token.type === "pipe") throw parseFailed("「|」前缺少字段名。", token.start);
  if (token.type === "word") {
    throw parseFailed(
      `第 ${token.start + 1} 个字符处缺少 AND 或 OR 连接符；若这是上一个条件的取值，请注意取值不能包含空格。`,
      token.start,
      token.end - token.start
    );
  }
  throw parseFailed(
    `第 ${token.start + 1} 个字符处缺少 AND 或 OR 连接符；若想为同一个字段添加多个取值，请使用「|」分隔。`,
    token.start,
    token.end - token.start
  );
}

// 枚举字段默认精确，文本字段默认模糊；显式 '=' / '~' 可以覆盖默认
function canonicalOp(field, opChar) {
  if (isEnumField(field)) return opChar === "~" ? "~" : ":";
  return opChar === "=" ? "=" : "~";
}

// 只做校验、不改写取值：改写会让用户正在输入的字符在光标下跳变
// （例如输入 status:已拒绝 时被逐字换成 status:rejected）。
// 归一化交给 canonicalEnumValue，在「表达式接入条件行」那一步做一次。
function collectValue(state, field, raw, offset) {
  const value = raw.trim();
  if (field === "direction" || field === "passed") {
    if (!DIRECTIONS.some((direction) => direction.toLowerCase() === value.toLowerCase())) {
      state.warnings.push({
        message: `「${value}」不是有效的方向，可选：${DIRECTIONS.join("、")}。`,
        offset,
        length: value.length
      });
    }
    return value;
  }
  if (field === "status") {
    const known =
      STATUSES.some((status) => status.toLowerCase() === value.toLowerCase()) ||
      Boolean(STATUS_LABEL_TO_KEY[value]);
    if (!known) {
      state.warnings.push({
        message: `「${value}」不是有效的面试状态，可选：${STATUSES.map((s) => STATUS_LABELS[s]).join(
          "、"
        )}（或 ${STATUSES.join("、")}）。`,
        offset,
        length: value.length
      });
    }
    return value;
  }
  return value;
}

// ---- 对外 API ----

/**
 * 解析表达式。永远返回结果对象、不抛异常，调用方在渲染期不需要 try/catch。
 * @returns {{ok: true, ast, warnings, empty: boolean} | {ok: false, error: {message, offset, length}}}
 */
export function parseFilterExpression(text) {
  const raw = typeof text === "string" ? text : "";
  if (!raw.trim()) return { ok: true, ast: null, warnings: [], empty: true };
  if (raw.length > MAX_EXPRESSION_LENGTH) {
    return {
      ok: false,
      error: { message: `表达式过长，最多 ${MAX_EXPRESSION_LENGTH} 个字符。`, offset: MAX_EXPRESSION_LENGTH, length: 1 }
    };
  }
  try {
    const { ast, warnings } = parseTokens(tokenize(raw));
    return { ok: true, ast, warnings, empty: false };
  } catch (thrown) {
    if (thrown && thrown.__filterError) return { ok: false, error: thrown.__filterError };
    return { ok: false, error: { message: "表达式解析失败。", offset: 0, length: 1 } };
  }
}

/** AST → 文本。同优先级左结合下左子树永不需要括号，所以条件行生成的文本不含括号。 */
export function stringifyFilterExpression(ast) {
  return ast ? generate(ast) : "";
}

function generate(node) {
  switch (node.type) {
    case "condition":
      return `${node.field}${OP_CHAR[node.op] || ":"}${node.values.join("|")}`;
    case "and":
    case "or":
      return `${generate(node.left)} ${node.type === "and" ? "AND" : "OR"} ${generateRight(node.right)}`;
    case "not":
      return `NOT ${
        node.child.type === "condition" ? generate(node.child) : `(${generate(node.child)})`
      }`;
    default:
      return "";
  }
}

function generateRight(node) {
  if (!node) return "";
  return node.type === "condition" ? generate(node) : `(${generate(node)})`;
}

/**
 * 是否是「扁平左结合链」——决定表达式能否回填到条件行。
 * 返回按从左到右排列的行数组（首行 connector 为 null），否则返回 null。
 *
 * 只有根到叶纯左结合、每个右子都是 condition 时才成立：
 *   a OR (b AND c) → null（右子不是 condition）
 *   (a OR b) AND c → 成立（左子可以是任意布尔节点）
 * NOT 与括号分组会自动落 null，不需要额外扫描。
 */
export function toFlatChain(ast) {
  if (!ast) return null;
  const rows = [];
  let node = ast;
  while (node && (node.type === "and" || node.type === "or")) {
    if (!node.right || node.right.type !== "condition") return null;
    rows.unshift({
      field: node.right.field,
      op: node.right.op,
      values: [...node.right.values],
      connector: node.type === "and" ? "AND" : "OR"
    });
    node = node.left;
  }
  if (!node || node.type !== "condition") return null;
  rows.unshift({
    field: node.field,
    op: node.op,
    values: [...node.values],
    connector: null
  });
  return rows;
}

/** 条件行 → AST。没有取值的行会被跳过，因此「选了字段没选值」绝不会把列表筛空。 */
export function rowsToAst(rows) {
  const usable = (rows || []).filter(
    (row) => row && row.field && Array.isArray(row.values) && row.values.length > 0
  );
  if (!usable.length) return null;
  let ast = toConditionNode(usable[0]);
  for (let i = 1; i < usable.length; i += 1) {
    ast = {
      type: usable[i].connector === "OR" ? "or" : "and",
      left: ast,
      right: toConditionNode(usable[i])
    };
  }
  return ast;
}

function toConditionNode(row) {
  return {
    type: "condition",
    field: row.field,
    op: canonicalOp(row.field, row.op === undefined ? ":" : row.op),
    values: [...row.values]
  };
}

/**
 * 求值。取值由外部注入（getValues(field) → string[]），因此本模块不依赖字段定义。
 */
export function evaluateAst(node, getValues) {
  if (!node) return true;
  switch (node.type) {
    case "and":
      return evaluateAst(node.left, getValues) && evaluateAst(node.right, getValues);
    case "or":
      return evaluateAst(node.left, getValues) || evaluateAst(node.right, getValues);
    case "not":
      return !evaluateAst(node.child, getValues);
    case "condition": {
      const wanted = node.values;
      if (!wanted.length) return true;
      const actual = getValues(node.field) || [];
      if (isEnumField(node.field)) {
        if (node.op === "~") {
          return actual.some((value) => wanted.some((needle) => enumFuzzyMatch(node.field, value, needle)));
        }
        return actual.some((value) => wanted.some((needle) => enumEquals(node.field, value, needle)));
      }
      if (node.op === "=") return wanted.some((needle) => actual.includes(needle));
      return actual.some((value) =>
        wanted.some((needle) => value.toLowerCase().includes(needle.toLowerCase()))
      );
    }
    default:
      return true;
  }
}

// 枚举比较：大小写不敏感；status 还接受中文标签（status:已拒绝 ≡ status:rejected）
function enumEquals(field, actual, wanted) {
  if (actual === wanted) return true;
  if (actual.toLowerCase() === wanted.toLowerCase()) return true;
  if (field === "status") {
    const left = STATUS_LABEL_TO_KEY[actual] || actual;
    const right = STATUS_LABEL_TO_KEY[wanted] || wanted;
    return left === right;
  }
  return false;
}

// 模糊比较：既比枚举值本身，也比它的中文标签，所以 status~拒绝、status~r1 都能用
function enumFuzzyMatch(field, actual, wanted) {
  const needle = wanted.toLowerCase();
  if (actual.toLowerCase().includes(needle)) return true;
  if (field === "status") {
    const label = STATUS_LABELS[actual];
    if (label && label.includes(wanted)) return true;
  }
  return false;
}
