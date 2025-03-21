import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  authProvider: { type: String, enum: ["Google", "Email"], required: true },
  linkedin: { type: String }, // Optional
  github: { type: String },   // Optional
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model("User", userSchema);
