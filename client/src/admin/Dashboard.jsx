import { useEffect, useState } from "react";
import { adminStats } from "../api.js";

function Tile({ label, value, tone, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag className={`tile ${tone || ""}`} onClick={onClick}>
      <span className="num">{value}</span>
      <span>{label}</span>
    </Tag>
  );
}

function Bars({ rows, empty }) {
  if (!rows.length) return <p className="hint">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <ul className="bars">
      {rows.map((r) => (
        <li key={r._id}>
          <span className="bar-label">{r._id}</span>
          <span className="bar-track"><span style={{ width: `${(r.count / max) * 100}%` }} /></span>
          <span className="bar-count">{r.count}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard({ onOpen }) {
  const [s, setS] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminStats().then(setS).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!s) return <p className="hint">Loading…</p>;

  return (
    <div className="stack">
      <div className="tiles">
        <Tile label="Live venues" value={s.active} tone="green" />
        <Tile label="Waiting for review" value={s.pending} tone={s.pending ? "gold" : ""} onClick={() => onOpen("Venues", "pending")} />
        <Tile label="Live but no map pin" value={s.missingCoords} tone={s.missingCoords ? "red" : ""} onClick={() => onOpen("Venues", "nopin")} />
        <Tile label="Venue opens (all time)" value={s.totalViews} />
        <Tile label="Searches (30 days)" value={s.searches30d} />
        <Tile label="Hidden venues" value={s.hidden} onClick={() => onOpen("Venues", "hidden")} />
      </div>

      <div className="panels">
        <section className="panel">
          <h2>Searches with no results</h2>
          <p className="hint">Students looked for these and found nothing. Good candidates to add.</p>
          <Bars rows={s.noResults} empty="No missed searches in the last 30 days." />
        </section>
        <section className="panel">
          <h2>Top searches</h2>
          <Bars rows={s.topSearches} empty="No searches recorded yet." />
        </section>
        <section className="panel">
          <h2>Most opened venues</h2>
          {s.topViewed.length ? (
            <ul className="bars">
              {s.topViewed.map((v) => (
                <li key={v._id}>
                  <span className="bar-label">{v.name}</span>
                  <span className="bar-track"><span style={{ width: `${(v.views / s.topViewed[0].views) * 100}%` }} /></span>
                  <span className="bar-count">{v.views}</span>
                </li>
              ))}
            </ul>
          ) : <p className="hint">Counts appear when students open Maps links or map pins.</p>}
        </section>
        <section className="panel">
          <h2>Live venues by type</h2>
          <Bars rows={s.byCategory} empty="No venues yet." />
        </section>
        <section className="panel">
          <h2>Live venues by campus</h2>
          <Bars rows={s.byCampus} empty="No venues yet." />
        </section>
      </div>
    </div>
  );
}
