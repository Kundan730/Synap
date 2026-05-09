"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Clock, Trophy, Zap, Loader2 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from "recharts";
import Navbar from "@/components/Navbar";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

interface SessionSummary {
  room: string;
  topic: string;
  messageCount: number;
  updatedAt: string;
  viewMode: string | null;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function bucketByDayOfWeek(sessions: SessionSummary[]) {
  const buckets = new Map<string, { day: string; sessions: number; messages: number }>();
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { day: DAY_NAMES[d.getDay()], sessions: 0, messages: 0 });
  }
  for (const s of sessions) {
    const key = new Date(s.updatedAt).toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (b) {
      b.sessions += 1;
      b.messages += s.messageCount;
    }
  }
  return Array.from(buckets.values());
}

function topicFrequency(sessions: SessionSummary[]): Array<{ name: string; count: number }> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const key = s.topic.toLowerCase().slice(0, 30);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function viewModeStats(sessions: SessionSummary[]): Array<{ name: string; mastery: number }> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (!s.viewMode) continue;
    map.set(s.viewMode, (map.get(s.viewMode) ?? 0) + 1);
  }
  const total = sessions.length || 1;
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, mastery: Math.round((count / total) * 100) }))
    .sort((a, b) => b.mastery - a.mastery);
}

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);

  useEffect(() => {
    fetch("/api/sessions")
      .then(res => res.json())
      .then(data => setSessions(data.sessions ?? []))
      .catch(() => setSessions([]));
  }, []);

  const weekly = useMemo(() => sessions ? bucketByDayOfWeek(sessions) : [], [sessions]);
  const topics = useMemo(() => sessions ? topicFrequency(sessions) : [], [sessions]);
  const modes = useMemo(() => sessions ? viewModeStats(sessions) : [], [sessions]);

  const thisWeekSessions = weekly.reduce((sum, d) => sum + d.sessions, 0);
  const thisWeekMessages = weekly.reduce((sum, d) => sum + d.messages, 0);
  const avgMessagesPerSession = thisWeekSessions ? Math.round(thisWeekMessages / thisWeekSessions) : 0;
  const streak = (() => {
    let s = 0;
    for (let i = weekly.length - 1; i >= 0; i--) {
      if (weekly[i].sessions > 0) s += 1;
      else break;
    }
    return s;
  })();

  const overallScore = sessions && sessions.length > 0
    ? Math.min(100, Math.round((sessions.reduce((a, s) => a + Math.min(s.messageCount, 50), 0) / sessions.length) * 2))
    : 0;
  const radialData = [{ name: "Score", value: overallScore, fill: "#6366f1" }];

  if (sessions === null) {
    return (
      <>
        <Navbar />
        <main className="pt-[88px] pb-16 flex items-center justify-center" style={{ background: "var(--color-bg-soft)", minHeight: "100vh" }}>
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-[88px] pb-16" style={{ background: "var(--color-bg-soft)", minHeight: "100vh" }}>
        <div className="container">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Learning Analytics</h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Aggregated from {sessions.length} session{sessions.length === 1 ? "" : "s"} stored in MongoDB.
            </p>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "This Week", value: String(thisWeekSessions), sub: "sessions", icon: BarChart3, color: "#6366f1" },
              { label: "Messages", value: String(thisWeekMessages), sub: "this week", icon: Clock, color: "#8b5cf6" },
              { label: "Avg / Session", value: String(avgMessagesPerSession), sub: "messages", icon: Trophy, color: "#10b981" },
              { label: "Streak", value: String(streak), sub: streak === 1 ? "day" : "days", icon: Zap, color: "#f59e0b" },
            ].map((s, i) => (
              <div key={i} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}12` }}>
                    <s.icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{s.label} · {s.sub}</p>
              </div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="lg:col-span-2 card">
              <h2 className="font-semibold mb-5">Sessions This Week</h2>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={weekly}>
                  <defs>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }} />
                  <Area type="monotone" dataKey="sessions" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSessions)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="card flex flex-col items-center justify-center">
              <h2 className="font-semibold mb-4">Engagement Score</h2>
              <ResponsiveContainer width="100%" height={180}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
                  <RadialBar background dataKey="value" cornerRadius={10} fill="#6366f1" />
                </RadialBarChart>
              </ResponsiveContainer>
              <p className="text-3xl font-bold -mt-6" style={{ color: "var(--color-primary)" }}>{overallScore}%</p>
              <p className="text-xs mt-1 text-center" style={{ color: "var(--color-text-muted)" }}>
                Based on avg messages / session
              </p>
            </motion.div>
          </div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="card mb-6">
            <h2 className="font-semibold mb-5">Top Topics</h2>
            {topics.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No topics yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map((t, i) => (
                  <div key={i} className="p-4 rounded-xl" style={{ background: "var(--color-bg-soft)" }}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate pr-2">{t.name}</span>
                      <span className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>×{t.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {modes.length > 0 && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5} className="card">
              <h2 className="font-semibold mb-5">Whiteboard Tools Used</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {modes.map((t, i) => {
                  const color = t.mastery >= 50 ? "#6366f1" : t.mastery >= 20 ? "#8b5cf6" : "#94a3b8";
                  return (
                    <div key={i} className="p-4 rounded-xl" style={{ background: "var(--color-bg-soft)" }}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium capitalize">{t.name}</span>
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
          )}
        </div>
      </main>
    </>
  );
}
