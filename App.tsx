
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";

// --- Services ---
const playSound = {
  pixel: () => {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  },
  success: () => {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

// --- Components ---

const PixelEditor = ({ onExport, onCritique, activeRef }: any) => {
  const [gridSize, setGridSize] = useState({ w: 32, h: 32 });
  const [color, setColor] = useState('#ffffff');
  const [tool, setTool] = useState('pencil');
  const [zoom, setZoom] = useState(1.5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctxRef.current = ctx;
    ctx.imageSmoothingEnabled = false;
  }, [gridSize]);

  const getPos = (e: any) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.floor((clientX - rect.left) * (canvasRef.current!.width / rect.width)),
      y: Math.floor((clientY - rect.top) * (canvasRef.current!.height / rect.height))
    };
  };

  const draw = (e: any) => {
    if (!ctxRef.current) return;
    const pos = getPos(e);
    if (tool === 'pencil') {
      ctxRef.current.fillStyle = color;
      ctxRef.current.fillRect(pos.x, pos.y, 1, 1);
      playSound.pixel();
    } else if (tool === 'eraser') {
      ctxRef.current.clearRect(pos.x, pos.y, 1, 1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <div className="flex-1 checkerboard flex items-center justify-center relative overflow-hidden touch-none" 
           onMouseDown={(e) => { if(e.buttons === 1) draw(e); }}
           onMouseMove={(e) => { if(e.buttons === 1) draw(e); }}
           onTouchMove={(e) => draw(e)}>
        
        <div style={{ transform: `scale(${zoom})` }} className="relative transition-transform duration-200">
          {activeRef && <img src={activeRef} className="absolute inset-0 w-full h-full opacity-30 pixel-render pointer-events-none" />}
          <canvas 
            ref={canvasRef} 
            width={gridSize.w} 
            height={gridSize.h} 
            className="bg-transparent border border-zinc-800 shadow-2xl pixel-render"
            style={{ width: gridSize.w * 10, height: gridSize.h * 10 }}
          />
        </div>

        {/* Floating Tools */}
        <div className="absolute top-6 right-6 flex flex-col gap-3">
          <button onClick={() => setZoom(z => Math.min(z + 0.5, 5))} className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-xl shadow-xl">➕</button>
          <button onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))} className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-xl shadow-xl">➖</button>
        </div>
      </div>

      <footer className="h-28 bg-[#09090b] border-t border-zinc-800 flex items-center justify-around px-4">
        <button onClick={() => setTool('pencil')} className={`p-4 rounded-2xl ${tool==='pencil' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500'}`}>✏️</button>
        <button onClick={() => setTool('eraser')} className={`p-4 rounded-2xl ${tool==='eraser' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500'}`}>🧹</button>
        <div className="w-12 h-12 rounded-xl border-2 border-zinc-700 overflow-hidden relative">
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="absolute inset-0 scale-150 cursor-pointer" />
        </div>
        <button onClick={() => { setGridSize({w:32, h:32}); playSound.success(); }} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-bold">HEAD</button>
        <button onClick={() => { setGridSize({w:32, h:64}); playSound.success(); }} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-bold">BODY</button>
        <button onClick={() => onExport(canvasRef.current?.toDataURL())} className="p-4 bg-zinc-100 text-black rounded-2xl">💾</button>
      </footer>
    </div>
  );
};

const AILab = ({ onUseRef }: any) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Pixel art icon for Graal Online Classic game, 32x32, retro game style: ${prompt}` }] }
      });
      const part = resp.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part) setImage(`data:image/png;base64,${part.inlineData.data}`);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8 overflow-y-auto h-full custom-scroll">
      <h2 className="text-4xl font-black tracking-tighter uppercase">Reference <span className="text-indigo-500">Lab</span></h2>
      <div className="flex gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ex: Machado de gelo..." className="flex-1 bg-transparent px-4 focus:outline-none" />
        <button onClick={generate} disabled={loading} className="bg-indigo-600 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-50">
          {loading ? '...' : 'Gerar'}
        </button>
      </div>
      {image && (
        <div className="bg-zinc-900 p-8 border border-zinc-800 rounded-[40px] flex flex-col items-center gap-6">
          <img src={image} className="w-32 h-32 pixel-render shadow-2xl" />
          <button onClick={() => onUseRef(image)} className="w-full py-4 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest">Usar no Editor</button>
        </div>
      )}
    </div>
  );
};

const MasterCritique = ({ img }: any) => {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (img) analyze();
  }, [img]);

  const analyze = async () => {
    setLoading(true);
    try {
      const resp = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [
          { inlineData: { mimeType: 'image/png', data: img.split(',')[1] } },
          { text: "Avalie esta pixel art para o jogo Graal Online. Analise cores, sombreamento e forma em português, seja um mestre rigoroso mas justo." }
        ]}
      });
      setFeedback(resp.text || '');
    } catch (e) { setFeedback("Erro ao consultar o mestre."); }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8 overflow-y-auto h-full custom-scroll">
      <h2 className="text-4xl font-black tracking-tighter uppercase">O <span className="text-indigo-500">Mestre</span></h2>
      {loading ? <div className="animate-pulse text-zinc-500">O Mestre está observando cada pixel...</div> : (
        <div className="bg-zinc-900 p-8 border border-zinc-800 rounded-[40px] leading-relaxed text-zinc-300 italic whitespace-pre-wrap">
          {feedback || "Envie sua arte do editor para receber uma avaliação do Mestre Pixel."}
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [tab, setTab] = useState('editor');
  const [activeRef, setActiveRef] = useState<string | null>(null);
  const [lastArt, setLastArt] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-screen w-full bg-[#09090b] text-zinc-100 overflow-hidden">
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#09090b]/80 backdrop-blur-md z-50">
        <div className="font-black tracking-widest text-[10px] uppercase flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-[8px]">G</div>
          Graal Studio <span className="text-indigo-500">Carbon</span>
        </div>
        <nav className="flex bg-zinc-900 p-1 rounded-xl">
          <button onClick={() => setTab('editor')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${tab==='editor' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Editor</button>
          <button onClick={() => setTab('lab')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${tab==='lab' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>IA Lab</button>
          <button onClick={() => setTab('mestre')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${tab==='mestre' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Mestre</button>
        </nav>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {tab === 'editor' && <PixelEditor onExport={(url: any) => { setLastArt(url); setTab('mestre'); }} activeRef={activeRef} />}
        {tab === 'lab' && <AILab onUseRef={(url: any) => { setActiveRef(url); setTab('editor'); }} />}
        {tab === 'mestre' && <MasterCritique img={lastArt} />}
      </main>
    </div>
  );
}
