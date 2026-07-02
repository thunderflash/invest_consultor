import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Helper functions and Mocks
function getTodayDateString(): string { return new Date().toLocaleDateString("zh-CN", { year: 'numeric', month: 'long', day: 'numeric' }); }
function cleanAndParseJSON(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    const firstLineEnd = cleaned.indexOf("\n");
    if (firstLineEnd !== -1) cleaned = cleaned.substring(firstLineEnd).trim();
    if (cleaned.endsWith("```")) cleaned = cleaned.substring(0, cleaned.length - 3).trim();
  }
  return JSON.parse(cleaned);
}

function getMockNews() {
  return [{ title: "财经市场动态", source: "内置模型", summary: "市场平稳。", sentiment: "neutral", affectedAssets: ["美股"], category: "macro", relevanceScore: 5, url: "#" }];
}

function getMockTrends() {
  return [{ assetClass: "stocks", nameZh: "全球股市", shortTermTrend: "neutral", shortTermOutlook: "震荡", longTermTrend: "neutral", longTermOutlook: "平稳", technicalIndicators: [], fundamentalDrivers: [], riskLevel: "low", riskWarnings: [], investmentAdvice: [], lastUpdated: new Date().toISOString() }];
}

function getMockHotPushes() {
  return [{ id: "market-data", topic: "市场机会", description: "市场平稳。", catalysts: [], recommendedStrategy: "观望", riskRating: "low", potentialTickers: [{ ticker: "N/A", name: "无", impact: "positive" }], riskWarnings: "无" }];
}

function getMockPortfolioAnalysis(items: any[]) {
  return { overallRiskScore: 50, diversificationRating: "good", analysisSummary: "平稳。", assetClassDistribution: [], vulnerabilities: [], rebalancingRecommendations: [] };
}

function getLocalAdvisorResponse(query: string) {
  return { reply: "睿泽智能投顾：内测演示。", references: [] };
}

// Routes
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.get("/api/news", (req, res) => res.json({ news: getMockNews(), cached: false, isDemoMode: true }));
app.get("/api/asset-trends", (req, res) => res.json({ trends: getMockTrends(), cached: false, isDemoMode: true }));
app.get("/api/hot-pushes", (req, res) => res.json({ hotPushes: getMockHotPushes(), cached: false, isDemoMode: true }));
app.post("/api/advisor/chat", (req, res) => res.json(getLocalAdvisorResponse("")));
app.post("/api/portfolio/analyze", (req, res) => res.json(getMockPortfolioAnalysis([])));
app.get("/api/watchlist-prices", (req, res) => res.json({ watchlist: [], isRealData: false }));
app.post("/api/portfolio/prices", (req, res) => res.json({ prices: [] }));

export default app;
