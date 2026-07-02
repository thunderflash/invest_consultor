import express from "express";
import serverless from "serverless-http";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Cache variables
let cachedNews: any = null;
let newsCacheTime = 0;
let cachedTrends: any = null;
let trendsCacheTime = 0;
let cachedHotPushes: any = null;
let hotPushesCacheTime = 0;

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache

// Lazy initialization of Gemini client
let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing. Please configure it in Settings > Secrets or in the environment variables.");
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }
  return aiInstance;
}

// Wrapper helper to generate content safely across different models (like Gemma 2 and Gemini)
async function generateModelContent(ai: GoogleGenAI, params: { contents: any; config?: any }) {
  let modelName = process.env.GEMINI_MODEL || "gemma-4-26b-a4b-it";
  const envModel = process.env.GEMINI_MODEL;
  if (envModel && (envModel.toLowerCase().includes("gemma") || envModel.toLowerCase().includes("gemini")) && !envModel.startsWith("AQ.")) {
    modelName = envModel;
  }

  if (modelName.toLowerCase().includes("gemma-4-26b") || modelName.toLowerCase().includes("gemma-2-27b") || modelName.toLowerCase() === "gemma-2-27b-it") {
    modelName = "gemma-4-26b-a4b-it";
  }

  const isGemma = modelName.toLowerCase().includes("gemma");
  const finalConfig: any = params.config ? { ...params.config } : {};
  let finalContents = params.contents;
  const hadJsonMimeType = finalConfig.responseMimeType === "application/json";
  const hasTools = finalConfig.tools && finalConfig.tools.length > 0;

  if (isGemma) {
    if (finalConfig.tools) delete finalConfig.tools;
    const schemaStr = finalConfig.responseSchema ? JSON.stringify(finalConfig.responseSchema, null, 2) : "";
    if (finalConfig.responseSchema) delete finalConfig.responseSchema;
    delete finalConfig.responseMimeType;

    if (finalConfig.systemInstruction) {
      const sysInstructionText = typeof finalConfig.systemInstruction === "string" 
        ? finalConfig.systemInstruction 
        : (finalConfig.systemInstruction.parts?.[0]?.text || "");
      delete finalConfig.systemInstruction;
      if (sysInstructionText) {
        if (typeof finalContents === "string") {
          finalContents = `[System Instructions]\n${sysInstructionText}\n\n[User Prompt]\n${finalContents}`;
        } else if (Array.isArray(finalContents)) {
          finalContents = [
            { role: "user", parts: [{ text: `[System Instructions]\n${sysInstructionText}` }] },
            ...finalContents
          ];
        }
      }
    }

    if (hadJsonMimeType) {
      let jsonPromptSuffix = `\n\nIMPORTANT: Return ONLY a valid JSON object. Do not include any conversational text or markdown codeblocks (such as \`\`\`json). The response must be a single raw JSON object starting with '{' and ending with '}'.`;
      if (schemaStr) jsonPromptSuffix += `\n\nYour JSON response must strictly conform to this JSON schema structure:\n${schemaStr}`;
      if (typeof finalContents === "string") finalContents += jsonPromptSuffix;
      else if (Array.isArray(finalContents)) {
        const lastIndex = finalContents.length - 1;
        if (lastIndex >= 0 && finalContents[lastIndex].parts?.[0]) {
          finalContents[lastIndex].parts[0].text += jsonPromptSuffix;
        }
      }
    }
  } else if (hasTools && hadJsonMimeType) {
    const schemaStr = finalConfig.responseSchema ? JSON.stringify(finalConfig.responseSchema, null, 2) : "";
    delete finalConfig.responseMimeType;
    delete finalConfig.responseSchema;
    let jsonPromptSuffix = `\n\nIMPORTANT: Return ONLY a valid JSON object. Do not include any conversational text or markdown codeblocks (such as \`\`\`json). The response must be a single raw JSON object starting with '{' and ending with '}'.`;
    if (schemaStr) jsonPromptSuffix += `\n\nYour JSON response must strictly conform to this JSON schema structure:\n${schemaStr}`;
    if (typeof finalContents === "string") finalContents += jsonPromptSuffix;
    else if (Array.isArray(finalContents)) {
      const lastIndex = finalContents.length - 1;
      if (lastIndex >= 0 && finalContents[lastIndex].parts?.[0]) {
        finalContents[lastIndex].parts[0].text += jsonPromptSuffix;
      }
    }
  }

  let finalModelName = modelName;
  if (!finalModelName.startsWith("models/") && !finalModelName.startsWith("tunedModels/")) {
    finalModelName = `models/${finalModelName}`;
  }

  const response = await ai.models.generateContent({
    model: finalModelName,
    contents: finalContents,
    config: finalConfig
  });

  let responseText = response.text || "";
  if ((isGemma || hasTools) && hadJsonMimeType) {
    responseText = responseText.replace(/^\s*```json\s*/i, "").replace(/```\s*$/, "").trim();
  }

  return { ...response, text: responseText };
}

const app = express();
app.use(express.json());

// Helper: Get today's formatted date
function getTodayDateString(): string {
  const d = new Date();
  return d.toLocaleDateString("zh-CN", { year: 'numeric', month: 'long', day: 'numeric' });
}

// Helper: Clean and parse JSON from Gemini's response
function cleanAndParseJSON(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    const firstLineEnd = cleaned.indexOf("\n");
    if (firstLineEnd !== -1) cleaned = cleaned.substring(firstLineEnd).trim();
    if (cleaned.endsWith("```")) cleaned = cleaned.substring(0, cleaned.length - 3).trim();
  }
  return JSON.parse(cleaned);
}

// Local mock data generators for graceful fallback and demo mode
function getMockNews() {
  return [
    {
      title: "美联储最新政策纪要：暗示将维持温和降息节奏，风控锚点聚焦非农与CPI数据",
      source: "华尔街日报 (Wall Street Journal)",
      summary: "美联储公布的最新会议纪要显示，多数与会官员赞成在通胀放缓及就业增长温和的背景下，采取渐进且温和的降息步伐。",
      sentiment: "bullish",
      affectedAssets: ["美股", "标普500", "黄金", "美债"],
      category: "macro",
      relevanceScore: 9,
      url: "https://www.wsj.com/economy/central-banking"
    }
  ];
}

function getMockTrends() {
  return [
    {
      assetClass: "stocks",
      nameZh: "全球股市",
      shortTermTrend: "volatile",
      shortTermOutlook: "高位震荡",
      longTermTrend: "bullish",
      longTermOutlook: "长期看涨",
      technicalIndicators: [],
      fundamentalDrivers: [],
      riskLevel: "medium",
      riskWarnings: [],
      investmentAdvice: [],
      lastUpdated: new Date().toISOString()
    }
  ];
}

function getMockHotPushes() {
  return [
    {
      id: "ai-semiconductors",
      topic: "AI芯片与全球半导体供应链",
      description: "AI算力增长强劲。",
      catalysts: [],
      recommendedStrategy: "分批建仓",
      riskRating: "medium",
      potentialTickers: [{ ticker: "NVDA", name: "英伟达", impact: "positive" }],
      riskWarnings: "估值风险"
    }
  ];
}

function getMockPortfolioAnalysis(items: any[]) {
  const totalValue = items.reduce((sum, item) => sum + (item.amount * item.currentPrice), 0);
  const classTotals: Record<string, number> = {};
  items.forEach(item => {
    classTotals[item.assetClass] = (classTotals[item.assetClass] || 0) + (item.amount * item.currentPrice);
  });
  const assetClassDistribution = Object.entries(classTotals).map(([assetClass, val]) => ({
    assetClass,
    percentage: totalValue > 0 ? parseFloat(((val / totalValue) * 100).toFixed(1)) : 0,
    value: parseFloat(val.toFixed(1))
  }));
  let weightedRisk = 0;
  items.forEach(item => {
    const weight = totalValue > 0 ? (item.amount * item.currentPrice) / totalValue : 0;
    let riskFactor = 50;
    if (item.assetClass === 'crypto') riskFactor = 90;
    if (item.assetClass === 'stocks') riskFactor = 70;
    if (item.assetClass === 'forex') riskFactor = 40;
    if (item.assetClass === 'futures') riskFactor = 35;
    weightedRisk += riskFactor * weight;
  });
  const riskScore = totalValue > 0 ? Math.min(100, Math.max(10, Math.round(weightedRisk))) : 0;
  let rating = "good";
  if (items.length <= 1) rating = "poor";
  else if (items.length === 2) rating = "fair";
  else if (items.length >= 4) rating = "excellent";
  return {
    overallRiskScore: riskScore,
    diversificationRating: rating,
    analysisSummary: `组合总市值约 $${totalValue.toLocaleString()}.`,
    assetClassDistribution,
    vulnerabilities: ["分析"],
    rebalancingRecommendations: ["建议"]
  };
}

function getLocalAdvisorResponse(query: string) {
  const q = query.toLowerCase();
  if (q.includes("美联储") || q.includes("降息") || q.includes("黄金")) {
    return { reply: "睿泽投顾：美联储降息周期利多黄金。", references: [] };
  }
  return { reply: "睿泽投顾：请咨询具体问题。", references: [] };
}

// API: Check server health
app.get("/api/health", (req, res) => {
  const isApiKeyMissing = !process.env.GEMINI_API_KEY;
  res.json({ 
    status: "ok", 
    time: new Date().toISOString(),
    isDemoMode: isApiKeyMissing,
    demoReason: isApiKeyMissing ? "系统检测到您的 GEMINI_API_KEY 尚未配置。" : null
  });
});

// API: Fetch and analyze daily financial news
app.get("/api/news", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const now = Date.now();
    const isApiKeyMissing = !process.env.GEMINI_API_KEY;

    if (!forceRefresh && cachedNews && (now - newsCacheTime < CACHE_DURATION)) {
      return res.json({ news: cachedNews, cached: true, isDemoMode: isApiKeyMissing });
    }

    if (isApiKeyMissing) {
      cachedNews = getMockNews();
      newsCacheTime = now;
      return res.json({ news: cachedNews, cached: false, isDemoMode: true, demoReason: "GEMINI_API_KEY 未配置。" });
    }

    const ai = getGemini();
    const today = getTodayDateString();
    const prompt = `你是一个顶级财经新闻解析器。请利用谷歌搜索查询今天（${today}）来自华尔街日报、彭博社、路透社、金融时报等权威媒体的最核心财经新闻，返回包含 5 个最重要新闻事件的 JSON 列表。`;

    const response = await generateModelContent(ai, {
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            news: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  source: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  sentiment: { type: Type.STRING, enum: ["bullish", "bearish", "neutral"] },
                  affectedAssets: { type: Type.ARRAY, items: { type: Type.STRING } },
                  category: { type: Type.STRING, enum: ["stocks", "futures", "forex", "crypto", "macro"] },
                  relevanceScore: { type: Type.INTEGER }
                },
                required: ["title", "source", "summary", "sentiment", "affectedAssets", "category", "relevanceScore"]
              }
            }
          },
          required: ["news"]
        }
      }
    });

    const result = cleanAndParseJSON(response.text);
    cachedNews = result.news || [];
    newsCacheTime = now;
    res.json({ news: cachedNews, cached: false, isDemoMode: false });
  } catch (error: any) {
    cachedNews = getMockNews();
    newsCacheTime = Date.now();
    res.json({ news: cachedNews, cached: false, isDemoMode: true });
  }
});

// API: Fetch short-term and long-term trend analysis for 4 asset classes
app.get("/api/asset-trends", async (req, res) => {
  try {
    const isApiKeyMissing = !process.env.GEMINI_API_KEY;
    if (isApiKeyMissing) {
      cachedTrends = getMockTrends();
      trendsCacheTime = Date.now();
      return res.json({ trends: cachedTrends, cached: false, isDemoMode: true, demoReason: "GEMINI_API_KEY 未配置。" });
    }

    const ai = getGemini();
    const today = getTodayDateString();
    const prompt = `检索今天（${today}）股票、期货、外汇、加密货币的走势分析，返回JSON: { trends: [{ assetClass, nameZh, shortTermTrend, shortTermOutlook, longTermTrend, longTermOutlook, technicalIndicators, fundamentalDrivers, riskLevel, riskWarnings, investmentAdvice, lastUpdated }] }。`;

    const response = await generateModelContent(ai, {
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trends: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  assetClass: { type: Type.STRING, enum: ["stocks", "futures", "forex", "crypto"] },
                  nameZh: { type: Type.STRING },
                  shortTermTrend: { type: Type.STRING, enum: ["bullish", "bearish", "neutral", "volatile"] },
                  shortTermOutlook: { type: Type.STRING },
                  longTermTrend: { type: Type.STRING, enum: ["bullish", "bearish", "neutral", "volatile"] },
                  longTermOutlook: { type: Type.STRING },
                  technicalIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
                  fundamentalDrivers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  riskLevel: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
                  riskWarnings: { type: Type.ARRAY, items: { type: Type.STRING } },
                  investmentAdvice: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["assetClass", "nameZh", "shortTermTrend", "shortTermOutlook", "longTermTrend", "longTermOutlook", "technicalIndicators", "fundamentalDrivers", "riskLevel", "riskWarnings", "investmentAdvice"]
              }
            }
          },
          required: ["trends"]
        }
      }
    });

    const result = cleanAndParseJSON(response.text);
    cachedTrends = (result.trends || []).map((t: any) => ({ ...t, lastUpdated: new Date().toISOString() }));
    trendsCacheTime = Date.now();
    res.json({ trends: cachedTrends, cached: false, isDemoMode: false });
  } catch (error: any) {
    cachedTrends = getMockTrends();
    trendsCacheTime = Date.now();
    res.json({ trends: cachedTrends, cached: false, isDemoMode: true });
  }
});

// API: Fetch stock market hot topics push
app.get("/api/hot-pushes", async (req, res) => {
  try {
    const isApiKeyMissing = !process.env.GEMINI_API_KEY;
    if (isApiKeyMissing) {
      cachedHotPushes = getMockHotPushes();
      hotPushesCacheTime = Date.now();
      return res.json({ hotPushes: cachedHotPushes, cached: false, isDemoMode: true, demoReason: "GEMINI_API_KEY 未配置。" });
    }

    const ai = getGemini();
    const today = getTodayDateString();
    const prompt = `检索今天（${today}）全球或A股、港股、美股中最受追捧的2-3个热门投资主题，返回JSON: { hotPushes: [{ id, topic, description, catalysts, recommendedStrategy, riskRating, potentialTickers: [{ ticker, name, impact }], riskWarnings }] }。`;

    const response = await generateModelContent(ai, {
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hotPushes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  description: { type: Type.STRING },
                  catalysts: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recommendedStrategy: { type: Type.STRING },
                  riskRating: { type: Type.STRING, enum: ["low", "medium", "high"] },
                  potentialTickers: { type: Type.ARRAY, items: { type: { type: Type.OBJECT } } },
                  riskWarnings: { type: Type.STRING }
                },
                required: ["id", "topic", "description", "catalysts", "recommendedStrategy", "riskRating", "potentialTickers", "riskWarnings"]
              }
            }
          },
          required: ["hotPushes"]
        }
      }
    });

    const result = cleanAndParseJSON(response.text);
    cachedHotPushes = result.hotPushes || [];
    hotPushesCacheTime = Date.now();
    res.json({ hotPushes: cachedHotPushes, cached: false, isDemoMode: false });
  } catch (error: any) {
    cachedHotPushes = getMockHotPushes();
    hotPushesCacheTime = Date.now();
    res.json({ hotPushes: cachedHotPushes, cached: false, isDemoMode: true });
  }
});

// API: Multi-turn Chat with AI Investment Advisor Agent
app.post("/api/advisor/chat", async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing messages array." });
    }

    const isApiKeyMissing = !process.env.GEMINI_API_KEY;

    if (isApiKeyMissing) {
      const lastUserMsg = messages[messages.length - 1]?.content || "";
      const { reply, references } = getLocalAdvisorResponse(lastUserMsg);
      return res.json({ reply, references, isDemoMode: true, demoReason: "GEMINI_API_KEY 未配置。" });
    }

    const ai = getGemini();
    const today = getTodayDateString();
    const systemInstruction = `你是一位全球投资顾问，名字叫睿泽，精通股票、期货、外汇、加密货币、宏观经济分析。今天是：${today}。所有回复请使用中文。`;

    const contents = messages.map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const response = await generateModelContent(ai, {
      contents,
      config: { systemInstruction, tools: [{ googleSearch: {} }] }
    });

    const citationChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const references = citationChunks.filter((c: any) => c.web).map((c: any) => ({
      title: c.web?.title || "来源",
      uri: c.web?.uri || ""
    }));

    res.json({
      reply: response.text || "抱歉，我未能生成分析。",
      references: references.slice(0, 5),
      isDemoMode: false
    });
  } catch (error: any) {
    const lastUserMsg = req.body?.messages?.[req.body.messages.length - 1]?.content || "";
    const { reply, references } = getLocalAdvisorResponse(lastUserMsg);
    res.json({ reply: `【网络故障】${reply}`, references, isDemoMode: true });
  }
});

// API: Analyze Portfolio
app.post("/api/portfolio/analyze", async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Missing portfolio items." });
    }

    const isApiKeyMissing = !process.env.GEMINI_API_KEY;

    if (isApiKeyMissing) {
      return res.json({ ...getMockPortfolioAnalysis(items), isDemoMode: true, demoReason: "GEMINI_API_KEY 未配置。" });
    }

    const ai = getGemini();
    const today = getTodayDateString();
    const portfolioDescription = items.map((item: any, i: number) => 
      `${i + 1}. ${item.name}, ${item.ticker}, ${item.assetClass}, 持有 ${item.amount}, 成本 ${item.purchasePrice}, 当前 ${item.currentPrice}`
    ).join("\n");

    const prompt = `分析客户投资组合（${today}）：${portfolioDescription}。返回JSON: { overallRiskScore, diversificationRating, analysisSummary, assetClassDistribution: [{ assetClass, percentage, value }], vulnerabilities, rebalancingRecommendations }。`;

    const response = await generateModelContent(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallRiskScore: { type: Type.INTEGER },
            diversificationRating: { type: Type.STRING, enum: ["poor", "fair", "good", "excellent"] },
            analysisSummary: { type: Type.STRING },
            assetClassDistribution: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  assetClass: { type: Type.STRING },
                  percentage: { type: Type.NUMBER },
                  value: { type: Type.NUMBER }
                },
                required: ["assetClass", "percentage", "value"]
              }
            },
            vulnerabilities: { type: Type.ARRAY, items: { type: Type.STRING } },
            rebalancingRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["overallRiskScore", "diversificationRating", "analysisSummary", "assetClassDistribution", "vulnerabilities", "rebalancingRecommendations"]
        }
      }
    });

    const result = cleanAndParseJSON(response.text);
    res.json({ ...result, isDemoMode: false });
  } catch (error: any) {
    res.json({ ...getMockPortfolioAnalysis(req.body?.items || []), isDemoMode: true, demoReason: `AI 故障: ${error.message}` });
  }
});

// API: Watchlist Prices (mock data)
app.get("/api/watchlist-prices", async (req, res) => {
  res.json({ watchlist: [{ ticker: "BTC/USD", price: 96000, change: 1.2 }], isRealData: false });
});

// API: Portfolio Prices (mock data)
app.post("/api/portfolio/prices", async (req, res) => {
  const { items } = req.body || {};
  res.json({ prices: (items || []).map((i: any) => ({ id: i.id, ticker: i.ticker, currentPrice: i.currentPrice })) });
});

// Debug endpoint to verify environment
app.get("/api/debug", (req, res) => {
  res.json({
    keyPresent: !!process.env.GEMINI_API_KEY,
    keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 4) + "..." : "null"
  });
});

export default serverless(app);