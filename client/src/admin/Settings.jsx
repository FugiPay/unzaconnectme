import { useState } from "react";
import { saveCampus, deleteCampus, addCategory, deleteCategory } from "../api.js";
import MapPicker from "../MapPicker.jsx";
import LocateButton from "../LocateButton.jsx";

function CampusForm({ campus, onSaved, onCancel }) {
  const [form, setForm] = useState({ name: campus.name || "", lat: campus.lat ?? "", lng: campus.lng ?? "" });
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    try {
      await saveCampus(campus._id, form);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <form className="form" onSubmit={submit}>
      <h2>{campus._id ? "Edit campus" : "Add a campus"}</h2>
      <label>Campus name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <fieldset>
        <legend>Map centre</legend>
        <p className="hint">The map opens here when no venue pins are showing.</p>
        <MapPicker lat={form.lat} lng={form.lng} onChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))} />
        <div className="row">
          <label>Latitude<input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} /></label>
          <label>Longitude<input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} /></label>
          <LocateButton onFound={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))} />
        </div>
      </fieldset>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
        <button>Save campus</button>
      </div>
    </form>
  );
}

export default function Settings({ meta, onChange }) {
  const [editing, setEditing] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");

  const run = async (fn) => {
    try { setError(""); await fn(); onChange(); } catch (err) { setError(err.message); }
  };

  if (editing) {
    return <CampusForm campus={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); onChange(); }} />;
  }

  return (
    <div className="stack">
      {error && <p className="error">{error}</p>}
      <section className="panel">
        <div className="bar">
          <h2>Campuses</h2>
          <button onClick={() => setEditing({})}>Add a campus</button>
        </div>
        <ul className="plain">
          {meta.campuses.map((c) => (
            <li key={c._id}>
              <span className="grow">{c.name} <span className="hint">{c.lat != null ? "map centre set" : "no map centre"}</span></span>
              <button className="ghost" onClick={() => setEditing(c)}>Edit</button>
              <button className="danger" onClick={() => window.confirm(`Delete ${c.name}?`) && run(() => deleteCampus(c._id))}>Delete</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Venue types</h2>
        <form className="inline" onSubmit={(e) => { e.preventDefault(); run(async () => { await addCategory(newCategory); setNewCategory(""); }); }}>
          <input required value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New type, e.g. Chapel" aria-label="New venue type" />
          <button>Add type</button>
        </form>
        <ul className="plain">
          {meta.categories.map((c) => (
            <li key={c._id}>
              <span className="grow">{c.name}</span>
              <button className="danger" onClick={() => window.confirm(`Delete ${c.name}?`) && run(() => deleteCategory(c._id))}>Delete</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
