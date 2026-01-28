import React, { useEffect, useState } from "react";
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  pinAnnouncement,
  deleteAnnouncement
} from "../api/announcements.js";
import MarkdownRenderer from "../components/MarkdownRenderer.jsx";

export default function ManageAnnouncements() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", content: "" });
  const [editingId, setEditingId] = useState("");
  const [status, setStatus] = useState("");

  const load = () => {
    listAnnouncements()
      .then((data) => setItems(data.items || []))
      .catch(() => setStatus("公告加载失败。"));
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      if (editingId) {
        await updateAnnouncement(editingId, form);
      } else {
        await createAnnouncement(form);
      }
      setForm({ title: "", content: "" });
      setEditingId("");
      load();
    } catch (error) {
      setStatus(error.message || (editingId ? "更新公告失败。" : "创建公告失败。"));
    }
  };

  const onEdit = (item) => {
    setForm({ title: item.title || "", content: item.content || "" });
    setEditingId(item.id);
    setStatus("正在编辑公告，发布后将覆盖原内容。");
  };

  const onPin = async (id, pinned) => {
    setStatus("");
    try {
      await pinAnnouncement(id, pinned);
      load();
    } catch (error) {
      setStatus(error.message || "置顶设置失败。");
    }
  };

  const onDelete = async (id) => {
    setStatus("");
    try {
      await deleteAnnouncement(id);
      load();
    } catch (error) {
      setStatus(error.message || "删除公告失败。");
    }
  };

  return (
    <section>
      <h2>公告管理</h2>
      {status && <p className="hint">{status}</p>}
      <form className="form-card" onSubmit={onSubmit}>
        <label>
          标题
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
        </label>
        <label>
          内容（支持 Markdown）
          <textarea
            rows={5}
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
            required
          />
        </label>
        <button type="submit">{editingId ? "发布修改" : "发布"}</button>
      </form>

      <div className="grid two">
        {items.map((item) => (
          <article key={item.id} className={`card ${item.pinned ? "pinned" : ""}`}>
            <h3>{item.title}</h3>
            <div className="meta">发布人 {item.authorNickname || "未知"} · {new Date(item.updatedAt).toLocaleString()}</div>
            <MarkdownRenderer content={item.content} />
            <div className="row">
              <button type="button" onClick={() => onPin(item.id, !item.pinned)}>
                {item.pinned ? "取消置顶" : "置顶"}
              </button>
              <button type="button" onClick={() => onEdit(item)}>
                编辑
              </button>
              <button type="button" onClick={() => onDelete(item.id)}>
                删除
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
