import React, { useEffect, useMemo, useRef, useState } from "react";
import { listUsers } from "../api/users.js";
import { useAuth } from "../context/AuthContext.jsx";
import { gravatarUrl } from "../utils/gravatar.js";
import FilterBuilder from "../components/FilterBuilder.jsx";
import { FILTER_FIELD_ORDER, formatStatus } from "../utils/recruitmentMeta.js";
import {
  applyFilter,
  createFilterState,
  findUnavailableFields,
  getFieldValues
} from "../utils/filterFields.js";

export default function UserDirectory() {
  const { user: currentUser } = useAuth();
  const [role, setRole] = useState("interviewee");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState(() => createFilterState());
  // 面试者之间互不可见面试进度，仅面试官可查看状态与通过方向
  const canViewInterviewInfo = currentUser?.role === "interviewer";

  const load = () => {
    listUsers({ role })
      .then((data) => setItems(data.items || []))
      .catch(() => setStatus("成员加载失败。"));
  };

  useEffect(() => {
    load();
  }, [role]);

  // 切角色等于换了一个数据集，带着旧筛选过去只会得到一片费解的空列表
  const firstRoleRun = useRef(true);
  useEffect(() => {
    if (firstRoleRun.current) {
      firstRoleRun.current = false;
      return;
    }
    setFilter(createFilterState());
  }, [role]);

  const visibleItems = useMemo(() => applyFilter(filter, items), [items, filter]);
  const unavailableFields = useMemo(
    () => findUnavailableFields(filter, items, FILTER_FIELD_ORDER),
    [filter, items]
  );

  return (
    <section className="page">
      <div className="page-header">
        <div className="stack-tight">
          <h1 className="page-title">成员目录</h1>
          <p className="page-subtitle">查看面试官与面试者的信息与方向分布。</p>
        </div>
        <div className="page-actions">
          <select className="select-clean" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="interviewee">面试者</option>
            <option value="interviewer">面试官</option>
          </select>
        </div>
      </div>
      {status && <p className="hint">{status}</p>}
      {canViewInterviewInfo && (
        <>
          <FilterBuilder
            value={filter}
            onChange={setFilter}
            hint="按申请方向、通过方向、面试状态、真实姓名、手机号码、学号筛选当前角色下已加载的成员。"
            unavailableFields={unavailableFields}
          />
          <p className="meta">共 {visibleItems.length} / {items.length} 位成员</p>
          {items.length > 0 && visibleItems.length === 0 && (
            <p className="hint">
              {role === "interviewer"
                ? "没有符合条件的成员。面试官通常没有报名信息（真实姓名 / 手机号码 / 学号 / 面试状态 / 通过方向 可能为空），请尝试移除相关条件或重置筛选。"
                : "没有符合条件的成员，请调整或重置筛选条件。"}
            </p>
          )}
        </>
      )}
      <div className="grid two">
        {visibleItems.map((user) => (
          <article key={user.id} className="card">
            <div className="stack-tight">
              <h3 className="card-title">{user.nickname || "匿名用户"}</h3>
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
              {getFieldValues(user, "direction").length > 0 && (
                <p>方向：{getFieldValues(user, "direction").join(", ")}</p>
              )}
              {canViewInterviewInfo && user.role === "interviewee" && user.passedDirections?.length > 0 && (
                <p>通过方向：{user.passedDirections.join(", ")}</p>
              )}
              {canViewInterviewInfo && user.role === "interviewee" && user.status && (
                <p>状态：{formatStatus(user.status)}</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
