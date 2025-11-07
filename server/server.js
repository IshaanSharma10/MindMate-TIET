import multer from "multer";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

const upload = multer({ dest: "uploads/" });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

app.post("/api/audio-analyze", upload.single("audio"), async (req, res) => {
  try {
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

    // clean temp file
    fs.unlinkSync(req.file.path);

    res.json(JSON.parse(text));
  } catch (err) {
    console.error("Audio error:", err);
    res.status(500).json({ error: "Audio analysis failed" });
  }
});
