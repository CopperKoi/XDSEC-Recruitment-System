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

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      await submitApplication(form);
      setStatus("Application submitted.");
    } catch (error) {
      setStatus(error.message || "Submission failed.");
    }
  };

  const onDelete = async () => {
    setStatus("");
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
      setStatus("Application deleted.");
    } catch (error) {
      setStatus(error.message || "Delete failed.");
    }
  };

  return (
    <section>
      <h1>Interview Application</h1>
      {status && <p className="hint">{status}</p>}
      <form className="grid" onSubmit={onSubmit}>
        <label>
          Real Name
          <input
            value={form.realName}
            onChange={(event) => setForm({ ...form, realName: event.target.value })}
            required
          />
        </label>
        <label>
          Phone
          <input
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            required
          />
        </label>
        <label>
          Gender
          <input
            value={form.gender}
            onChange={(event) => setForm({ ...form, gender: event.target.value })}
            required
          />
        </label>
        <label>
          Department
          <input
            value={form.department}
            onChange={(event) => setForm({ ...form, department: event.target.value })}
            required
          />
        </label>
        <label>
          Major
          <input
            value={form.major}
            onChange={(event) => setForm({ ...form, major: event.target.value })}
            required
          />
        </label>
        <label>
          Student ID
          <input
            value={form.studentId}
            onChange={(event) => setForm({ ...form, studentId: event.target.value })}
            required
          />
        </label>
        <fieldset>
          <legend>Interview Direction (multi-select)</legend>
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
          Resume (Markdown optional)
          <textarea
            rows={6}
            value={form.resume || ""}
            onChange={(event) => setForm({ ...form, resume: event.target.value })}
          />
        </label>
        <button type="submit">Submit Application</button>
        <button type="button" onClick={onDelete}>Delete My Application</button>
      </form>
      <div className="divider" />
      <h2>Resume Preview</h2>
      <MarkdownRenderer content={form.resume} />
    </section>
  );
}
