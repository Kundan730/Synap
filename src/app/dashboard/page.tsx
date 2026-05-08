"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles, ArrowRight, Clock, BookOpen, Trophy, TrendingUp,
  Play, FileText, Brain, Target, ChevronRight, BarChart3,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const recentSessions = [
  { topic: "Binary Search Trees", date: "Today", duration: "32 min", score: 92, status: "completed" },
  { topic: "Dynamic Programming", date: "Yesterday", duration: "45 min", score: 78, status: "completed" },
  { topic: "React Hooks Deep Dive", date: "May 6", duration: "28 min", score: 88, status: "completed" },
  { topic: "Neural Networks Basics", date: "May 5", duration: "50 min", score: 65, status: "in-progress" },
];

const weakTopics = [
  { name: "Graph Algorithms", mastery: 35, color: "#ef4444" },
  { name: "Dynamic Programming", mastery: 42, color: "#f59e0b" },
  { name: "System Design", mastery: 50, color: "#f59e0b" },
];

const recommended = [
  { title: "Graph Traversal: BFS & DFS", category: "Algorithms", difficulty: "Medium", icon: Brain },
  { title: "Understanding Recursion", category: "Fundamentals", difficulty: "Easy", icon: Target },
  { title: "Database Normalization", category: "Databases", difficulty: "Medium", icon: BookOpen },
];

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[88px] pb-16" style={{ background: "var(--color-bg-soft)", minHeight: "100vh" }}>
        <div className="container">
          {/* Header */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back 👋</h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Continue your learning journey. Pick up where you left off.</p>
          </motion.div>

          {/* Stats */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Sessions", value: "24", icon: Play, color: "#6366f1" },
              { label: "Hours Learned", value: "18.5", icon: Clock, color: "#8b5cf6" },
              { label: "Avg Score", value: "82%", icon: Trophy, color: "#10b981" },
              { label: "Topics Covered", value: "12", icon: BookOpen, color: "#06b6d4" },
            ].map((s, i) => (
              <div key={i} className="card flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}12` }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent sessions */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold">Recent Sessions</h2>
                  <Link href="/analytics" className="text-xs font-medium no-underline flex items-center gap-1" style={{ color: "var(--color-primary)" }}>
                    View all <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentSessions.map((s, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl transition-colors cursor-pointer"
                      style={{ background: "var(--color-bg-soft)" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.04)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "var(--color-bg-soft)"}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-card)" }}>
                        <Brain className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.topic}</p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{s.date} · {s.duration}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: s.score >= 80 ? "#10b981" : "#f59e0b" }}>{s.score}%</p>
                        <span className={`badge text-[10px] ${s.status === "completed" ? "badge-success" : "badge-warning"}`}>
                          {s.status === "completed" ? "Done" : "In progress"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/session" className="btn-primary w-full justify-center mt-5 no-underline text-sm">
                  <Sparkles className="w-4 h-4" /> Start New Session <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Weak topics */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="card">
                <h2 className="font-semibold mb-4">Focus Areas</h2>
                <div className="space-y-4">
                  {weakTopics.map((t, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium">{t.name}</span>
                        <span style={{ color: t.color }}>{t.mastery}%</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "var(--color-bg-muted)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${t.mastery}%`, background: t.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Recommended */}
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="card">
                <h2 className="font-semibold mb-4">Recommended Next</h2>
                <div className="space-y-3">
                  {recommended.map((r, i) => (
                    <Link key={i} href="/session" className="flex items-center gap-3 p-3 rounded-xl no-underline transition-colors"
                      style={{ background: "var(--color-bg-soft)", color: "var(--color-text)" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.05)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "var(--color-bg-soft)"}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-card)" }}>
                        <r.icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{r.category} · {r.difficulty}</p>
                      </div>
                      <ChevronRight className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
