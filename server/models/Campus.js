import mongoose from "mongoose";

// Each campus has a map centre so the map opens in the right place.
const campusSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  lat: { type: Number, min: -90, max: 90 },
  lng: { type: Number, min: -180, max: 180 },
});

export default mongoose.model("Campus", campusSchema);
