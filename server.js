import mongoose from "mongoose";
import express from "express";
import multer from "multer";
import axios from "axios";
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

app.post("/apply",async(req, res) => {
    try{
        const application = req.body
        console.log("Started applying : " + application)
        let response = await axios.post('http://127.0.0.1:5000/oneclickapply', application)
        console.log("Application Status : " + response.data)
        res.status(200).json(response.data)
    }catch (error) {
        res.status(500).json({ error: error.message });
        console.error("Error occurred while applying : " + error)
    }
})








// Start the Server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
