import React, { useEffect, useState } from "react";
import { listAnnouncements, createAnnouncement, updateAnnouncement, pinAnnouncement } from "../api/announcements.js";
import MarkdownRenderer from "../components/MarkdownRenderer.jsx";

export default function ManageAnnouncements() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", content: "" });
  const [status, setStatus] = useState("");

  const load = () => {
    listAnnouncements()
      .then((data) => setItems(data.items || []))
      .catch(() => setStatus("Failed to load announcements."));
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      await createAnnouncement(form);
      setForm({ title: "", content: "" });
      load();
    } catch (error) {
      setStatus(error.message || "Failed to create announcement.");
    }
  };

  const onUpdate = async (id) => {
    setStatus("");
    try {
      await updateAnnouncement(id, form);
      setForm({ title: "", content: "" });
      load();
    } catch (error) {
      setStatus(error.message || "Failed to update announcement.");
    }
  };

  const onPin = async (id, pinned) => {
    setStatus("");
    try {
      await pinAnnouncement(id, pinned);
      load();
    } catch (error) {
      setStatus(error.message || "Failed to pin announcement.");
    }
  };

  return (
    <section>
      <h2>Manage Announcements</h2>
      {status && <p className="hint">{status}</p>}
      <form className="form-card" onSubmit={onCreate}>
        <label>
          Title
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
        </label>
        <label>
          Content (Markdown)
          <textarea
            rows={5}
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
            required
          />
        </label>
        <button type="submit">Publish</button>
      </form>

      <div className="grid two">
        {items.map((item) => (
          <article key={item.id} className={`card ${item.pinned ? "pinned" : ""}`}>
            <h3>{item.title}</h3>
            <div className="meta">By {item.authorId} · {new Date(item.updatedAt).toLocaleString()}</div>
            <MarkdownRenderer content={item.content} />
            <div className="row">
              <button type="button" onClick={() => onPin(item.id, !item.pinned)}>
                {item.pinned ? "Unpin" : "Pin"}
              </button>
              <button type="button" onClick={() => onUpdate(item.id)}>
                Update with form
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
