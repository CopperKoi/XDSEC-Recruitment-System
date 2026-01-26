import React, { useEffect, useState } from "react";
import { listUsers, updateRole, updatePassedDirections, deleteUser } from "../api/users.js";
import { gravatarUrl } from "../utils/gravatar.js";
import { updateApplicationStatus } from "../api/applications.js";
import MarkdownRenderer from "../components/MarkdownRenderer.jsx";

const STATUSES = [
  "r1_pending",
  "r1_passed",
  "r2_pending",
  "r2_passed",
  "rejected",
  "offer"
];
const DIRECTIONS = ["Web", "Pwn", "Reverse", "Crypto", "Misc", "Dev", "Art"];

export default function CandidateList() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("");
  const [passedInputs, setPassedInputs] = useState({});

  const load = () => {
    listUsers({ q: query, role: "interviewee" })
      .then((data) => setUsers(data.items || []))
      .catch(() => setStatus("Failed to load candidates."));
  };

  useEffect(() => {
    load();
  }, []);

  const onSearch = (event) => {
    event.preventDefault();
    load();
  };

  const promote = async (userId) => {
    setStatus("");
    try {
      await updateRole(userId, "interviewer");
      load();
    } catch (error) {
      setStatus(error.message || "Failed to update role.");
    }
  };

  const removeUser = async (userId) => {
    setStatus("");
    try {
      await deleteUser(userId);
      load();
    } catch (error) {
      setStatus(error.message || "Failed to delete user.");
    }
  };

  const updateStatus = async (userId, nextStatus) => {
    setStatus("");
    try {
      await updateApplicationStatus(userId, nextStatus);
      load();
    } catch (error) {
      setStatus(error.message || "Failed to update status.");
    }
  };

  const updatePassed = async (userId) => {
    setStatus("");
    const directions = passedInputs[userId] || [];
    try {
      await updatePassedDirections(userId, directions);
      setPassedInputs((prev) => ({ ...prev, [userId]: [] }));
      load();
    } catch (error) {
      setStatus(error.message || "Failed to update passed directions.");
    }
  };

  return (
    <section>
      <h2>Candidate List</h2>
      {status && <p className="hint">{status}</p>}
      <form className="row" onSubmit={onSearch}>
        <input
          placeholder="Search by email or nickname"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      <div className="grid two">
        {users.map((user) => (
          <article key={user.id} className="card">
            <header className="row">
              <div className="row">
                <img
                  className="avatar"
                  src={gravatarUrl(user.email, 72)}
                  alt={user.nickname || "avatar"}
                />
                <div>
                  <h3>{user.nickname || user.email}</h3>
                  <p className="meta">{user.email} · {user.status || "r1_pending"}</p>
                </div>
              </div>
              <button type="button" onClick={() => promote(user.id)}>Grant Interviewer</button>
              <button type="button" onClick={() => removeUser(user.id)}>Delete User</button>
            </header>
            {user.application && (
              <div className="panel">
                <p><strong>Real Name:</strong> {user.application.realName}</p>
                <p><strong>Phone:</strong> {user.application.phone}</p>
                <p><strong>Gender:</strong> {user.application.gender}</p>
                <p><strong>Department:</strong> {user.application.department}</p>
                <p><strong>Major:</strong> {user.application.major}</p>
                <p><strong>Student ID:</strong> {user.application.studentId}</p>
                <p><strong>Directions:</strong> {(user.application.directions || []).join(", ")}</p>
                <MarkdownRenderer content={user.application.resume || ""} />
              </div>
            )}
            <div className="panel">
              <p><strong>Passed Directions:</strong> {(user.passedDirections || []).join(", ") || "None"}</p>
              {user.passedDirectionsBy && user.passedDirectionsBy.length > 0 && (
                <p className="meta">Updated by {user.passedDirectionsBy.join(", ")}</p>
              )}
              <fieldset>
                <legend>Set passed directions</legend>
                <div className="tags">
                  {DIRECTIONS.map((direction) => (
                    <label key={direction} className="tag">
                      <input
                        type="checkbox"
                        checked={(passedInputs[user.id] || []).includes(direction)}
                        onChange={() =>
                          setPassedInputs((prev) => {
                            const current = prev[user.id] || [];
                            const next = current.includes(direction)
                              ? current.filter((item) => item !== direction)
                              : [...current, direction];
                            return { ...prev, [user.id]: next };
                          })
                        }
                      />
                      {direction}
                    </label>
                  ))}
                </div>
                <button type="button" onClick={() => updatePassed(user.id)}>
                  Update Passed
                </button>
              </fieldset>
            </div>
            <div className="row">
              <select
                value={user.status || "r1_pending"}
                onChange={(event) => updateStatus(user.id, event.target.value)}
              >
                {STATUSES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
