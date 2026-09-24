import React, { useState } from "react";
import {
  FILTER_FIELD_HINTS,
  FILTER_FIELD_LABELS,
  FILTER_FIELD_ORDER,
  canonicalEnumValue,
  enumOptionLabel,
  enumOptionsFor,
  isEnumField
} from "../utils/recruitmentMeta.js";
import {
  buildRowState,
  createFilterState,
  defaultOpFor,
  defaultRow,
  nextRowId
} from "../utils/filterFields.js";
import { parseFilterExpression, toFlatChain } from "../utils/filterExpression.js";

// 受控组件。value 形如：
//   { rows, text, ast, mode: "rows" | "expression", error, warnings }
//
// 两条不变式（改动本文件时请守住）：
//   1) mode === "rows" 时，行区可编辑，ast 由 rows 推导；
//      mode === "expression" 时，ast 来自表达式，rows 冻结为「表达式接管前的快照」，
//      清空表达式即可恢复行编辑。
//   2) 所有派生都在事件处理里完成——**绝不用 useEffect 监听 rows 去回写 text**，
//      那会和「表达式 → 行」方向形成反馈环。
//
// 关于 text 与 rows 的拼写差异：表达式被回填成条件行时，枚举取值会被归一化
// （web → Web、已拒绝 → rejected），但输入框里保留用户原本的拼写。这是刻意的：
// 逐字重写会让光标下的字符跳变。两边语义一致，下一次编辑条件行时 text 自然重算。
const FALLBACK_STATE = createFilterState();

export default function FilterBuilder({
  value,
  onChange,
  fields = FILTER_FIELD_ORDER,
  label = "筛选条件",
  hint = null,
  disabled = false,
  unavailableFields = []
}) {
  const state = value || FALLBACK_STATE;
  const rows = state.rows || [];
  const locked = disabled || state.mode === "expression";

  // 中文输入法组字期间不解析、不切模式、不报错，否则 name~张 每敲一个拼音就闪一次错误
  const [composing, setComposing] = useState(false);
  const [localText, setLocalText] = useState("");

  const commitRows = (nextRows) => onChange(buildRowState(nextRows));

  const patchRow = (id, patch) => {
    commitRows(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  // 换字段要清空取值：["Web"] 对 name 来说是垃圾，留着会变成看不见的条件
  const changeField = (id, field) => {
    patchRow(id, { field, op: defaultOpFor(field), values: [] });
  };

  const setRowOp = (id, selected) => {
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    if (isEnumField(row.field)) {
      patchRow(id, { op: selected === "~" ? "~" : ":" });
      return;
    }
    patchRow(id, { op: selected === "=" ? "=" : "~" });
  };

  const toggleValue = (id, option) => {
    commitRows(
      rows.map((row) => {
        if (row.id !== id) return row;
        const current = row.values || [];
        const next = current.includes(option)
          ? current.filter((item) => item !== option)
          : [...current, option];
        return { ...row, values: next };
      })
    );
  };

  const addRow = () => {
    // 沿用最后一行的连接符：在 `a OR b` 后面追加时，默认 AND 会让语义
    // 变成 (a OR b) AND c——那不是「继续往下加一条」的意思
    const last = rows[rows.length - 1];
    const connector = last?.connector === "OR" ? "OR" : "AND";
    commitRows([...rows, defaultRow(fields[0] || FILTER_FIELD_ORDER[0], connector)]);
  };

  const removeRow = (id) => {
    if (rows.length <= 1) return;
    const next = rows.filter((row) => row.id !== id);
    // 删掉首行后，新的首行不该再带连接符
    commitRows(next.map((row, index) => (index === 0 ? { ...row, connector: null } : row)));
  };

  const handleTextChange = (nextText) => {
    const parsed = parseFilterExpression(nextText);

    if (!parsed.ok) {
      // 保留上一次有效的 ast，列表不闪不空
      onChange({ ...state, text: nextText, error: parsed.error });
      return;
    }
    if (parsed.empty) {
      // 空表达式 → 交还条件行。刻意让 text 保持为空（而不是用条件行重新生成文本），
      // 否则用户按退格清空输入框时，框里的内容会立刻被填回来，像删不掉一样。
      onChange(buildRowState(rows, { text: "" }));
      return;
    }
    const chain = toFlatChain(parsed.ast);
    if (chain) {
      const adopted = chain.map((row) => ({
        ...row,
        id: nextRowId(),
        values: row.values.map((item) => canonicalEnumValue(row.field, item))
      }));
      onChange({
        rows: adopted,
        text: nextText,
        ast: parsed.ast,
        mode: "rows",
        error: null,
        warnings: parsed.warnings
      });
      return;
    }
    // 含括号分组或 NOT：条件行无法表达，交给表达式接管
    onChange({
      ...state,
      text: nextText,
      ast: parsed.ast,
      mode: "expression",
      error: null,
      warnings: parsed.warnings
    });
  };

  const onTextInput = (event) => {
    const next = event.target.value;
    if (composing) {
      setLocalText(next);
      return;
    }
    handleTextChange(next);
  };

  const onCompositionStart = () => {
    setComposing(true);
    setLocalText(state.text || "");
  };

  const onCompositionEnd = (event) => {
    setComposing(false);
    handleTextChange(event.target.value);
  };

  const clearExpression = () => {
    setComposing(false);
    setLocalText("");
    handleTextChange("");
  };

  const reset = () => {
    setComposing(false);
    setLocalText("");
    onChange(createFilterState());
  };

  const optionLabel = (field, option) => enumOptionLabel(field, option);
  const knownOptions = (field) => enumOptionsFor(field);
  const extraOptions = (row) =>
    (row.values || []).filter((item) => !knownOptions(row.field).includes(item));
  const hasAnything =
    Boolean(state.text) || rows.some((row) => (row.values || []).length > 0);

  const fieldHelp = fields
    .map((field) => `${field} ${FILTER_FIELD_LABELS[field]}`)
    .join("、");

  return (
    <div className="card filter-panel" aria-label={label}>
      <div className="stack-tight">
        <h3>{label}</h3>
        {hint && <p className="page-subtitle">{hint}</p>}
      </div>

      <div className={`filter-rows${locked ? " is-locked" : ""}`}>
        {rows.map((row, index) => {
          const isEnum = isEnumField(row.field);
          const extras = isEnum ? extraOptions(row) : [];
          return (
            <div className="filter-row" key={row.id}>
              <div className="filter-connector">
                {index === 0 ? (
                  <span className="filter-label">条件</span>
                ) : (
                  <label>
                    <span className="filter-label">与上一条件</span>
                    <select
                      className="select-clean"
                      value={row.connector === "OR" ? "OR" : "AND"}
                      disabled={locked}
                      onChange={(event) => patchRow(row.id, { connector: event.target.value })}
                    >
                      <option value="AND">和</option>
                      <option value="OR">或</option>
                    </select>
                  </label>
                )}
              </div>

              <label className="filter-field">
                <span className="filter-label">字段</span>
                <select
                  className="select-clean"
                  value={row.field}
                  disabled={locked}
                  onChange={(event) => changeField(row.id, event.target.value)}
                >
                  {fields.map((field) => (
                    <option key={field} value={field}>
                      {FILTER_FIELD_LABELS[field] || field}
                    </option>
                  ))}
                </select>
              </label>

              {/* 文本字段恒有匹配方式；枚举行只在「表达式里写了 ~」时露出，以便切回精确 */}
              {(!isEnum || row.op === "~") && (
                <label className="filter-op">
                  <span className="filter-label">匹配方式</span>
                  <select
                    className="select-clean"
                    value={row.op === "~" ? "~" : "="}
                    disabled={locked}
                    onChange={(event) => setRowOp(row.id, event.target.value)}
                  >
                    <option value="~">包含</option>
                    <option value="=">精确</option>
                  </select>
                </label>
              )}

              <div className="filter-values">
                <span className="filter-label">{isEnum ? "取值（可多选）" : "取值"}</span>
                {isEnum ? (
                  <div className="tags filter-tags">
                    {knownOptions(row.field).map((option) => (
                      <label key={option} className="tag">
                        <input
                          type="checkbox"
                          checked={(row.values || []).includes(option)}
                          disabled={locked}
                          onChange={() => toggleValue(row.id, option)}
                        />
                        {optionLabel(row.field, option)}
                      </label>
                    ))}
                    {/* 表达式里写了无法识别的取值时，仍要能看见、能取消，不能只剩一个看不见的条件 */}
                    {extras.map((option) => (
                      <label key={option} className="tag tag-unknown" title="不是有效的取值">
                        <input
                          type="checkbox"
                          checked
                          disabled={locked}
                          onChange={() => toggleValue(row.id, option)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    value={(row.values || [])[0] || ""}
                    disabled={locked}
                    placeholder={FILTER_FIELD_HINTS[row.field] || "输入取值"}
                    onChange={(event) =>
                      patchRow(row.id, { values: event.target.value ? [event.target.value] : [] })
                    }
                  />
                )}
                {isEnum && (row.values || []).length === 0 && (
                  <span className="meta">未选择取值，该条件不参与筛选</span>
                )}
              </div>

              <div className="filter-row-actions">
                {rows.length > 1 && (
                  <button
                    type="button"
                    className="filter-row-remove"
                    disabled={locked}
                    onClick={() => removeRow(row.id)}
                  >
                    删除
                  </button>
                )}
                {index === rows.length - 1 && (
                  <button type="button" disabled={locked} onClick={addRow}>
                    ＋ 添加条件
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="filter-expression">
        <label>
          <span className="filter-label">表达式</span>
          <input
            className="filter-expression-input"
            value={composing ? localText : state.text || ""}
            spellCheck={false}
            autoComplete="off"
            placeholder="direction:Web|Pwn AND (status:rejected OR status:offer)"
            aria-invalid={state.error ? "true" : "false"}
            onChange={onTextInput}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
          />
        </label>
        <p className="meta">
          字段：{fieldHelp}；「包含」用 ~、「精确」用 =、`:` 按字段默认（枚举精确、文本包含）；多个取值用 |
          分隔；AND / OR / NOT 与括号支持嵌套，且 AND 与 OR 同优先级、按从左到右的顺序结合，如需分组请使用括号。
        </p>
        {state.error && (
          <p className="error" role="alert">
            表达式错误：{state.error.message}（第 {state.error.offset + 1} 个字符附近）
          </p>
        )}
        {!state.error &&
          (state.warnings || []).map((warning) => (
            <p className="error" key={`${warning.offset}-${warning.message}`}>
              表达式提示：{warning.message}
            </p>
          ))}
        {unavailableFields.length > 0 && (
          <p className="hint">
            当前已加载的数据里没有任何
            {unavailableFields.map((field) => `「${FILTER_FIELD_LABELS[field] || field}」`).join("、")}
            字段，涉及它的条件无法生效。
          </p>
        )}
        {state.mode === "expression" && (
          <p className="filter-takeover">
            <span>已由表达式接管，清空表达式即可恢复条件行编辑。</span>
            <button type="button" className="link-button" onClick={clearExpression}>
              清空表达式
            </button>
          </p>
        )}
        {hasAnything && (
          <div className="filter-expression-actions">
            <button type="button" className="link-button" onClick={reset}>
              重置筛选
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
