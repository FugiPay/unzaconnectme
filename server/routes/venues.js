import { Router } from "express";
import Venue from "../models/Venue.js";
import Campus from "../models/Campus.js";
import Category from "../models/Category.js";
import SearchLog from "../models/SearchLog.js";
import { rateLimit } from "../middleware/auth.js";

const router = Router();
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Campuses and categories for filters and forms
router.get("/meta", async (_req, res) => {
  try {
    const [campuses, categories] = await Promise.all([
      Campus.find().sort({ name: 1 }),
      Category.find().sort({ name: 1 }),
    ]);
    res.json({ campuses, categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Students only ever see active venues
router.get("/", async (req, res) => {
  try {
    const { q, category, campus } = req.query;
    const filter = { status: "active" };
    if (category) filter.category = String(category);
    if (campus) filter.campus = String(campus);
    if (q) {
      const rx = new RegExp(escapeRegex(String(q).trim()), "i");
      filter.$or = [{ name: rx }, { building: rx }, { directions: rx }];
    }
    res.json(await Venue.find(filter).sort({ name: 1 }).limit(300));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Client calls this once a student has stopped typing, so partial words aren't logged
router.post("/search-log", rateLimit(60, 60 * 1000), async (req, res) => {
  const q = String(req.body.q || "").trim().toLowerCase().slice(0, 80);
  if (q.length >= 2) await SearchLog.create({ q, results: Number(req.body.results) || 0 });
  res.json({ ok: true });
});

router.post("/:id/view", rateLimit(120, 60 * 1000), async (req, res) => {
  try {
    await Venue.updateOne({ _id: req.params.id, status: "active" }, { $inc: { views: 1 } });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: "Invalid venue id" });
  }
});

// Student suggestion: always lands as "pending"; an admin checks the details and pin before approving
router.post("/suggest", rateLimit(5, 60 * 60 * 1000, "You've sent several suggestions already. Please try again later."), async (req, res) => {
  try {
    const { name, category, campus, building, floor, capacity, directions, lat, lng } = req.body;
    const num = (v) => (v === "" || v == null ? undefined : Number(v));
    const venue = await Venue.create({
      name, category, campus, building, floor, directions,
      capacity: capacity ? Number(capacity) : undefined,
      lat: num(lat), lng: num(lng), // optional pin placed by the student; admin verifies before approving
      status: "pending",
    });
    res.status(201).json({ ok: true, id: venue._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
