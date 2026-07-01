/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AssetTrend } from "../types";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  ShieldAlert, 
  Activity, 
  Info, 
  Compass, 
  CheckCircle2,
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function TrendAnalysisPanel() {
  const [trends, setTrends] = useState<AssetTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stocks' | 'futures' | 'forex' | 'crypto'>('stocks');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTrends = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setIsRefreshing(true);
      else setLoading(true);

      setError(null);
      const res = await fetch(`/api/asset-trends?refresh=${forceRefresh}`);
      if (!res.ok) {
        throw new Error("无法连接智能趋势数据库，请稍后重试。");
      }
      const data = await res.json();
      setTrends(data.trends || []);
    } catch (err: any) {
      setError(err.message || "趋势分析加载失败");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const activeTrend = trends.find(t => t.assetClass === activeTab);

  const getTrendIconAndLabel = (trend: 'bullish' | 'bearish' | 'neutral' | 'volatile') => {
    switch (trend) {
      case 'bullish':
        return {
          label: "看涨 / Bullish",
          style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: <TrendingUp className="w-4 h-4 text-emerald-400" />
        };
      case 'bearish':
        return {
          label: "看跌 / Bearish",
          style: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          icon: <TrendingDown className="w-4 h-4 text-rose-400" />
        };
      case 'volatile':
        return {
          label: "宽幅震荡 / Volatile",
          style: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          icon: <Activity className="w-4 h-4 text-amber-400" />
        };
      default:
        return {
          label: "区间震荡 / Neutral",
          style: "bg-slate-800 text-slate-300 border-slate-700",
          icon: <Minus className="w-4 h-4 text-slate-400" />
        };
    }
  };

  const getRiskLevelBadge = (level: 'low' | 'medium' | 'high' | 'critical') => {
    switch (level) {
      case 'low':
        return <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">低 / Low</span>;
      case 'medium':
        return <span className="px-2 py-1 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">中 / Medium</span>;
      case 'high':
        return <span className="px-2 py-1 rounded text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">高 / High</span>;
      case 'critical':
        return <span className="px-2 py-1 rounded text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">极高 / Critical</span>;
      default:
        return <span className="px-2 py-1 rounded text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">{level}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-2xl border border-slate-800">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">睿泽智能投顾正在运用量化模型和宏观面进行长短期趋势深度研判...</p>
      </div>
    );
  }

  if (error || !trends.length) {
    return (
      <div className="p-6 bg-rose-950/20 rounded-2xl border border-rose-900/40 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-rose-200 text-sm">趋势加载出错</h4>
          <p className="text-rose-300 text-xs mt-1">{error || "数据结构不匹配"}</p>
          <button 
            onClick={() => fetchTrends(false)}
            className="mt-3 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-medium transition-colors"
          >
            重试加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-2xs space-y-6" id="trends-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h3 className="text-lg font-bold text-white font-display">长短期多资产趋势深度研判</h3>
          <p className="text-slate-400 text-xs mt-0.5">短中期技防阻力与长期宏观基本面双逻辑多维推演</p>
        </div>
        <button
          onClick={() => fetchTrends(true)}
          disabled={isRefreshing}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium border border-slate-800 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? "重算趋势中..." : "重新研判"}
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800 pb-px overflow-x-auto gap-2">
        {(['stocks', 'futures', 'forex', 'crypto'] as const).map((tab) => {
          const item = trends.find(t => t.assetClass === tab);
          const isSelected = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all shrink-0 ${
                isSelected 
                  ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-500/10 rounded-t-lg' 
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {item ? item.nameZh : tab.toUpperCase()}
            </button>
          );
        })}
      </div>

      {activeTrend && (
        <div className="space-y-6">
          {/* Trend Cards (Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Short Term Trend */}
            <div className="p-5 bg-slate-950/40 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">短期走势 (1周-1个月)</span>
                  {(() => {
                    const info = getTrendIconAndLabel(activeTrend.shortTermTrend);
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${info.style}`}>
                        {info.icon}
                        {info.label}
                      </span>
                    );
                  })()}
                </div>
                <h4 className="text-sm font-bold text-slate-200 mb-2 font-display">短期支撑与阻力研判</h4>
                <p className="text-slate-300 text-xs leading-relaxed">{activeTrend.shortTermOutlook}</p>
              </div>
            </div>

            {/* Long Term Trend */}
            <div className="p-5 bg-slate-950/40 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">长期格局 (3个月-1年以上)</span>
                  {(() => {
                    const info = getTrendIconAndLabel(activeTrend.longTermTrend);
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${info.style}`}>
                        {info.icon}
                        {info.label}
                      </span>
                    );
                  })()}
                </div>
                <h4 className="text-sm font-bold text-slate-200 mb-2 font-display">宏观与产业基本面演进</h4>
                <p className="text-slate-300 text-xs leading-relaxed">{activeTrend.longTermOutlook}</p>
              </div>
            </div>
          </div>

          {/* Quant Indicators & Fundamentals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Fundamental Drivers */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Compass className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">核心基本面驱动力</h4>
              </div>
              <ul className="space-y-2">
                {activeTrend.fundamentalDrivers.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed bg-slate-950/30 border border-slate-800 p-2.5 rounded-lg shadow-2xs">
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technical Indicators */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">技术指标雷达</h4>
              </div>
              <ul className="space-y-2">
                {activeTrend.technicalIndicators.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed bg-slate-950/30 border border-slate-800 p-2.5 rounded-lg shadow-2xs">
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <span className="font-mono">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Risks & Advisories Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-3 border-t border-slate-800">
            {/* Risk Column */}
            <div className="lg:col-span-5 p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <h4 className="text-xs font-bold text-rose-400 tracking-wider">市场风险提示</h4>
                </div>
                {getRiskLevelBadge(activeTrend.riskLevel)}
              </div>
              <ul className="space-y-1.5">
                {activeTrend.riskWarnings.map((warning, idx) => (
                  <li key={idx} className="text-[11px] text-rose-300 leading-relaxed flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Advice Column */}
            <div className="lg:col-span-7 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-emerald-400 tracking-wider">投顾操作资产策略建议</h4>
              </div>
              <ul className="space-y-1.5">
                {activeTrend.investmentAdvice.map((advice, idx) => (
                  <li key={idx} className="text-[11px] text-emerald-300 leading-relaxed flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <span>{advice}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-1 justify-end text-[10px] text-slate-500 font-mono">
            <Info className="w-3 h-3" />
            <span>智能量化算法最后研判时间: {new Date(activeTrend.lastUpdated).toLocaleString("zh-CN")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
