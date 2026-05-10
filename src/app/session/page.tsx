"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Send, Sparkles,
  PanelRightOpen, PanelRightClose, FileText, Brain,
  Lightbulb, ArrowLeft, Maximize2, Minimize2,
  BookOpen, ListChecks, PenTool, MessageSquare, Loader2,
  Square, Upload as UploadIcon, Image as ImageIcon, X as XIcon, RefreshCw,
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
import ManimRenderer from "@/components/ManimRenderer";
import GeoGebraRenderer from "@/components/GeoGebraRenderer";
import DrawingBoard from "@/components/DrawingBoard";
import CodeSandbox from "@/components/CodeSandbox";
import QuizRenderer, { QuizData } from "@/components/QuizRenderer";

type Tab = "chat" | "notes" | "summary" | "upload";
interface ChatMsg { id: number; role: "user" | "ai"; text: string; time: string; }
interface SessionUpload {
  id: string;
  name: string;
  size: number;
  kind: "image" | "pdf" | "other";
  dataUrl?: string;             // for images, the inline preview
  // AI integration
  aiStatus: "idle" | "analyzing" | "ready" | "error";
  aiContent?: string;           // PDF text OR image description from Gemini Vision
  aiError?: string;
  attachedToAgent?: boolean;    // true once user has clicked "Ask AI about this"
}

const NOW = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function stripMermaid(text: string): string {
  return text.replace(/```mermaid\n[\s\S]*?```/g, "*(I have generated a diagram for you on the whiteboard)*").trim();
}

function extractMermaid(text: string): string | null {
  const match = text.match(/```mermaid\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

export default function SessionPage() {
  // useSearchParams in Next 16 must be inside a Suspense boundary.
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center text-slate-500">Loading…</div>}>
      <SessionPageInner />
    </Suspense>
  );
}

function SessionPageInner() {
  // Optional URL params from /upload — concept badges link with these.
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic") || "";
  const initialRoom = searchParams.get("room") || `synap-lab-${Math.random().toString(36).slice(2, 8)}`;

  // LiveKit Connection State
  const [token, setToken] = useState("");
  const [roomName, setRoomName] = useState(initialRoom);
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
          <p className="text-base mb-6 text-slate-500 leading-relaxed">
            Connect to the real-time AI Whiteboard.
          </p>

          {initialTopic && (
            <div className="mb-6 mx-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-700">
                Today's topic: {initialTopic}
              </span>
            </div>
          )}

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
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string>("graph TD\n    A[\"🚀 LiveKit WebRTC Connected\"] --> B[\"Ultra-low latency audio/video\"]\n    A --> C[\"AI Agent Ready\"]\n    B --> D[\"Interactive Learning\"]");
  const [vizLoading, setVizLoading] = useState(false);
  // If we arrived here from /upload (?topic=...&uploadId=...), seed the topic
  // and (later) fetch the document's full text to include as agent context.
  const sp = useSearchParams();
  const seedTopic = sp.get("topic") || "";
  const seedUploadId = sp.get("uploadId") || "";
  const [topic, setTopic] = useState(seedTopic || "General Learning");
  const [docText, setDocText] = useState<string>("");
  const [sessionTime, setSessionTime] = useState(0);
  const [viewMode, setViewMode] = useState<"mermaid" | "desmos" | "html" | "video" | "drawing" | "code" | "quiz" | "manim" | "geogebra">("mermaid");
  const [desmosEquations, setDesmosEquations] = useState<string[]>([]);
  const [htmlAppletCode, setHtmlAppletCode] = useState<string>("");
  const [videoId, setVideoId] = useState<string>("");
  const [manimVideoUrl, setManimVideoUrl] = useState<string>("");
  const [geogebraCommands, setGeogebraCommands] = useState<string[]>([]);
  const [geogebraApp, setGeogebraApp] = useState<"graphing" | "geometry" | "3d" | "classic" | "scientific">("geometry");

  // New Interactive States
  const [sandboxCode, setSandboxCode] = useState<string>("");
  const [sandboxLang, setSandboxLang] = useState<string>("react");
  const [quizData, setQuizData] = useState<QuizData | null>(null);

  // Per-tab content state
  const [notesMd, setNotesMd] = useState<string>("");
  const [summaryMd, setSummaryMd] = useState<string>("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [sessionUploads, setSessionUploads] = useState<SessionUpload[]>([]);
  const sessionUploadInputRef = useRef<HTMLInputElement>(null);


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

  const [agentReady, setAgentReady] = useState(false);
  const sawAgentSpeakingRef = useRef(false);
  useEffect(() => {
    if (agentReady) return;
    if (voiceAssistant.state === "speaking") {
      sawAgentSpeakingRef.current = true;
    } else if (voiceAssistant.state === "listening" && sawAgentSpeakingRef.current) {
      setAgentReady(true);
    }
  }, [voiceAssistant.state, agentReady]);
  useEffect(() => {
    if (agentReady) return;
    const t = setTimeout(() => setAgentReady(true), 12000);
    return () => clearTimeout(t);
  }, [agentReady]);

  // If the user came from /upload with a topic param, send the agent a single
  // priming chat message — but ONLY after it has finished its initial greeting.
  // Sending it earlier creates a race where Gemini Live processes the greeting
  // instruction and drops the chat message on the floor.
  //
  // We track the agent's voiceAssistant.state transitions: it goes
  // initializing → listening → speaking (greeting) → listening (ready). We
  // wait for the speaking-then-listening transition before sending. A 12-second
  // fallback fires if the agent never speaks (network blip, no greeting).
  // If we arrived with ?uploadId, fetch that document's full text once. The
  // text gets folded into the priming message so the agent has it as context
  // for the rest of the session — answer questions, summarize, find a
  // specific question's answer in a question bank, etc.
  useEffect(() => {
    if (!seedUploadId) return;
    fetch(`/api/upload?id=${seedUploadId}`)
      .then(r => r.json())
      .then(data => {
        if (data.upload?.text) setDocText(data.upload.text);
      })
      .catch(e => console.error("Failed to fetch upload text:", e));
  }, [seedUploadId]);

  // Build the priming message. If we have document text, attach a generous
  // (but bounded) excerpt as context. We display a shortened version in the
  // chat panel — sending the full thing to the agent is fine, but rendering
  // 15k characters in the UI looks bad.
  const buildPrimer = useCallback((): { full: string; display: string } => {
    if (!seedTopic) return { full: "", display: "" };
    const MAX_CONTEXT_CHARS = 15_000;
    const ctx = docText
      ? `Here is the document I uploaded for reference (you can quote or answer questions from it):\n\n===DOCUMENT START===\n${docText.slice(0, MAX_CONTEXT_CHARS)}\n===DOCUMENT END===\n\n`
      : "";
    const ask = `I'd like to learn about "${seedTopic}". Please teach me step by step using your visual tools, and use the document above to answer any specific questions I ask.`;
    return {
      full: ctx + ask,
      display: docText
        ? `I'd like to learn about "${seedTopic}". (Document attached as context — feel free to ask the AI questions about it.)`
        : `I'd like to learn about "${seedTopic}". Please teach me this concept step by step, using your visual tools when helpful.`,
    };
  }, [seedTopic, docText]);

  const seedSentRef = useRef(false);
  const hasGreetedRef = useRef(false);
  useEffect(() => {
    if (seedSentRef.current || !seedTopic) return;
    // If we expect document text, wait for it to load before priming. Skip
    // this guard if there's no uploadId — there's nothing to wait for.
    if (seedUploadId && !docText) return;
    if (voiceAssistant.state === "speaking") {
      hasGreetedRef.current = true;
      return; // never send while agent is talking
    }
    if (hasGreetedRef.current && voiceAssistant.state === "listening") {
      seedSentRef.current = true;
      const { full, display } = buildPrimer();
      sendChat(full).catch(e => console.error("Failed to seed topic:", e));
      setMessages(m => [...m, { id: Date.now(), role: "user", text: display, time: NOW() }]);
    }
  }, [seedTopic, seedUploadId, docText, voiceAssistant.state, sendChat, buildPrimer]);

  // Fallback: if the agent never enters "speaking" within 12s (unusual — would
  // mean greeting failed), send the primer anyway so the user isn't stuck.
  useEffect(() => {
    if (!seedTopic) return;
    const timer = setTimeout(() => {
      if (seedSentRef.current) return;
      // If a doc was expected but never loaded, prime without it rather than
      // leaving the user staring at a silent agent.
      seedSentRef.current = true;
      const { full, display } = buildPrimer();
      sendChat(full).catch(e => console.error("Failed to seed topic (fallback):", e));
      setMessages(m => [...m, { id: Date.now(), role: "user", text: display, time: NOW() }]);
    }, 12000);
    return () => clearTimeout(timer);
  }, [seedTopic, sendChat, buildPrimer]);

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
  const room = useRoomContext();

  // ── MongoDB session persistence ──
  // `hydrated` gates the save effect so the initial Mongo load doesn't
  // immediately re-fire a save (load → setState → save → … pingpong).
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!room?.name) return;
    fetch(`/api/session?room=${room.name}`)
      .then(res => res.json())
      .then(data => {
        if (data.state) {
          const s = data.state;
          if (s.messages) setMessages(s.messages);
          if (s.mermaidCode) setMermaidCode(s.mermaidCode);
          if (s.viewMode) setViewMode(s.viewMode);
          if (s.desmosEquations) setDesmosEquations(s.desmosEquations);
          if (s.htmlAppletCode) setHtmlAppletCode(s.htmlAppletCode);
          if (s.videoId) setVideoId(s.videoId);
          if (Array.isArray(s.geogebraCommands)) setGeogebraCommands(s.geogebraCommands);
          if (s.geogebraApp) setGeogebraApp(s.geogebraApp);
          if (typeof s.sandboxCode === "string") setSandboxCode(s.sandboxCode);
          if (s.sandboxLang) setSandboxLang(s.sandboxLang);
          if (s.quizData) setQuizData(s.quizData);
        }
      })
      .catch(e => console.error("Failed to load session from DB", e))
      .finally(() => setHydrated(true));
  }, [room?.name]);

  useEffect(() => {
    if (!room?.name || !hydrated) return;
    const timeout = setTimeout(() => {
      // Note: manimVideoUrl is intentionally NOT persisted — a base64 mp4
      // can be hundreds of KB and would blow past the 512KB cap on
      // /api/session. The user can regenerate the animation if they refresh.
      const state = {
        messages, mermaidCode, viewMode, desmosEquations, htmlAppletCode,
        videoId, sandboxCode, sandboxLang, quizData,
        geogebraCommands, geogebraApp,
      };
      fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: room.name, state }),
      }).catch(e => console.error("Failed to save session to DB", e));
    }, 2000); // 2s debounce so we don't spam Mongo on every state tick
    return () => clearTimeout(timeout);
  }, [hydrated, messages, mermaidCode, viewMode, desmosEquations, htmlAppletCode, videoId, sandboxCode, sandboxLang, quizData, geogebraCommands, geogebraApp, room?.name]);

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

  const generateManim = useCallback(async (manimTopic: string) => {
    setVizLoading(true);
    setViewMode("manim");
    setManimVideoUrl(""); // loader state
    try {
      const res = await fetch("/api/manim", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: manimTopic }),
      });
      const data = await res.json();
      if (data.videoDataUrl) {
        setManimVideoUrl(data.videoDataUrl);
      } else {
        console.error("Manim gen failed:", data);
      }
    } catch (e) {
      console.error("Manim gen error:", e);
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
        } else if (payload.tool === 'generate_manim_video') {
          generateManim(payload.data);
        } else if (payload.tool === 'show_geogebra_construction') {
          if (payload.data) {
            if (Array.isArray(payload.data.commands)) setGeogebraCommands(payload.data.commands);
            if (payload.data.appName) setGeogebraApp(payload.data.appName);
          }
          setViewMode("geogebra");
        } else if (payload.tool === 'play_educational_video') {
          setVideoId(payload.data);
          setViewMode("video");
        } else if (payload.tool === 'open_drawing_board') {
          setViewMode("drawing");
        } else if (payload.tool === 'open_code_editor') {
          if (payload.data) {
            setSandboxLang(payload.data.language || "react");
            setSandboxCode(payload.data.initialCode || "");
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

  const sendMessage = useCallback(async (override?: string) => {
    const text = (override ?? chatInput).trim();
    if (!text) return;

    const userMsg: ChatMsg = { id: Date.now(), role: "user", text, time: NOW() };
    setMessages((m) => [...m, userMsg]);
    if (override === undefined) setChatInput("");
    if (messagesRef.current.length <= 2) setTopic(text.slice(0, 50));

    try {
      await sendChat(text);
    } catch (error) {
      console.error("Failed to send text to agent:", error);
    }
  }, [chatInput, sendChat]);

  const tabs: { key: Tab; icon: typeof MessageSquare; label: string }[] = [
    { key: "chat", icon: MessageSquare, label: "Chat" },
    { key: "notes", icon: FileText, label: "Notes" },
    { key: "summary", icon: BookOpen, label: "Summary" },
    { key: "upload", icon: UploadIcon, label: "Files" },
  ];

  // Generate Notes / Summary on demand from the current chat history.
  const generateNotesOrSummary = useCallback(async (mode: "notes" | "summary") => {
    if (mode === "notes") setNotesLoading(true);
    else setSummaryLoading(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, messages, topic }),
      });
      const data = await res.json();
      const md = (data?.markdown ?? "").toString() || "_The AI returned an empty response._";
      if (mode === "notes") setNotesMd(md);
      else setSummaryMd(md);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate";
      if (mode === "notes") setNotesMd(`Error: ${msg}`);
      else setSummaryMd(`Error: ${msg}`);
    } finally {
      if (mode === "notes") setNotesLoading(false);
      else setSummaryLoading(false);
    }
  }, [messages, topic]);

  // Helper: patch one upload by id.
  const patchUpload = useCallback((id: string, patch: Partial<SessionUpload>) => {
    setSessionUploads(curr => curr.map(u => u.id === id ? { ...u, ...patch } : u));
  }, []);

  // Background processing — extract text from PDFs (via /api/upload) or
  // describe images (via /api/vision) so the agent has something concrete
  // to query later.
  const processUploadForAI = useCallback(async (id: string, file: File, kind: SessionUpload["kind"]) => {
    patchUpload(id, { aiStatus: "analyzing" });
    try {
      if (kind === "pdf") {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "PDF parse failed");
        // /api/upload doesn't return the raw text — fetch it via the new GET-by-id.
        if (!data.uploadId) throw new Error("Upload didn't return an id");
        const detailRes = await fetch(`/api/upload?id=${data.uploadId}`);
        const detail = await detailRes.json();
        const text = detail?.upload?.text || "";
        if (!text.trim()) throw new Error("Couldn't extract text from this PDF");
        patchUpload(id, { aiStatus: "ready", aiContent: text });
      } else if (kind === "image") {
        const fd = new FormData();
        fd.append("image", file);
        const res = await fetch("/api/vision", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Vision analysis failed");
        patchUpload(id, { aiStatus: "ready", aiContent: data.description });
      } else {
        patchUpload(id, { aiStatus: "error", aiError: "Unsupported file type for AI analysis" });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to process";
      patchUpload(id, { aiStatus: "error", aiError: msg });
    }
  }, [patchUpload]);

  // Inline upload handler for the Files tab. Adds the file to local state,
  // builds a thumbnail (for images), and kicks off AI processing in the
  // background so the "Ask AI about this" button can be enabled when ready.
  const handleSessionUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const kind: SessionUpload["kind"] = isImage ? "image" : isPdf ? "pdf" : "other";

      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = typeof reader.result === "string" ? reader.result : undefined;
          setSessionUploads(curr => [{ id, name: file.name, size: file.size, kind, dataUrl, aiStatus: "idle" }, ...curr]);
          processUploadForAI(id, file, kind);
        };
        reader.readAsDataURL(file);
      } else {
        setSessionUploads(curr => [{ id, name: file.name, size: file.size, kind, aiStatus: "idle" }, ...curr]);
        if (kind === "pdf") processUploadForAI(id, file, kind);
      }
    });
  }, [processUploadForAI]);

  // "Ask AI about this" — sends the file's extracted content to the agent as
  // a chat message. Display a short version in the panel; send the full text
  // to the agent. The agent can then answer follow-up questions about it.
  const attachUploadToAgent = useCallback((u: SessionUpload) => {
    if (!u.aiContent || u.aiStatus !== "ready") return;
    const MAX = 12_000;
    const content = u.aiContent.slice(0, MAX);
    const label = u.kind === "image" ? "image" : "PDF";
    const fullMessage = `I've attached a ${label} called "${u.name}". Here is its content for reference:\n\n===${u.kind.toUpperCase()} START===\n${content}\n===${u.kind.toUpperCase()} END===\n\nPlease use this as context for the rest of our conversation. I may ask you questions about it.`;
    const displayMessage = `📎 Attached ${label}: ${u.name} — feel free to ask me anything about it.`;
    sendChat(fullMessage).catch(e => console.error("Failed to attach to agent:", e));
    setMessages(m => [...m, { id: Date.now() + Math.random(), role: "user", text: displayMessage, time: NOW() }]);
    patchUpload(u.id, { attachedToAgent: true });
  }, [sendChat, patchUpload]);

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
              {viewMode === "manim" && (
                manimVideoUrl ? <ManimRenderer videoUrl={manimVideoUrl} /> : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                    <p className="font-bold tracking-widest uppercase text-xs">Rendering Manim animation… (~30-60s)</p>
                  </div>
                )
              )}
              {viewMode === "mermaid" && <MermaidRenderer code={mermaidCode} className="w-full max-w-5xl" />}
              {viewMode === "geogebra" && <GeoGebraRenderer commands={geogebraCommands} appName={geogebraApp} />}
              {viewMode === "code" && <CodeSandbox initialCode={sandboxCode} language={sandboxLang} />}
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

                {activeTab === "notes" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-700">Session Notes</h3>
                      <button
                        onClick={() => generateNotesOrSummary("notes")}
                        disabled={notesLoading}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white disabled:opacity-50 hover:bg-black transition-colors"
                      >
                        {notesLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        {notesMd ? "Regenerate" : "Generate"}
                      </button>
                    </div>
                    {notesMd ? (
                      <div className="prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-li:my-0.5 text-slate-800 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                        <ReactMarkdown>{notesMd}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-slate-400">
                        <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-xs font-medium">Click <span className="font-bold">Generate</span> to extract bullet-point notes from this session.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "summary" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-700">Session Summary</h3>
                      <button
                        onClick={() => generateNotesOrSummary("summary")}
                        disabled={summaryLoading}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white disabled:opacity-50 hover:bg-black transition-colors"
                      >
                        {summaryLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        {summaryMd ? "Regenerate" : "Generate"}
                      </button>
                    </div>
                    {summaryMd ? (
                      <div className="prose prose-sm max-w-none prose-p:my-2 text-slate-800 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                        <ReactMarkdown>{summaryMd}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-slate-400">
                        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-xs font-medium">Click <span className="font-bold">Generate</span> for a narrative recap of your session.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "upload" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-700">Files ({sessionUploads.length})</h3>
                      <button
                        onClick={() => sessionUploadInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-black transition-colors"
                      >
                        <UploadIcon className="w-3 h-3" /> Add file
                      </button>
                    </div>
                    <input
                      ref={sessionUploadInputRef}
                      type="file"
                      accept="image/*,application/pdf,.pdf"
                      multiple
                      hidden
                      onChange={(e) => handleSessionUpload(e.target.files)}
                    />

                    <div
                      onClick={() => sessionUploadInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); handleSessionUpload(e.dataTransfer.files); }}
                      className="border-2 border-dashed border-slate-200 rounded-2xl py-8 text-center cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-colors"
                    >
                      <UploadIcon className="w-7 h-7 mx-auto mb-2 text-slate-400" />
                      <p className="text-xs text-slate-500 font-medium">Drop images or PDFs to attach to this session</p>
                    </div>

                    {sessionUploads.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 mt-2">No files attached yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {sessionUploads.map((u) => (
                          <div key={u.id} className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
                            <div className="flex gap-3 p-3">
                              {u.kind === "image" && u.dataUrl ? (
                                <img src={u.dataUrl} alt={u.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                              ) : (
                                <div className="w-20 h-20 rounded-lg flex items-center justify-center bg-slate-50 shrink-0">
                                  {u.kind === "pdf"
                                    ? <FileText className="w-8 h-8 text-rose-400" />
                                    : <ImageIcon className="w-8 h-8 text-slate-400" />}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-700 truncate">{u.name}</p>
                                <p className="text-[10px] text-slate-400">{(u.size / 1024).toFixed(1)} KB</p>

                                {u.aiStatus === "analyzing" && (
                                  <span className="badge badge-warning text-[10px] mt-2 inline-flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Analyzing
                                  </span>
                                )}
                                {u.aiStatus === "ready" && !u.attachedToAgent && (
                                  <button
                                    onClick={() => attachUploadToAgent(u)}
                                    className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                                  >
                                    <Sparkles className="w-3 h-3" /> Ask AI about this
                                  </button>
                                )}
                                {u.attachedToAgent && (
                                  <span className="badge badge-success text-[10px] mt-2 inline-flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Attached to AI
                                  </span>
                                )}
                                {u.aiStatus === "error" && (
                                  <p className="text-[10px] text-rose-500 mt-2">{u.aiError}</p>
                                )}
                                {u.kind === "other" && u.aiStatus === "idle" && (
                                  <p className="text-[10px] text-slate-400 mt-2">No AI analysis available for this file type.</p>
                                )}
                              </div>
                              <button
                                onClick={() => setSessionUploads(curr => curr.filter(x => x.id !== u.id))}
                                className="self-start text-slate-300 hover:text-rose-500 transition-colors"
                              >
                                <XIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {sessionUploads.length > 0 && (
                      <p className="text-[10px] text-slate-400 mt-2">
                        After clicking <span className="font-semibold">Ask AI about this</span>, you can ask the AI questions about the file in the Chat tab.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Chat input */}
              {activeTab === "chat" && (
                <div className="p-5 border-t border-slate-100 shrink-0 bg-white">
                  {messages.filter(m => m.role === "user").length === 0 && (
                    <div className="mb-3">
                      {agentReady ? (
                        <>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                            Try one of these
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "Animate the Pythagorean theorem",
                              "Build me a React todo app",
                              "Show a sine wave from a unit circle",
                              "Visualize bubble sort",
                            ].map((prompt) => (
                              <button
                                key={prompt}
                                onClick={() => sendMessage(prompt)}
                                className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Waiting for the AI to finish greeting…
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder="Ask the AI Tutor..." disabled={isTyping}
                      className="flex-1 px-5 py-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 rounded-2xl border border-slate-200 bg-slate-50 outline-none transition-all disabled:opacity-50 focus:border-slate-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,23,42,0.05)]" />
                    <button onClick={() => sendMessage()} disabled={isTyping || !chatInput.trim()}
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

