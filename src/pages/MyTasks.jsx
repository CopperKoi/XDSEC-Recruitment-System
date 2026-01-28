import React, { useEffect, useState } from "react";
import { listTasks, submitTaskReport } from "../api/tasks.js";
import { listUsers } from "../api/users.js";
import MarkdownRenderer from "../components/MarkdownRenderer.jsx";

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [report, setReport] = useState({});
  const [status, setStatus] = useState("");
  const [userMap, setUserMap] = useState({});

  const loadTasks = () => {
    listTasks({ scope: "mine" })
      .then((data) => setTasks(data.items || []))
      .catch(() => setStatus("任务加载失败。"));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    listUsers({})
      .then((data) => {
        const map = {};
        (data.items || []).forEach((user) => {
          map[user.id] = user.nickname || user.email || user.id;
        });
        setUserMap(map);
      })
      .catch(() => {});
  }, []);

  const submitReport = async (taskId) => {
    setStatus("");
    try {
      await submitTaskReport(taskId, { report: report[taskId] || "" });
      setStatus("报告已提交。");
      loadTasks();
    } catch (error) {
      setStatus(error.message || "提交报告失败。");
    }
  };

  return (
    <section>
      <h1>我的任务</h1>
      {status && <p className="hint">{status}</p>}
      {tasks.map((task) => (
        <article key={task.id} className="card">
          <h2>{task.title}</h2>
          <div className="meta">
            分配人 {userMap[task.assignedBy] || task.assignedBy} · {new Date(task.createdAt).toLocaleString()}
          </div>
          <MarkdownRenderer content={task.description} />
          <label className="full">
            报告（支持 Markdown）
            <textarea
              rows={5}
              value={report[task.id] || task.report || ""}
              onChange={(event) =>
                setReport((prev) => ({ ...prev, [task.id]: event.target.value }))
              }
            />
          </label>
          <button type="button" onClick={() => submitReport(task.id)}>提交报告</button>
          {task.report && (
            <>
              <h3>最新提交</h3>
              <MarkdownRenderer content={task.report} />
            </>
          )}
        </article>
      ))}
      {!tasks.length && <p>暂无任务。</p>}
    </section>
  );
}
