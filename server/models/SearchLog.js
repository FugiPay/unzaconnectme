import mongoose from "mongoose";

const searchLogSchema = new mongoose.Schema({
  q: { type: String, required: true },
  results: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 }, // auto-delete after 90 days
});

export default mongoose.model("SearchLog", searchLogSchema);
