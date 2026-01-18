import React, { useState } from "react";
import { Link } from "react-router-dom";
import * as authApi from "../api/auth.js";

export default function ForgotPassword() {
  const [form, setForm] = useState({ email: "", emailCode: "", newPassword: "" });
  const [status, setStatus] = useState({ loading: false, message: "" });

  const sendCode = async () => {
    setStatus({ loading: true, message: "Sending code..." });
    try {
      await authApi.requestEmailCode({ email: form.email, purpose: "reset" });
      setStatus({ loading: false, message: "Code sent. Check your email." });
    } catch (error) {
      setStatus({ loading: false, message: error.message || "Failed to send code." });
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, message: "" });
    try {
      await authApi.resetPassword(form);
      setStatus({ loading: false, message: "Password updated. Please login." });
    } catch (error) {
      setStatus({ loading: false, message: error.message || "Reset failed." });
    }
  };

  return (
    <section className="form-card">
      <h1>Reset Password</h1>
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
          New Password
          <input
            type="password"
            value={form.newPassword}
            onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
            required
          />
        </label>
        <button type="submit" disabled={status.loading}>Update Password</button>
      </form>
      <div className="form-footer">
        <Link to="/login">Back to login</Link>
      </div>
    </section>
  );
}
