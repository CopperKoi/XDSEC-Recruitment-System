import React, { useEffect, useState } from "react";
import { listUsers } from "../api/users.js";
import { gravatarUrl } from "../utils/gravatar.js";

export default function UserDirectory() {
  const [role, setRole] = useState("interviewee");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const statusLabels = {
    r1_pending: "一轮待定",
    r1_passed: "一轮通过",
    r2_pending: "二轮待定",
    r2_passed: "二轮通过",
    rejected: "已拒绝",
    offer: "已录取"
  };

  const load = () => {
    listUsers({ role })
      .then((data) => setItems(data.items || []))
      .catch(() => setStatus("成员加载失败。"));
  };

  useEffect(() => {
    load();
  }, [role]);

  return (
    <section>
      <h1>成员目录</h1>
      {status && <p className="hint">{status}</p>}
      <div className="row">
        <label>
          角色
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="interviewee">面试者</option>
            <option value="interviewer">面试官</option>
          </select>
        </label>
      </div>
      <div className="grid two">
        {items.map((user) => (
          <article key={user.id} className="card">
            <div className="row">
              <img
                className="avatar"
                src={gravatarUrl(user.email, 72)}
                alt={user.nickname || "avatar"}
              />
              <div>
                <h3>{user.nickname || "匿名用户"}</h3>
                <p className="meta">{user.signature || "暂无个性签名"}</p>
              </div>
            </div>
            {user.directions && (
              <p>方向：{(user.directions || []).join(", ")}</p>
            )}
            {user.role === "interviewee" && user.passedDirections && (
              <p>通过方向：{(user.passedDirections || []).join(", ")}</p>
            )}
            {user.status && <p>状态：{statusLabels[user.status] || user.status}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
