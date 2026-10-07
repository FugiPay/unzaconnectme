import { useState } from "react";
import { Link } from "react-router-dom";
import { auth, login, getMeta } from "../api.js";
import { Brand } from "../Home.jsx";
import Dashboard from "./Dashboard.jsx";
import VenuesAdmin from "./VenuesAdmin.jsx";
import Settings from "./Settings.jsx";

function Login({ onDone }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { token } = await login(email, password);
      auth.set(token);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <header className="top">
        <Brand><h1>Admin</h1><p>Sign in to manage UnzaConnectme.</p></Brand>
      </header>
      <main>
        <form className="form narrow" onSubmit={submit}>
          <label>Email<input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <p className="error">{error}</p>}
          <div className="actions"><button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></div>
        </form>
        <p className="hint"><Link to="/">Back to the student site</Link></p>
      </main>
    </div>
  );
}

const TABS = ["Dashboard", "Venues", "Settings"];

export default function AdminApp() {
  const [signedIn, setSignedIn] = useState(!!auth.get());
  const [tab, setTab] = useState("Dashboard");
  const [meta, setMeta] = useState({ campuses: [], categories: [] });
  const [filterStatus, setFilterStatus] = useState("");

  const refreshMeta = () => getMeta().then(setMeta).catch(() => {});
  const start = () => { setSignedIn(true); refreshMeta(); };
  if (signedIn && meta.campuses.length === 0 && meta.categories.length === 0) refreshMeta();

  if (!signedIn) return <Login onDone={start} />;

  const open = (t, status = "") => { setFilterStatus(status); setTab(t); };

  return (
    <div className="page wide">
      <header className="top">
        <Brand><h1>Admin</h1><p>UnzaConnectme venues, map pins and student activity.</p></Brand>
        <nav className="tabs" aria-label="Admin sections">
          {TABS.map((t) => (
            <button key={t} className={tab === t ? "chip on" : "chip"} onClick={() => open(t)}>{t}</button>
          ))}
          <span className="spacer" />
          <Link className="chip" to="/">Student site</Link>
          <button className="chip" onClick={() => { auth.clear(); setSignedIn(false); }}>Sign out</button>
        </nav>
      </header>
      <main>
        {tab === "Dashboard" && <Dashboard onOpen={open} />}
        {tab === "Venues" && <VenuesAdmin meta={meta} initialStatus={filterStatus} />}
        {tab === "Settings" && <Settings meta={meta} onChange={refreshMeta} />}
      </main>
    </div>
  );
}
