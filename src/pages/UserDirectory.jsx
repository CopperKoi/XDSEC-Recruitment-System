import React, { useEffect, useState } from "react";
import { listUsers } from "../api/users.js";
import { useAuth } from "../context/AuthContext.jsx";
import { gravatarUrl } from "../utils/gravatar.js";

const STATUS_LABELS = {
  r1_pending: "一轮待定",
  r1_passed: "一轮通过",
  r2_pending: "二轮待定",
  r2_passed: "二轮通过",
  rejected: "已拒绝",
  offer: "已录取"
};

export default function UserDirectory() {
  const { user: currentUser } = useAuth();
  const [role, setRole] = useState("interviewee");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
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
      <div className="grid two">
        {items.map((user) => (
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
              {user.directions && (
                <p>方向：{(user.directions || []).join(", ")}</p>
              )}
              {canViewInterviewInfo && user.role === "interviewee" && user.passedDirections?.length > 0 && (
                <p>通过方向：{user.passedDirections.join(", ")}</p>
              )}
              {canViewInterviewInfo && user.role === "interviewee" && user.status && (
                <p>状态：{STATUS_LABELS[user.status] || user.status}</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
