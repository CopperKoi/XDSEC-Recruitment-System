import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import * as authApi from "../api/auth.js";
import { updateProfile } from "../api/users.js";

export default function Profile() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState({
    email: "",
    nickname: "",
    signature: "",
    emailCode: ""
  });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (user) {
      setProfile({
        email: user.email || "",
        nickname: user.nickname || "",
        signature: user.signature || "",
        emailCode: ""
      });
    }
  }, [user]);

  const sendCode = async () => {
    setStatus("Sending code...");
    try {
      await authApi.requestEmailCode({ email: profile.email, purpose: "profile" });
      setStatus("Code sent.");
    } catch (error) {
      setStatus(error.message || "Failed to send code.");
    }
  };
  const onSaveProfile = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      await updateProfile(profile);
      await refresh();
      setStatus("Profile updated.");
    } catch (error) {
      setStatus(error.message || "Failed to update profile.");
    }
  };

  const onChangePassword = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      await authApi.changePassword(passwordForm);
      setPasswordForm({ oldPassword: "", newPassword: "" });
      setStatus("Password updated.");
    } catch (error) {
      setStatus(error.message || "Failed to change password.");
    }
  };

  return (
    <section className="form-card">
      <h1>Profile</h1>
      {status && <p className="hint">{status}</p>}
      <form onSubmit={onSaveProfile}>
        <label>
          Email
          <input
            type="email"
            value={profile.email}
            onChange={(event) => setProfile({ ...profile, email: event.target.value })}
            required
          />
        </label>
        <div className="row">
          <label>
            Email Code
            <input
              value={profile.emailCode}
              onChange={(event) => setProfile({ ...profile, emailCode: event.target.value })}
              required
            />
          </label>
          <button type="button" onClick={sendCode} disabled={!profile.email}>
            Send Code
          </button>
        </div>
        <label>
          Nickname
          <input
            value={profile.nickname}
            onChange={(event) => setProfile({ ...profile, nickname: event.target.value })}
            required
          />
        </label>
        <label>
          Signature
          <input
            value={profile.signature}
            onChange={(event) => setProfile({ ...profile, signature: event.target.value })}
          />
        </label>
        <button type="submit">Save Profile</button>
      </form>

      <div className="divider" />

      <form onSubmit={onChangePassword}>
        <h2>Change Password</h2>
        <label>
          Old Password
          <input
            type="password"
            value={passwordForm.oldPassword}
            onChange={(event) => setPasswordForm({ ...passwordForm, oldPassword: event.target.value })}
            required
          />
        </label>
        <label>
          New Password
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
            required
          />
        </label>
        <button type="submit">Update Password</button>
      </form>
    </section>
  );
}
