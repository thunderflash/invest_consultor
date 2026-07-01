/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { NewsItem } from "../types";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  FileText, 
  Layers, 
  Award,
  ExternalLink,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function NewsPanel() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNews = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setIsRefreshing(true);
      else setLoading(true);
      
      setError(null);
      const res = await fetch(`/api/news?refresh=${forceRefresh}`);
      if (!res.ok) {
        throw new Error("无法获取财经新闻数据，请稍后重试。");
      }
      const data = await res.json();
      setNews(data.news || []);
    } catch (err: any) {
      setError(err.message || "获取新闻失败");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const getSentimentBadge = (sentiment: 'bullish' | 'bearish' | 'neutral') => {
    switch (sentiment) {
      case 'bullish':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-3.5 h-3.5" />
            利好 / Bullish
          </span>
        );
      case 'bearish':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <TrendingDown className="w-3.5 h-3.5" />
            利空 / Bearish
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Minus className="w-3.5 h-3.5" />
            中性 / Neutral
          </span>
        );
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { zh: string; style: string }> = {
      stocks: { zh: "股票", style: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
      futures: { zh: "商品期货", style: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
      forex: { zh: "外汇", style: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" },
      crypto: { zh: "加密货币", style: "bg-violet-500/10 text-violet-400 border border-violet-500/20" },
      macro: { zh: "宏观经济", style: "bg-slate-800 text-slate-300 border border-slate-700" },
    };
    const item = labels[category] || { zh: category, style: "bg-slate-800 text-slate-300 border border-slate-700" };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.style}`}>{item.zh}</span>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-2xl border border-slate-800 shadow-xs">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">正在解析华尔街日报、彭博社等权威金融新闻...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-950/20 rounded-2xl border border-rose-900/40 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-rose-200 text-sm">解析出错</h4>
          <p className="text-rose-300 text-xs mt-1">{error}</p>
          <button 
            onClick={() => fetchNews(false)}
            className="mt-3 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-medium transition-colors"
          >
            重试加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="news-section">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white font-display">权威财经热点</h3>
          <p className="text-slate-400 text-xs mt-0.5">自动解析主流金融媒体今日最新焦点资讯</p>
        </div>
        <button
          onClick={() => fetchNews(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-800 transition-colors shadow-2xs disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? "刷新中..." : "刷新解析"}
        </button>
      </div>

      <div className="space-y-4">
        {news.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/20 rounded-2xl border border-slate-800">
            <p className="text-slate-500 text-sm">暂无财经新闻热点</p>
          </div>
        ) : (
          news.map((item) => (
            <div 
              key={item.id || item.title}
              className={`p-5 bg-slate-900/40 rounded-2xl border transition-all hover:border-slate-700 hover:shadow-xs flex flex-col gap-3 ${
                item.sentiment === 'bullish' 
                  ? 'border-l-4 border-l-emerald-500 border-slate-800' 
                  : item.sentiment === 'bearish'
                  ? 'border-l-4 border-l-rose-500 border-slate-800'
                  : 'border-l-4 border-l-slate-600 border-slate-800'
              }`}
            >
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px] font-semibold tracking-wider uppercase font-mono">
                    {item.source}
                  </span>
                  {getCategoryLabel(item.category)}
                </div>
                <div className="flex items-center gap-3">
                  {getSentimentBadge(item.sentiment)}
                  <div className="flex items-center gap-1 text-slate-400" title={`关联重要度: ${item.relevanceScore}/10`}>
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-slate-200 font-mono">{item.relevanceScore}</span>
                    <span className="text-[10px] text-slate-500">/10</span>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h4 className="text-base font-bold text-slate-100 leading-snug">
                {item.title}
              </h4>

              {/* Summary */}
              <p className="text-slate-300 text-xs leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
                {item.summary}
              </p>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800 mt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-medium text-slate-500 mr-1 uppercase tracking-wide">波及标的:</span>
                  {(item.affectedAssets || []).map((asset) => (
                    <span 
                      key={asset}
                      className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[11px] font-mono font-medium"
                    >
                      {asset}
                    </span>
                  ))}
                </div>

                {item.url && (
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noreferrer referrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    查看原文
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
