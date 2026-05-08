"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Clock, Trophy, Brain, Target, BookOpen, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadialBarChart, RadialBar } from "recharts";
import Navbar from "@/components/Navbar";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const weeklyData = [
  { day: "Mon", sessions: 2, score: 75 }, { day: "Tue", sessions: 3, score: 82 },
  { day: "Wed", sessions: 1, score: 68 }, { day: "Thu", sessions: 4, score: 90 },
  { day: "Fri", sessions: 2, score: 85 }, { day: "Sat", sessions: 3, score: 88 },
  { day: "Sun", sessions: 1, score: 72 },
];

const topicMastery = [
  { name: "Arrays", mastery: 92 }, { name: "Trees", mastery: 78 },
  { name: "Graphs", mastery: 35 }, { name: "DP", mastery: 42 },
  { name: "Sorting", mastery: 88 }, { name: "React", mastery: 85 },
];

const radialData = [{ name: "Score", value: 82, fill: "#6366f1" }];

export default function AnalyticsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[88px] pb-16" style={{ background: "var(--color-bg-soft)", minHeight: "100vh" }}>
        <div className="container">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Learning Analytics</h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Track your progress and identify areas for improvement.</p>
          </motion.div>

          {/* Stats row */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "This Week", value: "16", sub: "sessions", icon: BarChart3, color: "#6366f1", trend: "+23%" },
              { label: "Avg Duration", value: "34m", sub: "per session", icon: Clock, color: "#8b5cf6", trend: "+5m" },
              { label: "Quiz Avg", value: "82%", sub: "accuracy", icon: Trophy, color: "#10b981", trend: "+8%" },
              { label: "Streak", value: "7", sub: "days", icon: Zap, color: "#f59e0b", trend: "🔥" },
            ].map((s, i) => (
              <div key={i} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}12` }}>
                    <s.icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "#10b981" }}>{s.trend}</span>
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{s.label} · {s.sub}</p>
              </div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Performance chart */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="lg:col-span-2 card">
              <h2 className="font-semibold mb-5">Weekly Performance</h2>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }} />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Overall score */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="card flex flex-col items-center justify-center">
              <h2 className="font-semibold mb-4">Overall Score</h2>
              <ResponsiveContainer width="100%" height={180}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
                  <RadialBar background dataKey="value" cornerRadius={10} fill="#6366f1" />
                </RadialBarChart>
              </ResponsiveContainer>
              <p className="text-3xl font-bold -mt-6" style={{ color: "var(--color-primary)" }}>82%</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Great progress!</p>
            </motion.div>
          </div>

          {/* Topic mastery */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="card">
            <h2 className="font-semibold mb-5">Topic Mastery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topicMastery.map((t, i) => {
                const color = t.mastery >= 80 ? "#10b981" : t.mastery >= 50 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={i} className="p-4 rounded-xl" style={{ background: "var(--color-bg-soft)" }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{t.name}</span>
                      <span className="text-sm font-bold" style={{ color }}>{t.mastery}%</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "var(--color-bg-muted)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${t.mastery}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                        className="h-full rounded-full" style={{ background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}
