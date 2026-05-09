"use client";

export default function VideoRenderer({ videoId }: { videoId: string }) {
  return (
    <div className="w-full h-full min-h-[400px] rounded-[24px] overflow-hidden shadow-sm border border-slate-200 bg-black flex items-center justify-center">
      <iframe
        className="w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      ></iframe>
    </div>
  );
}
