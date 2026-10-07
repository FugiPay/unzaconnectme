import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Venue from "../models/Venue.js";
import Campus from "../models/Campus.js";
import Category from "../models/Category.js";
import SearchLog from "../models/SearchLog.js";
import { requireAdmin, rateLimit } from "../middleware/auth.js";

const router = Router();

router.post("/login", rateLimit(10, 15 * 60 * 1000, "Too many sign-in attempts. Try again in 15 minutes."), async (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const admin = await Admin.findOne({ email });
  const ok = admin && (await bcrypt.compare(String(req.body.password || ""), admin.passwordHash));
  if (!ok) return res.status(401).json({ error: "Wrong email or password" });
  const token = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: "12h" });
  res.json({ token, email: admin.email });
});

router.use(requireAdmin);

// ---------- helpers ----------
const TEXT = ["name", "code", "category", "campus", "building", "floor", "directions", "status"];
const NUMS = ["capacity", "lat", "lng"];

// Only copies fields that were sent, so partial updates (e.g. just status) work
function clean(body) {
  const out = {};
  for (const k of TEXT) if (k in body) out[k] = typeof body[k] === "string" ? body[k].trim() : body[k];
  for (const k of NUMS) {
    if (!(k in body)) continue;
    const v = body[k];
    if (v === "" || v === null || v === undefined) out[k] = null;
    else {
      out[k] = Number(v);
      if (Number.isNaN(out[k])) throw new Error(`${k} must be a number`);
    }
  }
  return out;
}

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    const code = err.code === 11000 ? 409 : 400;
    res.status(code).json({ error: err.code === 11000 ? "That name already exists" : err.message });
  }
};

// ---------- stats ----------
router.get("/stats", wrap(async (_req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [total, active, pending, hidden, missingCoords, byCategory, byCampus, topViewed, viewsAgg, searches, topSearches, noResults] =
    await Promise.all([
      Venue.countDocuments(),
      Venue.countDocuments({ status: "active" }),
      Venue.countDocuments({ status: "pending" }),
      Venue.countDocuments({ status: "hidden" }),
      Venue.countDocuments({ status: "active", $or: [{ lat: null }, { lng: null }] }),
      Venue.aggregate([{ $match: { status: "active" } }, { $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Venue.aggregate([{ $match: { status: "active" } }, { $group: { _id: "$campus", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Venue.find({ status: "active", views: { $gt: 0 } }).sort({ views: -1 }).limit(5).select("name campus views"),
      Venue.aggregate([{ $group: { _id: null, views: { $sum: "$views" } } }]),
      SearchLog.countDocuments({ createdAt: { $gte: since } }),
      SearchLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$q", count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 8 },
      ]),
      SearchLog.aggregate([
        { $match: { createdAt: { $gte: since }, results: 0 } },
        { $group: { _id: "$q", count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 8 },
      ]),
    ]);
  res.json({
    total, active, pending, hidden, missingCoords,
    totalViews: viewsAgg[0]?.views || 0,
    searches30d: searches,
    byCategory, byCampus, topViewed, topSearches, noResults,
  });
}));

// ---------- venues ----------
router.get("/venues", wrap(async (req, res) => {
  const { status, q } = req.query;
  const filter = {};
  if (status) filter.status = String(status);
  if (q) {
    const rx = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { building: rx }, { campus: rx }];
  }
  res.json(await Venue.find(filter).sort({ status: 1, name: 1 }).limit(500));
}));

router.post("/venues", wrap(async (req, res) => {
  res.status(201).json(await Venue.create(clean(req.body)));
}));

router.put("/venues/:id", wrap(async (req, res) => {
  const venue = await Venue.findByIdAndUpdate(req.params.id, clean(req.body), { new: true, runValidators: true });
  if (!venue) return res.status(404).json({ error: "Venue not found" });
  res.json(venue);
}));

router.delete("/venues/:id", wrap(async (req, res) => {
  const venue = await Venue.findByIdAndDelete(req.params.id);
  if (!venue) return res.status(404).json({ error: "Venue not found" });
  res.json({ deleted: true });
}));

// ---------- campuses and categories ----------
router.post("/campuses", wrap(async (req, res) => {
  const { name, lat, lng } = req.body;
  res.status(201).json(await Campus.create({ name, lat: lat === "" ? null : lat, lng: lng === "" ? null : lng }));
}));

router.put("/campuses/:id", wrap(async (req, res) => {
  const campus = await Campus.findById(req.params.id);
  if (!campus) return res.status(404).json({ error: "Campus not found" });
  const oldName = campus.name;
  const { name, lat, lng } = req.body;
  campus.set({ name, lat: lat === "" ? null : lat, lng: lng === "" ? null : lng });
  await campus.save();
  // keep venues attached if the campus was renamed
  if (campus.name !== oldName) await Venue.updateMany({ campus: oldName }, { campus: campus.name });
  res.json(campus);
}));

router.delete("/campuses/:id", wrap(async (req, res) => {
  const campus = await Campus.findById(req.params.id);
  if (!campus) return res.status(404).json({ error: "Campus not found" });
  const inUse = await Venue.countDocuments({ campus: campus.name });
  if (inUse) return res.status(409).json({ error: `${inUse} venue(s) still use this campus. Move or delete them first.` });
  await campus.deleteOne();
  res.json({ deleted: true });
}));

router.post("/categories", wrap(async (req, res) => {
  res.status(201).json(await Category.create({ name: req.body.name }));
}));

router.delete("/categories/:id", wrap(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) return res.status(404).json({ error: "Category not found" });
  const inUse = await Venue.countDocuments({ category: cat.name });
  if (inUse) return res.status(409).json({ error: `${inUse} venue(s) still use this category. Move or delete them first.` });
  await cat.deleteOne();
  res.json({ deleted: true });
}));

export default router;
