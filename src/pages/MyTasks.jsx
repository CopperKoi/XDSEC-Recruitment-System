import React, { useEffect, useState } from "react";
import { listTasks, submitTaskReport } from "../api/tasks.js";
import MarkdownRenderer from "../components/MarkdownRenderer.jsx";

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [report, setReport] = useState({});
  const [status, setStatus] = useState("");

  const loadTasks = () => {
    listTasks({ scope: "mine" })
      .then((data) => setTasks(data.items || []))
      .catch(() => setStatus("Failed to load tasks."));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const submitReport = async (taskId) => {
    setStatus("");
    try {
      await submitTaskReport(taskId, { report: report[taskId] || "" });
      setStatus("Report submitted.");
      loadTasks();
    } catch (error) {
      setStatus(error.message || "Failed to submit report.");
    }
  };

  return (
    <section>
      <h1>My Tasks</h1>
      {status && <p className="hint">{status}</p>}
      {tasks.map((task) => (
        <article key={task.id} className="card">
          <h2>{task.title}</h2>
          <div className="meta">Assigned by {task.assignedBy} · {new Date(task.createdAt).toLocaleString()}</div>
          <MarkdownRenderer content={task.description} />
          <label className="full">
            Report (Markdown)
            <textarea
              rows={5}
              value={report[task.id] || task.report || ""}
              onChange={(event) =>
                setReport((prev) => ({ ...prev, [task.id]: event.target.value }))
              }
            />
          </label>
          <button type="button" onClick={() => submitReport(task.id)}>Submit Report</button>
          {task.report && (
            <>
              <h3>Last Submission</h3>
              <MarkdownRenderer content={task.report} />
            </>
          )}
        </article>
      ))}
      {!tasks.length && <p>No tasks assigned yet.</p>}
    </section>
  );
}
