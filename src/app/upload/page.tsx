"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X, Sparkles, Brain, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

interface UploadedFile {
  id: string;             // local id for keying / removal during upload
  name: string;
  size: number;
  status: "uploading" | "analyzing" | "ready" | "error";
  title?: string;
  concepts?: string[];
  error?: string;
  uploadId?: string;      // Mongo _id, used to fetch doc text in /session
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load any prior uploads from Mongo on mount.
  useEffect(() => {
    fetch("/api/upload")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.uploads)) {
          setFiles(data.uploads.map((u: { id: string; filename: string; sizeBytes: number; title: string; concepts: string[]; createdAt: string }) => ({
            id: `${u.filename}-${u.createdAt}`,
            uploadId: u.id,
            name: u.filename,
            size: u.sizeBytes,
            status: "ready" as const,
            title: u.title,
            concepts: u.concepts,
          })));
        }
      })
      .catch(() => {});
  }, []);

  const uploadFile = async (file: File) => {
    const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setFiles(curr => [{ id, name: file.name, size: file.size, status: "uploading" }, ...curr]);

    try {
      // Switch to analyzing state once the network upload starts (the route does both
      // PDF parse + Gemini call, so we'll stay in this state until the response).
      setFiles(curr => curr.map(f => f.id === id ? { ...f, status: "analyzing" } : f));

      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        const detail = data.preview ? `${data.error ?? "Upload failed"} — model said: ${data.preview}` : (data.error ?? "Upload failed");
        setFiles(curr => curr.map(f => f.id === id
          ? { ...f, status: "error", error: detail }
          : f));
        return;
      }

      setFiles(curr => curr.map(f => f.id === id
        ? { ...f, status: "ready", title: data.title, concepts: data.concepts ?? [], uploadId: data.uploadId }
        : f));
    } catch (e) {
      console.error(e);
      setFiles(curr => curr.map(f => f.id === id
        ? { ...f, status: "error", error: e instanceof Error ? e.message : "Upload failed" }
        : f));
    }
  };

  const handleFileList = (list: FileList | null) => {
    if (!list) return;
    Array.from(list).forEach(uploadFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFileList(e.dataTransfer.files);
  };

  return (
    <>
      <Navbar />
      <main className="pt-[88px] pb-16" style={{ background: "var(--color-bg-soft)", minHeight: "100vh" }}>
        <div className="container max-w-4xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Document Upload</h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Upload a PDF — Gemini will extract teachable concepts you can launch into a live session.
            </p>
          </motion.div>

          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="card mb-8 cursor-pointer transition-all"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              borderStyle: "dashed",
              borderWidth: 2,
              borderColor: dragging ? "var(--color-primary)" : "var(--color-border)",
              background: dragging ? "rgba(99,102,241,0.04)" : "var(--color-bg)",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              hidden
              onChange={(e) => handleFileList(e.target.files)}
            />
            <div className="flex flex-col items-center py-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--gradient-card)" }}>
                <Upload className="w-8 h-8" style={{ color: "var(--color-primary)" }} />
              </div>
              <p className="font-semibold mb-1">Drop a PDF here, or click to browse</p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Up to 10 MB. PDFs only for now.</p>
            </div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="space-y-4">
            <h2 className="font-semibold">Your Documents</h2>
            {files.length === 0 && (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Nothing uploaded yet. Drop a PDF above to extract concepts.
              </p>
            )}
            {files.map((f) => (
              <div key={f.id} className="card">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--color-bg-soft)" }}>
                    <FileText className="w-5 h-5" style={{ color: "#ef4444" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.title ?? f.name}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {f.name} · {formatSize(f.size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {f.status === "uploading" && (
                      <span className="badge badge-warning text-[10px] flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />Uploading
                      </span>
                    )}
                    {f.status === "analyzing" && (
                      <span className="badge badge-primary text-[10px] flex items-center gap-1">
                        <Brain className="w-3 h-3 animate-pulse" />Analyzing
                      </span>
                    )}
                    {f.status === "ready" && (
                      <span className="badge badge-success text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />Ready
                      </span>
                    )}
                    {f.status === "error" && (
                      <span className="badge text-[10px] flex items-center gap-1" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", borderColor: "rgba(239,68,68,0.25)" }}>
                        <X className="w-3 h-3" />Error
                      </span>
                    )}
                    <button
                      className="btn-icon"
                      style={{ width: 32, height: 32 }}
                      onClick={(e) => { e.stopPropagation(); setFiles((curr) => curr.filter((c) => c.id !== f.id)); }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {f.status === "error" && f.error && (
                  <p className="mt-3 text-xs" style={{ color: "#ef4444" }}>{f.error}</p>
                )}

                {f.concepts && f.concepts.length > 0 && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--color-border-light)" }}>
                    <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>
                      Extracted Concepts <span className="text-slate-400 font-normal">— click any to start a focused session</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {f.concepts.map((c, ci) => {
                        const room = `lab-${Date.now().toString(36)}-${ci}`;
                        const uploadParam = f.uploadId ? `&uploadId=${f.uploadId}` : "";
                        return (
                          <Link
                            key={ci}
                            href={`/session?topic=${encodeURIComponent(c)}&room=${room}${uploadParam}`}
                            className="badge badge-primary text-[11px] no-underline transition-all hover:scale-105 hover:shadow-md cursor-pointer"
                          >
                            {c}
                          </Link>
                        );
                      })}
                    </div>
                    <Link
                      href={`/session?topic=${encodeURIComponent(f.title ?? f.name)}&room=lab-${Date.now().toString(36)}-doc${f.uploadId ? `&uploadId=${f.uploadId}` : ""}`}
                      className="btn-primary mt-4 text-xs px-4 py-2 no-underline inline-flex"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Learn the whole document
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </main>
    </>
  );
}
