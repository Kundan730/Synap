"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Send, Sparkles,
  PanelRightOpen, PanelRightClose, FileText, Brain,
  Lightbulb, ArrowLeft, Maximize2, Minimize2,
  BookOpen, ListChecks, PenTool, MessageSquare, Loader2,
  Square,
} from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import { VOICES, DEFAULT_VOICE_ID } from "@/lib/elevenlabs";

// LiveKit Imports
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useTracks,
  useLocalParticipant,
  useParticipants,
  useVoiceAssistant,
  useTrackTranscription,
  TrackToggle,
  DisconnectButton,
  useRoomContext,
  useDataChannel,
  useChat,
} from "@livekit/components-react";
import { Track, DataPacket_Kind } from "livekit-client";
import "@livekit/components-styles";

const MermaidRenderer = dynamic(() => import("@/components/MermaidRenderer"), { ssr: false });
import DesmosRenderer from "@/components/DesmosRenderer";
import HTMLAppletRenderer from "@/components/HTMLAppletRenderer";
import VideoRenderer from "@/components/VideoRenderer";
import DrawingBoard from "@/components/DrawingBoard";
import CodeSandbox from "@/components/CodeSandbox";
import QuizRenderer, { QuizData } from "@/components/QuizRenderer";

type Tab = "chat" | "notes" | "quiz" | "summary";
interface ChatMsg { id: number; role: "user" | "ai"; text: string; time: string; }

const NOW = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function stripMermaid(text: string): string {
  return text.replace(/```mermaid\n[\s\S]*?```/g, "*(I have generated a diagram for you on the whiteboard)*").trim();
}

function extractMermaid(text: string): string | null {
  const match = text.match(/```mermaid\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

export default function SessionPage() {
  // LiveKit Connection State
  const [token, setToken] = useState("");
  const [roomName, setRoomName] = useState("synap-lab-1");
  const [username, setUsername] = useState("Student");

  // Try to load env vars directly if available
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  // Fetch token to join session
  const connectToRoom = async () => {
    if (!livekitUrl) {
      alert("NEXT_PUBLIC_LIVEKIT_URL is not set in your .env.local!");
      return;
    }
    try {
      const res = await fetch(`/api/livekit?room=${roomName}&username=${username}`);
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
      } else {
        alert(data.error || "Failed to get token");
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting to LiveKit room");
    }
  };

  // Pre-join screen
  if (token === "") {

    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 relative">
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-zinc-900 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
        <div className="card max-w-md w-full text-center shadow-2xl border border-slate-200/60 rounded-3xl p-10 bg-white/80 backdrop-blur-xl">
          <Logo iconOnly size="lg" className="justify-center mb-8" />
          <h1 className="text-3xl font-extrabold mb-3 text-slate-900 tracking-tight">Synap Lab</h1>
          <p className="text-base mb-10 text-slate-500 leading-relaxed">
            Connect to the real-time AI Whiteboard.
          </p>

          <div className="space-y-4 mb-8 text-left">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500">Your Name</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-zinc-700 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-500">Room Name</label>
              <input value={roomName} onChange={e => setRoomName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-zinc-700 transition-colors" />
            </div>
          </div>

          <button onClick={connectToRoom} className="btn-primary w-full justify-center py-3.5">
            Join Session
          </button>

          {!livekitUrl && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-xs text-left">
              ⚠️ Missing LIVEKIT API Keys in .env.local
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={livekitUrl}
      data-lk-theme="default"
      style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
      onDisconnected={() => setToken("")}
    >
      <ActiveSessionUI />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

// Inner Component once connected to the Room
function ActiveSessionUI() {
  const [sideOpen, setSideOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 1, role: "ai", text: "Welcome to the WebRTC Room! I am your Synap AI tutor. What would you like to learn today?", time: NOW() },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string>("graph TD\n    A[\"🚀 LiveKit WebRTC Connected\"] --> B[\"Ultra-low latency audio/video\"]\n    A --> C[\"AI Agent Ready\"]\n    B --> D[\"Interactive Learning\"]");
  const [vizLoading, setVizLoading] = useState(false);
  const [topic, setTopic] = useState("General Learning");
  const [sessionTime, setSessionTime] = useState(0);
  const [viewMode, setViewMode] = useState<"mermaid" | "desmos" | "html" | "video" | "drawing" | "code" | "quiz">("mermaid");
  const [desmosEquations, setDesmosEquations] = useState<string[]>([]);
  const [htmlAppletCode, setHtmlAppletCode] = useState<string>("");
  const [videoId, setVideoId] = useState<string>("");

  // New Interactive States
  const [sandboxFiles, setSandboxFiles] = useState<Record<string, string>>({});
  const [sandboxLang, setSandboxLang] = useState<string>("react");
  const [quizData, setQuizData] = useState<QuizData | null>(null);

  const room = useRoomContext();

  // Load from MongoDB
  useEffect(() => {
    if (!room?.name) return;
    fetch(`/api/session?room=${room.name}`)
      .then(res => res.json())
      .then(data => {
        if (data.state) {
          const { state } = data;
          if (state.messages) setMessages(state.messages);
          if (state.mermaidCode) setMermaidCode(state.mermaidCode);
          if (state.viewMode) setViewMode(state.viewMode);
          if (state.desmosEquations) setDesmosEquations(state.desmosEquations);
          if (state.htmlAppletCode) setHtmlAppletCode(state.htmlAppletCode);
          if (state.videoId) setVideoId(state.videoId);
          if (state.sandboxFiles) setSandboxFiles(state.sandboxFiles);
          if (state.sandboxLang) setSandboxLang(state.sandboxLang);
          if (state.quizData) setQuizData(state.quizData);
        }
      })
      .catch(e => console.error("Failed to load session from DB", e));
  }, [room?.name]);

  // Save to MongoDB (Debounced)
  useEffect(() => {
    if (!room?.name) return;
    
    const timeout = setTimeout(() => {
      const state = {
        messages, mermaidCode, viewMode, desmosEquations, htmlAppletCode,
        videoId, sandboxFiles, sandboxLang, quizData
      };
      fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: room.name, state })
      }).catch(e => console.error("Failed to save session to DB", e));
    }, 2000); // 2-second debounce to prevent spamming DB

    return () => clearTimeout(timeout);
  }, [messages, mermaidCode, viewMode, desmosEquations, htmlAppletCode, videoId, sandboxFiles, sandboxLang, quizData, room?.name]);


  const chatEnd = useRef<HTMLDivElement>(null);

  // LiveKit Hooks
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const aiParticipant = participants.find(p => p.identity.toLowerCase().includes('ai') || p.identity.toLowerCase().includes('agent'));
  const allVideoTracks = useTracks([Track.Source.Camera]);
  const myVideoTrack = allVideoTracks.find(t => t.participant.identity === localParticipant.identity);
  const aiVideoTrack = aiParticipant ? allVideoTracks.find(t => t.participant.identity === aiParticipant.identity) : null;
  const isMicMuted = !localParticipant.isMicrophoneEnabled;
  const { send: sendChat } = useChat();

  // Voice Assistant & Transcriptions
  const voiceAssistant = useVoiceAssistant();
  const agentTranscriptions = voiceAssistant.agentTranscriptions;

  // Track user microphone for user transcriptions
  const userAudioTracks = useTracks([Track.Source.Microphone]);
  const userAudioTrack = userAudioTracks.find(t => t.participant.identity === localParticipant.identity);
  const { segments: userSegments } = useTrackTranscription(userAudioTrack);

  // Sync user voice transcripts into the chat panel
  const processedUserSegIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const seg of userSegments) {
      if (seg.final && seg.text.trim() && !processedUserSegIds.current.has(seg.id)) {
        processedUserSegIds.current.add(seg.id);
        setMessages(m => [...m, { id: Date.now() + Math.random(), role: 'user', text: seg.text.trim(), time: NOW() }]);
      }
    }
  }, [userSegments]);

  // Function to stop the agent from speaking via data channel
  const stopAgentSpeaking = useCallback(async () => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode('STOP_SPEAKING');
      await room.localParticipant.publishData(data, { reliable: true });
      console.log('🛑 Stop command sent to agent');
    } catch (e) {
      console.error('Failed to send stop command:', e);
    }
  }, [room]);

  const generateApplet = useCallback(async (appletTopic: string) => {
    setVizLoading(true);
    setViewMode("html");
    setHtmlAppletCode(""); // Show loading state
    try {
      const res = await fetch("/api/visualize", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: appletTopic, type: "applet" }),
      });
      const data = await res.json();
      if (data.htmlCode) {
        setHtmlAppletCode(data.htmlCode);
      }
    } catch (e) {
      console.error("Applet gen error:", e);
    }
    setVizLoading(false);
  }, []);

  // Listen for explicit Tool Calls from the Agent
  useDataChannel((msg) => {
    try {
      const decoded = new TextDecoder().decode(msg.payload);
      const payload = JSON.parse(decoded);
      if (payload.type === 'TOOL_CALL') {
        if (payload.tool === 'show_desmos_graph') {
          setDesmosEquations(payload.data);
          setViewMode("desmos");
        } else if (payload.tool === 'show_mermaid_diagram') {
          setMermaidCode(payload.data);
          setViewMode("mermaid");
        } else if (payload.tool === 'generate_interactive_applet') {
          generateApplet(payload.data);
        } else if (payload.tool === 'play_educational_video') {
          setVideoId(payload.data);
          setViewMode("video");
        } else if (payload.tool === 'open_drawing_board') {
          setViewMode("drawing");
        } else if (payload.tool === 'open_code_editor') {
          if (payload.data) {
            setSandboxLang(payload.data.language || "react");
            setSandboxFiles(payload.data.files || {});
          }
          setViewMode("code");
        } else if (payload.tool === 'show_quiz') {
          if (payload.data) {
            setQuizData(payload.data);
          }
          setViewMode("quiz");
        }
      }
    } catch (e) {
      // ignore parse errors for non-JSON data
    }
  });

  useEffect(() => { const t = setInterval(() => setSessionTime((s) => s + 1), 1000); return () => clearInterval(t); }, []);
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  // ── Refs for latest state ──
  const messagesRef = useRef(messages);
  const topicRef = useRef(topic);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { topicRef.current = topic; }, [topic]);


  const generateVisualization = useCallback(async (vizTopic: string, context?: string) => {
    setVizLoading(true);
    try {
      const res = await fetch("/api/visualize", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: vizTopic, context }),
      });
      const data = await res.json();
      if (data.mermaid) setMermaidCode(data.mermaid);
    } catch (e) { console.error("Viz error:", e); }
    setVizLoading(false);
  }, []);

  // Sync agent voice transcripts into the chat panel (after generateVisualization is declared)
  const processedAgentSegIds = useRef<Set<string>>(new Set());
  const lastVizTimestamp = useRef<number>(0);
  const liveAgentMsgId = useRef<number | null>(null);

  useEffect(() => {
    for (const seg of agentTranscriptions) {
      const agentText = seg.text.trim();
      if (!agentText) continue;

      if (seg.final && !processedAgentSegIds.current.has(seg.id)) {
        processedAgentSegIds.current.add(seg.id);

        // If we had a live message, update it to final. Otherwise add new.
        if (liveAgentMsgId.current) {
          setMessages(m => m.map(msg =>
            msg.id === liveAgentMsgId.current ? { ...msg, text: agentText } : msg
          ));
          liveAgentMsgId.current = null;
        } else {
          setMessages(m => [...m, { id: Date.now() + Math.random(), role: 'ai', text: agentText, time: NOW() }]);
        }
      } else if (!seg.final) {
        // Show live/partial transcript in real time
        if (!liveAgentMsgId.current) {
          const id = Date.now() + Math.random();
          liveAgentMsgId.current = id;
          setMessages(m => [...m, { id, role: 'ai', text: agentText, time: NOW() }]);
        } else {
          setMessages(m => m.map(msg =>
            msg.id === liveAgentMsgId.current ? { ...msg, text: agentText } : msg
          ));
        }
      }
    }
  }, [agentTranscriptions, topic, generateVisualization]);

  const sendMessage = useCallback(async () => {
    const text = chatInput.trim();
    if (!text) return;

    // We add it to our local messages array for instant UI feedback
    const userMsg: ChatMsg = { id: Date.now(), role: "user", text, time: NOW() };
    setMessages((m) => [...m, userMsg]);
    setChatInput("");
    if (messages.length <= 2) setTopic(text.slice(0, 50));

    try {
      // Send the message directly into the LiveKit Room chat!
      // The Gemini voice agent automatically listens to this channel and will respond with voice/tools.
      await sendChat(text);
    } catch (error) {
      console.error("Failed to send text to agent:", error);
    }
  }, [chatInput, sendChat, messages]);

  const tabs: { key: Tab; icon: typeof MessageSquare; label: string }[] = [
    { key: "chat", icon: MessageSquare, label: "Chat" },
    { key: "notes", icon: FileText, label: "Notes" },
    { key: "quiz", icon: ListChecks, label: "Quiz" },
    { key: "summary", icon: BookOpen, label: "Summary" },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] h-screen overflow-hidden relative">
      <header className="flex items-center justify-between px-6 h-20 shrink-0 bg-transparent z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-11 h-11 flex items-center justify-center rounded-full bg-white border border-slate-200/80 shadow-sm hover:bg-slate-50 transition-colors text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200/80 shadow-sm">
            <Logo size="sm" iconOnly />
            <span className="font-bold text-sm text-slate-800">Synap AI Session</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50/80 backdrop-blur-sm px-3.5 py-2 rounded-full border border-emerald-100 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-600">{formatTime(sessionTime)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs hidden sm:block truncate max-w-[200px] text-slate-500 bg-white border border-slate-200/80 px-4 py-2.5 rounded-full shadow-sm font-semibold">{topic}</span>


          <button className="w-11 h-11 flex items-center justify-center rounded-full bg-white border border-slate-200/80 shadow-sm hover:bg-slate-50 transition-colors text-slate-600" onClick={() => setSideOpen(!sideOpen)}>
            {sideOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative px-6 pb-24 gap-6">

        {/* Center — Massive AI Whiteboard */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white shadow-[0_8px_40px_rgb(0,0,0,0.04)] rounded-[32px] border border-slate-200/60 relative isolate">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white/80 backdrop-blur-md z-10 absolute top-0 inset-x-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200/50">
                <PenTool className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Live AI Whiteboard</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Auto-generating visualizations</p>
              </div>
              {vizLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-700 ml-3" />}
            </div>
          </div>

          {/* Whiteboard Canvas */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-slate-50 pt-28 pb-8">
            <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-[24px] flex items-center justify-center p-8 bg-white relative shadow-sm">
              {viewMode === "desmos" && <DesmosRenderer equations={desmosEquations} />}
              {viewMode === "html" && (
                htmlAppletCode ? <HTMLAppletRenderer htmlCode={htmlAppletCode} /> : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                    <p className="font-bold tracking-widest uppercase text-xs">Compiling Simulation...</p>
                  </div>
                )
              )}
              {viewMode === "video" && <VideoRenderer videoId={videoId} />}
              {viewMode === "mermaid" && <MermaidRenderer code={mermaidCode} className="w-full max-w-5xl" />}
              {viewMode === "code" && <CodeSandbox files={sandboxFiles} language={sandboxLang} />}
              {viewMode === "quiz" && quizData && <QuizRenderer quiz={quizData} />}
              {viewMode === "drawing" && <DrawingBoard />}
            </div>
          </div>

          {/* Floating Local Video (Picture-in-Picture) */}
          <motion.div drag dragMomentum={false} className="absolute bottom-8 left-8 w-40 h-28 cursor-grab active:cursor-grabbing bg-black rounded-2xl shadow-xl ring-2 ring-slate-700 overflow-hidden z-50 group transition-transform hover:scale-105">
            {myVideoTrack && !myVideoTrack.publication?.isMuted ? (
              <VideoTrack trackRef={myVideoTrack} className="w-full h-full object-cover pointer-events-none" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f172a] pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center mb-2 ring-1 ring-slate-700">
                  <VideoOff className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Camera Off</p>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 pointer-events-none">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> You
            </div>
          </motion.div>
        </div>

        {/* Right sidebar */}
        <AnimatePresence>
          {sideOpen && (
            <motion.aside initial={{ width: 0, opacity: 0, marginLeft: 0 }} animate={{ width: typeof window !== "undefined" && window.innerWidth < 768 ? "100%" : 400, opacity: 1, marginLeft: 0 }} exit={{ width: 0, opacity: 0, marginLeft: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }} className="flex flex-col overflow-hidden shrink-0 bg-white rounded-[32px] border border-slate-200/60 shadow-[0_8px_40px_rgb(0,0,0,0.04)] h-full relative z-20">
              {/* Tabs */}
              <div className="flex border-b border-slate-100 shrink-0 bg-white p-2.5">
                {tabs.map((t) => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all rounded-2xl relative"
                    style={{
                      color: activeTab === t.key ? "var(--color-primary)" : "var(--color-text-secondary)",
                      backgroundColor: activeTab === t.key ? "var(--color-bg-muted)" : "transparent"
                    }}>
                    <t.icon className="w-4 h-4" />{t.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-slate-50/30">
                {activeTab === "chat" && (
                  <div className="space-y-6">
                    {messages.map((m) => (
                      <motion.div layout initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.2 }} key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[85%] rounded-[24px] px-5 py-4 shadow-sm ${m.role === "user" ? "bg-slate-900 text-white rounded-tr-[6px]" : "bg-white border border-slate-200/80 text-slate-800 rounded-tl-[6px]"}`}>
                          <motion.div layout className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {m.role === "ai" ? (
                              <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 text-slate-800">
                                <ReactMarkdown>{m.text}</ReactMarkdown>
                              </div>
                            ) : (
                              <p>{m.text}</p>
                            )}
                          </motion.div>
                          <p className={`text-[10px] mt-2 font-bold text-right ${m.role === 'user' ? 'text-zinc-300' : 'text-slate-400'}`}>{m.time}</p>
                        </div>
                      </motion.div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="rounded-[24px] rounded-tl-[6px] px-5 py-4 bg-white border border-slate-200/80 shadow-sm">
                          <div className="typing-dots"><span /><span /><span /></div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEnd} />
                  </div>
                )}
              </div>

              {/* Chat input */}
              {activeTab === "chat" && (
                <div className="p-5 border-t border-slate-100 shrink-0 bg-white">
                  <div className="flex gap-3">
                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder="Ask the AI Tutor..." disabled={isTyping}
                      className="flex-1 px-5 py-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 rounded-2xl border border-slate-200 bg-slate-50 outline-none transition-all disabled:opacity-50 focus:border-slate-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,23,42,0.05)]" />
                    <button onClick={sendMessage} disabled={isTyping || !chatInput.trim()}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center border-0 bg-slate-900 text-white shadow-md shadow-slate-900/20 disabled:opacity-40 hover:bg-black transition-colors cursor-pointer">
                      {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                    </button>
                  </div>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Bottom Dock (MacOS Style) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-white/70 backdrop-blur-3xl border border-white/40 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50 ring-1 ring-black/5">

        {/* Voice Group */}
        <div className="flex items-center gap-2 bg-black/5 rounded-[22px] p-1">
          <TrackToggle source={Track.Source.Microphone} className="w-11 h-11 rounded-[18px] border-0 flex items-center justify-center transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 data-[state=off]:bg-red-500 data-[state=off]:text-white shadow-sm" />

          <div className="h-11 min-w-[140px] px-4 rounded-[18px] bg-white/50 flex items-center justify-center gap-2 transition-all">
            <AgentStatusIndicator isMicMuted={isMicMuted} />
          </div>

          {/* Stop Speaking Button — only visible when agent is speaking */}
          {voiceAssistant.state === 'speaking' && (
            <button
              onClick={stopAgentSpeaking}
              className="w-11 h-11 rounded-[18px] border-0 flex items-center justify-center transition-all cursor-pointer bg-orange-500 text-white hover:bg-orange-600 shadow-sm animate-pulse"
              title="Stop AI from speaking"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          )}
        </div>

        <div className="w-[1px] h-6 bg-black/10 mx-1"></div>

        {/* Video Toggle */}
        <TrackToggle source={Track.Source.Camera} className="w-11 h-11 rounded-[22px] border-0 flex items-center justify-center transition-all cursor-pointer bg-white/50 text-slate-700 hover:bg-white data-[state=off]:bg-red-500 data-[state=off]:text-white shadow-sm" />

        <div className="w-[1px] h-6 bg-black/10 mx-1"></div>

        {/* End Session */}
        <DisconnectButton className="w-11 h-11 rounded-[22px] border-0 bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all cursor-pointer shadow-sm group">
          <PhoneOff className="w-4 h-4 transition-transform group-hover:scale-110" />
        </DisconnectButton>
      </div>
    </div>
  );
}

function AgentStatusIndicator({ isMicMuted }: { isMicMuted: boolean }) {
  const { state } = useVoiceAssistant();

  const isListening = state === 'listening' && !isMicMuted;
  const isThinking = state === 'thinking';
  const isSpeaking = state === 'speaking';
  const isInitializing = state === 'initializing';
  const isActive = isListening || isThinking || isSpeaking;

  let text = 'Waiting for Agent...';
  let dotColor = 'bg-slate-400';

  if (isMicMuted && state === 'listening') { text = 'Mic Muted'; dotColor = 'bg-red-400'; }
  else if (isListening) { text = 'Listening'; dotColor = 'bg-emerald-500'; }
  else if (isThinking) { text = 'Thinking'; dotColor = 'bg-amber-500'; }
  else if (isSpeaking) { text = 'Speaking'; dotColor = 'bg-blue-500'; }
  else if (isInitializing) { text = 'Connecting'; dotColor = 'bg-slate-500'; }

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center w-8 h-8">
        {isActive && (
          <>
            <span className={`absolute inset-0 rounded-full opacity-20 animate-ping ${isSpeaking ? 'bg-blue-400' : isThinking ? 'bg-amber-400' : 'bg-emerald-400'
              }`} style={{ animationDuration: isSpeaking ? '1s' : '2s' }} />
            <span className={`absolute inset-[3px] rounded-full opacity-30 animate-ping ${isSpeaking ? 'bg-blue-400' : isThinking ? 'bg-amber-400' : 'bg-emerald-400'
              }`} style={{ animationDuration: isSpeaking ? '1.3s' : '2.5s' }} />
          </>
        )}
        <span className={`relative z-10 w-3 h-3 rounded-full transition-all duration-300 shadow-sm ${dotColor} ${isActive ? 'scale-100' : 'scale-75'}`} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 whitespace-nowrap">
        {text}
      </span>
    </div>
  );
}

