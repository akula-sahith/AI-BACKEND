import mongoose from "mongoose";
import express from "express";
import multer from "multer";
import { User } from "./models/users.js";
import { analyzeATS } from "./atsAnalyzer.js";
import cors from "cors";

const app = express();
const port = 3000;
app.use(cors());

// Connect to MongoDB
await mongoose.connect("mongodb://127.0.0.1:27017/SahithAkula");

// Middleware
app.use(express.json());

// Configure Multer for File Upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
app.get("/", async (req, res) => {
    res.send("Hello World");
});

// Create Account
app.post("/createAccount", async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).send(user);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Resume Analysis Endpoint
app.post("/atsAnalyzer", upload.fields([{ name: 'resume' }, { name: 'jobDescription' }]), async (req, res) => {
    try {
        const resumeBuffer = req.files['resume'][0].buffer;
        const jobDescriptionBuffer = req.files['jobDescription'][0].buffer;

        const analysisResult = await analyzeATS(resumeBuffer, jobDescriptionBuffer);
        res.status(200).json(analysisResult);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get User by Email
app.get("/users/email/:email", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email }).select("name email");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the Server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
