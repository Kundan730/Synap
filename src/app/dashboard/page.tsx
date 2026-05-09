"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, ArrowRight, Clock, BookOpen, Trophy,
  Play, Brain, ChevronRight, Loader2,
} from "lucide-react";
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

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - then;
  const day = 24 * 60 * 60 * 1000;
  if (diff < day && new Date(then).toDateString() === new Date(now).toDateString()) return "Today";
  if (diff < 2 * day && new Date(then).toDateString() === new Date(now - day).toDateString()) return "Yesterday";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);

  useEffect(() => {
    fetch("/api/sessions")
      .then(res => res.json())
      .then(data => setSessions(data.sessions ?? []))
      .catch(e => {
        console.error("Failed to load sessions", e);
        setSessions([]);
      });
  }, []);

  const totalSessions = sessions?.length ?? 0;
  const totalMessages = sessions?.reduce((sum, s) => sum + s.messageCount, 0) ?? 0;
  const avgMessagesPerSession = totalSessions ? Math.round(totalMessages / totalSessions) : 0;
  const uniqueTopics = new Set(sessions?.map(s => s.topic.toLowerCase()) ?? []).size;

  return (
    <>
      <Navbar />
      <main className="pt-[88px] pb-16" style={{ background: "var(--color-bg-soft)", minHeight: "100vh" }}>
        <div className="container">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back 👋</h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Continue your learning journey. Pick up where you left off.</p>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Sessions", value: totalSessions.toString(), icon: Play, color: "#6366f1" },
              { label: "Total Messages", value: totalMessages.toString(), icon: Clock, color: "#8b5cf6" },
              { label: "Avg / Session", value: avgMessagesPerSession.toString(), icon: Trophy, color: "#10b981" },
              { label: "Unique Topics", value: uniqueTopics.toString(), icon: BookOpen, color: "#06b6d4" },
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
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold">Recent Sessions</h2>
                  <Link href="/analytics" className="text-xs font-medium no-underline flex items-center gap-1" style={{ color: "var(--color-primary)" }}>
                    View all <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {sessions === null && (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                )}

                {sessions && sessions.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>No sessions yet — start one to see it here.</p>
                  </div>
                )}

                {sessions && sessions.length > 0 && (
                  <div className="space-y-3">
                    {sessions.slice(0, 6).map((s) => (
                      <Link
                        key={s.room}
                        href="/session"
                        className="flex items-center gap-4 p-3 rounded-xl no-underline transition-colors"
                        style={{ background: "var(--color-bg-soft)", color: "var(--color-text)" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.04)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "var(--color-bg-soft)"}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-card)" }}>
                          <Brain className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.topic}</p>
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            {formatRelative(s.updatedAt)} · {s.messageCount} messages · room {s.room}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                      </Link>
                    ))}
                  </div>
                )}

                <Link href="/session" className="btn-primary w-full justify-center mt-5 no-underline text-sm">
                  <Sparkles className="w-4 h-4" /> Start New Session <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            <div className="space-y-6">
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="card">
                <h2 className="font-semibold mb-4">Activity</h2>
                <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
                  Showing aggregate stats from your last {Math.min(totalSessions, 100)} sessions stored in Mongo. Per-user filtering will land once auth is wired up.
                </p>
                <Link href="/analytics" className="text-sm font-medium no-underline flex items-center gap-1" style={{ color: "var(--color-primary)" }}>
                  Open analytics <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
