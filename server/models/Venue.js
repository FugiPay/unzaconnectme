import mongoose from "mongoose";

const venueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, trim: true, uppercase: true, maxlength: 8 }, // short map label, e.g. CL2
    category: { type: String, trim: true, default: "Other" },
    campus: { type: String, required: true, trim: true },
    building: { type: String, trim: true, maxlength: 120 },
    floor: { type: String, trim: true, maxlength: 40 },
    capacity: { type: Number, min: 0 },
    directions: { type: String, trim: true, maxlength: 500 },
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
    // active = visible to students, pending = student suggestion awaiting review, hidden = admin-only
    status: { type: String, enum: ["active", "pending", "hidden"], default: "active", index: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Venue", venueSchema);
