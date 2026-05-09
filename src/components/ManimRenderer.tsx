"use client";

export default function ManimRenderer({ videoUrl }: { videoUrl: string }) {
  return (
    <div className="w-full h-full min-h-[400px] rounded-[24px] overflow-hidden shadow-sm border border-slate-200 bg-black flex items-center justify-center">
      <video
        key={videoUrl}
        src={videoUrl}
        autoPlay
        controls
        loop
        playsInline
        className="w-full h-full object-contain"
      />
    </div>
  );
}
