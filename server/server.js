import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import PDFDocument from "pdfkit";

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

// In-memory storage (in production, use a database like MongoDB, PostgreSQL, or Firebase)
const dataStore = {
  moods: [], // { userId, date, mood, note, timestamp }
  journalEntries: [], // { userId, date, entry, timestamp }
  goals: [], // { userId, id, title, description, targetDate, completed, createdAt }
  sessions: [], // { userId, sessionId, messages, createdAt, updatedAt }
};

// Helper function to get user data
const getUserData = (userId) => ({
  moods: dataStore.moods.filter(m => m.userId === userId),
  journalEntries: dataStore.journalEntries.filter(j => j.userId === userId),
  goals: dataStore.goals.filter(g => g.userId === userId),
  sessions: dataStore.sessions.filter(s => s.userId === userId),
});

// Crisis detection keywords
const crisisKeywords = [
  "suicide", "kill myself", "end my life", "want to die", "not worth living",
  "self harm", "cutting", "hurting myself", "harm myself",
  "hopeless", "no way out", "nothing matters", "give up"
];

const detectCrisis = (message) => {
  const lowerMessage = message.toLowerCase();
  return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
};

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  console.log("📨 Received chat request");
  
  try {
    const { message, history, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("💬 User message:", message);

    // Crisis detection
    const isCrisis = detectCrisis(message);
    if (isCrisis) {
      console.log("⚠️ CRISIS DETECTED - Providing resources");
      return res.json({
        reply: "I'm really concerned about what you're sharing. Your life has value, and there are people who want to help you right now. Please reach out to a crisis helpline:\n\n• National Suicide Prevention Lifeline: 988 (US)\n• Crisis Text Line: Text HOME to 741741\n• International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/\n\nIf you're in immediate danger, please call emergency services (911 in US). You don't have to go through this alone.",
        mood: "crisis",
        crisisDetected: true,
        resources: {
          hotline: "988",
          textLine: "741741",
          emergency: "911"
        }
      });
    }

    // Get user context for personalized responses
    let userContext = "";
    if (userId) {
      const userData = getUserData(userId);
      const recentMoods = userData.moods.slice(-5);
      const activeGoals = userData.goals.filter(g => !g.completed).slice(0, 3);
      
      if (recentMoods.length > 0) {
        userContext += `\nRecent mood patterns: ${recentMoods.map(m => m.mood).join(", ")}.`;
      }
      if (activeGoals.length > 0) {
        userContext += `\nActive goals: ${activeGoals.map(g => g.title).join(", ")}.`;
      }
    }

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

    // Enhanced system prompt with context awareness
    const systemPrompt = `You are MindMate, a compassionate and empathetic AI mental health coach. Your role is to:
- Listen actively and respond with empathy and warmth
- Ask thoughtful follow-up questions to understand better
- Provide emotional support and validation
- Help users explore their feelings in a safe space
- Suggest evidence-based coping strategies when appropriate (breathing exercises, grounding techniques, journaling)
- Reference user's goals and progress when relevant
- Never diagnose or replace professional therapy
- Keep responses warm, conversational, and supportive (2-4 sentences typically)
- Be genuine, caring, and non-judgmental
- If user mentions crisis thoughts, immediately provide crisis resources

User context:${userContext}

Respond naturally and conversationally as a supportive mental health coach would.`;

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

// Facial expression analysis is now handled client-side using MediaPipe
// No backend endpoint needed - all processing happens in the browser

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

// Mood tracking endpoints
app.post("/api/moods", (req, res) => {
  try {
    const { userId, mood, note } = req.body;
    if (!userId || !mood) {
      return res.status(400).json({ error: "userId and mood are required" });
    }

    const moodEntry = {
      userId,
      date: new Date().toISOString().split('T')[0],
      mood,
      note: note || "",
      timestamp: new Date().toISOString(),
    };

    dataStore.moods.push(moodEntry);
    res.json({ success: true, mood: moodEntry });
  } catch (err) {
    console.error("Mood error:", err);
    res.status(500).json({ error: "Failed to save mood" });
  }
});

app.get("/api/moods/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const moods = dataStore.moods.filter(m => m.userId === userId);
    res.json({ moods });
  } catch (err) {
    console.error("Get moods error:", err);
    res.status(500).json({ error: "Failed to fetch moods" });
  }
});

// Journal entries endpoints
app.post("/api/journal", (req, res) => {
  try {
    const { userId, entry } = req.body;
    if (!userId || !entry) {
      return res.status(400).json({ error: "userId and entry are required" });
    }

    const journalEntry = {
      userId,
      date: new Date().toISOString().split('T')[0],
      entry,
      timestamp: new Date().toISOString(),
    };

    dataStore.journalEntries.push(journalEntry);
    res.json({ success: true, journalEntry });
  } catch (err) {
    console.error("Journal error:", err);
    res.status(500).json({ error: "Failed to save journal entry" });
  }
});

app.get("/api/journal/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const entries = dataStore.journalEntries.filter(j => j.userId === userId);
    res.json({ entries });
  } catch (err) {
    console.error("Get journal error:", err);
    res.status(500).json({ error: "Failed to fetch journal entries" });
  }
});

// Goals endpoints
app.post("/api/goals", (req, res) => {
  try {
    const { userId, title, description, targetDate } = req.body;
    if (!userId || !title) {
      return res.status(400).json({ error: "userId and title are required" });
    }

    const goal = {
      userId,
      id: Date.now().toString(),
      title,
      description: description || "",
      targetDate: targetDate || null,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    dataStore.goals.push(goal);
    res.json({ success: true, goal });
  } catch (err) {
    console.error("Goal error:", err);
    res.status(500).json({ error: "Failed to create goal" });
  }
});

app.get("/api/goals/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const goals = dataStore.goals.filter(g => g.userId === userId);
    res.json({ goals });
  } catch (err) {
    console.error("Get goals error:", err);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

app.patch("/api/goals/:goalId", (req, res) => {
  try {
    const { goalId } = req.params;
    const updates = req.body;
    const goalIndex = dataStore.goals.findIndex(g => g.id === goalId);
    
    if (goalIndex === -1) {
      return res.status(404).json({ error: "Goal not found" });
    }

    dataStore.goals[goalIndex] = { ...dataStore.goals[goalIndex], ...updates };
    res.json({ success: true, goal: dataStore.goals[goalIndex] });
  } catch (err) {
    console.error("Update goal error:", err);
    res.status(500).json({ error: "Failed to update goal" });
  }
});

app.delete("/api/goals/:goalId", (req, res) => {
  try {
    const { goalId } = req.params;
    const goalIndex = dataStore.goals.findIndex(g => g.id === goalId);
    
    if (goalIndex === -1) {
      return res.status(404).json({ error: "Goal not found" });
    }

    dataStore.goals.splice(goalIndex, 1);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete goal error:", err);
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

// Session history endpoints
app.post("/api/sessions", (req, res) => {
  try {
    const { userId, messages } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const session = {
      userId,
      sessionId: Date.now().toString(),
      messages: messages || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dataStore.sessions.push(session);
    res.json({ success: true, session });
  } catch (err) {
    console.error("Session error:", err);
    res.status(500).json({ error: "Failed to save session" });
  }
});

app.get("/api/sessions/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = dataStore.sessions
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json({ sessions });
  } catch (err) {
    console.error("Get sessions error:", err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// Wellness endpoints
const wellnessData = {
  checkIns: [], // { userId, date, timestamp }
  gratitude: [], // { userId, entry, timestamp }
  activities: [], // { userId, activityId, completed, date }
  streaks: {}, // { userId: streakCount }
};

// Daily check-in endpoint
app.post("/api/wellness/checkin", (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const today = new Date().toISOString().split('T')[0];
    const existingCheckIn = wellnessData.checkIns.find(
      c => c.userId === userId && c.date === today
    );

    if (!existingCheckIn) {
      wellnessData.checkIns.push({
        userId,
        date: today,
        timestamp: new Date().toISOString(),
      });

      // Update streak
      if (!wellnessData.streaks[userId]) {
        wellnessData.streaks[userId] = 1;
      } else {
        wellnessData.streaks[userId]++;
      }
    }

    res.json({ success: true, checkedIn: true });
  } catch (err) {
    console.error("Check-in error:", err);
    res.status(500).json({ error: "Failed to save check-in" });
  }
});

app.get("/api/wellness/checkin/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    const checkIn = wellnessData.checkIns.find(
      c => c.userId === userId && c.date === today
    );

    // Get today's mood if available
    const todayMood = dataStore.moods
      .filter(m => m.userId === userId && m.date === today)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    res.json({
      checkedIn: !!checkIn,
      mood: todayMood?.mood || null,
    });
  } catch (err) {
    console.error("Get check-in error:", err);
    res.status(500).json({ error: "Failed to fetch check-in" });
  }
});

// Gratitude endpoints
app.post("/api/wellness/gratitude", (req, res) => {
  try {
    const { userId, entry } = req.body;
    if (!userId || !entry) {
      return res.status(400).json({ error: "userId and entry are required" });
    }

    wellnessData.gratitude.push({
      userId,
      entry,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Gratitude error:", err);
    res.status(500).json({ error: "Failed to save gratitude" });
  }
});

app.get("/api/wellness/gratitude/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const entries = wellnessData.gratitude
      .filter(g => g.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 30) // Last 30 entries
      .map(g => g.entry);

    res.json({ entries });
  } catch (err) {
    console.error("Get gratitude error:", err);
    res.status(500).json({ error: "Failed to fetch gratitude" });
  }
});

// Activities endpoints
app.post("/api/wellness/activities", (req, res) => {
  try {
    const { userId, activityId, completed } = req.body;
    if (!userId || activityId === undefined) {
      return res.status(400).json({ error: "userId and activityId are required" });
    }

    const today = new Date().toISOString().split('T')[0];
    const existingIndex = wellnessData.activities.findIndex(
      a => a.userId === userId && a.activityId === activityId && a.date === today
    );

    if (existingIndex >= 0) {
      wellnessData.activities[existingIndex].completed = completed;
    } else {
      wellnessData.activities.push({
        userId,
        activityId,
        completed,
        date: today,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Activity error:", err);
    res.status(500).json({ error: "Failed to update activity" });
  }
});

app.get("/api/wellness/activities/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    const completed = wellnessData.activities
      .filter(a => a.userId === userId && a.date === today && a.completed)
      .map(a => a.activityId);

    res.json({ completed });
  } catch (err) {
    console.error("Get activities error:", err);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

// Streak endpoint
app.get("/api/wellness/streak/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const streak = wellnessData.streaks[userId] || 0;
    res.json({ streak });
  } catch (err) {
    console.error("Get streak error:", err);
    res.status(500).json({ error: "Failed to fetch streak" });
  }
});

// Coping strategies endpoint
app.get("/api/coping-strategies", async (req, res) => {
  try {
    const { mood } = req.query;
    
    const strategies = {
      anxious: [
        {
          title: "5-4-3-2-1 Grounding Technique",
          description: "Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste",
          category: "grounding"
        },
        {
          title: "Progressive Muscle Relaxation",
          description: "Tense and release each muscle group from toes to head",
          category: "relaxation"
        },
        {
          title: "Challenge Negative Thoughts",
          description: "Ask yourself: Is this thought helpful? What evidence supports or contradicts it?",
          category: "cognitive"
        }
      ],
      sad: [
        {
          title: "Connect with Nature",
          description: "Take a walk outside, even for 5 minutes. Nature has proven mood-boosting effects",
          category: "activity"
        },
        {
          title: "Practice Self-Compassion",
          description: "Treat yourself with the same kindness you'd show a friend",
          category: "cognitive"
        },
        {
          title: "Express Gratitude",
          description: "Write down 3 things you're grateful for, no matter how small",
          category: "journaling"
        }
      ],
      stressed: [
        {
          title: "Time Blocking",
          description: "Break tasks into smaller chunks and focus on one at a time",
          category: "organization"
        },
        {
          title: "Take a Break",
          description: "Step away for 10 minutes. Walk, stretch, or do something you enjoy",
          category: "self-care"
        },
        {
          title: "Prioritize Tasks",
          description: "Use the Eisenhower Matrix: urgent/important, important/not urgent, etc.",
          category: "organization"
        }
      ],
      default: [
        {
          title: "Mindful Breathing",
          description: "Focus on your breath for 2-3 minutes",
          category: "mindfulness"
        },
        {
          title: "Journal Your Thoughts",
          description: "Write freely for 10 minutes without judgment",
          category: "journaling"
        },
        {
          title: "Gentle Movement",
          description: "Stretch, yoga, or light walk to release tension",
          category: "activity"
        }
      ]
    };

    const moodStrategies = strategies[mood] || strategies.default;
    
    // If user has specific mood, get AI-suggested strategies too
    if (mood && mood !== "default") {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Suggest 2 specific, actionable coping strategies for someone feeling ${mood}. Keep each strategy brief (1-2 sentences) and practical. Format as JSON array with title and description fields.`;
        
        const result = await model.generateContent(prompt);
        const aiStrategies = JSON.parse(result.response.text());
        
        if (Array.isArray(aiStrategies)) {
          moodStrategies.push(...aiStrategies.map(s => ({ ...s, category: "ai-suggested" })));
        }
      } catch (err) {
        console.log("AI strategy generation failed, using defaults");
      }
    }

    res.json({ strategies: moodStrategies });
  } catch (err) {
    console.error("Coping strategies error:", err);
    res.status(500).json({ error: "Failed to fetch coping strategies" });
  }
});

// Session summary endpoint
app.post("/api/sessions/summary", async (req, res) => {
  try {
    const { userId, sessionId, messages } = req.body;
    
    if (!userId || !messages || messages.length === 0) {
      return res.status(400).json({ error: "userId and messages are required" });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    });

    const conversationText = messages
      .map(m => `${m.role === "user" ? "User" : "MindMate"}: ${m.content}`)
      .join("\n");

    const prompt = `Create a brief, supportive session summary (2-3 sentences) for this mental health coaching conversation. Focus on:
- Key themes or concerns discussed
- Progress or insights gained
- Encouragement and next steps

Conversation:
${conversationText}

Respond with only the summary text, no additional formatting.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    // Detect overall mood from session
    const allText = messages.map(m => m.content).join(" ").toLowerCase();
    const moodKeywords = {
      happy: ["happy", "great", "good", "wonderful", "excited", "joy"],
      calm: ["calm", "peaceful", "relaxed", "serene", "content"],
      anxious: ["anxious", "worried", "nervous", "stress", "panic", "scared"],
      sad: ["sad", "down", "depressed", "unhappy", "upset", "lonely"],
      stressed: ["stressed", "overwhelmed", "pressure", "exhausted", "tired"]
    };

    let sessionMood = "neutral";
    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(kw => allText.includes(kw))) {
        sessionMood = mood;
        break;
      }
    }

    res.json({
      summary,
      mood: sessionMood,
      messageCount: messages.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Session summary error:", err);
    res.status(500).json({ error: "Failed to generate session summary" });
  }
});

// Insights/analytics endpoint with chat and journal correlation
app.get("/api/insights/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = getUserData(userId);

    // Calculate mood trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentMoods = userData.moods.filter(m => 
      new Date(m.timestamp) >= sevenDaysAgo
    );

    // Group by emotion
    const emotionCounts = {};
    recentMoods.forEach(m => {
      emotionCounts[m.mood] = (emotionCounts[m.mood] || 0) + 1;
    });

    // Calculate weekly mood average
    const moodValues = { happy: 90, calm: 75, neutral: 50, anxious: 30, sad: 20, stressed: 25 };
    const weeklyAverage = recentMoods.length > 0
      ? recentMoods.reduce((sum, m) => sum + (moodValues[m.mood] || 50), 0) / recentMoods.length
      : 50;

    // Generate mood trend data for chart (last 7 days)
    const moodChartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMoods = recentMoods.filter(m => m.date === dateStr);
      const dayAverage = dayMoods.length > 0
        ? dayMoods.reduce((sum, m) => sum + (moodValues[m.mood] || 50), 0) / dayMoods.length
        : null;
      
      moodChartData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dateStr,
        value: dayAverage ? Math.round(dayAverage) : null
      });
    }

    // Analyze chat sessions and journal entries correlation
    const recentSessions = userData.sessions
      .filter(s => new Date(s.createdAt) >= sevenDaysAgo)
      .slice(-10); // Last 10 sessions

    const recentJournalEntries = userData.journalEntries
      .filter(j => new Date(j.timestamp) >= sevenDaysAgo)
      .slice(-10);

    // Create timeline combining chat and journal
    const timeline = [];
    
    recentSessions.forEach(session => {
      const userMessages = session.messages?.filter(m => m.role === "user") || [];
      const sessionText = userMessages.map(m => m.content).join(" ");
      
      // Detect mood from session
      const sessionMood = detectMoodFromText(sessionText);
      
      timeline.push({
        type: "chat",
        date: session.createdAt,
        mood: sessionMood,
        content: sessionText.substring(0, 100) + "...",
        messageCount: session.messages?.length || 0
      });
    });

    recentJournalEntries.forEach(entry => {
      // Get mood from journal entry date
      const entryMood = userData.moods.find(m => m.date === entry.date);
      
      timeline.push({
        type: "journal",
        date: entry.timestamp,
        mood: entryMood?.mood || "neutral",
        content: entry.entry.substring(0, 100) + "...",
        fullEntry: entry.entry
      });
    });

    // Sort timeline by date
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Analyze chat topics and mood correlation
    const chatMoodCorrelation = {};
    recentSessions.forEach(session => {
      const userMessages = session.messages?.filter(m => m.role === "user") || [];
      const sessionText = userMessages.map(m => m.content).join(" ").toLowerCase();
      const sessionMood = detectMoodFromText(sessionText);
      
      // Extract key topics (simple keyword extraction)
      const topics = extractTopics(sessionText);
      
      topics.forEach(topic => {
        if (!chatMoodCorrelation[topic]) {
          chatMoodCorrelation[topic] = {};
        }
        chatMoodCorrelation[topic][sessionMood] = (chatMoodCorrelation[topic][sessionMood] || 0) + 1;
      });
    });

    // Generate AI insights if we have data
    let aiInsights = null;
    if (recentSessions.length > 0 && recentJournalEntries.length > 0) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
          },
        });

        const chatSummary = recentSessions.slice(-3).map(s => {
          const userMsgs = s.messages?.filter(m => m.role === "user").map(m => m.content).join(" ") || "";
          return userMsgs.substring(0, 200);
        }).join("\n");

        const journalSummary = recentJournalEntries.slice(-3).map(j => j.entry.substring(0, 200)).join("\n");

        const prompt = `Analyze this user's mental health data and provide 2-3 brief, supportive insights connecting their chat conversations and journal entries. Focus on patterns, progress, and gentle observations. Keep it warm and encouraging (2-3 sentences total).

Recent chat topics: ${chatSummary.substring(0, 500)}
Recent journal entries: ${journalSummary.substring(0, 500)}
Recent moods: ${Object.keys(emotionCounts).join(", ")}

Respond with only the insights, no additional formatting.`;

        const result = await model.generateContent(prompt);
        aiInsights = result.response.text();
      } catch (err) {
        console.log("AI insights generation failed:", err.message);
      }
    }

    res.json({
      weeklyAverage: Math.round(weeklyAverage),
      emotionDistribution: emotionCounts,
      totalSessions: userData.sessions.length,
      totalJournalEntries: userData.journalEntries.length,
      activeGoals: userData.goals.filter(g => !g.completed).length,
      recentMoods: recentMoods.slice(-7),
      moodChartData,
      timeline: timeline.slice(-14), // Last 14 items
      chatMoodCorrelation,
      aiInsights,
      recentSessionsCount: recentSessions.length,
      recentJournalCount: recentJournalEntries.length,
    });
  } catch (err) {
    console.error("Insights error:", err);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

// Helper function to detect mood from text
function detectMoodFromText(text) {
  const lowerText = text.toLowerCase();
  
  // Check for multi-word phrases FIRST (higher priority)
  const phrasePatterns = {
    sad: ["passed away", "passed on", "died", "funeral", "breakup", "broke up", "divorce", "fired", "laid off", "left me"],
    happy: ["new car", "got the job", "passed exam", "passed test", "got engaged", "getting married"],
    anxious: ["test tomorrow", "exam tomorrow", "interview tomorrow", "waiting for results"],
    stressed: ["so much work", "no time", "can't handle", "running late", "money problems"]
  };
  
  // Check phrases first (they take priority)
  for (const [mood, phrases] of Object.entries(phrasePatterns)) {
    for (const phrase of phrases) {
      if (lowerText.includes(phrase)) {
        console.log(`Phrase match: "${phrase}" → ${mood}`);
        return mood;
      }
    }
  }
  
  // Expanded keyword lists for better detection
  const moodKeywords = {
    happy: [
      // Explicit emotions
      "happy", "great", "good", "wonderful", "amazing", "excited", "joy", "joyful",
      "love", "grateful", "thankful", "blessed", "fantastic", "awesome", "excellent",
      "cheerful", "delighted", "pleased", "thrilled", "ecstatic", "elated", "glad",
      "blissful", "satisfied", "positive", "optimistic", "hopeful",
      "brilliant", "perfect", "proud", "accomplished", "successful",
      // Context words (typically happy events)
      "bought", "promotion", "engaged", "married", "wedding", "birthday",
      "vacation", "holiday", "won", "graduated", "celebrate", "party",
      "accepted", "raise", "bonus", "surprise", "gift", "baby"
    ],
    calm: [
      "calm", "peaceful", "relaxed", "serene", "tranquil", "mellow", "chill",
      "balanced", "centered", "grounded", "mindful", "meditative", "quiet",
      "still", "composed", "collected", "soothed", "comfortable", "easy", "gentle",
      "resting", "weekend", "nothing much", "just chilling", "fine", "okay", "alright"
    ],
    anxious: [
      "anxious", "worried", "nervous", "panic", "scared", "afraid", "fear",
      "fearful", "terrified", "dread", "uneasy", "tense", "restless", "agitated",
      "jittery", "apprehensive", "concerned", "troubled", "disturbed",
      "insecure", "uncertain", "doubtful", "overthinking",
      // Context words
      "interview", "exam", "waiting", "results", "doctor", "dentist", "flight", 
      "presentation", "meeting"
    ],
    sad: [
      "sad", "down", "depressed", "unhappy", "upset", "cry", "crying", "lonely",
      "hurt", "heartbroken", "miserable", "gloomy", "melancholy", "sorrowful",
      "grief", "grieving", "mourning", "disappointed", "hopeless", "despair",
      "empty", "numb", "lost", "broken", "devastated", "terrible", "awful", "bad",
      // Context words
      "died", "death", "funeral", "rejected", "failed", "miss", "missing", "gone"
    ],
    stressed: [
      "stressed", "overwhelmed", "pressure", "busy", "exhausted", "tired", "burnout",
      "burned out", "drained", "fatigued", "worn out", "overworked", "swamped",
      "frantic", "hectic", "chaotic", "crazy", "frustrated", "irritated", "annoyed",
      "angry", "mad", "furious", "under pressure", "deadline", "too much",
      // Context words
      "bills", "debt", "argument", "fight"
    ]
  };

  // Count matches for each mood
  const moodScores = {};
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    moodScores[mood] = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        moodScores[mood]++;
      }
    }
  }

  // Find the mood with the highest score
  let bestMood = "neutral";
  let highestScore = 0;
  for (const [mood, score] of Object.entries(moodScores)) {
    if (score > highestScore) {
      highestScore = score;
      bestMood = mood;
    }
  }

  console.log(`Keyword scores:`, moodScores, `→ ${bestMood}`);
  return bestMood;
}

// Helper function to extract topics from text
function extractTopics(text) {
  const commonWords = ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "i", "you", "he", "she", "it", "we", "they", "is", "am", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "this", "that", "these", "those"];
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const meaningfulWords = words.filter(w => w.length > 4 && !commonWords.includes(w));
  
  // Count word frequency
  const wordCount = {};
  meaningfulWords.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Return top 3 most frequent words as topics
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);
}

// AI-powered mood detection from text
app.post("/api/detect-mood", async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required" });
    }

    console.log("Mood detection request for text:", text);

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 10,
      },
    });

    const prompt = `You are an expert emotion analyst. Analyze the emotional tone and context of this text. Consider:
- What is the person talking about?
- What emotion would a person LIKELY be feeling when saying this?
- Infer the underlying emotion even if not explicitly stated.

Examples:
- "I bought a new car" → happy (exciting purchase)
- "I lost my wallet" → stressed or sad
- "I have a job interview tomorrow" → anxious
- "Just finished my exams" → calm or happy
- "My dog passed away" → sad

VALID EMOTIONS: happy, sad, anxious, calm, stressed, neutral

TEXT: "${text}"

Based on context and common human experience, what emotion is this person MOST LIKELY feeling?
RESPOND WITH EXACTLY ONE WORD from the valid emotions list. Nothing else.`;

    let detectedMood = "";
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response?.text() || "";
      detectedMood = responseText.toLowerCase().trim();
      
      // Clean up the response - remove any punctuation, quotes, or extra text
      detectedMood = detectedMood.replace(/[^a-z]/g, '');
      
      console.log("Gemini raw response:", responseText);
      console.log("Cleaned mood:", detectedMood);
    } catch (geminiError) {
      console.error("Gemini API error:", geminiError.message);
      // Fall through to keyword detection
    }

    // Validate the detected mood
    const validMoods = ["happy", "sad", "anxious", "calm", "stressed", "neutral"];
    
    // Check if the response contains any valid mood word
    let finalMood = null;
    for (const validMood of validMoods) {
      if (detectedMood.includes(validMood)) {
        finalMood = validMood;
        break;
      }
    }
    
    // If Gemini didn't return a valid mood, use keyword detection
    if (!finalMood) {
      console.log("Gemini mood not valid, using keyword fallback");
      finalMood = detectMoodFromText(text);
    }

    console.log("Final detected mood:", finalMood);

    res.json({
      detectedMood: finalMood,
      confidence: "high",
      originalText: text,
    });
  } catch (err) {
    console.error("Mood detection error:", err);
    // Fallback to keyword-based detection
    const fallbackMood = detectMoodFromText(req.body.text || "");
    console.log("Error fallback mood:", fallbackMood);
    res.json({
      detectedMood: fallbackMood,
      confidence: "medium",
      originalText: req.body.text,
    });
  }
});

// Mood patterns analysis endpoint
app.get("/api/mood-patterns/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = getUserData(userId);

    if (userData.moods.length === 0) {
      return res.json({
        peakTime: null,
        commonMood: null,
        trend: null,
        weeklyPattern: {},
      });
    }

    // Analyze time patterns
    const hourMoods = {};
    userData.moods.forEach(mood => {
      const hour = new Date(mood.timestamp).getHours();
      if (!hourMoods[hour]) {
        hourMoods[hour] = { count: 0, totalScore: 0 };
      }
      const moodValues = { happy: 90, calm: 75, neutral: 50, anxious: 30, sad: 20, stressed: 25 };
      hourMoods[hour].count++;
      hourMoods[hour].totalScore += moodValues[mood.mood] || 50;
    });

    // Find peak time (hour with highest average mood)
    let peakTime = null;
    let maxAvg = 0;
    Object.entries(hourMoods).forEach(([hour, data]) => {
      const avg = data.totalScore / data.count;
      if (avg > maxAvg) {
        maxAvg = avg;
        peakTime = `${hour}:00`;
      }
    });

    // Find most common mood
    const moodCounts = {};
    userData.moods.forEach(m => {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    });
    const commonMood = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Calculate trend (comparing last 7 days to previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentMoods = userData.moods.filter(m => new Date(m.timestamp) >= sevenDaysAgo);
    const previousMoods = userData.moods.filter(
      m => new Date(m.timestamp) >= fourteenDaysAgo && new Date(m.timestamp) < sevenDaysAgo
    );

    const moodValues = { happy: 90, calm: 75, neutral: 50, anxious: 30, sad: 20, stressed: 25 };
    
    const recentAvg = recentMoods.length > 0
      ? recentMoods.reduce((sum, m) => sum + (moodValues[m.mood] || 50), 0) / recentMoods.length
      : 50;
    
    const previousAvg = previousMoods.length > 0
      ? previousMoods.reduce((sum, m) => sum + (moodValues[m.mood] || 50), 0) / previousMoods.length
      : 50;

    let trend = "stable";
    if (recentAvg > previousAvg + 5) {
      trend = "improving";
    } else if (recentAvg < previousAvg - 5) {
      trend = "declining";
    }

    // Weekly pattern (day of week analysis)
    const weeklyPattern = {};
    userData.moods.forEach(m => {
      const day = new Date(m.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
      if (!weeklyPattern[day]) {
        weeklyPattern[day] = { count: 0, totalScore: 0 };
      }
      weeklyPattern[day].count++;
      weeklyPattern[day].totalScore += moodValues[m.mood] || 50;
    });

    Object.keys(weeklyPattern).forEach(day => {
      weeklyPattern[day] = Math.round(weeklyPattern[day].totalScore / weeklyPattern[day].count);
    });

    res.json({
      peakTime,
      commonMood,
      trend,
      weeklyPattern,
      recentAverage: Math.round(recentAvg),
      previousAverage: Math.round(previousAvg),
    });
  } catch (err) {
    console.error("Mood patterns error:", err);
    res.status(500).json({ error: "Failed to analyze mood patterns" });
  }
});

// Generate PDF Mood Report
app.get("/api/mood-report/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = getUserData(userId);

    if (userData.moods.length === 0) {
      return res.status(400).json({ error: "No mood data available to generate report" });
    }

    // Calculate statistics
    const moodValues = { happy: 90, calm: 75, neutral: 50, anxious: 30, sad: 20, stressed: 25 };
    const moodLabels = { happy: "Happy", calm: "Calm", neutral: "Neutral", anxious: "Anxious", sad: "Sad", stressed: "Stressed" };
    
    // Count moods
    const moodCounts = {};
    let totalScore = 0;
    userData.moods.forEach(m => {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
      totalScore += moodValues[m.mood] || 50;
    });
    
    const averageScore = Math.round(totalScore / userData.moods.length);
    const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
    const dominantMood = sortedMoods[0]?.[0] || "neutral";
    
    // Calculate trend
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentMoods = userData.moods.filter(m => new Date(m.timestamp) >= sevenDaysAgo);
    const recentAvg = recentMoods.length > 0
      ? Math.round(recentMoods.reduce((sum, m) => sum + (moodValues[m.mood] || 50), 0) / recentMoods.length)
      : 50;

    // Generate AI insights
    let aiInsights = "";
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const insightPrompt = `You are a mental health advisor. Based on this mood data, provide personalized insights and recommendations.

Mood Statistics:
- Total check-ins: ${userData.moods.length}
- Average mood score: ${averageScore}/100
- Most common mood: ${dominantMood}
- Recent 7-day average: ${recentAvg}/100
- Mood breakdown: ${sortedMoods.map(([mood, count]) => `${mood}: ${count} times`).join(", ")}

Recent mood entries with notes:
${userData.moods.slice(-10).map(m => `- ${m.mood}${m.note ? `: "${m.note}"` : ""}`).join("\n")}

Provide:
1. A brief summary of their emotional state (2-3 sentences)
2. 3 specific, actionable recommendations to improve their mood
3. One positive affirmation

Keep it warm, supportive, and concise (under 300 words total).`;

      const result = await model.generateContent(insightPrompt);
      aiInsights = result.response.text();
    } catch (aiError) {
      console.error("AI insights error:", aiError);
      aiInsights = "Unable to generate AI insights at this time. Please try again later.";
    }

    // Create PDF with better styling
    const doc = new PDFDocument({ 
      margin: 40,
      size: "A4",
      bufferPages: true
    });
    
    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=MindMate_Wellness_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    
    // Pipe the PDF to the response
    doc.pipe(res);

    const pageWidth = doc.page.width - 80;
    const colors = {
      primary: "#6366F1",
      primaryLight: "#EEF2FF",
      success: "#10B981",
      warning: "#F59E0B",
      danger: "#EF4444",
      text: "#1F2937",
      textLight: "#6B7280",
      border: "#E5E7EB",
      happy: "#FCD34D",
      calm: "#60A5FA",
      neutral: "#9CA3AF",
      anxious: "#FB923C",
      sad: "#A78BFA",
      stressed: "#F87171"
    };

    // ========== HEADER ==========
    // Header background
    doc.rect(0, 0, doc.page.width, 120).fill(colors.primary);
    
    // Logo/Title
    doc.fontSize(32).font("Helvetica-Bold").fillColor("#FFFFFF")
       .text("MindMate", 40, 30);
    doc.fontSize(14).font("Helvetica").fillColor("#E0E7FF")
       .text("Personal Wellness Report", 40, 65);
    doc.fontSize(11).fillColor("#C7D2FE")
       .text(new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }), 40, 85);

    // Score badge on right side
    const scoreX = doc.page.width - 120;
    doc.circle(scoreX, 60, 35).fill("#FFFFFF");
    doc.fontSize(24).font("Helvetica-Bold").fillColor(colors.primary)
       .text(averageScore.toString(), scoreX - 20, 48, { width: 40, align: "center" });
    doc.fontSize(8).font("Helvetica").fillColor(colors.textLight)
       .text("SCORE", scoreX - 20, 72, { width: 40, align: "center" });

    doc.y = 140;

    // ========== QUICK STATS ROW ==========
    const statBoxWidth = (pageWidth - 30) / 4;
    const stats = [
      { label: "Total Check-ins", value: userData.moods.length.toString(), color: colors.primary },
      { label: "Avg. Score", value: `${averageScore}/100`, color: colors.success },
      { label: "7-Day Avg", value: `${recentAvg}/100`, color: colors.warning },
      { label: "Entries This Week", value: recentMoods.length.toString(), color: colors.calm }
    ];

    stats.forEach((stat, i) => {
      const x = 40 + (i * (statBoxWidth + 10));
      // Box background
      doc.roundedRect(x, doc.y, statBoxWidth, 60, 8).fill("#F9FAFB");
      // Value
      doc.fontSize(20).font("Helvetica-Bold").fillColor(stat.color)
         .text(stat.value, x + 10, doc.y + 12, { width: statBoxWidth - 20 });
      // Label
      doc.fontSize(9).font("Helvetica").fillColor(colors.textLight)
         .text(stat.label, x + 10, doc.y + 38, { width: statBoxWidth - 20 });
    });

    doc.y += 80;

    // ========== DOMINANT MOOD SECTION ==========
    doc.roundedRect(40, doc.y, pageWidth, 70, 8).fill(colors.primaryLight);
    doc.fontSize(11).font("Helvetica-Bold").fillColor(colors.primary)
       .text("YOUR DOMINANT MOOD", 55, doc.y + 15);
    
    // Draw colored mood indicator circle
    const moodY = doc.y + 45;
    doc.circle(70, moodY, 12).fill(colors[dominantMood] || colors.neutral);
    doc.fontSize(28).font("Helvetica-Bold").fillColor(colors.text)
       .text(dominantMood.charAt(0).toUpperCase() + dominantMood.slice(1), 95, doc.y + 32);

    doc.y += 90;

    // ========== MOOD BREAKDOWN WITH VISUAL BARS ==========
    doc.fontSize(14).font("Helvetica-Bold").fillColor(colors.text)
       .text("Mood Breakdown", 40, doc.y);
    doc.y += 25;

    const maxCount = Math.max(...sortedMoods.map(([_, count]) => count));
    sortedMoods.forEach(([mood, count]) => {
      const percentage = Math.round((count / userData.moods.length) * 100);
      const barWidth = (count / maxCount) * (pageWidth - 120);
      
      // Colored circle indicator
      doc.circle(50, doc.y + 8, 6).fill(colors[mood] || colors.neutral);
      
      // Mood label
      doc.fontSize(11).font("Helvetica").fillColor(colors.text)
         .text(mood.charAt(0).toUpperCase() + mood.slice(1), 65, doc.y, { width: 60 });
      
      // Background bar
      doc.roundedRect(130, doc.y + 2, pageWidth - 120, 14, 4).fill("#E5E7EB");
      
      // Colored bar
      if (barWidth > 0) {
        doc.roundedRect(130, doc.y + 2, barWidth, 14, 4).fill(colors[mood] || colors.neutral);
      }
      
      // Percentage text
      doc.fontSize(10).font("Helvetica-Bold").fillColor(colors.textLight)
         .text(`${percentage}%`, pageWidth - 10, doc.y + 2, { width: 40, align: "right" });
      
      doc.y += 24;
    });

    doc.y += 15;

    // ========== RECENT MOOD ENTRIES ==========
    doc.fontSize(14).font("Helvetica-Bold").fillColor(colors.text)
       .text("Recent Mood Entries", 40, doc.y);
    doc.y += 20;

    // Table header
    doc.roundedRect(40, doc.y, pageWidth, 25, 4).fill("#F3F4F6");
    doc.fontSize(9).font("Helvetica-Bold").fillColor(colors.textLight);
    doc.text("DATE & TIME", 50, doc.y + 8);
    doc.text("MOOD", 180, doc.y + 8);
    doc.text("NOTE", 280, doc.y + 8);
    doc.y += 30;

    const recentEntries = userData.moods.slice(-5).reverse();
    recentEntries.forEach((entry, i) => {
      const rowY = doc.y;
      const date = new Date(entry.timestamp);
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      
      // Alternating row background
      if (i % 2 === 0) {
        doc.rect(40, rowY - 2, pageWidth, 22).fill("#FAFAFA");
      }
      
      // Date
      doc.fontSize(10).font("Helvetica").fillColor(colors.text)
         .text(`${dateStr}, ${timeStr}`, 50, rowY + 4);
      
      // Mood with color indicator
      doc.circle(185, rowY + 9, 5).fill(colors[entry.mood] || colors.neutral);
      doc.fontSize(10).font("Helvetica").fillColor(colors.text)
         .text(entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1), 195, rowY + 4);
      
      // Note (truncated)
      const note = entry.note ? (entry.note.length > 35 ? entry.note.substring(0, 35) + "..." : entry.note) : "-";
      doc.fontSize(9).font("Helvetica").fillColor(colors.textLight)
         .text(note, 280, rowY + 4, { width: pageWidth - 250 });
      
      doc.y += 24;
    });

    doc.y += 20;

    // ========== AI INSIGHTS SECTION ==========
    // Check if we need a new page
    if (doc.y > 600) {
      doc.addPage();
      doc.y = 50;
    }

    doc.roundedRect(40, doc.y, pageWidth, 20, 4).fill(colors.primary);
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#FFFFFF")
       .text("AI-POWERED INSIGHTS & RECOMMENDATIONS", 50, doc.y + 5);
    doc.y += 30;

    // AI content box
    const aiBoxY = doc.y;
    doc.roundedRect(40, aiBoxY, pageWidth, 200, 8)
       .lineWidth(1).stroke(colors.border);
    
    doc.fontSize(10).font("Helvetica").fillColor(colors.text)
       .text(aiInsights, 55, aiBoxY + 15, { 
         width: pageWidth - 30, 
         align: "left", 
         lineGap: 4 
       });

    // ========== FOOTER ==========
    const footerY = doc.page.height - 60;
    doc.rect(0, footerY, doc.page.width, 60).fill("#F9FAFB");
    
    doc.fontSize(9).font("Helvetica").fillColor(colors.textLight)
       .text("This report is generated by MindMate AI for personal wellness tracking.", 40, footerY + 15, { 
         width: pageWidth, 
         align: "center" 
       });
    doc.fontSize(8).fillColor(colors.textLight)
       .text("If you are experiencing severe emotional distress, please seek professional help.", 40, footerY + 30, { 
         width: pageWidth, 
         align: "center" 
       });
    doc.fontSize(8).font("Helvetica-Bold").fillColor(colors.primary)
       .text("www.mindmate.app", 40, footerY + 45, { 
         width: pageWidth, 
         align: "center" 
       });

    // Finalize the PDF
    doc.end();

  } catch (err) {
    console.error("PDF report error:", err);
    res.status(500).json({ error: "Failed to generate mood report" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "MindMate server is running",
    model: "gemini-2.5-flash"
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