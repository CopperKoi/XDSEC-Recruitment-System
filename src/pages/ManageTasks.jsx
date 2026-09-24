import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { listTasks, createTask, updateTask, deleteTask } from "../api/tasks.js";
import { listUsers, getUser } from "../api/users.js";
import MarkdownRenderer from "../components/MarkdownRenderer.jsx";

export default function ManageTasks() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", targetUserId: "" });
  const [status, setStatus] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [userOptions, setUserOptions] = useState([]);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [editingId, setEditingId] = useState("");

  const load = () => {
    listTasks({ scope: "all" })
      .then((data) => setItems(data.items || []))
      .catch(() => setStatus("任务加载失败。"));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetUserId = params.get("targetUserId");
    if (targetUserId) {
      setForm((prev) => ({ ...prev, targetUserId }));
      setSelectedUserName("");
      getUser(targetUserId)
        .then((user) => setSelectedUserName(user.nickname || user.email || user.id))
        .catch(() => {});
    }
  }, [location.search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      listUsers({ role: "interviewee", q: userQuery })
        .then((data) => setUserOptions(data.items || []))
        .catch(() => setStatus("用户搜索失败。"));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [userQuery]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    // 在 await 之前快照：下面的 setForm / setEditingId("") 会清掉它们，
    // 而 state 更新是异步的，await 之后再读不可靠
    const targetUserId = form.targetUserId;
    const isEditing = Boolean(editingId);
    if (!targetUserId) {
      setStatus("请选择目标用户。");
      return;
    }
    try {
      if (isEditing) {
        await updateTask(editingId, form);
      } else {
        await createTask(form);
      }
      setForm({ title: "", description: "", targetUserId: "" });
      setSelectedUserName("");
      setEditingId("");
      if (isEditing) {
        // 改完留在任务页，否则每次保存修改都会把人弹走
        load();
      } else {
        // 创建总是属于「给某个候选人布置任务」（targetUserId 必填），
        // 所以直接回候选人详情看结果
        navigate(`/interviewer/candidates/${targetUserId}`);
      }
    } catch (error) {
      setStatus(error.message || (isEditing ? "任务更新失败。" : "任务创建失败。"));
    }
  };

  const onEdit = (task) => {
    setForm({
      title: task.title || "",
      description: task.description || "",
      targetUserId: task.targetUserId || ""
    });
    setSelectedUserName(task.targetUserName || task.targetUserId || "");
    setEditingId(task.id);
    setStatus("正在编辑任务，发布后将覆盖原内容。");
  };

  const onDelete = async (task) => {
    setStatus("");
    if (!window.confirm(`确定删除任务「${task.title}」吗？此操作不可恢复。`)) {
      return;
    }
    try {
      await deleteTask(task.id);
      load();
    } catch (error) {
      setStatus(error.message || "任务删除失败。");
    }
  };

  const visibleItems = form.targetUserId
    ? items.filter((task) => task.targetUserId === form.targetUserId)
    : items;

  return (
    <section className="page">
      <div className="page-header">
        <div className="stack-tight">
          <h1 className="page-title">任务管理</h1>
          <p className="page-subtitle">为面试者布置任务并追踪提交情况。</p>
        </div>
      </div>
      {status && <p className="hint">{status}</p>}
      <form className="form-card wide stack gap-bottom-lg" onSubmit={onSubmit}>
        <div className="stack-tight">
          <h3>{editingId ? "编辑任务" : "布置新任务"}</h3>
          <p className="page-subtitle">先搜索用户，再填写任务内容。</p>
        </div>
        <label className="field-top-gap">
          标题
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
        </label>
        <label>
          搜索用户（昵称 / 邮箱）
          <input
            value={userQuery}
            onChange={(event) => setUserQuery(event.target.value)}
            placeholder="输入关键词进行搜索"
            autoComplete="off"
          />
        </label>
        {userQuery && userOptions.length > 0 && (
          <div className="search-list">
            {userOptions.map((user) => (
              <button
                key={user.id}
                type="button"
                className="search-option"
                onClick={() => {
                  setForm({ ...form, targetUserId: user.id });
                  setSelectedUserName(user.nickname || user.email || user.id);
                  setUserQuery("");
                  setUserOptions([]);
                }}
              >
                {(user.nickname || "未填写昵称") + " · " + (user.email || "未填写邮箱")}
              </button>
            ))}
          </div>
        )}
        <label>
          目标用户（通过搜索选择）
          <input
            value={selectedUserName}
            placeholder="请通过搜索选择用户"
            readOnly
            className="readonly-field"
          />
        </label>
        <label>
          描述（支持 Markdown）
          <textarea
            rows={5}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            required
          />
        </label>
        <div className="form-actions">
          <button type="submit">{editingId ? "发布修改" : "布置任务"}</button>
        </div>
      </form>

      <div className="grid single">
        {visibleItems.map((task) => (
          <article key={task.id} className="card">
            <div className="card-header">
              <h3>{task.title}</h3>
            </div>
            <div className="inline-meta">
              <span>目标 {task.targetUserName || task.targetUserId}</span>
              <span>分配人 {task.assignedBy || "未知"}</span>
              <span>{new Date(task.updatedAt).toLocaleString()}</span>
            </div>
            <div className="card-body">
              <div className="content-gap">
                <MarkdownRenderer content={task.description} />
              </div>
              {task.report && (
                <div className="stack-tight">
                  <h4>最新报告</h4>
                  <MarkdownRenderer content={task.report} />
                </div>
              )}
            </div>
            <div className="card-actions">
              <button type="button" onClick={() => onEdit(task)}>编辑</button>
              <button type="button" onClick={() => onDelete(task)}>删除</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
