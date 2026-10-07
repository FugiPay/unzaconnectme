import { useState } from "react";

// "Use my location" button: reads the device's GPS/Wi-Fi position and hands it to onFound(lat, lng)
export default function LocateButton({ onFound }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState({ text: "", bad: false });

  function locate() {
    if (!navigator.geolocation) {
      return setNote({ text: "This browser can't share its location. Click the map instead.", bad: true });
    }
    setBusy(true);
    setNote({ text: "", bad: false });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onFound(+coords.latitude.toFixed(6), +coords.longitude.toFixed(6));
        const m = Math.round(coords.accuracy);
        setNote({
          text: m > 50
            ? `Pin set, but only accurate to about ${m} m. Step outside or wait a moment and try again.`
            : `Pin set (accurate to about ${m} m).`,
          bad: false,
        });
        setBusy(false);
      },
      (err) => {
        setBusy(false);
        setNote({
          text: err.code === 1
            ? "Location is blocked. Allow it for this site in your browser settings, then try again."
            : "Couldn't get your location. Try again, or click the map.",
          bad: true,
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  return (
    <div className="self-end">
      <button type="button" className="ghost" onClick={locate} disabled={busy}>
        {busy ? "Finding you…" : "Use my location"}
      </button>
      {note.text && <p className={note.bad ? "error" : "hint"} role="status">{note.text}</p>}
    </div>
  );
}
