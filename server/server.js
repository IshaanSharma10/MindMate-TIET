import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

// Initialize Gemini AI
console.log("🔑 API Key loaded:", process.env.GEMINI_API_KEY ? "Yes" : "No");
console.log("🔑 API Key (first 10 chars):", process.env.GEMINI_API_KEY?.substring(0, 10));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  console.log("📨 Received chat request");
  
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("💬 User message:", message);

    // Use gemini-2.5-flash model (stable version)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    // Build conversation history
    const chatHistory = [];
    
    if (history && history.length > 1) {
      // Skip the initial AI greeting and map the rest
      for (let i = 1; i < history.length; i++) {
        const msg = history[i];
        chatHistory.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      }
    }

    console.log("📚 History length:", chatHistory.length);

    // System prompt
    const systemPrompt = `You are MindMate, a compassionate and empathetic AI therapist companion. Your role is to:
- Listen actively and respond with empathy and warmth
- Ask thoughtful follow-up questions to understand better
- Provide emotional support and validation
- Help users explore their feelings in a safe space
- Suggest healthy coping strategies when appropriate
- Never diagnose or replace professional therapy
- Keep responses warm, conversational, and supportive (2-4 sentences typically)
- Be genuine, caring, and non-judgmental

Respond naturally and conversationally as a supportive friend would.`;

    // Start chat
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I'm here to listen and support you with care and empathy." }],
        },
        ...chatHistory,
      ],
    });

    console.log("🤖 Sending to Gemini...");

    // Send message
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    console.log("✅ Gemini response:", responseText);

    // Simple mood detection
    const moodKeywords = {
      happy: ["happy", "great", "good", "wonderful", "amazing", "excited", "joy", "love"],
      sad: ["sad", "down", "depressed", "unhappy", "upset", "cry", "lonely", "hurt"],
      anxious: ["anxious", "worried", "nervous", "stress", "panic", "scared", "afraid", "fear"],
      calm: ["calm", "peaceful", "relaxed", "serene", "content", "fine", "okay"],
      stressed: ["stressed", "overwhelmed", "pressure", "busy", "exhausted", "tired", "burnout"],
    };

    let detectedMood = "neutral";
    const lowerMessage = message.toLowerCase();

    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
        detectedMood = mood;
        break;
      }
    }

    console.log("😊 Detected mood:", detectedMood);

    res.json({
      reply: responseText,
      mood: detectedMood,
    });
  } catch (err) {
    console.error("❌ Chat error:", err);
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    
    res.status(500).json({
      error: "Failed to process chat",
      reply: "I'm having trouble connecting right now. Please try again in a moment.",
      details: err.message,
    });
  }
});

// Audio analysis endpoint
app.post("/api/audio-analyze", upload.single("audio"), async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const audioFile = fs.readFileSync(req.file.path);
    const base64Audio = audioFile.toString("base64");

    const prompt = `
You are MindMate, an empathetic AI therapist.
Analyze the user's voice tone for emotional cues (stress, calmness, happiness).
Return:
- transcript of what you hear
- emotion (happy, sad, anxious, calm, stressed)
Respond in JSON format.
`;

    const response = await model.generateContent([
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "audio/webm", data: base64Audio } },
        ],
      },
    ]);

    const text = response.response.text();

    // Clean temp file
    fs.unlinkSync(req.file.path);

    res.json(JSON.parse(text));
  } catch (err) {
    console.error("Audio error:", err);
    res.status(500).json({ error: "Audio analysis failed" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "MindMate server is running",
    model: "gemini-1.5-flash"
  });
});

// Test endpoint
app.get("/", (req, res) => {
  res.json({ message: "MindMate API is running!" });
});

app.listen(PORT, () => {
  console.log(`✅ MindMate server running on http://localhost:${PORT}`);
  console.log(`🔗 Test it: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Using model: gemini-2.5-flash`);
});