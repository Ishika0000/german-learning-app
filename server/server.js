require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

app.post("/generate", async (req, res) => {
  const { category, number } = req.body;

  if (!category || !number) {
    return res.status(400).json({ error: "category and number are required" });
  }

  const prompt = `
Give me ${number} German sentences for the context: ${category}.
Return ONLY valid JSON. No explanation. No markdown.
Format:
[
  { "id": "1", "german": "...", "english": "...", "scenario": "..." }
]
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log("GEMINI RAW:", text);

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.json(parsed);

  } catch (error) {
    console.error("ERROR:", error.message);
  
  // Temporary fallback while quota is exceeded
    res.status(200).json([
      { "id": "1", "german": "Ich trainiere jeden Tag.", "english": "I train every day.", "scenario": "Talking about your routine at the gym" },
      { "id": "2", "german": "Wie viel schaffst du?", "english": "How much can you lift?", "scenario": "Asking someone at the gym" },
      { "id": "3", "german": "Kannst du mir helfen?", "english": "Can you help me?", "scenario": "Asking for a spotter" },
      { "id": "4", "german": "Ich bin erschöpft.", "english": "I am exhausted.", "scenario": "After a tough workout" },
      { "id": "5", "german": "Wie lange machst du das schon?", "english": "How long have you been doing this?", "scenario": "Starting a conversation" }
   ]);
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});