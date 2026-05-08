"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Image, FileSpreadsheet, X, Sparkles, Brain, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

interface UploadedFile {
  name: string;
  size: string;
  type: string;
  status: "uploading" | "analyzing" | "ready";
  concepts?: string[];
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([
    { name: "data-structures-notes.pdf", size: "2.4 MB", type: "pdf", status: "ready", concepts: ["Binary Trees", "Hash Maps", "Linked Lists", "Stacks & Queues"] },
    { name: "ml-lecture-slides.pptx", size: "8.1 MB", type: "pptx", status: "ready", concepts: ["Neural Networks", "Gradient Descent", "Backpropagation"] },
  ]);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const newFile: UploadedFile = { name: "new-document.pdf", size: "1.2 MB", type: "pdf", status: "uploading" };
    setFiles((f) => [newFile, ...f]);
    setTimeout(() => setFiles((f) => f.map((fi) => fi.name === "new-document.pdf" ? { ...fi, status: "analyzing" } : fi)), 1500);
    setTimeout(() => setFiles((f) => f.map((fi) => fi.name === "new-document.pdf" ? { ...fi, status: "ready", concepts: ["Key Concept 1", "Key Concept 2"] } : fi)), 3500);
  };

  const getIcon = (type: string) => {
    if (type === "pdf") return <FileText className="w-5 h-5" style={{ color: "#ef4444" }} />;
    if (type === "pptx") return <FileSpreadsheet className="w-5 h-5" style={{ color: "#f59e0b" }} />;
    return <Image className="w-5 h-5" style={{ color: "#6366f1" }} />;
  };

  return (
    <>
      <Navbar />
      <main className="pt-[88px] pb-16" style={{ background: "var(--color-bg-soft)", minHeight: "100vh" }}>
        <div className="container max-w-4xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Document Upload</h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Upload your study materials and let AI extract key concepts for your live sessions.</p>
          </motion.div>

          {/* Drop zone */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="card mb-8 cursor-pointer transition-all"
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{ borderStyle: "dashed", borderWidth: 2, borderColor: dragging ? "var(--color-primary)" : "var(--color-border)", background: dragging ? "rgba(99,102,241,0.04)" : "var(--color-bg)" }}>
            <div className="flex flex-col items-center py-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--gradient-card)" }}>
                <Upload className="w-8 h-8" style={{ color: "var(--color-primary)" }} />
              </div>
              <p className="font-semibold mb-1">Drop files here or click to upload</p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>PDF, PPTX, Images, or Text files</p>
            </div>
          </motion.div>

          {/* Uploaded files */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="space-y-4">
            <h2 className="font-semibold">Your Documents</h2>
            {files.map((f, i) => (
              <div key={i} className="card">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--color-bg-soft)" }}>
                    {getIcon(f.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{f.size}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {f.status === "uploading" && <span className="badge badge-warning text-[10px] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Uploading</span>}
                    {f.status === "analyzing" && <span className="badge badge-primary text-[10px] flex items-center gap-1"><Brain className="w-3 h-3 animate-pulse" />Analyzing</span>}
                    {f.status === "ready" && <span className="badge badge-success text-[10px] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Ready</span>}
                    <button className="btn-icon" style={{ width: 32, height: 32 }} onClick={() => setFiles((fs) => fs.filter((_, fi) => fi !== i))}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {f.concepts && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--color-border-light)" }}>
                    <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>Extracted Concepts</p>
                    <div className="flex flex-wrap gap-2">
                      {f.concepts.map((c, ci) => (
                        <span key={ci} className="badge badge-primary text-[11px]">{c}</span>
                      ))}
                    </div>
                    <Link href="/session" className="btn-primary mt-4 text-xs px-4 py-2 no-underline inline-flex">
                      <Sparkles className="w-3.5 h-3.5" /> Learn This in Live Session
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
