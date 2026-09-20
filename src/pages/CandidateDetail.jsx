import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { gravatarUrl } from "../utils/gravatar.js";
import { listUsers, updateRole, updatePassedDirections, deleteUser, getUser } from "../api/users.js";
import { updateApplicationStatus } from "../api/applications.js";
import { createComment, deleteComment, listComments, updateComment } from "../api/comments.js";
import { listTasks } from "../api/tasks.js";
import MarkdownRenderer from "../components/MarkdownRenderer.jsx";

const STATUSES = [
  "r1_pending",
  "r1_passed",
  "r2_pending",
  "r2_passed",
  "rejected",
  "offer"
];
const STATUS_LABELS = {
  r1_pending: "一轮待定",
  r1_passed: "一轮通过",
  r2_pending: "二轮待定",
  r2_passed: "二轮通过",
  rejected: "已拒绝",
  offer: "已录取"
};
const DIRECTIONS = ["Web", "Pwn", "Reverse", "Crypto", "Misc", "Dev", "Art"];

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("");
  const [passedInputs, setPassedInputs] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [showTasks, setShowTasks] = useState(false);
  const [showApplication, setShowApplication] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const onCardExpand = (event, isOpen, setter) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest("button, a, input, textarea, select, label")) {
      return;
    }
    if (!isOpen) {
      setter(true);
    }
  };

  const displayDirections = useMemo(() => {
    if (!user) return [];
    return user.application?.directions || user.directions || [];
  }, [user]);

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const load = async () => {
    try {
      const [detail, commentData, taskData] = await Promise.all([
        getUser(id),
        listComments(id),
        listTasks({ scope: "all" })
      ]);
      setUser(detail);
      setComments(commentData.items || []);
      const allTasks = taskData.items || [];
      setTasks(allTasks.filter((task) => task.targetUserId === id));
      setPassedInputs(detail.passedDirections || []);
    } catch (error) {
      setStatus(error.message || "候选人详情加载失败。");
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const promote = async () => {
    setStatus("");
    if (!window.confirm("确定将该用户设为面试官吗？此操作不可恢复。")) {
      return;
    }
    try {
      await updateRole(id, "interviewer");
      await load();
    } catch (error) {
      setStatus(error.message || "设置面试官失败。");
    }
  };

  const removeUser = async () => {
    setStatus("");
    if (!window.confirm("确定删除该面试者吗？此操作不可恢复。")) {
      return;
    }
    try {
      await deleteUser(id);
      navigate("/interviewer/candidates");
    } catch (error) {
      setStatus(error.message || "删除用户失败。");
    }
  };

  const updateStatus = async (nextStatus) => {
    setStatus("");
    try {
      await updateApplicationStatus(id, nextStatus);
      await load();
    } catch (error) {
      setStatus(error.message || "更新面试状态失败。");
    }
  };

  const updatePassed = async () => {
    setStatus("");
    if (!window.confirm("一旦提交，无法修改。确认提交通过方向吗？")) {
      return;
    }
    try {
      await updatePassedDirections(id, passedInputs);
      await load();
    } catch (error) {
      setStatus(error.message || "更新通过方向失败。");
    }
  };

  const submitComment = async () => {
    const content = commentInput.trim();
    if (!content) {
      setStatus("评论内容不能为空。");
      return;
    }
    try {
      await createComment({ intervieweeId: id, content });
      setCommentInput("");
      await load();
    } catch (error) {
      setStatus(error.message || "提交评论失败。");
    }
  };

  const canManageComment = (comment) =>
    currentUser?.role === "interviewer" && currentUser?.id === comment.interviewerId;

  const onEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content || "");
  };

  const onSaveComment = async () => {
    if (!editingCommentId) return;
    const content = editingContent.trim();
    if (!content) {
      setStatus("评论内容不能为空。");
      return;
    }
    try {
      await updateComment(editingCommentId, { content });
      setEditingCommentId("");
      setEditingContent("");
      await load();
    } catch (error) {
      setStatus(error.message || "更新评论失败。");
    }
  };

  const onDeleteComment = async (commentId) => {
    if (!window.confirm("确定删除该评论吗？此操作不可恢复。")) {
      return;
    }
    try {
      await deleteComment(commentId);
      await load();
    } catch (error) {
      setStatus(error.message || "删除评论失败。");
    }
  };

  if (!user) {
    return (
      <section className="page">
        <div className="page-header">
          <div className="stack-tight">
            <h2 className="page-title">候选人详情</h2>
            <p className="page-subtitle">正在加载候选人资料与进度。</p>
          </div>
          <div className="page-actions">
            <Link to="/interviewer/candidates" className="link-button">返回候选人列表</Link>
          </div>
        </div>
        <p className="hint">正在加载候选人详情...</p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div className="stack-tight">
          <h2 className="page-title">候选人详情</h2>
          <p className="page-subtitle">管理面试状态、通过方向与任务进度。</p>
        </div>
        <div className="page-actions">
          <Link to="/interviewer/candidates" className="link-button">返回候选人列表</Link>
        </div>
      </div>
      {status && <p className="hint">{status}</p>}

      <div className="grid single">
        <article className="card" onClick={(event) => onCardExpand(event, showTasks, setShowTasks)}>
          <div className="card-header">
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
          </div>
          <div className="card-body info-row">
            <div className="candidate-meta">
              <p className="status-line">
                面试状态：
                <select
                  value={user.status || "r1_pending"}
                  onChange={(event) => updateStatus(event.target.value)}
                >
                  {STATUSES.map((item) => (
                    <option key={item} value={item}>{STATUS_LABELS[item]}</option>
                  ))}
                </select>
              </p>
              <p>方向：{displayDirections.join(", ") || "暂无"}</p>
              <p>通过方向：{(user.passedDirections || []).join(", ") || "暂无"}</p>
            </div>
            <div className="status-actions">
              <div className="action-row">
                {user.role === "interviewee" && (
                  <button type="button" className="nowrap" onClick={promote}>设为面试官</button>
                )}
                <button type="button" className="nowrap" onClick={removeUser}>删除用户</button>
              </div>
            </div>
          </div>
        </article>

        <article className="card" onClick={(event) => onCardExpand(event, showTasks, setShowTasks)}>
          <div className="card-header">
            <h3>设置通过方向</h3>
          </div>
          {user.passedDirectionsBy && user.passedDirectionsBy.length > 0 && (
            <p className="meta">更新人：{user.passedDirectionsBy.join(", ")}</p>
          )}
          <div className="card-body">
            <div className="tags">
              {DIRECTIONS.map((direction) => (
                <label key={direction} className="tag">
                  <input
                    type="checkbox"
                    checked={passedInputs.includes(direction)}
                    onChange={() =>
                      setPassedInputs((prev) => {
                        const current = prev || [];
                        const next = current.includes(direction)
                          ? current.filter((item) => item !== direction)
                          : [...current, direction];
                        return next;
                      })
                    }
                  />
                  {direction}
                </label>
              ))}
            </div>
            <div className="form-actions align-right">
              <button type="button" onClick={updatePassed}>提交通过方向</button>
            </div>
          </div>
        </article>

        <article className="card" onClick={(event) => onCardExpand(event, showTasks, setShowTasks)}>
          <div className="card-header">
            <h3>任务完成信息</h3>
            <button type="button" onClick={() => setShowTasks((prev) => !prev)}>
              {showTasks ? "收起" : "展开"}
            </button>
          </div>
          {showTasks && (
            <>
              <div className="content-gap-lg">
                <Link to={`/interviewer/tasks?targetUserId=${id}`} className="link-button">去布置任务</Link>
              </div>
              {tasks.length === 0 ? (
                <p className="meta">暂无任务。</p>
              ) : (
                tasks.map((task, index) => (
                  <React.Fragment key={task.id}>
                    {index > 0 && <div className="divider" />}
                    <div className="panel">
                      <h4>{task.title}</h4>
                      <p className="meta">更新时间 {formatDate(task.updatedAt || task.createdAt)}</p>
                      <div className="content-gap">
                        <MarkdownRenderer content={task.description || ""} />
                      </div>
                      {task.report && (
                        <>
                          <p className="meta">任务报告</p>
                          <MarkdownRenderer content={task.report} />
                        </>
                      )}
                    </div>
                  </React.Fragment>
                ))
              )}
            </>
          )}
        </article>

        {user.application && (
          <article className="card" onClick={(event) => onCardExpand(event, showApplication, setShowApplication)}>
            <div className="card-header">
              <h3>个人介绍与报名信息</h3>
              <button
                type="button"
                onClick={() => setShowApplication((prev) => !prev)}
              >
                {showApplication ? "收起" : "展开"}
              </button>
            </div>
            {showApplication && (
              <div className="card-body">
                <div className="content-gap" />
                <p><strong>姓名：</strong> {user.application.realName}</p>
                <p><strong>手机号：</strong> {user.application.phone}</p>
                <p><strong>性别：</strong> {user.application.gender === "male" ? "男" : "女"}</p>
                <p><strong>院系：</strong> {user.application.department}</p>
                <p><strong>专业：</strong> {user.application.major}</p>
                <p><strong>学号：</strong> {user.application.studentId}</p>
                <p><strong>方向：</strong> {(user.application.directions || []).join(", ")}</p>
                <div className="divider" />
                <MarkdownRenderer content={user.application.resume || ""} />
              </div>
            )}
          </article>
        )}

        <article className="card" onClick={(event) => onCardExpand(event, showComments, setShowComments)}>
          <div className="card-header">
            <h3>评论</h3>
            <button type="button" onClick={() => setShowComments((prev) => !prev)}>
              {showComments ? "收起" : "展开"}
            </button>
          </div>
          {showComments && (
            <>
              <div className="content-gap" />
              {comments.length > 0 ? (
                comments.map((comment, index) => (
                  <div key={comment.id}>
                    <div className="panel">
                      {editingCommentId === comment.id ? (
                        <>
                          <textarea
                            rows={3}
                            value={editingContent}
                            onChange={(event) => setEditingContent(event.target.value)}
                          />
                          <div className="row">
                            <button type="button" onClick={onSaveComment}>保存修改</button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId("");
                                setEditingContent("");
                              }}
                            >
                              取消
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <MarkdownRenderer content={comment.content || ""} />
                          <p className="meta">
                            {comment.interviewerName || "面试官"} · {formatDate(comment.updatedAt || comment.createdAt)}
                          </p>
                          {canManageComment(comment) && (
                            <div className="card-actions">
                              <button type="button" onClick={() => onEditComment(comment)}>编辑</button>
                              <button type="button" onClick={() => onDeleteComment(comment.id)}>删除</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {index < comments.length - 1 && <div className="divider" />}
                  </div>
                ))
              ) : (
                <p className="meta">暂无评论</p>
              )}
            <div className="divider" />
            <div className="stack">
              <textarea
                rows={3}
                placeholder="写下评价或备注"
                value={commentInput}
                onChange={(event) => setCommentInput(event.target.value)}
              />
              <div className="form-actions">
                <button type="button" onClick={submitComment}>提交评论</button>
              </div>
            </div>
          </>
        )}
      </article>
      </div>
    </section>
  );
}
