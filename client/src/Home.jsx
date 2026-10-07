import { useEffect, useRef, useState } from "react";
import { getMeta, getVenues, trackView, logSearch } from "./api.js";
import MapView from "./MapView.jsx";
import SuggestForm from "./SuggestForm.jsx";
import { pinLabel } from "./util.js";

export function Brand({ children }) {
  return (
    <div className="brand">
      <img src="/logo.svg" alt="UnzaConnectme logo" />
      <div>{children}</div>
    </div>
  );
}

function mapsLink(v) {
  if (v.lat != null && v.lng != null) return `https://www.google.com/maps?q=${v.lat},${v.lng}`;
  return `https://www.google.com/maps/search/${encodeURIComponent(`${v.name} University of Zambia ${v.campus}`)}`;
}

export default function Home() {
  const [meta, setMeta] = useState({ campuses: [], categories: [] });
  const [venues, setVenues] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [campus, setCampus] = useState("");
  const [view, setView] = useState("list");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const lastLogged = useRef("");

  useEffect(() => {
    getMeta().then(setMeta).catch(() => {});
  }, []);

  // debounce so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        setVenues(await getVenues({ q, category, campus }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, category, campus]);

  // record what students look for once they pause, so admins can see what's missing
  useEffect(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2 || loading || term === lastLogged.current) return;
    const t = setTimeout(() => {
      lastLogged.current = term;
      logSearch(term, venues.length);
    }, 1200);
    return () => clearTimeout(t);
  }, [q, venues, loading]);

  const mappable = venues.filter((v) => v.lat != null && v.lng != null).length;

  return (
    <div className="page">
      <header className="top">
        <Brand>
          <h1>UnzaConnectme</h1>
          <p>Find lecture theatres, labs and everything else at UNZA.</p>
        </Brand>
        <input
          className="search" type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search a venue, building or landmark" aria-label="Search venues"
        />
        <div className="chips" role="group" aria-label="Filter by type">
          <button className={!category ? "chip on" : "chip"} onClick={() => setCategory("")}>All</button>
          {meta.categories.map((c) => (
            <button key={c._id} className={category === c.name ? "chip on" : "chip"} onClick={() => setCategory(c.name)}>
              {c.name}
            </button>
          ))}
        </div>
        {meta.campuses.length > 1 && (
          <div className="chips" role="group" aria-label="Filter by campus">
            <button className={!campus ? "chip on" : "chip"} onClick={() => setCampus("")}>Both campuses</button>
            {meta.campuses.map((c) => (
              <button key={c._id} className={campus === c.name ? "chip on" : "chip"} onClick={() => setCampus(c.name)}>
                {c.name}
              </button>
            ))}
          </div>
        )}
      </header>

      <main>
        {suggesting ? (
          <SuggestForm meta={meta} onDone={() => setSuggesting(false)} />
        ) : (
          <>
            <div className="bar">
              <span>{loading ? "Searching…" : `${venues.length} venue${venues.length === 1 ? "" : "s"}`}</span>
              <div className="bar-actions">
                <div className="seg" role="group" aria-label="Choose view">
                  <button className={view === "list" ? "on" : ""} onClick={() => setView("list")}>List</button>
                  <button className={view === "map" ? "on" : ""} onClick={() => setView("map")}>Map</button>
                </div>
                <button className="ghost" onClick={() => setSuggesting(true)}>Suggest a venue</button>
              </div>
            </div>
            {error && <p className="error">{error}. Check that the API is running.</p>}
            {!loading && !error && venues.length === 0 && (
              <p className="empty">No venues match. Try a shorter search, or suggest this venue so it can be added.</p>
            )}

            {view === "map" ? (
              <>
                <MapView venues={venues} campuses={meta.campuses} onViewVenue={(v) => trackView(v._id)} />
                {mappable < venues.length && (
                  <p className="hint">{venues.length - mappable} venue(s) have no map pin yet. They show in the list view.</p>
                )}
              </>
            ) : (
              <ul className="list">
                {venues.map((v) => (
                  <li key={v._id} className="venue">
                    <div className="venue-head">
                      <h2>{v.name} <span className="code">{pinLabel(v)}</span></h2>
                      <span className="tag">{v.category}</span>
                    </div>
                    <p className="where">
                      {[v.campus, v.building, v.floor && `${v.floor} floor`].filter(Boolean).join(", ")}
                    </p>
                    {v.directions && <p className="dir">{v.directions}</p>}
                    <div className="venue-foot">
                      {v.capacity ? <span>Seats {v.capacity}</span> : <span />}
                      <a href={mapsLink(v)} target="_blank" rel="noreferrer" onClick={() => trackView(v._id)}>
                        Open in Maps
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}
