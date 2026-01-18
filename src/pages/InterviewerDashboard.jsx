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
      </div>
      <Outlet />
    </section>
  );
}
