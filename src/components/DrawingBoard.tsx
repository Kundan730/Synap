"use client";
import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

export default function DrawingBoard() {
  return (
    <div className="w-full h-full min-h-[500px] rounded-[24px] overflow-hidden shadow-sm border border-slate-200 bg-white relative" style={{ height: '600px' }}>
      <Tldraw persistenceKey="synap-drawing-board" />
    </div>
  );
}
