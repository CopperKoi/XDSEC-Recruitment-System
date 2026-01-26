import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as authApi from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [form, setForm] = useState({
    password: "",
    email: "",
    nickname: "",
    signature: "",
    emailCode: ""
  });
  const [status, setStatus] = useState({ loading: false, message: "" });

  const sendCode = async () => {
    setStatus({ loading: true, message: "Sending code..." });
    try {
      await authApi.requestEmailCode({ email: form.email, purpose: "register" });
      setStatus({ loading: false, message: "Code sent. Check your email." });
    } catch (error) {
      setStatus({ loading: false, message: error.message || "Failed to send code." });
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, message: "" });
    try {
      await authApi.register(form);
      await refresh();
      navigate("/login");
    } catch (error) {
      setStatus({ loading: false, message: error.message || "Registration failed." });
    }
  };

  return (
    <section className="form-card">
      <h1>Register</h1>
      {status.message && <p className="hint">{status.message}</p>}
      <form onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>
        <div className="row">
          <label>
            Email Code
            <input
              value={form.emailCode}
              onChange={(event) => setForm({ ...form, emailCode: event.target.value })}
              required
            />
          </label>
          <button type="button" onClick={sendCode} disabled={!form.email || status.loading}>
            Send Code
          </button>
        </div>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        <label>
          Nickname
          <input
            value={form.nickname}
            onChange={(event) => setForm({ ...form, nickname: event.target.value })}
            required
          />
        </label>
        <label>
          Signature
          <input
            value={form.signature}
            onChange={(event) => setForm({ ...form, signature: event.target.value })}
            required
          />
        </label>
        <button type="submit" disabled={status.loading}>Register</button>
      </form>
      <div className="form-footer">
        <Link to="/login">Already have an account?</Link>
      </div>
    </section>
  );
}
