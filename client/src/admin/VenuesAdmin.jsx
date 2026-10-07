import { useEffect, useState } from "react";
import { adminVenues, saveVenue, deleteVenue } from "../api.js";
import MapPicker from "../MapPicker.jsx";
import { abbreviate } from "../util.js";
import LocateButton from "../LocateButton.jsx";

const STATUS_LABEL = { active: "Live", pending: "Needs review", hidden: "Hidden" };
const blank = (meta) => ({
  name: "", code: "", category: meta.categories[0]?.name || "Other", campus: meta.campuses[0]?.name || "",
  building: "", floor: "", capacity: "", directions: "", lat: "", lng: "", status: "active",
});

function VenueForm({ meta, venue, onSaved, onCancel }) {
  const [form, setForm] = useState(venue._id ? {
    ...venue, capacity: venue.capacity ?? "", lat: venue.lat ?? "", lng: venue.lng ?? "",
    code: venue.code || "", building: venue.building || "", floor: venue.floor || "", directions: venue.directions || "",
  } : venue);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const campus = meta.campuses.find((c) => c.name === form.campus);
  const center = campus && campus.lat != null ? [campus.lat, campus.lng] : undefined;

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { _id, views, createdAt, updatedAt, __v, ...data } = form;
      await saveVenue(_id, data);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <h2>{venue._id ? "Edit venue" : "Add a venue"}</h2>
      <div className="row">
        <label>Venue name<input required maxLength={120} value={form.name} onChange={set("name")} /></label>
        <label>Map label (short code)
          <input maxLength={8} value={form.code} onChange={set("code")} placeholder={abbreviate(form.name) || "CL2"} />
        </label>
      </div>
      <p className="hint">The short code appears on the map pin. Leave it blank to use the automatic one shown in grey.</p>
      <div className="row">
        <label>Type
          <select value={form.category} onChange={set("category")}>
            {meta.categories.map((c) => <option key={c._id}>{c.name}</option>)}
            {!meta.categories.some((c) => c.name === form.category) && <option>{form.category}</option>}
          </select>
        </label>
        <label>Campus
          <select required value={form.campus} onChange={set("campus")}>
            {meta.campuses.map((c) => <option key={c._id}>{c.name}</option>)}
            {!meta.campuses.some((c) => c.name === form.campus) && <option>{form.campus}</option>}
          </select>
        </label>
        <label>Status
          <select value={form.status} onChange={set("status")}>
            <option value="active">Live (students can see it)</option>
            <option value="pending">Needs review</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
      </div>
      <div className="row">
        <label>Building<input value={form.building} onChange={set("building")} /></label>
        <label>Floor<input value={form.floor} onChange={set("floor")} /></label>
        <label>Capacity<input type="number" min="0" value={form.capacity} onChange={set("capacity")} /></label>
      </div>
      <label>How to get there
        <textarea rows="3" maxLength={500} value={form.directions} onChange={set("directions")} />
      </label>

      <fieldset>
        <legend>Map location</legend>
        <p className="hint">Click the map to drop the pin, or type the coordinates.</p>
        <MapPicker key={form.campus} lat={form.lat} lng={form.lng} center={center}
          onChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))} />
        <div className="row">
          <label>Latitude<input type="number" step="any" value={form.lat} onChange={set("lat")} /></label>
          <label>Longitude<input type="number" step="any" value={form.lng} onChange={set("lng")} /></label>
          <LocateButton onFound={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))} />
          <button type="button" className="ghost self-end" onClick={() => setForm({ ...form, lat: "", lng: "" })}>Remove pin</button>
        </div>
      </fieldset>

      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
        <button disabled={saving}>{saving ? "Saving…" : "Save venue"}</button>
      </div>
    </form>
  );
}

export default function VenuesAdmin({ meta, initialStatus }) {
  const [venues, setVenues] = useState([]);
  const [status, setStatus] = useState(initialStatus || "");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      // "nopin" is a client-side filter: live venues without coordinates
      setVenues(await adminVenues({ status: status === "nopin" ? "active" : status, q }));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [status, q]);

  const shown = status === "nopin" ? venues.filter((v) => v.lat == null || v.lng == null) : venues;

  async function setVenueStatus(v, next) {
    try { await saveVenue(v._id, { status: next }); load(); } catch (err) { setError(err.message); }
  }
  async function remove(v) {
    if (!window.confirm(`Delete "${v.name}"? This cannot be undone.`)) return;
    try { await deleteVenue(v._id); load(); } catch (err) { setError(err.message); }
  }

  if (editing) {
    return <VenueForm meta={meta} venue={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />;
  }

  return (
    <div className="stack">
      <div className="bar">
        <div className="bar-actions grow">
          <input className="filter" type="search" placeholder="Search venues" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search venues" />
          <select className="filter" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="active">Live</option>
            <option value="pending">Needs review</option>
            <option value="hidden">Hidden</option>
            <option value="nopin">Live, no map pin</option>
          </select>
        </div>
        <button onClick={() => setEditing(blank(meta))}>Add a venue</button>
      </div>
      {error && <p className="error">{error}</p>}
      {!loading && shown.length === 0 && <p className="empty">No venues match this filter.</p>}
      <ul className="list">
        {shown.map((v) => (
          <li key={v._id} className="venue admin-row">
            <div className="grow">
              <div className="venue-head">
                <h2>{v.name} <span className="code">{v.code || abbreviate(v.name)}</span></h2>
                <span className={`badge ${v.status}`}>{STATUS_LABEL[v.status]}</span>
              </div>
              <p className="where">
                {[v.category, v.campus, v.building].filter(Boolean).join(", ")} ·{" "}
                {v.lat != null && v.lng != null ? "Pinned" : "No pin"} · {v.views} opens
              </p>
              {v.status === "pending" && v.directions && <p className="dir">{v.directions}</p>}
            </div>
            <div className="row-actions">
              {v.status === "pending" && <button onClick={() => setVenueStatus(v, "active")}>Approve</button>}
              {v.status === "active" && <button className="ghost" onClick={() => setVenueStatus(v, "hidden")}>Hide</button>}
              {v.status === "hidden" && <button className="ghost" onClick={() => setVenueStatus(v, "active")}>Show</button>}
              <button className="ghost" onClick={() => setEditing(v)}>Edit</button>
              <button className="danger" onClick={() => remove(v)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
