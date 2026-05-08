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
  TrackToggle,
  DisconnectButton,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

const MermaidRenderer = dynamic(() => import("@/components/MermaidRenderer"), { ssr: false });

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

  // Fetch token to join room
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
            Join Room
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
      audio={false}
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
  const [selectedVoice, setSelectedVoice] = useState("EXAVITQu4vr4xnSDxMaL"); // Sarah - reliable female
  const [voiceMenuOpen, setVoiceMenuOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Audio playback management
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const chatEnd = useRef<HTMLDivElement>(null);

  // LiveKit Hooks
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const aiParticipant = participants.find(p => p.identity.toLowerCase().includes('ai') || p.identity.toLowerCase().includes('agent'));
  const allVideoTracks = useTracks([Track.Source.Camera]);
  const myVideoTrack = allVideoTracks.find(t => t.participant.identity === localParticipant.identity);
  const aiVideoTrack = aiParticipant ? allVideoTracks.find(t => t.participant.identity === aiParticipant.identity) : null;

  useEffect(() => { const t = setInterval(() => setSessionTime((s) => s + 1), 1000); return () => clearInterval(t); }, []);
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);

  // ── Stop AI Speech ──
  const stopSpeech = useCallback(() => {
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // ── Play TTS ──
  const playTTS = useCallback(async (text: string): Promise<void> => {
    try {
      const ttsRes = await fetch("/api/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, voiceId: selectedVoice }) });
      if (ttsRes.ok) {
        const blobUrl = URL.createObjectURL(await ttsRes.blob());
        const audio = new Audio(blobUrl);
        currentAudioRef.current = audio;
        setIsSpeaking(true);
        
        return new Promise((resolve) => {
          audio.onended = () => { setIsSpeaking(false); currentAudioRef.current = null; resolve(); };
          audio.onerror = () => { setIsSpeaking(false); currentAudioRef.current = null; resolve(); };
          audio.play().catch(() => resolve());
        });
      }
    } catch(e) { console.warn("TTS error:", e); }
  }, [selectedVoice]);

  const processAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    isPlayingRef.current = true;
    
    while (audioQueueRef.current.length > 0 && isPlayingRef.current) {
      const text = audioQueueRef.current.shift();
      if (text) {
        await playTTS(text);
      }
    }
    
    isPlayingRef.current = false;
  }, [playTTS]);

  // ── Refs for latest state ──
  const messagesRef = useRef(messages);
  const topicRef = useRef(topic);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { topicRef.current = topic; }, [topic]);

  // ── Send voice transcript to AI ──
  const sendVoiceMessage = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;

    const currentMessages = messagesRef.current;
    const currentTopic = topicRef.current;
    const userMsg: ChatMsg = { id: Date.now(), role: "user", text: transcript, time: NOW() };
    setMessages((m) => [...m, userMsg]);
    if (currentMessages.length <= 2) setTopic(transcript.slice(0, 50));
    setIsTyping(true);
    setChatInput("");

    try {
      const allMsgs = [...currentMessages, userMsg].map((m) => ({ role: m.role === "ai" ? "assistant" : "user", text: m.text }));
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: allMsgs, topic: currentTopic }) });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let processedLength = 0;
      const aiMsgId = Date.now() + 1;
      setMessages((m) => [...m, { id: aiMsgId, role: "ai", text: "", time: NOW() }]);
      setIsTyping(false);

      while (true) {
        const { done, value } = await reader?.read()!;
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              setMessages((m) => m.map((msg) => msg.id === aiMsgId ? { ...msg, text: stripMermaid(fullText) } : msg));
              
              // Chunking TTS by sentence
              const cleanText = stripMermaid(fullText);
              while (true) {
                const unprocessed = cleanText.slice(processedLength);
                const sentenceEnd = unprocessed.search(/[.!?](?:\s|$)/);
                if (sentenceEnd !== -1) {
                  const sentence = unprocessed.slice(0, sentenceEnd + 1).trim();
                  if (sentence.length > 10) { // Ignore very short fragments
                    audioQueueRef.current.push(sentence);
                    processAudioQueue();
                  }
                  processedLength += sentenceEnd + 1;
                } else {
                  break;
                }
              }
            }
          } catch {}
        }
      }

      const diagram = extractMermaid(fullText);
      if (diagram) setMermaidCode(diagram);
      
      // Play any remaining text that didn't end with punctuation
      const cleanText = stripMermaid(fullText);
      const remaining = cleanText.slice(processedLength).trim();
      if (remaining.length > 0) {
        audioQueueRef.current.push(remaining);
        processAudioQueue();
      }
    } catch (err) { setIsTyping(false); }
  }, [processAudioQueue]);

  // ── Spacebar Voice Control with MediaRecorder ──
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const spaceDownRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startVoiceCapture = useCallback(async () => {
    stopSpeech(); // Interrupt AI
    setIsTranscribing(true);
    setChatInput("🎙️ Recording your voice...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (e) {
      console.error("Mic access denied:", e);
      setChatInput("Microphone access denied.");
      setIsTranscribing(false);
    }
  }, [stopSpeech]);

  const stopVoiceCapture = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      setIsTranscribing(false);
      setChatInput("");
      return;
    }

    return new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current!;

      recorder.onstop = async () => {
        // Stop mic stream
        mediaStreamRef.current?.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];

        if (audioBlob.size < 1000) {
          // Too short / empty
          setChatInput("");
          setIsTranscribing(false);
          resolve();
          return;
        }

        setChatInput("⏳ Thinking...");

        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const res = await fetch("/api/transcribe", { method: "POST", body: formData });
          const data = await res.json();

          if (data.transcript && data.transcript.trim()) {
            setChatInput("");
            setIsTranscribing(false);
            sendVoiceMessage(data.transcript.trim());
          } else {
            setChatInput("");
            setIsTranscribing(false);
          }
        } catch (e) {
          console.error("Transcription failed:", e);
          setChatInput("Failed to hear that. Try again.");
          setIsTranscribing(false);
        }
        resolve();
      };

      try {
        recorder.stop();
      } catch (e) {
        setIsTranscribing(false);
        setChatInput("");
        resolve();
      }
    });
  }, [sendVoiceMessage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !spaceDownRef.current && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        spaceDownRef.current = true;
        setIsSpacePressed(true);
        startVoiceCapture();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && spaceDownRef.current) {
        spaceDownRef.current = false;
        setIsSpacePressed(false);
        stopVoiceCapture();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [startVoiceCapture, stopVoiceCapture]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      stopSpeech();
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
    };
  }, [stopSpeech]);

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

  const sendMessage = useCallback(async () => {
    const text = chatInput.trim();
    if (!text) return;
    const userMsg: ChatMsg = { id: Date.now(), role: "user", text, time: NOW() };
    setMessages((m) => [...m, userMsg]);
    setChatInput("");
    setIsTyping(true);
    if (messages.length <= 2) setTopic(text.slice(0, 50));

    try {
      const allMsgs = [...messages, userMsg].map((m) => ({ role: m.role === "ai" ? "assistant" : "user", text: m.text }));
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: allMsgs, topic }) });
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      const aiMsgId = Date.now() + 1;

      setMessages((m) => [...m, { id: aiMsgId, role: "ai", text: "", time: NOW() }]);
      setIsTyping(false);

      while (true) {
        const { done, value } = await reader?.read()!;
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              setMessages((m) => m.map((msg) => msg.id === aiMsgId ? { ...msg, text: stripMermaid(fullText) } : msg));
            }
          } catch {}
        }
      }

      const diagram = extractMermaid(fullText);
      if (diagram) setMermaidCode(diagram);

      await playTTS(stripMermaid(fullText).slice(0, 500));

    } catch (err) { setIsTyping(false); }
  }, [chatInput, messages, topic, playTTS]);

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
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-tr from-slate-700 to-slate-900 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-slate-800">LiveKit Session</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50/80 backdrop-blur-sm px-3.5 py-2 rounded-full border border-emerald-100 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-600">{formatTime(sessionTime)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs hidden sm:block truncate max-w-[200px] text-slate-500 bg-white border border-slate-200/80 px-4 py-2.5 rounded-full shadow-sm font-semibold">{topic}</span>

          {/* Voice Selector */}
          <div className="relative">
            <button
              onClick={() => setVoiceMenuOpen(!voiceMenuOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200/80 shadow-sm hover:bg-slate-50 transition-colors text-slate-600 text-xs font-semibold"
            >
              <Mic className="w-3.5 h-3.5" />
              {VOICES.find(v => v.id === selectedVoice)?.name || "Voice"}
            </button>
            <AnimatePresence>
              {voiceMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-14 w-64 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-[0_16px_40px_rgba(0,0,0,0.1)] p-2 z-50"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 px-3 pt-2 pb-1">AI Tutor Voice</p>
                  {VOICES.map(voice => (
                    <button
                      key={voice.id}
                      onClick={() => { setSelectedVoice(voice.id); setVoiceMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        selectedVoice === voice.id
                          ? "bg-slate-900 text-white"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${
                        selectedVoice === voice.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        {voice.gender === "Female" ? "♀" : "♂"}
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-bold">{voice.name}</p>
                        <p className={`text-[10px] ${selectedVoice === voice.id ? "text-white/60" : "text-slate-400"}`}>{voice.style}</p>
                      </div>
                      {selectedVoice === voice.id && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
            <button
              onClick={() => generateVisualization(topic)}
              className="px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 shadow-sm active:scale-95 cursor-pointer">
              <Sparkles className="w-4 h-4 text-slate-700" /> Regenerate
            </button>
          </div>
          
          {/* Whiteboard Canvas */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-slate-50 pt-28 pb-8">
            <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-[24px] flex items-center justify-center p-8 bg-white relative shadow-sm">
              <MermaidRenderer code={mermaidCode} className="w-full max-w-5xl" />
            </div>
          </div>

          {/* Floating Local Video (Picture-in-Picture) */}
          <div className="absolute bottom-8 left-8 w-60 h-40 bg-black rounded-[24px] shadow-[0_16px_40px_rgb(0,0,0,0.4)] ring-4 ring-slate-700 overflow-hidden z-20 group transition-transform hover:scale-105">
            {myVideoTrack && !myVideoTrack.publication?.isMuted ? (
              <VideoTrack trackRef={myVideoTrack} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f172a]">
                <div className="w-14 h-14 rounded-full bg-slate-800/50 flex items-center justify-center mb-3 ring-1 ring-slate-700">
                  <VideoOff className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Camera Off</p>
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> You
            </div>
          </div>
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
                      <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[85%] rounded-[24px] px-5 py-4 shadow-sm ${m.role === "user" ? "bg-slate-900 text-white rounded-tr-[6px]" : "bg-white border border-slate-200/80 text-slate-800 rounded-tl-[6px]"}`}>
                          <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {m.role === "ai" ? (
                              <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 text-slate-800">
                                <ReactMarkdown>{m.text}</ReactMarkdown>
                              </div>
                            ) : (
                              <p>{m.text}</p>
                            )}
                          </div>
                          <p className={`text-[10px] mt-2 font-bold text-right ${m.role === 'user' ? 'text-zinc-300' : 'text-slate-400'}`}>{m.time}</p>
                        </div>
                      </div>
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
            <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isSpacePressed ? 'bg-red-500 animate-pulse' : isTranscribing ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isSpacePressed ? 'text-red-600' : isTranscribing ? 'text-amber-600' : 'text-slate-400'}`}>
              {isSpacePressed ? '● Recording' : isTranscribing ? 'Transcribing...' : 'Space to Talk'}
            </span>
          </div>
        </div>

        <div className="w-[1px] h-6 bg-black/10 mx-1"></div>

        {/* Stop AI Speech */}
        {isSpeaking && (
          <button
            onClick={stopSpeech}
            className="w-11 h-11 rounded-[22px] border-0 flex items-center justify-center transition-all cursor-pointer bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white shadow-sm animate-pulse"
            title="Stop AI Speech"
          >
            <Square className="w-4 h-4" />
          </button>
        )}

        {isSpeaking && <div className="w-[1px] h-6 bg-black/10 mx-1"></div>}

        {/* Video Toggle */}
        <TrackToggle source={Track.Source.Camera} className="w-11 h-11 rounded-[22px] border-0 flex items-center justify-center transition-all cursor-pointer bg-white/50 text-slate-700 hover:bg-white data-[state=off]:bg-red-500 data-[state=off]:text-white shadow-sm" />
        
        <div className="w-[1px] h-6 bg-black/10 mx-1"></div>

        {/* End Session */}
        <DisconnectButton onClick={stopSpeech} className="w-11 h-11 rounded-[22px] border-0 bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all cursor-pointer shadow-sm group">
          <PhoneOff className="w-4 h-4 transition-transform group-hover:scale-110" />
        </DisconnectButton>
      </div>
    </div>
  );
}
