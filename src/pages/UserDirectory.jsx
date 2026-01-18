import React, { useEffect, useState } from "react";
import { listUsers } from "../api/users.js";

export default function UserDirectory() {
  const [role, setRole] = useState("interviewee");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");

  const load = () => {
    listUsers({ role })
      .then((data) => setItems(data.items || []))
      .catch(() => setStatus("Failed to load users."));
  };

  useEffect(() => {
    load();
  }, [role]);

  return (
    <section>
      <h1>User Directory</h1>
      {status && <p className="hint">{status}</p>}
      <div className="row">
        <label>
          Role
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="interviewee">Interviewee</option>
            <option value="interviewer">Interviewer</option>
          </select>
        </label>
      </div>
      <div className="grid two">
        {items.map((user) => (
          <article key={user.id} className="card">
            <h3>{user.nickname || "Anonymous"}</h3>
            <p className="meta">{user.signature || "No signature"}</p>
            {user.directions && (
              <p>Directions: {(user.directions || []).join(", ")}</p>
            )}
            {user.passedDirections && (
              <p>Passed: {(user.passedDirections || []).join(", ")}</p>
            )}
            {user.status && <p>Status: {user.status}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
