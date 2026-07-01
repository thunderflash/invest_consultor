/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  affectedAssets: string[];
  timestamp: string;
  category: 'stocks' | 'futures' | 'forex' | 'crypto' | 'macro';
  relevanceScore: number; // 1-10
  url?: string;
}

export interface AssetTrend {
  assetClass: 'stocks' | 'futures' | 'forex' | 'crypto';
  nameZh: string; // Chinese display name
  shortTermTrend: 'bullish' | 'bearish' | 'neutral' | 'volatile';
  shortTermOutlook: string;
  longTermTrend: 'bullish' | 'bearish' | 'neutral' | 'volatile';
  longTermOutlook: string;
  technicalIndicators: string[];
  fundamentalDrivers: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskWarnings: string[];
  investmentAdvice: string[];
  lastUpdated: string;
}

export interface HotPushTopic {
  id: string;
  topic: string;
  description: string;
  catalysts: string[];
  recommendedStrategy: string;
  riskRating: 'low' | 'medium' | 'high';
  potentialTickers: { ticker: string; name: string; impact: 'positive' | 'negative' }[];
  riskWarnings: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: string;
  references?: { title: string; uri: string }[];
}

export interface PortfolioItem {
  id: string;
  name: string;
  ticker: string;
  assetClass: 'stocks' | 'futures' | 'forex' | 'crypto';
  amount: number;
  purchasePrice: number;
  currentPrice: number;
}

export interface PortfolioAnalysisResult {
  overallRiskScore: number; // 1-100
  diversificationRating: 'poor' | 'fair' | 'good' | 'excellent';
  analysisSummary: string;
  assetClassDistribution: { assetClass: string; percentage: number; value: number }[];
  vulnerabilities: string[];
  rebalancingRecommendations: string[];
}
