"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Play,
  Sparkles,
  Brain,
  Zap,
  Eye,
  MessageSquare,
  BarChart3,
  FileText,
  Lightbulb,
  Users,
  Video,
  Mic,
  PhoneOff,
  ListChecks,
  BookOpen,
  Target,
  CheckCircle2,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6 },
  }),
};

const features = [
  {
    icon: Brain,
    title: "Real-Time AI Tutor",
    desc: "Get instant, adaptive explanations that respond to your confusion and curiosity in real time.",
    color: "#6366f1",
  },
  {
    icon: Eye,
    title: "Live Visual Generation",
    desc: "AI creates diagrams, flowcharts, mind maps, and graphs as you learn — right in your session.",
    color: "#8b5cf6",
  },
  {
    icon: MessageSquare,
    title: "Voice & Text Chat",
    desc: "Ask questions through voice or text. The AI responds naturally, like a real tutor.",
    color: "#06b6d4",
  },
  {
    icon: Zap,
    title: "Instant Quizzes",
    desc: "AI generates quizzes on-the-fly to test your understanding during the session.",
    color: "#f59e0b",
  },
  {
    icon: FileText,
    title: "Smart Document Analysis",
    desc: "Upload PDFs, notes, or slides. AI extracts key concepts and teaches them to you live.",
    color: "#10b981",
  },
  {
    icon: BarChart3,
    title: "Learning Analytics",
    desc: "Track your progress, strengths, and areas to improve with intelligent insights.",
    color: "#ec4899",
  },
];

const howItWorks = [
  {
    step: "01",
    icon: Video,
    title: "Join a Live Session",
    desc: "Start an AI-powered learning session with one click. No setup needed.",
  },
  {
    step: "02",
    icon: MessageSquare,
    title: "Ask Anything",
    desc: "Speak or type your question. The AI understands context and adapts in real time.",
  },
  {
    step: "03",
    icon: Lightbulb,
    title: "Watch AI Visualize",
    desc: "See concepts come alive with auto-generated diagrams, animations, and explanations.",
  },
  {
    step: "04",
    icon: BookOpen,
    title: "Review & Retain",
    desc: "Get AI-generated notes, summaries, and quizzes to solidify your understanding.",
  },
];

const problems = [
  { problem: "Expensive 1-on-1 tutoring", solution: "AI-powered tutoring at a fraction of the cost" },
  { problem: "Passive video lectures", solution: "Interactive, real-time learning conversations" },
  { problem: "One-size-fits-all content", solution: "Personalized explanations that adapt to you" },
  { problem: "No instant feedback", solution: "Live quizzes and understanding checks" },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden pt-[140px] pb-[80px] md:pt-[180px] md:pb-[120px]">
        {/* Background gradient */}
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "var(--gradient-hero)" }}
        />
        {/* Decorative orbs */}
        <div className="absolute top-20 right-[10%] w-[400px] h-[400px] rounded-full opacity-30 blur-[100px] -z-10"
          style={{ background: "var(--color-border)" }} />
        <div className="absolute bottom-10 left-[5%] w-[300px] h-[300px] rounded-full opacity-20 blur-[80px] -z-10"
          style={{ background: "var(--color-bg-muted)" }} />

        <div className="container text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <span className="badge badge-primary inline-flex items-center gap-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Native Learning Platform
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-8 max-w-4xl mx-auto"
            style={{ color: "var(--color-text)" }}
          >
            Real-Time Visual{" "}
            <span
              className="font-bold"
              style={{ color: "var(--color-accent)" }}
            >
              Intelligence
            </span>{" "}
            for Learning
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Learn anything through live AI sessions. Get real-time visual explanations,
            interactive diagrams, and personalized teaching all in one intelligent workspace.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/session" className="btn-primary text-base px-8 py-3.5 no-underline">
              Start Live Session
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#how-it-works" className="btn-secondary text-base px-8 py-3.5 no-underline">
              <Play className="w-4 h-4" />
              See How It Works
            </a>
          </motion.div>

          {/* Hero preview card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-16 max-w-5xl mx-auto"
          >
            <div
              className="rounded-2xl overflow-hidden border"
              style={{
                borderColor: "var(--color-border)",
                boxShadow: "var(--shadow-xl)",
                background: "var(--color-bg-muted)",
              }}
            >
              {/* Mock session preview */}
              <div className="p-1">
                {/* Top bar */}
                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-t-xl"
                  style={{ background: "var(--color-bg-soft)" }}
                >
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                      Live Session — Introduction to Binary Trees
                    </span>
                  </div>
                  <div className="pulse-dot" />
                </div>

                {/* Session content preview */}
                <div className="flex flex-col md:flex-row gap-4 p-4 min-h-[540px] relative">
                  {/* Main Workspace (Expanded) */}
                  <div
                    className="flex-[3] rounded-xl p-8 flex flex-col items-center justify-center relative min-h-[440px] overflow-hidden"
                    style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                  >
                    {/* Top Status Bar Inside Whiteboard */}
                    <div className="absolute top-0 left-0 right-0 px-4 py-2 border-b flex items-center justify-between bg-slate-50/50 backdrop-blur-sm z-10" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live: Binary Tree Analysis</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">00:14:22</span>
                    </div>

                    {/* Floating Video PiP (Top Left) */}
                    <div className="absolute top-12 left-4 w-36 aspect-video rounded-lg shadow-2xl border-2 border-white overflow-hidden z-20"
                      style={{ background: 'var(--color-primary-dark)' }}>
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-6 h-6 text-white/30" />
                      </div>
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] text-white font-bold">
                        AI Tutor
                      </div>
                    </div>

                    {/* Symmetrical Binary Tree Visualization */}
                    <svg width="400" height="280" viewBox="0 0 320 240" className="w-full h-auto max-w-md opacity-90">
                      {/* Connections - Rendered first to stay behind nodes */}
                      <g stroke="var(--color-border)" strokeWidth="2">
                        <line x1="160" y1="40" x2="80" y2="110" />
                        <line x1="160" y1="40" x2="240" y2="110" />
                        
                        <g strokeWidth="1.5" opacity="0.6">
                          <line x1="80" y1="110" x2="40" y2="170" />
                          <line x1="80" y1="110" x2="120" y2="170" />
                          <line x1="240" y1="110" x2="200" y2="170" />
                          <line x1="240" y1="110" x2="280" y2="170" />
                        </g>
                      </g>

                      {/* Nodes - Rendered after lines to stay on top */}
                      {/* Root node */}
                      <circle cx="160" cy="40" r="22" fill="var(--color-primary)" />
                      <text x="160" y="46" textAnchor="middle" fill="white" fontSize="14" fontWeight="black">8</text>
                      
                      {/* Level 1 nodes */}
                      <circle cx="80" cy="110" r="20" fill="var(--color-primary-light)" />
                      <text x="80" y="115" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">3</text>
                      <circle cx="240" cy="110" r="20" fill="var(--color-primary-light)" />
                      <text x="240" y="115" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">10</text>
                      
                      {/* Level 2 nodes */}
                      <circle cx="40" cy="170" r="16" fill="var(--color-secondary)" />
                      <text x="40" y="174" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">1</text>
                      <circle cx="120" cy="170" r="16" fill="var(--color-secondary)" />
                      <text x="120" y="174" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">6</text>
                      <circle cx="200" cy="170" r="16" fill="var(--color-text-muted)" opacity="0.7" />
                      <text x="200" y="174" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">9</text>
                      <circle cx="280" cy="170" r="16" fill="var(--color-accent)" opacity="0.9" />
                      <text x="280" y="174" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">14</text>
                      
                      {/* Interaction highlight */}
                      <path d="M180 195 Q 240 235 300 195" fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeDasharray="6 4" className="animate-pulse" />
                      <text x="240" y="230" textAnchor="middle" fill="var(--color-accent)" fontSize="10" fontWeight="black" className="uppercase tracking-[0.2em]">Rebalancing Tree...</text>
                    </svg>
                    
                    {/* Bottom Floating Control Dock */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-2.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl z-30">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                        <Mic className="w-4 h-4" />
                      </div>
                      <div className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-200/50">
                        Hold Space to Talk
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                        <Video className="w-4 h-4" />
                      </div>
                      <div className="w-[1px] h-5 bg-slate-200 mx-0.5" />
                      <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                        <PhoneOff className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Right Sidebar - Focused Chat (Slimmer) */}
                  <div className="w-full md:w-72 flex flex-col gap-3">
                    <div
                      className="flex-1 rounded-xl p-4 flex flex-col gap-5"
                      style={{ background: "var(--color-bg-soft)", border: "1px solid var(--color-border)" }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          AI Insights
                        </div>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      </div>

                      {/* Chat Log */}
                      <div className="space-y-3">
                        <div className="rounded-xl p-2.5 text-[10px] leading-relaxed shadow-sm bg-white border border-slate-100 text-slate-600">
                          <span className="font-bold text-slate-400 block mb-0.5">Student</span>
                          How does this tree stay balanced?
                        </div>
                        <div className="rounded-xl p-2.5 text-[10px] leading-relaxed shadow-sm bg-slate-900 text-white">
                          <span className="font-bold text-blue-300 block mb-0.5">Synap AI</span>
                          I'll calculate the Balance Factor for root node 8...
                        </div>
                      </div>

                      {/* Live Transcript */}
                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Live Transcript</div>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed italic line-clamp-2">
                          "Now, notice how the height of both subtrees is equal to 2, resulting in a Balance Factor of 0—making this a perfectly balanced AVL tree..."
                        </p>
                      </div>

                      {/* Key Concepts - NEW */}
                      <div className="pt-4 border-t border-slate-200 mt-auto">
                        <div className="text-[9px] font-bold text-slate-400 uppercase mb-3 tracking-widest flex items-center gap-2">
                          <ListChecks className="w-3 h-3" /> Key Concepts
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 text-[8px] font-bold">Binary Search Tree</span>
                          <span className="px-2 py-1 rounded bg-amber-50 text-amber-600 text-[8px] font-bold">AVL Balancing</span>
                          <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[8px] font-bold">Tree Rotation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== PROBLEM / SOLUTION ===== */}
      <section className="section" style={{ background: "var(--color-bg)" }}>
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.span variants={fadeUp} custom={0} className="badge badge-accent mb-4 inline-block">
              Why Synap?
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mb-4">
              Learning should be{" "}
              <span className="font-bold" style={{ color: "var(--color-accent)" }}>
                interactive
              </span>
              , not passive
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {problems.map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="card flex gap-4 items-start"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                    <X className="w-3.5 h-3.5 text-red-500" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>
                    <s>{item.problem}</s>
                  </p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      {item.solution}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="section-lg" style={{ background: "var(--color-bg-soft)" }}>
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.span variants={fadeUp} custom={0} className="badge badge-primary mb-4 inline-block">
              <Sparkles className="w-3.5 h-3.5" />
              Core Features
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to learn{" "}
              <span className="font-bold" style={{ color: "var(--color-accent)" }}>
                smarter
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg max-w-2xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>
              A complete AI learning workspace that combines live tutoring, visual generation, and personalized feedback.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="card group cursor-default"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${feature.color}15` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="section-lg" style={{ background: "var(--color-bg)" }}>
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.span variants={fadeUp} custom={0} className="badge badge-accent mb-4 inline-block">
              How It Works
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mb-4">
              Get started in{" "}
              <span className="font-bold" style={{ color: "var(--color-accent)" }}>
                4 simple steps
              </span>
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {howItWorks.map((step, i) => (
              <motion.div
                key={step.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="text-center relative"
              >
                {/* Connector line */}
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-[2px]"
                    style={{ background: "var(--color-border)" }} />
                )}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 relative z-10"
                  style={{ background: "var(--gradient-card)", border: "1.5px solid var(--color-border)" }}
                >
                  <step.icon className="w-7 h-7" style={{ color: "var(--color-primary)" }} />
                </div>
                <span className="text-xs font-bold tracking-wider block mb-2" style={{ color: "var(--color-primary)" }}>
                  STEP {step.step}
                </span>
                <h3 className="text-base font-semibold mb-2">{step.title}</h3>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="section-lg relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px] -z-10"
          style={{ background: "var(--color-text-secondary)" }} />

        <div className="container text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeUp} custom={0} className="flex items-center justify-center gap-2 mb-6">
              <Users className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                Join thousands of learners
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold mb-6 max-w-3xl mx-auto">
              Ready to learn with{" "}
              <span className="font-bold" style={{ color: "var(--color-accent)" }}>
                AI intelligence
              </span>
              ?
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg mb-10 max-w-xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>
              Start your first live session and experience the future of education. No credit card required.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/session" className="btn-primary text-base px-10 py-4 no-underline">
                <Sparkles className="w-5 h-5" />
                Start Learning Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/dashboard" className="btn-secondary text-base px-8 py-4 no-underline">
                <Target className="w-4 h-4" />
                View Dashboard
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}
