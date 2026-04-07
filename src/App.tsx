import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart as PieChartIcon,
  History,
  Plus,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles,
  Loader2,
  Github,
  Facebook,
  Mail,
  Bell,
  Home,
  BarChart3,
  Target,
  Settings,
  CreditCard,
  Utensils,
  Bus,
  Smartphone,
  ShoppingBag,
  HeartPulse,
  MoreHorizontal
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { Transaction, TransactionType, Category, CATEGORIES } from './types';
import { cn } from './lib/utils';

const COLORS = [
  '#3b82f6', '#10b981', '#ef4444', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'
];

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('wealthwise_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<Category>('খাবার');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState('home');

  // Gemini AI Initialization
  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }), []);

  const generateInsights = async () => {
    if (transactions.length === 0) return;
    
    setIsAiLoading(true);
    try {
      const summary = transactions.map(t => `${t.type === 'income' ? 'আয়' : 'ব্যয়'}: ${t.amount} টাকা (${t.category}) - ${t.text}`).join('\n');
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `আপনি একজন আর্থিক বিশেষজ্ঞ। এখানে একজন ব্যবহারকারীর সাম্প্রতিক লেনদেনের তালিকা দেওয়া হলো:\n${summary}\n\nবর্তমান ব্যালেন্স: ${balance} টাকা।\n\nএই তথ্যের ভিত্তিতে ব্যবহারকারীকে ৩-৪টি ছোট এবং কার্যকর আর্থিক পরামর্শ দিন বাংলায়। পরামর্শগুলো বন্ধুত্বপূর্ণ এবং উৎসাহব্যঞ্জক হতে হবে।`,
      });
      
      setAiInsights(response.text || "দুঃখিত, এই মুহূর্তে কোনো পরামর্শ তৈরি করা সম্ভব হয়নি।");
    } catch (error) {
      console.error("Gemini AI Error:", error);
      setAiInsights("AI পরামর্শ পেতে সমস্যা হচ্ছে। অনুগ্রহ করে পরে চেষ্টা করুন।");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Persistence
  useEffect(() => {
    localStorage.setItem('wealthwise_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Calculations
  const { income, expenses, balance } = useMemo(() => {
    const now = new Date();
    const filtered = transactions.filter(t => {
      const tDate = new Date(t.date);
      if (filter === 'today') return tDate.toDateString() === now.toDateString();
      if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return tDate >= weekAgo;
      }
      if (filter === 'month') return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      if (filter === 'year') return tDate.getFullYear() === now.getFullYear();
      return true;
    });

    const inc = filtered
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const exp = filtered
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return { income: inc, expenses: exp, balance: inc - exp };
  }, [transactions, filter]);

  const chartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });
    
    return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const barChartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.toLocaleString('bn-BD', { month: 'short' }),
        income: 0,
        expense: 0,
        timestamp: d.getTime()
      };
    }).reverse();

    transactions.forEach(t => {
      const tDate = new Date(t.date);
      const monthIndex = last6Months.findIndex(m => {
        const mDate = new Date(m.timestamp);
        return tDate.getMonth() === mDate.getMonth() && tDate.getFullYear() === mDate.getFullYear();
      });
      if (monthIndex !== -1) {
        if (t.type === 'income') last6Months[monthIndex].income += t.amount;
        else last6Months[monthIndex].expense += t.amount;
      }
    });

    return last6Months;
  }, [transactions]);

  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case 'খাবার': return <Utensils size={18} />;
      case 'যাতায়াত': return <Bus size={18} />;
      case 'মোবাইল/ইন্টারনেট': return <Smartphone size={18} />;
      case 'বাজার': return <ShoppingBag size={18} />;
      case 'স্বাস্থ্য': return <HeartPulse size={18} />;
      case 'কেনাকাটা': return <ShoppingBag size={18} />;
      case 'বেতন': return <TrendingUp size={18} />;
      case 'বিনিয়োগ': return <TrendingUp size={18} />;
      default: return <MoreHorizontal size={18} />;
    }
  };

  const addTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !amount) return;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      text,
      amount: parseFloat(amount),
      type,
      category,
      date: new Date().toISOString(),
    };

    setTransactions([newTransaction, ...transactions]);
    setText('');
    setAmount('');
    setIsFormOpen(false);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100 pb-24">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-100 shadow-sm">
              <img 
                src="https://picsum.photos/seed/mehedi/200/200" 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">আয় ও ব্যয়ের হিসাব</h1>
              <p className="text-slate-400 text-xs font-medium">আজকের আর্থিক সারাংশ</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
          </div>
        </header>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'today', label: 'আজ' },
            { id: 'week', label: 'সপ্তাহ' },
            { id: 'month', label: 'মাস' },
            { id: 'year', label: 'বছর' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as any)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                filter === t.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                  : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Stats & Charts */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Summary Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Income Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm">
                    <ArrowUpRight size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">মোট আয়</span>
                </div>
                <h3 className="text-2xl font-black text-emerald-900">
                  ৳{income.toLocaleString('bn-BD')}
                </h3>
              </motion.div>

              {/* Expense Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white rounded-xl text-rose-600 shadow-sm">
                    <ArrowDownLeft size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest">মোট ব্যয়</span>
                </div>
                <h3 className="text-2xl font-black text-rose-900">
                  ৳{expenses.toLocaleString('bn-BD')}
                </h3>
              </motion.div>

              {/* Balance Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white rounded-xl text-blue-600 shadow-sm">
                    <Wallet size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">ব্যালেন্স</span>
                </div>
                <h3 className="text-2xl font-black text-blue-900">
                  ৳{balance.toLocaleString('bn-BD')}
                </h3>
              </motion.div>
            </div>

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => { setType('income'); setIsFormOpen(true); }}
                className="flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 text-emerald-600 p-4 rounded-2xl font-bold border border-emerald-100 transition-all active:scale-95 shadow-sm"
              >
                <Plus size={18} />
                আয় যোগ করুন
              </button>
              <button 
                onClick={() => { setType('expense'); setIsFormOpen(true); }}
                className="flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-rose-600 p-4 rounded-2xl font-bold border border-rose-100 transition-all active:scale-95 shadow-sm"
              >
                <Plus size={18} />
                ব্যয় যোগ করুন
              </button>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Pie Chart Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100"
              >
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <PieChartIcon size={18} className="text-blue-500" />
                  ব্যয়ের বিভাগ
                </h3>
                <div className="h-[240px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                      <PieChartIcon size={32} />
                      <p className="text-xs font-medium">তথ্য নেই</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Bar Chart Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100"
              >
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <BarChart3 size={18} className="text-blue-500" />
                  আয় বনাম ব্যয়
                </h3>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Budget & Savings Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Budget Card */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <CreditCard size={18} className="text-orange-500" />
                    মাসিক বাজেট
                  </h3>
                  <span className="text-xs font-bold text-slate-400">৳২৫,০০০</span>
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (expenses / 25000) * 100)}%` }}
                      className={cn(
                        "h-full transition-all duration-1000",
                        (expenses / 25000) > 0.8 ? "bg-rose-500" : "bg-orange-500"
                      )}
                    />
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    ৳{expenses.toLocaleString('bn-BD')} / ৳২৫,০০০ ব্যবহার হয়েছে
                  </p>
                </div>
              </div>

              {/* Savings Goal Card */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Target size={18} className="text-blue-500" />
                    সঞ্চয় লক্ষ্য
                  </h3>
                  <span className="text-xs font-bold text-slate-400">৳৫০,০০০</span>
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (balance / 50000) * 100)}%` }}
                      className="h-full bg-blue-500 transition-all duration-1000"
                    />
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    ৳{Math.max(0, balance).toLocaleString('bn-BD')} / ৳৫০,০০০ সঞ্চয় হয়েছে
                  </p>
                </div>
              </div>
            </div>

            {/* AI Insights Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-xl">
                    <Sparkles size={20} className="text-purple-600" />
                  </div>
                  <h3 className="font-bold text-slate-800">AI আর্থিক পরামর্শ</h3>
                </div>
                <button 
                  onClick={generateInsights}
                  disabled={isAiLoading || transactions.length === 0}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 disabled:text-slate-300 transition-colors flex items-center gap-1"
                >
                  {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  পরামর্শ আপডেট করুন
                </button>
              </div>

              <div className="min-h-[100px] flex flex-col justify-center">
                {isAiLoading ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Loader2 size={32} className="text-purple-200 animate-spin" />
                    <p className="text-slate-400 text-sm font-medium">Gemini আপনার তথ্য বিশ্লেষণ করছে...</p>
                  </div>
                ) : aiInsights ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="prose prose-slate max-w-none"
                  >
                    <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm md:text-base bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      {aiInsights}
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400 text-sm font-medium mb-4">আপনার লেনদেনের ভিত্তিতে ব্যক্তিগত পরামর্শ পেতে নিচের বাটনে ক্লিক করুন।</p>
                    <button 
                      onClick={generateInsights}
                      disabled={transactions.length === 0}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-purple-100 transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none"
                    >
                      AI পরামর্শ পান
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column: History */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <History size={20} className="text-slate-400" />
                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">সাম্প্রতিক লেনদেন</h3>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase">
                মোট {transactions.length}টি
              </span>
            </div>

            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {transactions.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200"
                  >
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <PlusCircle size={24} className="text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-medium">এখনো কোনো লেনদেন নেই</p>
                  </motion.div>
                ) : (
                  transactions.slice(0, 5).map((t) => (
                    <motion.div 
                      key={t.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="group relative bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          )}>
                            {getCategoryIcon(t.category)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm leading-tight mb-0.5">{t.text}</p>
                            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              <span>{t.category}</span>
                              <span className="w-1 h-1 bg-slate-200 rounded-full" />
                              <span>{new Date(t.date).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <p className={cn(
                            "font-black text-base tracking-tight",
                            t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {t.type === 'income' ? '+' : '-'}৳{t.amount.toLocaleString('bn-BD')}
                          </p>
                          <button 
                            onClick={() => deleteTransaction(t.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 rounded-lg transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
              {transactions.length > 5 && (
                <button className="w-full py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                  সব দেখুন
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Floating Action Button */}
        <button 
          onClick={() => setIsFormOpen(true)}
          className="fixed bottom-28 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl shadow-blue-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
        >
          <Plus size={28} />
        </button>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          {[
            { id: 'home', icon: <Home size={22} />, label: 'হোম' },
            { id: 'history', icon: <History size={22} />, label: 'লেনদেন' },
            { id: 'reports', icon: <BarChart3 size={22} />, label: 'রিপোর্ট' },
            { id: 'budget', icon: <Target size={22} />, label: 'বাজেট' },
            { id: 'profile', icon: <Settings size={22} />, label: 'প্রোফাইল' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                activeTab === tab.id ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {tab.icon}
              <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Developer Section */}
        <footer className="mt-20 pt-10 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md shrink-0">
                  <img 
                    src="https://picsum.photos/seed/mehedi/200/200" 
                    alt="Md. Mehedi Hasan" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">ডেভেলপার সম্পর্কে</h4>
                  <p className="text-slate-500 text-sm">Md. Mehedi Hasan দ্বারা নির্মিত</p>
                </div>
              </div>
              <div className="text-slate-600 text-sm space-y-2 max-w-md">
                <div className="pt-2 border-t border-slate-100">
                  <p className="font-semibold text-slate-800">যোগাযোগ:</p>
                  <p>WhatsApp: 01618189555</p>
                  <p>Email: useable.me2@gmail.com</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:items-end gap-6">
              <div className="flex items-center gap-4">
                <a href="https://www.facebook.com/profile.php?id=61584229616702" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm">
                  <Facebook size={20} />
                </a>
                <a href="https://github.com/Mehedii364" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-200 transition-all shadow-sm">
                  <Github size={20} />
                </a>
                <a href="mailto:useable.me2@gmail.com" className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm">
                  <Mail size={20} />
                </a>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                © ২০২৬ আয় ও ব্যয়ের হিসাব | সর্বস্বত্ব সংরক্ষিত
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-slate-900">নতুন লেনদেন</h3>
                  <button 
                    onClick={() => setIsFormOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <form onSubmit={addTransaction} className="space-y-6">
                  {/* Type Toggle */}
                  <div className="flex p-1 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setType('income');
                        setCategory(CATEGORIES.income[0]);
                      }}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                        type === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      আয়
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setType('expense');
                        setCategory(CATEGORIES.expense[0]);
                      }}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                        type === 'expense' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      ব্যয়
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">বিবরণ</label>
                      <input 
                        type="text" 
                        placeholder="যেমন: মাসের ভাড়া" 
                        required
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">পরিমাণ</label>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          required
                          className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">বিভাগ</label>
                        <select 
                          className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium appearance-none"
                          value={category}
                          onChange={(e) => setCategory(e.target.value as Category)}
                        >
                          {CATEGORIES[type].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className={cn(
                      "w-full py-5 rounded-[1.5rem] font-bold text-white shadow-lg transition-all active:scale-[0.98] mt-4",
                      type === 'income' ? "bg-emerald-600 shadow-emerald-100" : "bg-rose-600 shadow-rose-100"
                    )}
                  >
                    {type === 'income' ? 'আয়' : 'ব্যয়'} নিশ্চিত করুন
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
