import React, { useEffect, useState } from "react";
import { listAnnouncements } from "../api/announcements.js";
import MarkdownRenderer from "../components/MarkdownRenderer.jsx";

export default function Announcements() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listAnnouncements()
      .then((data) => setItems(data.items || []))
      .catch(() => setError("Failed to load announcements."));
  }, []);

  return (
    <section>
      <h1>Announcements</h1>
      {error && <p className="error">{error}</p>}
      {items.map((item) => (
        <article key={item.id} className={`card ${item.pinned ? "pinned" : ""}`}>
          <h2>{item.title}</h2>
          <div className="meta">By {item.authorId} · {new Date(item.createdAt).toLocaleString()}</div>
          <MarkdownRenderer content={item.content} />
        </article>
      ))}
      {!items.length && !error && <p>No announcements yet.</p>}
    </section>
  );
}
