import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listUsers } from "../api/users.js";
import { gravatarUrl } from "../utils/gravatar.js";
import FilterBuilder from "../components/FilterBuilder.jsx";
import { FILTER_FIELD_ORDER, formatStatus } from "../utils/recruitmentMeta.js";
import {
  applyFilter,
  createFilterState,
  findUnavailableFields,
  getFieldValues
} from "../utils/filterFields.js";

export default function CandidateList() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState(() => createFilterState());
  const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v2";
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const exportUrl = apiBase.startsWith("http")
    ? `${apiBase}/export/applications`
    : `http://${host}:8080${apiBase}/export/applications`;

  const load = () => {
    listUsers({ q: query, role: "interviewee" })
      .then((data) => setUsers(data.items || []))
      .catch(() => setStatus("候选人加载失败。"));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const onSearch = (event) => {
    event.preventDefault();
    load();
  };

  // 筛选在客户端做：它只作用于已拉取到的这一批数据，
  // 所以下面那行计数写的是「M / N」，不声称是全局总数
  const visibleUsers = useMemo(() => applyFilter(filter, users), [users, filter]);
  const unavailableFields = useMemo(
    () => findUnavailableFields(filter, users, FILTER_FIELD_ORDER),
    [filter, users]
  );

  return (
    <section className="page">
      <div className="page-header">
        <div className="stack-tight">
          <h1 className="page-title">候选人列表</h1>
          <p className="page-subtitle">搜索、查看候选人状态与方向进度。</p>
        </div>
        <div className="page-actions">
          <a href={exportUrl} className="link-button export-link" target="_blank" rel="noreferrer">
            导出候选人表格
          </a>
        </div>
      </div>
      {status && <p className="hint">{status}</p>}
      <form className="form-card wide form-inline" onSubmit={onSearch}>
        <label>
          <input
            placeholder="按邮箱或昵称搜索"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button type="submit" className="nowrap">搜索</button>
      </form>
      {/* 必须放在上面的 <form> 之外：里面的按钮一旦被当成 submit 就会误触发搜索 */}
      <FilterBuilder
        value={filter}
        onChange={setFilter}
        hint="按申请方向、通过方向、面试状态、真实姓名、手机号码、学号筛选当前已加载的候选人。"
        unavailableFields={unavailableFields}
      />
      <p className="meta">共 {visibleUsers.length} / {users.length} 位候选人</p>
      {users.length > 0 && visibleUsers.length === 0 && (
        <p className="hint">没有符合条件的候选人，请调整或重置筛选条件。</p>
      )}
      <div className="grid two">
        {visibleUsers.map((user) => (
          <article key={user.id} className="card">
            <div className="stack-tight">
              <h3 className="card-title">{user.nickname || user.email}</h3>
              <div className="row card-identity">
                <img
                  className="avatar"
                  src={gravatarUrl(user.email, 72)}
                  alt={user.nickname || "avatar"}
                />
                <div className="inline-meta stack-tight">
                  <span>{user.signature || "暂无个性签名"}</span>
                  <span>{user.email}</span>
                </div>
              </div>
            </div>
            <div className="card-body">
              <p>面试状态：{formatStatus(user.status)}</p>
              <p>方向：{getFieldValues(user, "direction").join(", ") || "暂无"}</p>
              <p>通过方向：{getFieldValues(user, "passed").join(", ") || "暂无"}</p>
              <Link to={`${user.id}`} className="action-link">查看详情</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
