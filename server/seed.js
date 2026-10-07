// Usage:
//   npm run seed              creates the admin account, and sample data only if the database is empty
//   npm run seed -- --reset   wipes venues, campuses and categories, then loads sample data again
//
// Venues below are SAMPLES. Replace them from the admin panel (coordinates included).
// Campus map centres are rough; correct them in Admin > Settings by clicking the map.
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Venue from "./models/Venue.js";
import Campus from "./models/Campus.js";
import Category from "./models/Category.js";
import Admin from "./models/Admin.js";

const reset = process.argv.includes("--reset");
await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/unza-venues");

// Admin account
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (ADMIN_EMAIL && ADMIN_PASSWORD && ADMIN_PASSWORD !== "change-this-password") {
  await Admin.findOneAndUpdate(
    { email: ADMIN_EMAIL.toLowerCase() },
    { passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10) },
    { upsert: true }
  );
  console.log(`Admin ready: ${ADMIN_EMAIL}`);
} else {
  console.log("Skipped admin: set ADMIN_EMAIL and a real ADMIN_PASSWORD in .env");
}

if (reset) {
  await Promise.all([Venue.deleteMany({}), Campus.deleteMany({}), Category.deleteMany({})]);
}

if ((await Campus.countDocuments()) === 0) {
  await Campus.insertMany([
    { name: "Great East Road", lat: -15.3885, lng: 28.3345 },
    { name: "Ridgeway", lat: -15.4170, lng: 28.3010 },
  ]);
  await Category.insertMany(
    ["Lecture theatre", "Classroom", "Lab", "Library", "Hall", "Food", "Office", "Sports", "Other"].map((name) => ({ name }))
  );
  await Venue.insertMany([
    { name: "Main Library", category: "Library", campus: "Great East Road", building: "Main Library", floor: "Ground", capacity: 800, directions: "Sample: near the central walkway, opposite the admin block." },
    { name: "Lecture Theatre 1", category: "Lecture theatre", campus: "Great East Road", building: "Lecture Theatre Block", floor: "Ground", capacity: 400, directions: "Sample: first entrance as you enter the block." },
    { name: "Computer Lab A", category: "Lab", campus: "Great East Road", building: "ICT Building", floor: "1st", capacity: 60, directions: "Sample: take the stairs on the left, first door." },
    { name: "Students' Cafeteria", category: "Food", campus: "Great East Road", building: "Student Centre", floor: "Ground", capacity: 250, directions: "Sample: next to the student centre entrance." },
    { name: "Medical Lecture Room 1", category: "Classroom", campus: "Ridgeway", building: "School of Medicine", floor: "Ground", capacity: 120, directions: "Sample: main corridor, third door on the right." },
  ]);
  console.log("Loaded sample campuses, categories and venues");
} else {
  console.log("Data already present, left as is (use -- --reset to start over)");
}

await mongoose.disconnect();
