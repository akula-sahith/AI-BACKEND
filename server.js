import mongoose from "mongoose";
import express from "express";
import { User } from "./models/users.js";
import cors from "cors";  // Import CORS
const app = express();
const port = 3000;
app.use(cors());
// Connect to MongoDB
// mongoose.connect("mongodb://127.0.0.1:27017/SahithAkula", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }).then(() => {
//     console.log("✅ Connected to MongoDB");
// }).catch(err => {
//     console.error("❌ MongoDB connection error:", err);
// });

let a = await mongoose.connect("mongodb://127.0.0.1:27017/SahithAkula")

// Middleware (optional)
app.use(express.json()); // For parsing JSON request bodies

// Routes
app.get("/", async (req, res) => {
    res.send("Hello World")
});

app.post("/createAccount",async (req,res)=>{
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).send(user);
    } catch (error) {
        res.status(400).send(error.message);
    }
})

app.post("/resumeAnalysis",async (req, res) => {

    
})

app.get("/users/email/:email", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email }).select("-password");
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
