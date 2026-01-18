import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app">
      <header className="nav">
        <div className="nav-left">
          <Link to="/">XDSEC 招新</Link>
          <Link to="/announcements">Announcements</Link>
          {user && <Link to="/profile">Profile</Link>}
          {user && <Link to="/directory">Directory</Link>}
          {user?.role === "interviewee" && <Link to="/application">Apply</Link>}
          {user?.role === "interviewee" && <Link to="/tasks">My Tasks</Link>}
          {user?.role === "interviewer" && <Link to="/interviewer">Interviewer</Link>}
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <span className="role">{user.role}</span>
              <button type="button" onClick={logout} className="link-button">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}
