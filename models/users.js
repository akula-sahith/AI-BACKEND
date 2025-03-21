import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    authProvider: { type: String, enum: ["Google", "Email"], required: true }, // Tracks sign-in method
    linkedin: { type: String }, // Optional LinkedIn profile link
    github: { type: String }, // Optional GitHub profile link
    createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model("User", userSchema);