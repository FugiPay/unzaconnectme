// In dev the Vite proxy handles /api. In production set VITE_API_URL to your Render API address.
const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "unza_admin_token";
export const auth = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(url, { method = "GET", body, admin = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (admin && auth.get()) headers.Authorization = `Bearer ${auth.get()}`;
  const res = await fetch(`${API}${url}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // expired or missing session on an admin call: go back to the sign-in screen
    if (res.status === 401 && admin && url !== "/api/admin/login") {
      auth.clear();
      window.location.assign("/admin");
    }
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}

const qs = (params) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return s ? `?${s}` : "";
};

// ----- students -----
export const getMeta = () => request("/api/venues/meta");
export const getVenues = (params = {}) => request(`/api/venues${qs(params)}`);
export const suggestVenue = (venue) => request("/api/venues/suggest", { method: "POST", body: venue });
export const trackView = (id) => request(`/api/venues/${id}/view`, { method: "POST" }).catch(() => {});
export const logSearch = (q, results) =>
  request("/api/venues/search-log", { method: "POST", body: { q, results } }).catch(() => {});

// ----- admin -----
export const login = (email, password) => request("/api/admin/login", { method: "POST", body: { email, password } });
export const adminStats = () => request("/api/admin/stats", { admin: true });
export const adminVenues = (params = {}) => request(`/api/admin/venues${qs(params)}`, { admin: true });
export const saveVenue = (id, data) =>
  request(id ? `/api/admin/venues/${id}` : "/api/admin/venues", { method: id ? "PUT" : "POST", body: data, admin: true });
export const deleteVenue = (id) => request(`/api/admin/venues/${id}`, { method: "DELETE", admin: true });
export const saveCampus = (id, data) =>
  request(id ? `/api/admin/campuses/${id}` : "/api/admin/campuses", { method: id ? "PUT" : "POST", body: data, admin: true });
export const deleteCampus = (id) => request(`/api/admin/campuses/${id}`, { method: "DELETE", admin: true });
export const addCategory = (name) => request("/api/admin/categories", { method: "POST", body: { name }, admin: true });
export const deleteCategory = (id) => request(`/api/admin/categories/${id}`, { method: "DELETE", admin: true });
