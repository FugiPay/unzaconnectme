import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import venueRoutes from "./routes/venues.js";
import adminRoutes from "./routes/admin.js";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change-me") {
  console.error("Set a real JWT_SECRET in server/.env before starting the API.");
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1); // Render sits in front of the app; this makes req.ip the real visitor

// Comma-separated list of allowed site origins, e.g. https://your-app.web.app,https://your-app.firebaseapp.com
const origins = (process.env.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
if (!origins.length && process.env.NODE_ENV === "production") {
  console.warn("CORS_ORIGIN is not set: any website can call this API. Set it to your Firebase URL(s).");
}
app.use(cors(origins.length ? { origin: origins } : {}));
app.use(express.json({ limit: "50kb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/venues", venueRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/unza-venues";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
