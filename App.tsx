
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";

// Wickler AI Config
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

// Professional Pixel Assets
const SKETCHES = {
  head_front: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAMElEQVR42mNkYGD4z0AAMDAyMIy6YDQERkNgeAAZGRkZGRkZGRkZGRkZGRkZGUMDAADMawm766/K+wAAAABJRU5ErkJggg==",
  body_front: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAABACAYAAABm6XpYAAAAM0lEQVR42u3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIDvAbKWAfG0366VAAAAAElFTkSuQmCC"
};

const PRO_PALETTE = [
  '#000000', '#ffffff', '#2c2c2e', '#48484a', '#8e8e93', '#d1d1d6',
  '#ff3b30', '#ff9500', '#ffcc00', '#4cd964', '#5ac8fa', '#007aff',
  '#f3a35f', '#8e5d3c', '#4b321c', '#ef7d57', '#ffcd75', '#a7f070', '#b13e53', '#1a1c2c'
];

// --- Haptic Feedback ---
const playHaptic = (type: 'light' | 'medium' | 'success') => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    if (type === 'light') { osc.frequency.value = 800; gain.gain.value = 0.005; }
    else if (type === 'medium') { osc.frequency.value = 400; gain.gain.value = 0.01; }
    else { osc.frequency.value = 600; gain.gain.value = 0.02; }
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
};

// --- WICKLER ENGINE: EDITOR ---
const WicklerEditor = ({ onAnalyze, activeRef }: any) => {
  const [grid, setGrid] = useState({ w: 32, h: 32 });
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(1);
  const [symmetry, setSymmetry] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panel, setPanel] = useState<'tools'|'palette'|'assets'|null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [sketch, setSketch] = useState<string | null>(null);
  const [sketchOpacity, setSketchOpacity] = useState(0.2);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastPos = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctxRef.current = ctx;
    ctx.imageSmoothingEnabled = false;
    if (history.length === 0) {
      ctx.clearRect(0, 0, grid.w, grid.h);
      setHistory([cvs.toDataURL()]);
    }
    updatePreview();
  }, [grid]);

  const updatePreview = () => {
    if (!canvasRef.current || !previewRef.current) return;
    const pCtx = previewRef.current.getContext('2d');
    if (!pCtx) return;
    pCtx.imageSmoothingEnabled = false;
    pCtx.clearRect(0, 0, grid.w, grid.h);
    pCtx.drawImage(canvasRef.current, 0, 0);
  };

  const getPos = (e: any) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.floor((cx - r.left) * (grid.w / r.width)),
      y: Math.floor((cy - r.top) * (grid.h / r.height))
    };
  };

  const drawPixel = (x: number, y: number) => {
    if (!ctxRef.current) return;
    const offset = Math.floor(brushSize / 2);
    
    const applyDraw = (px: number, py: number) => {
      if (tool === 'pencil') {
        ctxRef.current!.fillStyle = color;
        ctxRef.current!.fillRect(px - offset, py - offset, brushSize, brushSize);
      } else if (tool === 'eraser') {
        ctxRef.current!.clearRect(px - offset, py - offset, brushSize, brushSize);
      }
    };

    applyDraw(x, y);
    if (symmetry) {
      const symX = grid.w - 1 - x;
      applyDraw(symX, y);
    }
  };

  const onStart = (e: any) => {
    const p = getPos(e); lastPos.current = p;
    if (tool === 'picker') {
      const d = ctxRef.current!.getImageData(p.x, p.y, 1, 1).data;
      if (d[3] > 0) setColor("#" + ((1<<24)+(d[0]<<16)+(d[1]<<8)+d[2]).toString(16).slice(1));
      setTool('pencil'); playHaptic('success');
      return;
    }
    drawPixel(p.x, p.y); playHaptic('light');
    updatePreview();
  };

  const onMove = (e: any) => {
    if (e.buttons !== 1 && !e.touches) return;
    const p = getPos(e);
    if (!lastPos.current) return;
    
    let x0 = lastPos.current.x, y0 = lastPos.current.y;
    const x1 = p.x, y1 = p.y;
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    
    while(true) {
      drawPixel(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
    lastPos.current = p;
    updatePreview();
  };

  const saveState = () => {
    if (canvasRef.current) setHistory(p => [...p, canvasRef.current!.toDataURL()].slice(-30));
  };

  const undo = () => {
    if (history.length > 1) {
      const h = [...history]; h.pop();
      const img = new Image(); img.src = h[h.length - 1];
      img.onload = () => {
        ctxRef.current?.clearRect(0, 0, grid.w, grid.h);
        ctxRef.current?.drawImage(img, 0, 0);
        setHistory(h); updatePreview(); playHaptic('medium');
      };
    }
  };

  return (
    <div className="flex flex-col h-full relative animate-glass">
      {/* Dynamic Viewport */}
      <div className="flex-1 checkerboard flex items-center justify-center relative touch-none overflow-hidden">
        <div style={{ transform: `scale(${zoom + (window.innerWidth < 768 ? 0.7 : 2.5)})` }} className="relative transition-transform duration-300">
           {activeRef && <img src={activeRef} className="absolute inset-0 w-full h-full opacity-40 pixel-render pointer-events-none z-0" />}
           {sketch && <img src={sketch} style={{ opacity: sketchOpacity }} className="absolute inset-0 w-full h-full pixel-render pointer-events-none z-0 invert" />}
           
           <canvas 
            ref={canvasRef} width={grid.w} height={grid.h} 
            onMouseDown={onStart} onMouseMove={onMove} onMouseUp={saveState}
            onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={saveState}
            className="bg-transparent border-2 border-zinc-800 shadow-[0_20px_80px_rgba(0,0,0,0.8)] pixel-render relative z-10"
            style={{ width: grid.w * 8, height: grid.h * 8 }}
           />
           
           {symmetry && <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-indigo-500/50 z-20 pointer-events-none" />}
        </div>

        {/* Floating Pro Tools */}
        <div className="absolute right-6 top-6 flex flex-col gap-4">
           <div className="bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-800 flex flex-col gap-2">
             <button onClick={() => setZoom(z => Math.min(z+0.5, 6))} className="w-10 h-10 flex items-center justify-center text-lg active:scale-90 transition-transform">🔍</button>
             <button onClick={() => setZoom(z => Math.max(z-0.5, 0.5))} className="w-10 h-10 flex items-center justify-center text-lg active:scale-90 transition-transform">➖</button>
           </div>
           <button onClick={undo} className="w-12 h-12 bg-black/80 backdrop-blur-lg rounded-2xl flex items-center justify-center border border-zinc-800 shadow-xl active:scale-90 transition-transform disabled:opacity-20" disabled={history.length <= 1}>↩️</button>
           <button onClick={() => setSymmetry(!symmetry)} className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${symmetry ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-black/80 border-zinc-800'}`}>
             <span className="text-xl">⚖️</span>
           </button>
        </div>

        {/* Live Preview Window */}
        <div className="absolute left-6 top-6 bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-zinc-800 shadow-2xl">
           <div className="w-16 h-16 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
              <canvas ref={previewRef} width={grid.w} height={grid.h} className="w-full h-full pixel-render" />
           </div>
           <div className="text-[8px] font-black uppercase text-center mt-2 tracking-tighter text-zinc-600">Actual Size</div>
        </div>
      </div>

      {/* Wickler Control Center */}
      <div className="bg-black/95 backdrop-blur-3xl border-t border-zinc-800/50 px-6 py-4 flex items-center justify-between safe-pb z-50">
         <div className="flex gap-3">
            <button onClick={() => setPanel(panel === 'tools' ? null : 'tools')} className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${panel==='tools' ? 'bg-indigo-600 border-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>Build</button>
            <button onClick={() => setPanel(panel === 'palette' ? null : 'palette')} className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${panel==='palette' ? 'bg-indigo-600 border-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>Tone</button>
            <button onClick={() => setPanel(panel === 'assets' ? null : 'assets')} className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${panel==='assets' ? 'bg-indigo-600 border-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>Mold</button>
         </div>
         <button onClick={() => onAnalyze(canvasRef.current!.toDataURL())} className="bg-white text-black px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 transition-all">Review 🗿</button>
      </div>

      {/* Pro Drawer System */}
      {panel && (
        <div className="absolute inset-x-0 bottom-[120px] drawer-blur border-t border-zinc-800/50 p-8 animate-slide-up z-40 rounded-t-[40px] shadow-[0_-30px_100px_rgba(0,0,0,0.8)]">
          <div className="w-16 h-1 bg-zinc-700 rounded-full mx-auto mb-8 opacity-20" />
          
          {panel === 'tools' && (
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-4">
                <ToolItem active={tool==='pencil'} icon="✏️" label="Graphite" onClick={() => {setTool('pencil'); setPanel(null); playHaptic('light');}} />
                <ToolItem active={tool==='eraser'} icon="🧹" label="Clean" onClick={() => {setTool('eraser'); setPanel(null); playHaptic('light');}} />
                <ToolItem active={tool==='picker'} icon="💉" label="Sample" onClick={() => {setTool('picker'); setPanel(null); playHaptic('light');}} />
              </div>
              <div className="flex flex-col gap-4 bg-black/40 p-6 rounded-[2rem] border border-zinc-800/50">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Brush Density</span>
                   <span className="text-indigo-400 font-bold">{brushSize}px</span>
                 </div>
                 <div className="flex gap-3">
                    {[1, 2, 3, 4].map(s => (
                      <button key={s} onClick={() => setBrushSize(s)} className={`flex-1 py-4 rounded-xl font-black text-sm transition-all ${brushSize===s ? 'bg-indigo-600' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}>{s}</button>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {panel === 'palette' && (
            <div className="space-y-8">
              <div className="grid grid-cols-8 gap-3">
                {PRO_PALETTE.map(c => (
                  <button key={c} onClick={() => {setColor(c); setPanel(null); playHaptic('medium');}} className="aspect-square rounded-xl border-2 border-white/5 active:scale-90 transition-transform shadow-lg" style={{backgroundColor: c}} />
                ))}
              </div>
              <div className="flex items-center gap-6 bg-black/50 p-5 rounded-[2.5rem] border border-zinc-800/50">
                <div className="w-14 h-14 rounded-2xl relative overflow-hidden ring-2 ring-white/10">
                   <input type="color" value={color} onChange={e => setColor(e.target.value)} className="absolute inset-0 scale-[4] cursor-pointer bg-transparent" />
                </div>
                <div className="flex-1">
                   <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Hex Channel</p>
                   <p className="font-mono text-xl font-bold tracking-tight text-indigo-400">{color.toUpperCase()}</p>
                </div>
              </div>
            </div>
          )}

          {panel === 'assets' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <AssetCard icon="🎭" title="Classic Head" desc="32x32 Grid" onClick={() => {setGrid({w:32, h:32}); setSketch(SKETCHES.head_front); setPanel(null); setHistory([]); playHaptic('success');}} />
                <AssetCard icon="🧍" title="Elite Body" desc="32x64 Grid" onClick={() => {setGrid({w:32, h:64}); setSketch(SKETCHES.body_front); setPanel(null); setHistory([]); playHaptic('success');}} />
              </div>
              <div className="bg-black/40 p-6 rounded-[2rem] border border-zinc-800/50">
                 <div className="flex justify-between items-center mb-4 text-[9px] font-black uppercase text-zinc-500 tracking-widest">Guide Transparency</div>
                 <input type="range" min="0" max="1" step="0.1" value={sketchOpacity} onChange={e => setSketchOpacity(parseFloat(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-full appearance-none accent-indigo-500" />
                 <button onClick={() => {setSketch(null); setPanel(null);}} className="w-full mt-6 py-3 text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-400">Flush Reference Layers</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- WICKLER PRO COMPONENTS ---
const ToolItem = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-3 p-5 rounded-[2.5rem] border-2 transition-all ${active ? 'bg-white text-black border-white shadow-xl scale-105' : 'bg-black/50 text-zinc-600 border-zinc-800/50 hover:border-zinc-700'}`}>
    <span className="text-3xl">{icon}</span>
    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
  </button>
);

const AssetCard = ({ icon, title, desc, onClick }: any) => (
  <button onClick={onClick} className="flex flex-col items-center p-6 bg-black/40 rounded-[2.5rem] border border-zinc-800/50 hover:border-indigo-500/50 transition-all group">
    <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">{icon}</span>
    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-300">{title}</h4>
    <p className="text-[8px] font-bold text-zinc-600 mt-1 uppercase">{desc}</p>
  </button>
);

// --- IA LABORATORY (Wickler Gen) ---
const WicklerGen = ({ onUse }: any) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Professional retro pixel art 32x32 for Graal Online Classic: ${prompt}. Pure white background, high contrast.` }] }
      });
      const data = resp.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data;
      if (data) { setResult(`data:image/png;base64,${data}`); playHaptic('success'); }
    } catch(e) {}
    setLoading(false);
  };

  return (
    <div className="h-full bg-black p-8 overflow-y-auto no-scrollbar pb-32 animate-glass">
      <div className="max-w-xl mx-auto py-12">
        <header className="mb-16">
          <h2 className="text-5xl font-black uppercase tracking-tighter text-white mb-2">WICKLER <span className="text-indigo-600">FORGE</span></h2>
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.5em]">Synthetic reference laboratory</p>
        </header>

        <div className="flex flex-col gap-4 p-5 bg-zinc-900/30 rounded-[3rem] border border-zinc-800/50 mb-12 focus-within:border-indigo-500/50 transition-all">
          <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Project blueprint (ex: Cyber Hat)" className="bg-transparent px-6 py-4 focus:outline-none font-bold text-base placeholder:text-zinc-800" />
          <button onClick={handleGenerate} disabled={loading} className="bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] active:scale-95 transition-all shadow-lg">
            {loading ? 'Splicing Pixels...' : 'Initialize Forge'}
          </button>
        </div>

        {result && (
          <div className="bg-zinc-900/40 p-12 rounded-[4rem] border border-zinc-800/50 flex flex-col items-center gap-10 animate-in zoom-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
              <img src={result} className="w-48 h-48 pixel-render shadow-2xl bg-black rounded-[2.5rem] relative z-10 border border-white/5" />
            </div>
            <button onClick={() => onUse(result)} className="w-full py-7 bg-white text-black rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] active:scale-95 transition-all">Inject to Studio</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- ORÁCULO DE WICKLER (Pro Review) ---
const WicklerOracle = ({ image }: any) => {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (image) analyze(); }, [image]);

  const analyze = async () => {
    setLoading(true);
    try {
      const resp = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [
          { inlineData: { mimeType: 'image/png', data: image.split(',')[1] } },
          { text: "Você é o mestre artístico Wickler. Analise a pixel art para Graal Classic. Foque em Dithering, Anatomia e AA. Seja técnico, encorajador e dê uma nota 0-10. Responda em português." }
        ]}
      });
      setFeedback(resp.text || 'Silence...'); playHaptic('success');
    } catch(e) { setFeedback("Conexão com o templo Wickler perdida."); }
    setLoading(false);
  };

  return (
    <div className="h-full bg-black p-8 overflow-y-auto no-scrollbar pb-32 animate-glass">
       <div className="max-w-xl mx-auto py-12">
          <header className="mb-16">
            <h2 className="text-5xl font-black uppercase tracking-tighter text-white mb-2">ORACLE <span className="text-zinc-800">EYE</span></h2>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.5em]">Critical aesthetic synchronization</p>
          </header>

          {image && (
            <div className="mb-12 p-16 bg-zinc-950/40 border border-zinc-800/50 rounded-[5rem] flex justify-center relative group">
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[5rem]" />
              <img src={image} className="w-40 h-40 pixel-render scale-125 shadow-[0_0_50px_rgba(255,255,255,0.05)] relative z-10 transition-transform group-hover:scale-150" />
            </div>
          )}

          <div className="bg-zinc-900/20 p-12 border border-zinc-800/50 rounded-[4rem] relative overflow-hidden">
             <div className="absolute -top-6 -left-4 w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-2xl ring-8 ring-black">🗿</div>
             {loading ? (
               <div className="py-24 flex flex-col items-center gap-6">
                 <div className="w-10 h-10 border-4 border-zinc-800 border-t-indigo-500 rounded-full animate-spin" />
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest animate-pulse">Reading Wickler Scrolls...</p>
               </div>
             ) : (
               <div className="text-zinc-300 italic font-medium leading-relaxed text-lg animate-in fade-in duration-1000">
                 {feedback || "Offer your art to the Oracle for divine feedback."}
               </div>
             )}
          </div>
       </div>
    </div>
  );
};

// --- MAIN WICKLER APP ---
export default function App() {
  const [tab, setTab] = useState('editor');
  const [activeRef, setActiveRef] = useState<string | null>(null);
  const [critiqueImg, setCritiqueImg] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-screen w-full bg-black text-white selection:bg-indigo-500/30">
      {/* Studio Bar */}
      <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-8 shrink-0 bg-black/80 backdrop-blur-xl z-[100]">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-[0_0_20px_rgba(99,102,241,0.4)]">W</div>
           <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-[0.4em] leading-none text-white">Wickler Studio</span>
              <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Pro Station v7</span>
           </div>
        </div>
        
        <nav className="hidden md:flex gap-8">
           {['editor', 'lab', 'oracle'].map(t => (
             <button key={t} onClick={() => {setTab(t); playHaptic('light');}} className={`text-[10px] font-black uppercase tracking-[0.4em] transition-all ${tab===t ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'}`}>{t}</button>
           ))}
        </nav>

        <div className="w-10 h-10 rounded-full bg-zinc-900/50 border border-zinc-800 flex items-center justify-center text-[8px] font-black text-zinc-700">PR0</div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 relative overflow-hidden">
        {tab === 'editor' && <WicklerEditor onAnalyze={(img: any) => {setCritiqueImg(img); setTab('oracle'); playHaptic('success');}} activeRef={activeRef} />}
        {tab === 'lab' && <WicklerGen onUse={(img: any) => {setActiveRef(img); setTab('editor'); playHaptic('success');}} />}
        {tab === 'oracle' && <WicklerOracle image={critiqueImg} />}
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden flex justify-around items-center bg-black/95 border-t border-zinc-900/50 h-24 safe-pb z-[100] backdrop-blur-2xl">
         <NavIcon active={tab==='editor'} onClick={() => setTab('editor')} icon="🖌️" label="Studio" />
         <NavIcon active={tab==='lab'} onClick={() => setTab('lab')} icon="✨" label="Forge" />
         <NavIcon active={tab==='oracle'} onClick={() => setTab('oracle')} icon="🗿" label="Oracle" />
      </nav>
    </div>
  );
}

const NavIcon = ({ active, onClick, icon, label }: any) => (
  <button onClick={() => {onClick(); playHaptic('light');}} className={`flex flex-col items-center justify-center gap-2 w-24 transition-all ${active ? 'scale-110' : 'opacity-20 grayscale'}`}>
    <span className="text-3xl">{icon}</span>
    <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${active ? 'text-indigo-400' : 'text-zinc-500'}`}>{label}</span>
  </button>
);
