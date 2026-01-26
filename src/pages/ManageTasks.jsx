import React, { useEffect, useState } from "react";
import { listTasks, createTask, updateTask, deleteTask } from "../api/tasks.js";
import MarkdownRenderer from "../components/MarkdownRenderer.jsx";

export default function ManageTasks() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", targetUserId: "" });
  const [status, setStatus] = useState("");

  const load = () => {
    listTasks({ scope: "all" })
      .then((data) => setItems(data.items || []))
      .catch(() => setStatus("Failed to load tasks."));
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      await createTask(form);
      setForm({ title: "", description: "", targetUserId: "" });
      load();
    } catch (error) {
      setStatus(error.message || "Failed to create task.");
    }
  };

  const onUpdate = async (taskId) => {
    setStatus("");
    try {
      await updateTask(taskId, form);
      load();
    } catch (error) {
      setStatus(error.message || "Failed to update task.");
    }
  };

  const onDelete = async (taskId) => {
    setStatus("");
    try {
      await deleteTask(taskId);
      load();
    } catch (error) {
      setStatus(error.message || "Failed to delete task.");
    }
  };

  return (
    <section>
      <h2>Manage Tasks</h2>
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
          Target User ID
          <input
            value={form.targetUserId}
            onChange={(event) => setForm({ ...form, targetUserId: event.target.value })}
            required
          />
        </label>
        <label>
          Description (Markdown)
          <textarea
            rows={5}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            required
          />
        </label>
        <button type="submit">Assign Task</button>
      </form>

      <div className="grid two">
        {items.map((task) => (
          <article key={task.id} className="card">
            <h3>{task.title}</h3>
            <div className="meta">To {task.targetUserId} · {new Date(task.updatedAt).toLocaleString()}</div>
            <MarkdownRenderer content={task.description} />
            {task.report && (
              <>
                <h4>Latest Report</h4>
                <MarkdownRenderer content={task.report} />
              </>
            )}
            <button type="button" onClick={() => onUpdate(task.id)}>Update with form</button>
            <button type="button" onClick={() => onDelete(task.id)}>Delete</button>
          </article>
        ))}
      </div>
    </section>
  );
}
