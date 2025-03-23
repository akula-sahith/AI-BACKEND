import mongoose from "mongoose";
import express from "express";
import multer from "multer";
import axios from "axios";
import natural from "natural";
import fs from "fs";
import cors from "cors";
import { User } from "./models/users.js";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
const app = express();
const port = 3000;
app.use(express.json());
app.use(cors()); // ✅ Ensure form data parsing

// Connect to MongoDB
await mongoose.connect("mongodb://127.0.0.1:27017/SahithAkula");


const genAI = new GoogleGenerativeAI("AIzaSyAiTHFQCKuurfTiOmiVlR0iFs8PebxCI7o");

const storage = multer.memoryStorage(); // Store file in memory (or use diskStorage)
const upload = multer({ storage: storage });

// Extract Experience Function
function extractExperience(text) {
    const experienceRegex = /\b(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\b/i;
    const match = text.match(experienceRegex);
    return match ? parseFloat(match[1]) : 0;
  }
  
  // Extract Skills Function (Sample using basic extraction)
  function extractSkills(text) {
    const skills = ["JavaScript", "Python", "React", "Node.js", "MongoDB", "SQL", "AWS"];
    return skills.filter(skill => text.toLowerCase().includes(skill.toLowerCase()));
  }
  
  // Check Formatting (Simple Check)
  function checkFormatting(text) {
    const lines = text.split('\n');
    const hasSections = lines.some(line => /\b(objective|experience|education|skills)\b/i.test(line));
    return hasSections ? 100 : 50;
  }
  
  
// Cosine Similarity for Title Match
function cosineSimilarity(text1, text2) {
    const tokenizer = new natural.WordTokenizer();
    const vectorizer = new natural.TfIdf();
    const tokens1 = tokenizer.tokenize(text1.toLowerCase());
    const tokens2 = tokenizer.tokenize(text2.toLowerCase());
  
    vectorizer.addDocument(tokens1);
    vectorizer.addDocument(tokens2);
  
    const score = vectorizer.tfidf(0, 1) / Math.sqrt(vectorizer.tfidf(0, 0) * vectorizer.tfidf(1, 1));
    return isNaN(score) ? 0 : Math.min(score * 100, 100);
  }
  

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

//Get interview questions based on the company , job role and experience
app.get("/getQuestions", async (req, res) => {
    try {
      const { company, jobRole, experience } = req.query;
  
      if (!company || !jobRole || !experience) {
        return res.status(400).json({ error: "Company, job role, and experience are required" });
      }
  
      const prompt = `Generate 10 technical and behavioral interview questions for a ${jobRole} role at ${company} with ${experience} years of experience. The questions should focus on key skills, industry trends, and problem-solving abilities.Give it in a structured json format`;
  
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      res.json({ company, jobRole, experience, questions: response });
    } catch (error) {
      console.error("Error generating interview questions:", error);
      res.status(500).json({ error: "Failed to generate interview questions" });
    }
  });

  app.post("/chat", async (req, res) => {
    const userMessage = req.body.message;
  
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `
      You are an **empathetic mental health support chatbot** designed for **employees** facing workplace stress. 
      Your goal is to provide **compassionate, constructive, and professional** responses. 
      If an employee is feeling **overwhelmed, burnt out, or stressed**, offer **practical coping strategies** like time management tips, deep breathing, or positive affirmations.  
      
      Key Guidelines:
      - Be **encouraging and reassuring**.
      - Provide **motivational tips** for productivity.
      - Suggest **work-life balance techniques** like breaks, exercise, or mindfulness.
      - If an employee mentions **burnout or extreme stress**, suggest seeking professional support.
      - NEVER provide medical diagnoses but offer **self-care techniques**.
      - Keep the matter in buller points

      Example:
      - User: "I'm feeling really overwhelmed with work deadlines."
      - Bot: "I hear you. Managing deadlines can be stressful. Try breaking tasks into smaller steps and taking short breaks. You're doing great! Would you like a productivity tip?"

      Now, respond to this user message: "${userMessage}"
    `;
      const result = await model.generateContent(prompt);
      const response = result.response.text();
  
      res.json({ reply: response });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ reply: "Sorry, I'm having trouble responding right now!" });
    }
  });
  
  // ATS Scoring API
  app.post("/ats-score", upload.fields([{ name: 'resume' }, { name: 'jobDescription' }]), async (req, res) => {
    try {
      if (!req.files || !req.files['resume'] || !req.files['jobDescription']) {
        return res.status(400).json({ error: "Both resume and job description are required." });
      }
  
      const resumeText = req.files['resume'][0].buffer.toString('utf-8');
      const jobDescriptionText = req.files['jobDescription'][0].buffer.toString('utf-8');
  
      // Calculate Keyword Match using TF-IDF
      const tokenizer = new natural.WordTokenizer();
      const resumeTokens = tokenizer.tokenize(resumeText.toLowerCase());
      const jobTokens = tokenizer.tokenize(jobDescriptionText.toLowerCase());
      const tfidf = new natural.TfIdf();
      tfidf.addDocument(jobTokens);
      tfidf.addDocument(resumeTokens);
      const keywordMatchScore = Math.min(tfidf.tfidf(0, 1) * 100, 100) || 0;
  
      // Experience Match
      const resumeExperience = extractExperience(resumeText);
      const jobExperience = extractExperience(jobDescriptionText);
      const experienceScore = jobExperience ? Math.min((resumeExperience / jobExperience) * 100, 100) : 0;
  
      // Skills Match
      const resumeSkills = extractSkills(resumeText);
      const jobSkills = extractSkills(jobDescriptionText);
      const skillsMatchScore = jobSkills.length > 0 ? (resumeSkills.filter(skill => jobSkills.includes(skill)).length / jobSkills.length) * 100 : 50;
         // Job Title Match using Cosine Similarity
    const jobTitleMatchScore = cosineSimilarity(resumeText, jobDescriptionText);

    // Education Match (Basic Logic)
    const educationMatchScore = /\b(Bachelor|Master|PhD)\b/i.test(resumeText) ? 100 : 50;

    // Formatting Score
    const formattingScore = checkFormatting(resumeText);

    // Final Scores
    const scores = {
      keywordMatchScore,
      experienceScore,
      skillsMatchScore,
      jobTitleMatchScore,
      educationMatchScore,
      formattingScore
    };

    const totalScore = (keywordMatchScore * 0.4) +
                        (experienceScore * 0.2) +
                        (skillsMatchScore * 0.2) +
                        (jobTitleMatchScore * 0.1) +
                        (educationMatchScore * 0.05) +
                        (formattingScore * 0.05);

     res.json({
      atsScore: Math.min(totalScore, 100).toFixed(2),
      scores,
      message: "ATS Score calculated successfully with detailed score breakdown."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


  


  

// Start the Server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
