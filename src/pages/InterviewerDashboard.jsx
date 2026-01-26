import React from "react";
import { Link, Outlet } from "react-router-dom";

export default function InterviewerDashboard() {
  return (
    <section>
      <h1>Interviewer Console</h1>
      <div className="subnav">
        <Link to="announcements">Announcements</Link>
        <Link to="candidates">Candidates</Link>
        <Link to="tasks">Tasks</Link>
        <a href="/api/v2/export/applications" target="_blank" rel="noreferrer">
          Export Applications
        </a>
      </div>
      <Outlet />
    </section>
  );
}
