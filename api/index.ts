import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini
let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing.");
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }
  return aiInstance;
}

// Model generation helper
async function generateModelContent(ai: GoogleGenAI, params: { contents: any; config?: any }) {
  let modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash"; // Updated to a stable standard model
  const isGemma = modelName.toLowerCase().includes("gemma");
  const finalConfig: any = params.config ? { ...params.config } : {};
  let finalContents = params.contents;

  if (isGemma) {
    delete finalConfig.tools;
    delete finalConfig.responseSchema;
    delete finalConfig.responseMimeType;
  }

  if (!modelName.startsWith("models/") && !modelName.startsWith("tunedModels/")) modelName = `models/${modelName}`;
  const response = await ai.models.generateContent({ model: modelName, contents: finalContents, config: finalConfig });
  return { ...response, text: response.text || "" };
}

const app = express();
app.use(express.json());

// Helper functions
function getTodayDateString(): string { return new Date().toLocaleDateString("zh-CN", { year: 'numeric', month: 'long', day: 'numeric' }); }
function cleanAndParseJSON(text: string): any {
  let cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(cleaned);
}

// Routes
app.get("/api/health", (req, res) => res.json({ status: "ok", demo: !process.env.GEMINI_API_KEY }));

app.get("/api/news", async (req, res) => {
  try {
    const ai = getGemini();
    const prompt = `今天（${getTodayDateString()}）最重要的5个财经新闻事件，返回JSON。`;
    const response = await generateModelContent(ai, {
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    res.json({ news: cleanAndParseJSON(response.text), cached: false, isDemoMode: false });
  } catch (e) {
    res.json({ news: [], error: "Failed to fetch news" });
  }
});

app.get("/api/debug", (req, res) => {
  res.json({
    keyPresent: !!process.env.GEMINI_API_KEY,
    keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 4) + "..." : "null",
    model: process.env.GEMINI_MODEL || "default"
  });
});

export default app;
