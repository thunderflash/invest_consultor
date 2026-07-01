/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Compass, 
  Flame, 
  MessageSquare, 
  Briefcase, 
  Grid, 
  LineChart, 
  ShieldAlert, 
  Send, 
  Plus, 
  Trash2, 
  HelpCircle, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Loader2,
  BookOpen,
  PieChart,
  User,
  LogOut,
  Settings,
  Bell,
  Menu,
  X
} from "lucide-react";

import NewsPanel from "./components/NewsPanel";
import TrendAnalysisPanel from "./components/TrendAnalysisPanel";
import HotPushesPanel from "./components/HotPushesPanel";
import { ChatMessage, PortfolioItem, PortfolioAnalysisResult } from "./types";

export default function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'news' | 'trends' | 'pushes' | 'chat' | 'portfolio'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Demo Mode state
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoReason, setDemoReason] = useState<string | null>(null);

  // Check demo mode status on mount
  useEffect(() => {
    const checkDemoMode = async () => {
      try {
        const res = await fetch("/api/news?refresh=false");
        if (res.ok) {
          const data = await res.json();
          if (data.isDemoMode) {
            setIsDemoMode(true);
            setDemoReason(data.demoReason || null);
          } else {
            setIsDemoMode(false);
            setDemoReason(null);
          }
        }
      } catch (err) {
        console.warn("Could not fetch initial demo mode status", err);
      }
    };
    checkDemoMode();
  }, []);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "agent",
      content: "您好！我是您的智能投资顾问“睿泽”。我已成功连接全球主流金融媒体（WSJ、彭博社、路透社等）的实事资讯渠道及最新多资产技术指标数据库。\n\n无论是美联储宏观政策的推演、跨资产（股票/商品/外汇/加密货币）的长短期趋势研判、热门题材个股捕捉，还是针对您的专属持仓组合进行【风险雷达调仓诊断】，我都能为您提供严谨温和的专业分析。今天您有什么想探讨的话题吗？",
      timestamp: new Date().toLocaleTimeString("zh-CN", { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Portfolio state with pre-populated values for immediate usability
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([
    { id: "1", name: "苹果公司 / Apple Inc.", ticker: "AAPL", assetClass: "stocks", amount: 20, purchasePrice: 175, currentPrice: 234.5 },
    { id: "2", name: "SPDR 黄金信托 / Gold ETF", ticker: "GLD", assetClass: "futures", amount: 15, purchasePrice: 195, currentPrice: 242.8 },
    { id: "3", name: "比特币 / Bitcoin", ticker: "BTC", assetClass: "crypto", amount: 0.25, purchasePrice: 62000, currentPrice: 96450 },
    { id: "4", name: "欧元兑美元 / EURUSD", ticker: "EURUSD", assetClass: "forex", amount: 10000, purchasePrice: 1.08, currentPrice: 1.052 }
  ]);
  
  // Portfolio form state
  const [newItemName, setNewItemName] = useState("");
  const [newItemTicker, setNewItemTicker] = useState("");
  const [newItemAssetClass, setNewItemAssetClass] = useState<'stocks' | 'futures' | 'forex' | 'crypto'>('stocks');
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemPurchasePrice, setNewItemPurchasePrice] = useState("");
  const [newItemCurrentPrice, setNewItemCurrentPrice] = useState("");

  const [portfolioAnalysis, setPortfolioAnalysis] = useState<PortfolioAnalysisResult | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  // Live watchlist state that ticks in real-time
  const [watchlist, setWatchlist] = useState([
    { ticker: "BTC/USD", price: 96450, change: 2.1, precision: 0 },
    { ticker: "AAPL", price: 294.00, change: 0.8, precision: 2 },
    { ticker: "GCZ6 (GOLD)", price: 2630.50, change: -0.4, precision: 2 }
  ]);
  
  // Track visual flash triggers for ticking items
  const [lastTickTicks, setLastTickTicks] = useState<{ [key: string]: 'up' | 'down' | null }>({});

  useEffect(() => {
    const fetchWatchlistPrices = async () => {
      try {
        const res = await fetch("/api/watchlist-prices");
        if (res.ok) {
          const data = await res.json();
          if (data && data.watchlist) {
            setWatchlist(prev => {
              return prev.map(oldItem => {
                const newItem = data.watchlist.find((x: any) => x.ticker === oldItem.ticker);
                if (newItem) {
                  // If the price has actually changed, flash the background!
                  if (oldItem.price !== newItem.price) {
                    const isUp = newItem.price > oldItem.price;
                    setLastTickTicks(prevTicks => ({
                      ...prevTicks,
                      [newItem.ticker]: isUp ? 'up' : 'down'
                    }));
                    setTimeout(() => {
                      setLastTickTicks(prevTicks => ({
                        ...prevTicks,
                        [newItem.ticker]: null
                      }));
                    }, 800);
                  }
                  return {
                    ...oldItem,
                    price: newItem.price,
                    change: newItem.change
                  };
                }
                return oldItem;
              });
            });
          }
        }
      } catch (err) {
        console.warn("Failed to fetch watchlist prices:", err);
      }
    };

    // Initial fetch immediately
    fetchWatchlistPrices();

    // Fetch every 15 seconds for true real-time updates
    const interval = setInterval(fetchWatchlistPrices, 15000);

    return () => clearInterval(interval);
  }, []);

  // Keep a ref of the portfolio to avoid stale closures in intervals
  const portfolioRef = useRef(portfolio);
  useEffect(() => {
    portfolioRef.current = portfolio;
  }, [portfolio]);

  const fetchPortfolioPrices = async (currentPortfolioList = portfolioRef.current) => {
    if (currentPortfolioList.length === 0) return;
    try {
      const response = await fetch("/api/portfolio/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: currentPortfolioList })
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.prices) {
          setPortfolio(prev => {
            let changed = false;
            const next = prev.map(item => {
              const updated = data.prices.find((p: any) => p.id === item.id);
              if (updated && updated.currentPrice !== undefined && updated.currentPrice !== item.currentPrice) {
                changed = true;
                return {
                  ...item,
                  currentPrice: updated.currentPrice
                };
              }
              return item;
            });
            return changed ? next : prev;
          });
        }
      }
    } catch (e) {
      console.warn("Failed to fetch live prices for portfolio:", e);
    }
  };

  useEffect(() => {
    // Initial fetch of portfolio prices
    fetchPortfolioPrices(portfolioRef.current);

    // Fetch every 20 seconds
    const interval = setInterval(() => {
      fetchPortfolioPrices(portfolioRef.current);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // Quick prompt questions
  const quickQuestions = [
    "美联储近期利差变化对黄金和加密货币有哪些深远影响？",
    "近期热门的半导体人工智能板块（如英伟达）是否面临估值过高的追高风险？",
    "帮我研判一下美元指数（DXY）和欧元、人民币汇率的长期走势逻辑。",
    "如果通胀预期卷土重来，应该对商品期货（黄金/原油）做什么对冲配置？"
  ];

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Chat message submission
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputMessage).trim();
    if (!content) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      content,
      timestamp: new Date().toLocaleTimeString("zh-CN", { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setChatLoading(true);

    try {
      const chatHistoryToSend = [...chatMessages, userMsg].map(msg => ({
        sender: msg.sender,
        content: msg.content
      }));

      const response = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistoryToSend })
      });

      if (!response.ok) {
        throw new Error("投资顾问服务开小差了，请稍候再试。");
      }

      const data = await response.json();
      
      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: '2-digit', minute: '2-digit' }),
        references: data.references
      };

      setChatMessages(prev => [...prev, agentMsg]);
      if (data.isDemoMode) {
        setIsDemoMode(true);
        setDemoReason(data.demoReason || null);
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        content: `抱歉，与智能投顾服务器连接中断。错误提示: ${err.message || "请求失败"}。请检查您的 GEMINI_API_KEY 配置是否正确。`,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Portfolio Management
  const addPortfolioItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemTicker || !newItemAmount || !newItemPurchasePrice || !newItemCurrentPrice) return;

    const item: PortfolioItem = {
      id: Date.now().toString(),
      name: newItemName,
      ticker: newItemTicker.toUpperCase(),
      assetClass: newItemAssetClass,
      amount: parseFloat(newItemAmount),
      purchasePrice: parseFloat(newItemPurchasePrice),
      currentPrice: parseFloat(newItemCurrentPrice)
    };

    setPortfolio(prev => [...prev, item]);
    
    // Reset form
    setNewItemName("");
    setNewItemTicker("");
    setNewItemAmount("");
    setNewItemPurchasePrice("");
    setNewItemCurrentPrice("");
  };

  const removePortfolioItem = (id: string) => {
    setPortfolio(prev => prev.filter(item => item.id !== id));
  };

  // Fetch portfolio analysis from backend
  const triggerPortfolioAnalysis = async () => {
    setPortfolioLoading(true);
    setPortfolioError(null);
    try {
      const response = await fetch("/api/portfolio/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: portfolio })
      });

      if (!response.ok) {
        throw new Error("无法连接智能调仓模型，请确保服务端正常工作。");
      }

      const data = await response.json();
      setPortfolioAnalysis(data);
      if (data.isDemoMode) {
        setIsDemoMode(true);
        setDemoReason(data.demoReason || null);
      }
    } catch (err: any) {
      setPortfolioError(err.message || "投资组合诊断出错");
    } finally {
      setPortfolioLoading(false);
    }
  };

  // Auto-run analysis when portfolio page opens, or when portfolio changes/prices update
  const portfolioHash = portfolio.map(item => `${item.id}:${item.currentPrice}`).join(",");
  useEffect(() => {
    if (portfolio.length > 0) {
      triggerPortfolioAnalysis();
    } else {
      setPortfolioAnalysis(null);
    }
  }, [portfolioHash]);

  const calculateTotalValue = () => {
    return portfolio.reduce((sum, item) => sum + (item.amount * item.currentPrice), 0);
  };

  const calculateTotalCost = () => {
    return portfolio.reduce((sum, item) => sum + (item.amount * item.purchasePrice), 0);
  };

  const totalValue = calculateTotalValue();
  const totalCost = calculateTotalCost();
  const totalProfitLoss = totalValue - totalCost;
  const totalProfitLossPercentage = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#020617] text-[#f1f5f9] flex flex-col font-sans" id="app-root">
      {/* Upper Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 hover:bg-slate-900 rounded-lg text-slate-400"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/15 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight font-display flex items-center gap-1.5">
                睿泽投顾 AI
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-1.5 py-0.5 rounded font-mono border border-indigo-500/30">
                  AGENT PRO
                </span>
              </h1>
              <p className="text-[10px] text-slate-400">权威财经解密 · 多资产多维投顾系统</p>
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className="hidden lg:flex items-center gap-6 font-mono text-xs">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/40 rounded-lg border border-slate-800">
            <span className="text-slate-500">今日日期:</span>
            <span className="text-slate-300 font-semibold">{new Date().toLocaleDateString("zh-CN")}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/40 rounded-lg border border-slate-800">
            <span className="text-slate-500">系统时区:</span>
            <span className="text-emerald-400 font-semibold">UTC+8 (正常)</span>
          </div>
        </div>

        {/* Header Right */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 cursor-pointer relative" title="系统通知">
            <Bell className="w-4 h-4 text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
          </div>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-300 font-bold text-xs">
              RU
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-semibold text-slate-200 block leading-tight">首席研究员</span>
              <span className="text-[10px] text-slate-400 block">高级VIP账号</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className={`
          fixed inset-y-0 left-0 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-30
          w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0
        `}>
          <div className="space-y-6">
            <div className="px-2 pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">主控功能控制台</span>
              <nav className="space-y-1.5">
                <button
                  onClick={() => { setCurrentTab('dashboard'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    currentTab === 'dashboard' 
                      ? 'bg-indigo-500/10 text-indigo-400 border-l-4 border-indigo-500 font-bold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  智能沙盘总览
                </button>
                <button
                  onClick={() => { setCurrentTab('news'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    currentTab === 'news' 
                      ? 'bg-indigo-500/10 text-indigo-400 border-l-4 border-indigo-500 font-bold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  今日权威风向
                </button>
                <button
                  onClick={() => { setCurrentTab('trends'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    currentTab === 'trends' 
                      ? 'bg-indigo-500/10 text-indigo-400 border-l-4 border-indigo-500 font-bold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <LineChart className="w-4 h-4" />
                  多资产趋势研判
                </button>
                <button
                  onClick={() => { setCurrentTab('pushes'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    currentTab === 'pushes' 
                      ? 'bg-indigo-500/10 text-indigo-400 border-l-4 border-indigo-500 font-bold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  暴风眼核心题材
                </button>
              </nav>
            </div>

            <div className="px-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">持仓诊断及对谈</span>
              <nav className="space-y-1.5">
                <button
                  onClick={() => { setCurrentTab('chat'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    currentTab === 'chat' 
                      ? 'bg-indigo-500/10 text-indigo-400 border-l-4 border-indigo-500 font-bold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4" />
                    睿泽智能对话窗
                  </div>
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                </button>
                <button
                  onClick={() => { setCurrentTab('portfolio'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    currentTab === 'portfolio' 
                      ? 'bg-indigo-500/10 text-indigo-400 border-l-4 border-indigo-500 font-bold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  配置调仓诊断
                </button>
              </nav>
            </div>

            {/* Core Ticker Quick Lookout */}
            <div className="px-2 pt-4 border-t border-slate-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">LIVE WATCHLISTS</span>
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
              </div>
              <div className="space-y-1 text-xs font-mono">
                {watchlist.map((item) => {
                  const isPositive = item.change >= 0;
                  const flash = lastTickTicks[item.ticker];
                  let bgClass = "bg-slate-900/35 border-slate-900/50";
                  if (flash === 'up') bgClass = "bg-emerald-950/30 border-emerald-500/40 shadow-xs";
                  if (flash === 'down') bgClass = "bg-rose-950/30 border-rose-500/40 shadow-xs";

                  return (
                    <div 
                      key={item.ticker} 
                      className={`flex items-center justify-between p-1.5 rounded border transition-all duration-300 ${bgClass}`}
                    >
                      <span className="text-slate-400 text-[11px] font-medium">{item.ticker}</span>
                      <span className={`font-bold transition-colors duration-300 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                        ${item.price.toLocaleString("en-US", { minimumFractionDigits: item.precision, maximumFractionDigits: item.precision })} 
                        <span className="text-[10px] ml-1 font-semibold">
                          ({isPositive ? "+" : ""}{item.change.toFixed(2)}%)
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-400 leading-normal">
              <span className="font-bold text-slate-200 block mb-1">💡 理性合规声明</span>
              智能投顾研判由多路谷歌搜索和 Gemini 模型交叉计算得出，仅作学术及配置参考。
            </div>
            <div className="text-[11px] text-slate-500 font-mono text-center pt-2">
              Ruize Financial Advisor v2.4
            </div>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-8">
          
          {/* Demo Mode Notice Bar */}
          {isDemoMode && (
            <div className="bg-indigo-950/45 border border-indigo-500/20 rounded-2xl p-5 flex items-start gap-3.5 animate-fade-in shadow-lg">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-100 flex flex-wrap items-center gap-2">
                  策略沙盘正以本地内置多因子财经模型运行 (策略演练中)
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-500/30 font-mono tracking-wider">
                    DEMO MODE
                  </span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {demoReason || "系统未检测到 GEMINI_API_KEY 环境变量。已为您加载了多因子离线资产沙盘及宏观策略。"}
                </p>
                <p className="text-xs text-slate-400 leading-normal">
                  💡 <b>操作指引：</b>若要启用由 <b>Gemma-4-26B 免费版</b> 驱动的【实时全球财经检索穿透】、【资产长短期趋势量化研判】 and 持仓组合的【AI调仓定制雷达】，请在屏幕右下角点击 <b>Settings &gt; Secrets</b> 配置您的 <b>GEMINI_API_KEY</b>，刷新即可激活全网实时流。
                </p>
              </div>
            </div>
          )}
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {currentTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              {/* Main Welcome Hero */}
              <section className="relative overflow-hidden p-6 md:p-8 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    多因子量化 + 宏观情报双向流
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display">
                    智能财富决策沙盘，助您理智执掌变局
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    欢迎来到睿泽智能。系统已完成对华尔街日报、彭博社等权威终端今日焦点解析，并将数据与短、中、长期资产技术雷达无缝绑定。
                  </p>
                </div>
                <button 
                  onClick={() => setCurrentTab('chat')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-indigo-500/20 shrink-0 inline-flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  开启AI投顾对话
                </button>
              </section>

              {/* Dynamic Overview Cards (Portfolio brief + Quick Stats) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">我的实盘模拟市值</span>
                      <Briefcase className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-2xl font-black font-mono text-slate-100">${totalValue.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500">累计损益额</span>
                    <span className={`font-mono font-bold ${totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {totalProfitLoss >= 0 ? "+" : ""}${totalProfitLoss.toLocaleString("en-US", { maximumFractionDigits: 1 })} 
                      ({totalProfitLossPercentage >= 0 ? "+" : ""}{totalProfitLossPercentage.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">最新今日要闻流</span>
                      <Activity className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-xs text-slate-200 font-semibold leading-relaxed line-clamp-2">
                      美联储货币纪要暗示未来宽限空间，核心非农数据仍是风控锚点。
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500">解析评级</span>
                    <span className="text-slate-300 font-semibold">5个高可信度事件</span>
                  </div>
                </div>

                <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">投顾风险配置雷达</span>
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-black font-mono text-slate-100">
                        {portfolioAnalysis ? portfolioAnalysis.overallRiskScore : "65"}
                      </div>
                      <span className="text-xs text-slate-400">/ 100 风险分数</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500">分散化评级</span>
                    <span className="text-indigo-400 font-bold uppercase">
                      {portfolioAnalysis ? portfolioAnalysis.diversificationRating : "良好 / Good"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bento Grid: Main panels merged as preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                {/* News Preview */}
                <div className="lg:col-span-7 bg-slate-900/40 rounded-2xl border border-slate-800 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white font-display">权威财经风向标</h3>
                    <button 
                      onClick={() => setCurrentTab('news')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      查看完整资讯
                      <X className="w-3 h-3 rotate-45" />
                    </button>
                  </div>
                  <NewsPanel />
                </div>

                {/* Hot Pusher Preview */}
                <div className="lg:col-span-5 bg-slate-900/40 rounded-2xl border border-slate-800 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white font-display">本周暴风眼题材</h3>
                    <button 
                      onClick={() => setCurrentTab('pushes')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      查看精选个股
                      <X className="w-3 h-3 rotate-45" />
                    </button>
                  </div>
                  <HotPushesPanel />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NEWS */}
          {currentTab === 'news' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <NewsPanel />
            </div>
          )}

          {/* TAB 3: TRENDS */}
          {currentTab === 'trends' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <TrendAnalysisPanel />
            </div>
          )}

          {/* TAB 4: HOT PUSHES */}
          {currentTab === 'pushes' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <HotPushesPanel />
            </div>
          )}

          {/* TAB 5: AI INTERACTIVE CHAT ADVISOR */}
          {currentTab === 'chat' && (
            <div className="space-y-6 max-w-4xl mx-auto flex flex-col h-[calc(100vh-10rem)] bg-slate-900/20 rounded-2xl border border-slate-800 overflow-hidden" id="chat-frame">
              {/* Chat Title bar */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">睿泽 (Ruize) · 实时金融对谈系统</h3>
                    <p className="text-[10px] text-slate-400">结合谷歌实时搜索，为您提供最深度的宏观研判与个股剖析</p>
                  </div>
                </div>
                <button 
                  onClick={() => setChatMessages([
                    {
                      id: "welcome",
                      sender: "agent",
                      content: "您好！我是您的智能投资顾问“睿泽”。我已重新连接多路资讯渠道，随时准备解答您的提问。请问您今天想聊聊什么？",
                      timestamp: new Date().toLocaleTimeString("zh-CN", { hour: '2-digit', minute: '2-digit' })
                    }
                  ])}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-900 rounded-md transition-colors"
                >
                  清空历史
                </button>
              </div>

              {/* Chat messages stream */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6" id="messages-container">
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex gap-3.5 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      msg.sender === 'user' 
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>

                    {/* Content Speech Bubble */}
                    <div className="space-y-1.5">
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-900/60 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                      }`}>
                        {msg.content}
                      </div>

                      {/* References / Grounding citations */}
                      {msg.references && msg.references.length > 0 && (
                        <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-[10px] space-y-1.5 mt-2">
                          <span className="font-bold text-slate-500 uppercase tracking-wider block">🔍 AI 搜索情报参考源:</span>
                          <div className="flex flex-wrap gap-2">
                            {msg.references.map((ref, i) => (
                              <a 
                                key={i}
                                href={ref.uri} 
                                target="_blank" 
                                rel="noreferrer referrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 rounded transition-colors"
                              >
                                {ref.title}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <span className="text-[9px] text-slate-500 block text-right font-mono px-1">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-3.5 mr-auto">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                    </div>
                    <div className="p-4 bg-slate-900/30 border border-slate-800/60 rounded-2xl rounded-tl-none flex items-center gap-2">
                      <span className="text-slate-400 text-xs">睿泽正在全网搜寻权威财经资料并为您进行多因子交叉解密...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              {chatMessages.length === 1 && (
                <div className="p-4 border-t border-slate-900 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">💡 推荐深度提问词:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {quickQuestions.map((q, i) => (
                      <button 
                        key={i}
                        onClick={() => handleSendMessage(q)}
                        className="text-left p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-300 hover:text-white transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input form */}
              <div className="p-4 bg-slate-950 border-t border-slate-800">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="flex gap-2"
                >
                  <input 
                    type="text" 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="输入股票、期货、汇率、数字货币代码或提问词，睿泽在线为您解答..."
                    disabled={chatLoading}
                    className="flex-1 px-4 py-2.5 bg-slate-900/60 focus:bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden transition-all disabled:opacity-55"
                  />
                  <button 
                    type="submit" 
                    disabled={chatLoading || !inputMessage.trim()}
                    className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-900 text-white disabled:text-slate-500 rounded-xl flex items-center justify-center transition-colors shadow-md disabled:shadow-none"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 6: PORTFOLIO DIAGNOSTIC CENTER */}
          {currentTab === 'portfolio' && (
            <div className="space-y-8 max-w-5xl mx-auto animate-fade-in" id="portfolio-frame">
              
              {/* Header section with Stats */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg font-bold text-white font-display">配置调仓及风险诊断雷达</h3>
                  <p className="text-slate-400 text-xs mt-0.5">多路谷歌搜索和 Gemini 模型交叉计算得出您的资产配置、分散评级与漏洞缺陷</p>
                </div>
                <button
                  onClick={triggerPortfolioAnalysis}
                  disabled={portfolioLoading || portfolio.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold border border-indigo-500/20 transition-colors shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {portfolioLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {portfolioLoading ? "重新对齐计算中..." : "重新运行雷达诊断"}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left side: Assets Manager Table & Adding Positions */}
                <div className="lg:col-span-6 space-y-6">
                  
                  {/* Portfolio Valuation Header */}
                  <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-500 block">组合总市值</span>
                      <span className="text-lg font-extrabold font-mono text-slate-100">${totalValue.toLocaleString("en-US", { maximumFractionDigits: 1 })}</span>
                    </div>
                    <div className="text-center border-x border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 block">买入总成本</span>
                      <span className="text-lg font-extrabold font-mono text-slate-200">${totalCost.toLocaleString("en-US", { maximumFractionDigits: 1 })}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-500 block">累计损益百分比</span>
                      <span className={`text-lg font-extrabold font-mono block ${totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {totalProfitLoss >= 0 ? "+" : ""}{totalProfitLossPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Portfolio table */}
                  <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">我的实盘模拟持仓表</h4>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-mono">{portfolio.length} 个标的</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800/80 text-[10px] text-slate-400 font-mono">
                            <th className="px-4 py-3">代码/标的</th>
                            <th className="px-4 py-3">类别</th>
                            <th className="px-4 py-3 text-right">持有量</th>
                            <th className="px-4 py-3 text-right">买入均价</th>
                            <th className="px-4 py-3 text-right">最新市价</th>
                            <th className="px-4 py-3 text-center">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-xs">
                          {portfolio.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-10 text-slate-500">
                                目前持仓为空，请在下方添加资产。
                              </td>
                            </tr>
                          ) : (
                            portfolio.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-900/20 transition-colors">
                                <td className="px-4 py-3">
                                  <span className="font-bold text-slate-100 font-mono block">{item.ticker}</span>
                                  <span className="text-[10px] text-slate-400">{item.name}</span>
                                </td>
                                <td className="px-4 py-3 capitalize">
                                  {item.assetClass === 'stocks' && <span className="text-blue-400">股票</span>}
                                  {item.assetClass === 'futures' && <span className="text-amber-400">期货</span>}
                                  {item.assetClass === 'forex' && <span className="text-indigo-400">外汇</span>}
                                  {item.assetClass === 'crypto' && <span className="text-violet-400">加密货币</span>}
                                </td>
                                <td className="px-4 py-3 text-right font-mono">{item.amount}</td>
                                <td className="px-4 py-3 text-right font-mono">${item.purchasePrice}</td>
                                <td className="px-4 py-3 text-right font-mono">${item.currentPrice}</td>
                                <td className="px-4 py-3 text-center">
                                  <button 
                                    onClick={() => removePortfolioItem(item.id)}
                                    className="p-1 text-slate-500 hover:text-rose-400 rounded-md hover:bg-slate-950 transition-colors"
                                    title="删除仓位"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Add Position Form */}
                  <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-indigo-400" />
                      添加新的模拟仓位/资产
                    </h4>
                    
                    <form onSubmit={addPortfolioItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">资产中文名称</label>
                        <input 
                          type="text" 
                          required
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder="例如：英伟达股份"
                          className="w-full px-3 py-1.5 bg-slate-950 focus:bg-slate-900 border border-slate-850 rounded-lg text-xs focus:outline-hidden text-slate-200 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">英文代码 / Ticker</label>
                        <input 
                          type="text" 
                          required
                          value={newItemTicker}
                          onChange={(e) => setNewItemTicker(e.target.value)}
                          placeholder="例如：NVDA"
                          className="w-full px-3 py-1.5 bg-slate-950 focus:bg-slate-900 border border-slate-850 rounded-lg text-xs focus:outline-hidden text-slate-200 focus:border-indigo-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">资产类别</label>
                        <select 
                          value={newItemAssetClass}
                          onChange={(e) => setNewItemAssetClass(e.target.value as any)}
                          className="w-full px-3 py-1.5 bg-slate-950 focus:bg-slate-900 border border-slate-850 rounded-lg text-xs focus:outline-hidden text-slate-200 focus:border-indigo-500"
                        >
                          <option value="stocks">股票 (Stocks)</option>
                          <option value="futures">商品期货 (Futures)</option>
                          <option value="forex">外汇 (Forex)</option>
                          <option value="crypto">加密货币 (Crypto)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">持有数量 / Amount</label>
                        <input 
                          type="number" 
                          step="any"
                          required
                          value={newItemAmount}
                          onChange={(e) => setNewItemAmount(e.target.value)}
                          placeholder="持有份额"
                          className="w-full px-3 py-1.5 bg-slate-950 focus:bg-slate-900 border border-slate-850 rounded-lg text-xs focus:outline-hidden text-slate-200 focus:border-indigo-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">买入均价 ($)</label>
                        <input 
                          type="number" 
                          step="any"
                          required
                          value={newItemPurchasePrice}
                          onChange={(e) => setNewItemPurchasePrice(e.target.value)}
                          placeholder="成本均价"
                          className="w-full px-3 py-1.5 bg-slate-950 focus:bg-slate-900 border border-slate-850 rounded-lg text-xs focus:outline-hidden text-slate-200 focus:border-indigo-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">当前市价 ($)</label>
                        <input 
                          type="number" 
                          step="any"
                          required
                          value={newItemCurrentPrice}
                          onChange={(e) => setNewItemCurrentPrice(e.target.value)}
                          placeholder="最新市价"
                          className="w-full px-3 py-1.5 bg-slate-950 focus:bg-slate-900 border border-slate-850 rounded-lg text-xs focus:outline-hidden text-slate-200 focus:border-indigo-500 font-mono"
                        />
                      </div>
                      
                      <div className="col-span-1 md:col-span-2 pt-2">
                        <button 
                          type="submit"
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          确认添加该仓位
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Right side: AI Diagnostic results */}
                <div className="lg:col-span-6 space-y-6">
                  {portfolioLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-slate-900/20 rounded-2xl border border-slate-800">
                      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                      <p className="text-slate-400 text-sm font-semibold">正在调取睿泽AI资产配置诊断雷达...</p>
                      <p className="text-slate-500 text-[11px] mt-2">分析各资产暴露，计算风险模型与大类比率中</p>
                    </div>
                  ) : portfolioError ? (
                    <div className="p-6 bg-rose-950/20 rounded-2xl border border-rose-900/40 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-rose-200 text-sm">资产诊断中心出错</h4>
                        <p className="text-rose-300 text-xs mt-1">{portfolioError}</p>
                        <button 
                          onClick={triggerPortfolioAnalysis}
                          className="mt-3 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-medium transition-colors"
                        >
                          重试重新分析
                        </button>
                      </div>
                    </div>
                  ) : !portfolioAnalysis ? (
                    <div className="text-center py-20 bg-slate-900/20 rounded-2xl border border-slate-800 p-6 space-y-4">
                      <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
                      <div>
                        <h4 className="font-bold text-slate-300">暂无组合诊断数据</h4>
                        <p className="text-slate-500 text-xs mt-1">在左侧持仓表中添加一些资产，睿泽投顾雷达将自动进行量化评估。</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      {/* Risk rating and Summary Card */}
                      <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">诊断报告总评</h4>
                          <div className="flex items-center gap-3">
                            <div className="px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold font-mono">
                              风险评分: {portfolioAnalysis.overallRiskScore}
                            </div>
                            <div className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase">
                              分散化: {portfolioAnalysis.diversificationRating}
                            </div>
                          </div>
                        </div>

                        <p className="text-slate-200 text-xs leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                          {portfolioAnalysis.analysisSummary}
                        </p>
                      </div>

                      {/* Distribution breakdown */}
                      <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">大类资产暴露分配比例</h4>
                        
                        <div className="space-y-3">
                          {portfolioAnalysis.assetClassDistribution?.map((dist, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-mono">
                                <span className="capitalize text-slate-300 font-bold">
                                  {dist.assetClass === 'stocks' && "全球股票 (Stocks)"}
                                  {dist.assetClass === 'futures' && "商品期货 (Futures)"}
                                  {dist.assetClass === 'forex' && "外汇资产 (Forex)"}
                                  {dist.assetClass === 'crypto' && "加密资产 (Crypto)"}
                                </span>
                                <span className="text-slate-200 font-semibold">{dist.percentage}% (${dist.value?.toLocaleString("en-US", { maximumFractionDigits: 1 })})</span>
                              </div>
                              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    dist.assetClass === 'stocks' ? 'bg-blue-500' :
                                    dist.assetClass === 'futures' ? 'bg-amber-500' :
                                    dist.assetClass === 'forex' ? 'bg-indigo-500' :
                                    'bg-violet-500'
                                  }`}
                                  style={{ width: `${dist.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Vulnerabilities & Rebalancing advice */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Vulnerabilities */}
                        <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 space-y-3">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                            <h4 className="text-xs font-bold text-rose-300 tracking-wider">风险与漏洞警告</h4>
                          </div>
                          <ul className="space-y-2">
                            {portfolioAnalysis.vulnerabilities?.map((vuln, idx) => (
                              <li key={idx} className="text-[11px] text-rose-300 leading-normal flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                                <span>{vuln}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Rebalancing suggestions */}
                        <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-xs font-bold text-emerald-300 tracking-wider">AI 投资再平衡操作路线</h4>
                          </div>
                          <ul className="space-y-2">
                            {portfolioAnalysis.rebalancingRecommendations?.map((rebal, idx) => (
                              <li key={idx} className="text-[11px] text-emerald-300 leading-normal flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                                <span>{rebal}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
