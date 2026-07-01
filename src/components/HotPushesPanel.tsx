/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { HotPushTopic } from "../types";
import { 
  Flame, 
  Lightbulb, 
  Target, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2, 
  AlertCircle,
  RefreshCw
} from "lucide-react";

export default function HotPushesPanel() {
  const [pushes, setPushes] = useState<HotPushTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHotPushes = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setIsRefreshing(true);
      else setLoading(true);

      setError(null);
      const res = await fetch(`/api/hot-pushes?refresh=${forceRefresh}`);
      if (!res.ok) {
        throw new Error("无法获取热点板块推送数据。");
      }
      const data = await res.json();
      setPushes(data.hotPushes || []);
    } catch (err: any) {
      setError(err.message || "热点板块加载失败");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHotPushes();
  }, []);

  const getRiskRatingBadge = (rating?: 'low' | 'medium' | 'high') => {
    switch (rating) {
      case 'low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">风险极低</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">风险一般</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">高风险防追高</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">风险待评</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-2xl border border-slate-800">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">睿泽精选分析师团队正在扫描全球热门交易主题和资金异动板块...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-950/20 rounded-2xl border border-rose-900/40 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-rose-200 text-sm">加载热点推送出错</h4>
          <p className="text-rose-300 text-xs mt-1">{error}</p>
          <button 
            onClick={() => fetchHotPushes(false)}
            className="mt-3 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-medium transition-colors"
          >
            重试加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="hot-pushes-section">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white font-display">核心股票热点推送</h3>
          <p className="text-slate-400 text-xs mt-0.5">多因子追踪热钱流向，聚焦本周最核心暴风眼题材</p>
        </div>
        <button
          onClick={() => fetchHotPushes(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-800 transition-colors shadow-2xs disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? "重算板块中..." : "重新筛选"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {pushes.length === 0 ? (
          <div className="xl:col-span-2 text-center py-10 bg-slate-900/20 rounded-2xl border border-slate-800">
            <p className="text-slate-500 text-sm">暂无当前热门板块推送</p>
          </div>
        ) : (
          pushes.map((topic) => (
            <div 
              key={topic.id}
              className="bg-slate-900/40 rounded-2xl border border-slate-800 p-5 shadow-2xs flex flex-col justify-between hover:border-slate-700 transition-shadow"
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-slate-850 text-amber-500 rounded-lg border border-slate-800">
                      <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                    </span>
                    <h4 className="text-base font-bold text-white">{topic.topic}</h4>
                  </div>
                  {getRiskRatingBadge(topic.riskRating)}
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">{topic.description}</p>

                {/* Catalysts */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Lightbulb className="w-3.5 h-3.5 text-gold-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">主升催化剂事件</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(topic.catalysts || []).map((cat, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-950/40 text-slate-300 border border-slate-800 rounded-lg text-[10px] font-medium leading-normal">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Strategy */}
                <div className="space-y-1 bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">首席投顾布局策略</span>
                  </div>
                  <p className="text-slate-200 text-xs font-semibold leading-relaxed pl-5">
                    {topic.recommendedStrategy}
                  </p>
                </div>

                {/* Potential tickers */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">建议重点关注的核心标的:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(topic.potentialTickers || []).map((ticker, idx) => (
                      <div 
                        key={idx}
                        className="p-2.5 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-100 font-mono block">{ticker.ticker}</span>
                          <span className="text-[10px] text-slate-400">{ticker.name}</span>
                        </div>
                        {ticker.impact === 'positive' ? (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            正相关
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            负相关
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Risk Warnings */}
              <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-start gap-2 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-rose-300">特选板块风控警告:</span>
                  <p className="text-[11px] text-rose-300 leading-normal font-medium">{topic.riskWarnings}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
