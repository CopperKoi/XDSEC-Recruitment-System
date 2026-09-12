import React, { useEffect, useState } from "react";
import { submitApplication, getMyApplication, deleteMyApplication } from "../api/applications.js";
import MarkdownRenderer from "../components/MarkdownRenderer.jsx";

const DIRECTIONS = ["Web", "Pwn", "Reverse", "Crypto", "Misc", "Dev", "Art"];

export default function ApplicationForm() {
  const [form, setForm] = useState({
    realName: "",
    phone: "",
    gender: "",
    department: "",
    major: "",
    studentId: "",
    directions: [],
    resume: ""
  });
  const [status, setStatus] = useState("");
  const [step, setStep] = useState("basic");

  useEffect(() => {
    getMyApplication()
      .then((data) => {
        if (data.application) {
          setForm({ ...data.application });
        }
      })
      .catch(() => {});
  }, []);

  const toggleDirection = (value) => {
    setForm((prev) => {
      const next = prev.directions.includes(value)
        ? prev.directions.filter((item) => item !== value)
        : [...prev.directions, value];
      return { ...prev, directions: next };
    });
  };

  const goToDirections = (event) => {
    if (!event.currentTarget.form.reportValidity()) {
      return;
    }
    setStep("directions");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    if (form.directions.length === 0) {
      setStatus("请至少选择一个面试方向后再提交。");
      setStep("directions");
      return;
    }
    try {
      await submitApplication(form);
      setStatus("申请已提交。");
    } catch (error) {
      setStatus(error.message || "提交失败。");
    }
  };

  const onDelete = async () => {
    setStatus("");
    if (!window.confirm("确定删除申请吗？此操作不可恢复。")) {
      return;
    }
    try {
      await deleteMyApplication();
      setForm({
        realName: "",
        phone: "",
        gender: "",
        department: "",
        major: "",
        studentId: "",
        directions: [],
        resume: ""
      });
      setStatus("申请已删除。");
    } catch (error) {
      setStatus(error.message || "删除失败。");
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div className="stack-tight">
          <h1 className="page-title">面试申请</h1>
          <p className="page-subtitle">填写你的基础信息与方向偏好，简历可用 Markdown。</p>
        </div>
      </div>
      <section className="card profile-shell">
        {status && <p className="hint">{status}</p>}
        <div className="profile-layout">
          <aside className="profile-nav nav-static">
            <button
              type="button"
              className={`nav-item ${step === "basic" ? "is-active" : ""}`}
              onClick={() => setStep("basic")}
            >
              基础资料
            </button>
            <button
              type="button"
              className={`nav-item ${step === "directions" ? "is-active" : ""}`}
              onClick={() => setStep("directions")}
            >
              方向选择
            </button>
          </aside>
          <div className="profile-panel">
            <form className="grid" onSubmit={onSubmit}>
              {step === "basic" && (
                <>
                  <label>
                    姓名
                    <input
                      value={form.realName}
                      onChange={(event) => setForm({ ...form, realName: event.target.value })}
                      required
                    />
                  </label>
                  <label>
                    手机号
                    <input
                      value={form.phone}
                      onChange={(event) => setForm({ ...form, phone: event.target.value })}
                      required
                    />
                  </label>
                  <fieldset>
                    <legend>性别</legend>
                    <div className="row radio-row">
                      <label>
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={form.gender === "male"}
                          onChange={(event) => setForm({ ...form, gender: event.target.value })}
                          required
                        />
                        男
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={form.gender === "female"}
                          onChange={(event) => setForm({ ...form, gender: event.target.value })}
                          required
                        />
                        女
                      </label>
                    </div>
                  </fieldset>
                  <label>
                    院系
                    <input
                      value={form.department}
                      onChange={(event) => setForm({ ...form, department: event.target.value })}
                      required
                    />
                  </label>
                  <label>
                    专业
                    <input
                      value={form.major}
                      onChange={(event) => setForm({ ...form, major: event.target.value })}
                      required
                    />
                  </label>
                  <label>
                    学号
                    <input
                      value={form.studentId}
                      onChange={(event) => setForm({ ...form, studentId: event.target.value })}
                      required
                    />
                  </label>
                </>
              )}

              {step === "directions" && (
                <>
                  <p className="hint full">
                    基础资料已填写完成，请在下方选择面试方向并填写简历，之后点击“提交申请”完成投递。
                  </p>
                  <fieldset>
                    <legend>面试方向（可多选）</legend>
                    <div className="tags">
                      {DIRECTIONS.map((direction) => (
                        <label key={direction} className="tag">
                          <input
                            type="checkbox"
                            checked={form.directions.includes(direction)}
                            onChange={() => toggleDirection(direction)}
                          />
                          {direction}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label className="full">
                    简历（支持 Markdown，可选）
                    <span className="hint">可填写个人经历、技能与项目作品，下方会实时预览效果。</span>
                    <textarea
                      rows={6}
                      value={form.resume || ""}
                      onChange={(event) => setForm({ ...form, resume: event.target.value })}
                    />
                  </label>
                  <div className="divider" />
                  <MarkdownRenderer content={form.resume} />
                </>
              )}
              <div className="form-actions">
                {step === "basic" ? (
                  <button type="button" onClick={goToDirections}>
                    下一步：填写方向与简历
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={() => setStep("basic")}>
                      上一步
                    </button>
                    <button type="submit" disabled={form.directions.length === 0}>
                      提交申请
                    </button>
                    <button type="button" onClick={onDelete}>
                      删除我的申请
                    </button>
                    {form.directions.length === 0 && (
                      <span className="hint">请先选择至少一个面试方向</span>
                    )}
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </section>
  );
}
