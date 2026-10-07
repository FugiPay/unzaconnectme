import jwt from "jsonwebtoken";

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Please sign in" });
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Your session has expired. Please sign in again" });
  }
}

// Tiny in-memory limiter (per IP). Fine for one server; use a shared store if you scale out.
export function rateLimit(max, windowMs, message = "Too many requests. Try again later.") {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const recent = (hits.get(req.ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) return res.status(429).json({ error: message });
    recent.push(now);
    hits.set(req.ip, recent);
    next();
  };
}
