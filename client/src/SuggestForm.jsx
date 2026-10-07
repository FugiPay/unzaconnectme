import { useState } from "react";
import { suggestVenue } from "./api.js";
import MapPicker from "./MapPicker.jsx";

export default function SuggestForm({ meta, onDone }) {
  const [form, setForm] = useState({
    name: "",
    category: meta.categories[0]?.name || "Other",
    campus: meta.campuses[0]?.name || "",
    building: "", floor: "", capacity: "", directions: "", lat: "", lng: "",
  });
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const campus = meta.campuses.find((c) => c.name === form.campus);
  const center = campus && campus.lat != null ? [campus.lat, campus.lng] : undefined;

  function useMyLocation() {
    if (!navigator.geolocation) return setError("Your browser can't share its location. Tap the map instead.");
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) }));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Couldn't get your location. Tap the map to place the pin instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await suggestVenue(form);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (sent) {
    return (
      <div className="form">
        <h2>Thanks, we got it</h2>
        <p>An admin will check this venue and add it to the map.</p>
        <div className="actions"><button onClick={onDone}>Back to search</button></div>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit}>
      <h2>Suggest a venue</h2>
      <p className="hint">Can't find a place? Tell us where it is. An admin reviews it before it goes live.</p>
      <label>Venue name
        <input required maxLength={120} value={form.name} onChange={set("name")} placeholder="Lecture Theatre 3" />
      </label>
      <div className="row">
        <label>Type
          <select value={form.category} onChange={set("category")}>
            {meta.categories.map((c) => <option key={c._id}>{c.name}</option>)}
          </select>
        </label>
        <label>Campus
          <select required value={form.campus} onChange={set("campus")}>
            {meta.campuses.map((c) => <option key={c._id}>{c.name}</option>)}
          </select>
        </label>
      </div>
      <div className="row">
        <label>Building<input value={form.building} onChange={set("building")} /></label>
        <label>Floor<input value={form.floor} onChange={set("floor")} /></label>
        <label>Capacity<input type="number" min="0" value={form.capacity} onChange={set("capacity")} /></label>
      </div>
      <label>How to get there
        <textarea rows="3" maxLength={500} value={form.directions} onChange={set("directions")}
          placeholder="Behind the main library, second door on the left" />
      </label>
      <fieldset>
        <legend>Where is it?</legend>
        <p className="hint">Tap the map to place the pin on the exact spot, or stand at the venue and use your location.</p>
        <MapPicker key={form.campus} lat={form.lat} lng={form.lng} center={center}
          onChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))} />
        <div className="actions left">
          <button type="button" className="ghost" onClick={useMyLocation} disabled={locating}>
            {locating ? "Finding you…" : "Use my location"}
          </button>
          {form.lat !== "" && (
            <button type="button" className="ghost" onClick={() => setForm({ ...form, lat: "", lng: "" })}>Remove pin</button>
          )}
        </div>
      </fieldset>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button type="button" className="ghost" onClick={onDone}>Cancel</button>
        <button type="submit" disabled={saving}>{saving ? "Sending…" : "Send suggestion"}</button>
      </div>
    </form>
  );
}
