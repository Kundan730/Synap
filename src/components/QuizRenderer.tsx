"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

export type QuizData = {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
};

export default function QuizRenderer({ quiz }: { quiz: QuizData }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelectedIdx(idx);
    setShowResult(true);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white rounded-[24px] shadow-sm border border-slate-200 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
      <h2 className="text-2xl font-bold text-slate-800 mb-8 mt-2 leading-tight">{quiz.question}</h2>
      
      <div className="space-y-4">
        {quiz.options.map((opt, idx) => {
          const isSelected = selectedIdx === idx;
          const isCorrect = idx === quiz.correctAnswerIndex;
          
          let btnClass = "w-full text-left p-5 rounded-xl border-2 transition-all flex justify-between items-center group ";
          
          if (!showResult) {
            btnClass += "border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-700 hover:bg-indigo-50/50 cursor-pointer";
          } else {
            if (isCorrect) btnClass += "border-emerald-500 bg-emerald-50 text-emerald-800";
            else if (isSelected && !isCorrect) btnClass += "border-rose-500 bg-rose-50 text-rose-800";
            else btnClass += "border-slate-200 text-slate-400 opacity-50 bg-slate-50";
          }

          return (
            <button key={idx} onClick={() => handleSelect(idx)} disabled={showResult} className={btnClass}>
              <span className="font-medium text-lg">{opt}</span>
              {showResult && isCorrect && <CheckCircle2 className="w-7 h-7 text-emerald-500" />}
              {showResult && isSelected && !isCorrect && <XCircle className="w-7 h-7 text-rose-500" />}
            </button>
          );
        })}
      </div>
      
      {showResult && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
            <span className="text-xl">💡</span> Explanation
          </h3>
          <p className="text-slate-600 leading-relaxed text-base">{quiz.explanation}</p>
        </motion.div>
      )}
    </div>
  );
}
