
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { playSound } from '../services/audioService';

interface PixelEditorProps {
  onExport: (dataUrl: string) => void;
  onCritiqueRequest: (dataUrl: string) => void;
  activeReference?: string | null;
}

const PixelEditor: React.FC<PixelEditorProps> = ({ onExport, onCritiqueRequest, activeReference }) => {
  const [gridSize, setGridSize] = useState({ w: 32, h: 32 });
  const [color, setColor] = useState('#ffffff');
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'picker' | 'fill'>('pencil');
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(1.5);
  const [showGrid, setShowGrid] = useState(true);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [hIndex, setHIndex] = useState(-1);
  const [showProps, setShowProps] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastPos = useRef<{ x: number, y: number } | null>(null);

  const palette = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
    '#ff00ff', '#00ffff', '#71717a', '#a1a1aa', '#3f3f46', '#f3a35f', 
    '#8e5d3c', '#4b321c', '#1a1c2c', '#5d275d', '#b13e53', '#ef7d57', 
    '#ffcd75', '#a7f070', '#38b764', '#257179', '#29366f', '#3b5dc9'
  ];

  useEffect(() => { 
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctxRef.current = ctx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
  }, [gridSize.w, gridSize.h]);

  const saveState = useCallback(() => {
    if (ctxRef.current) {
      const data = ctxRef.current.getImageData(0, 0, gridSize.w, gridSize.h);
      setHistory(prev => {
        const newHist = prev.slice(0, hIndex + 1);
        newHist.push(data);
        return newHist.slice(-30);
      });
      setHIndex(prev => Math.min(prev + 1, 29));
      updatePreview();
    }
  }, [gridSize, hIndex]);

  const updatePreview = () => {
    if (canvasRef.current && previewRef.current) {
      const pCtx = previewRef.current.getContext('2d');
      if (pCtx) {
        pCtx.imageSmoothingEnabled = false;
        pCtx.clearRect(0, 0, gridSize.w, gridSize.h);
        pCtx.drawImage(canvasRef.current, 0, 0);
      }
    }
  };

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.floor((clientX - rect.left) * scaleX),
      y: Math.floor((clientY - rect.top) * scaleY)
    };
  };

  const handleStart = (e: any) => {
    const pos = getPos(e);
    if (!pos) return;
    setIsDrawing(true);
    lastPos.current = pos;
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (tool === 'fill') {
      floodFill(ctx, pos.x, pos.y, color);
      saveState();
      playSound.magic();
    } else if (tool === 'picker') {
      pickColor(ctx, pos.x, pos.y);
      playSound.tool();
    } else {
      drawPixel(ctx, pos.x, pos.y);
      playSound.pixel();
    }
    
    if (tool !== 'eraser' && tool !== 'picker') {
        setRecentColors(prev => [color, ...prev.filter(c => c !== color)].slice(0, 8));
    }
  };

  const handleMove = (e: any) => {
    if (!isDrawing || tool === 'fill' || tool === 'picker') return;
    const pos = getPos(e);
    if (!pos || !lastPos.current || !ctxRef.current) return;
    
    const dx = Math.abs(pos.x - lastPos.current.x);
    const dy = Math.abs(pos.y - lastPos.current.y);
    const sx = lastPos.current.x < pos.x ? 1 : -1;
    const sy = lastPos.current.y < pos.y ? 1 : -1;
    let err = dx - dy;
    let x0 = lastPos.current.x;
    let y0 = lastPos.current.y;

    while (true) {
      drawPixel(ctxRef.current, x0, y0, false);
      if (x0 === pos.x && y0 === pos.y) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
    
    lastPos.current = pos;
    if (Math.random() > 0.8) updatePreview();
  };

  const handleEnd = () => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPos.current = null;
      saveState();
    }
  };

  const drawPixel = (ctx: CanvasRenderingContext2D, x: number, y: number, shouldUpdatePreview = true) => {
    if (tool === 'eraser') {
      ctx.clearRect(x, y, 1, 1);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
    if (shouldUpdatePreview) updatePreview();
  };

  const pickColor = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const p = ctx.getImageData(x, y, 1, 1).data;
    if (p[3] > 0) {
      const hex = "#" + ("000000" + ((p[0] << 16) | (p[1] << 8) | p[2]).toString(16)).slice(-6);
      setColor(hex);
      setTool('pencil');
    }
  };

  const floodFill = (ctx: CanvasRenderingContext2D, x: number, y: number, fillHex: string) => {
    const imageData = ctx.getImageData(0, 0, gridSize.w, gridSize.h);
    const targetColor = getPixelColor(imageData, x, y);
    const fillColor = hexToRgba(fillHex);
    if (colorsMatch(targetColor, fillColor)) return;
    const stack: [number, number][] = [[x, y]];
    while (stack.length > 0) {
      const [curX, curY] = stack.pop()!;
      if (curX >= 0 && curX < gridSize.w && curY >= 0 && curY < gridSize.h) {
        if (colorsMatch(getPixelColor(imageData, curX, curY), targetColor)) {
          setPixelColor(imageData, curX, curY, fillColor);
          stack.push([curX - 1, curY], [curX + 1, curY], [curX, curY - 1], [curX, curY + 1]);
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const getPixelColor = (img: ImageData, x: number, y: number) => {
    const i = (y * img.width + x) * 4;
    return [img.data[i], img.data[i+1], img.data[i+2], img.data[i+3]];
  };

  const setPixelColor = (img: ImageData, x: number, y: number, color: number[]) => {
    const i = (y * img.width + x) * 4;
    img.data[i] = color[0]; img.data[i+1] = color[1]; img.data[i+2] = color[2]; img.data[i+3] = color[3];
  };

  const colorsMatch = (c1: number[], c2: number[]) => c1[0]===c2[0] && c1[1]===c2[1] && c1[2]===c2[2] && c1[3]===c2[3];
  const hexToRgba = (hex: string) => [parseInt(hex.slice(1,3), 16), parseInt(hex.slice(3,5), 16), parseInt(hex.slice(5,7), 16), 255];

  const undo = () => {
    if (hIndex > 0) {
      const newIdx = hIndex - 1;
      const data = history[newIdx];
      if (ctxRef.current && data) {
        ctxRef.current.clearRect(0, 0, gridSize.w, gridSize.h);
        ctxRef.current.putImageData(data, 0, 0);
        setHIndex(newIdx);
        updatePreview();
        playSound.tool();
      }
    }
  };

  const clearCanvas = () => {
    if (window.confirm("Limpar tela?")) {
      ctxRef.current?.clearRect(0, 0, gridSize.w, gridSize.h);
      saveState();
      playSound.clear();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] overflow-hidden select-none">
      <main className="flex-1 relative checkerboard flex items-center justify-center p-8 overflow-hidden touch-none">
        <div className="relative transition-transform duration-300 ease-out" style={{ transform: `scale(${zoom})` }}>
          {activeReference && (
            <img src={activeReference} className="absolute inset-0 w-full h-full z-0 pixel-render pointer-events-none opacity-40" alt="ref" />
          )}
          <canvas
            ref={canvasRef}
            width={gridSize.w}
            height={gridSize.h}
            onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
            onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
            className="relative z-10 pixel-render bg-transparent border border-zinc-700 shadow-2xl"
            style={{ 
                width: 'min(80vw, 60vh)', 
                height: gridSize.h === 64 ? 'min(160vw, 120vh)' : 'min(80vw, 60vh)',
                touchAction: 'none'
            }}
          />
          {showGrid && (
            <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.1]" 
                 style={{ 
                     backgroundSize: `calc(100% / ${gridSize.w}) calc(100% / ${gridSize.h})`, 
                     backgroundImage: 'linear-gradient(to right, #ffffff 0.5px, transparent 0.5px), linear-gradient(to bottom, #ffffff 0.5px, transparent 0.5px)' 
                 }} />
          )}
        </div>

        {/* Controles Flutuantes */}
        <div className="absolute bottom-8 left-6 flex flex-col gap-4 z-40">
           <div className="flex flex-col bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
             <button onClick={()=>{setZoom(z=>Math.min(z+0.5, 6)); playSound.tool();}} className="p-4 hover:bg-zinc-800 active:bg-zinc-700 transition-colors text-xl">➕</button>
             <button onClick={()=>{setZoom(z=>Math.max(z-0.5, 0.5)); playSound.tool();}} className="p-4 hover:bg-zinc-800 active:bg-zinc-700 transition-colors text-xl">➖</button>
           </div>
           <button onClick={undo} disabled={hIndex <= 0} className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-xl disabled:opacity-20 active:scale-95 transition-all text-xl">↩️</button>
        </div>

        <div className="absolute top-6 right-6 flex flex-col items-end gap-5 z-40">
            <div className="bg-zinc-900 p-1 rounded-xl border border-zinc-800 shadow-xl">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-800">
                   <canvas ref={previewRef} width={gridSize.w} height={gridSize.h} className="w-full h-full pixel-render" />
                </div>
            </div>
            
            <button onClick={()=>{setShowProps(!showProps); playSound.tool();}} className={`w-14 h-14 rounded-2xl shadow-xl border flex items-center justify-center transition-all active:scale-95 ${showProps ? 'bg-zinc-100 text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
               <span className="text-xl">⚙️</span>
            </button>
        </div>
      </main>

      <footer className="h-24 bg-[#09090b] border-t border-zinc-800/50 flex items-center justify-around px-4 z-50 shrink-0">
        <ToolBtn active={tool==='pencil'} onClick={()=>{setTool('pencil'); playSound.tool();}} icon="✏️" label="Lápis" />
        <ToolBtn active={tool==='eraser'} onClick={()=>{setTool('eraser'); playSound.tool();}} icon="🧹" label="Apagar" />
        <ToolBtn active={tool==='fill'} onClick={()=>{setTool('fill'); playSound.tool();}} icon="🧪" label="Balde" />
        <ToolBtn active={tool==='picker'} onClick={()=>{setTool('picker'); playSound.tool();}} icon="💉" label="Cor" />
        
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-12 h-12 rounded-xl border border-zinc-700 overflow-hidden relative shadow-inner">
            <input type="color" value={color} onChange={e=>{setColor(e.target.value); playSound.tool();}} className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer" />
          </div>
          <span className="text-[8px] font-bold uppercase text-zinc-600 tracking-widest">Paleta</span>
        </div>
      </footer>

      {/* Painel de Configurações Bottom Sheet */}
      <div className={`fixed inset-x-0 bottom-0 bg-zinc-900/98 backdrop-blur-xl border-t border-zinc-800 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] z-[60] p-8 pb-12 flex flex-col gap-8 rounded-t-[40px] ${showProps ? 'translate-y-0 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]' : 'translate-y-full'}`}>
        <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto -mt-2 mb-2" />
        
        <div className="space-y-4">
          <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Formato de Item</h3>
          <div className="grid grid-cols-2 gap-3">
            <SizeBtn active={gridSize.h===32} onClick={()=>{setGridSize({w:32, h:32}); setShowProps(false); playSound.success();}} label="Head/Hat (32x32)" />
            <SizeBtn active={gridSize.h===64} onClick={()=>{setGridSize({w:32, h:64}); setShowProps(false); playSound.success();}} label="Body (32x64)" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Cores de Estúdio</h3>
          <div className="flex gap-3 overflow-x-auto pb-4 custom-scroll">
             {recentColors.map((c, i) => (
               <button key={i} onClick={()=>{setColor(c); playSound.tool();}} className="w-10 h-10 rounded-lg shrink-0 border border-zinc-800 shadow-sm" style={{backgroundColor: c}} />
             ))}
             {palette.map((p, i) => (
               <button key={'p'+i} onClick={()=>{setColor(p); playSound.tool();}} className="w-10 h-10 rounded-lg shrink-0 border border-zinc-800/50" style={{backgroundColor: p}} />
             ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-2">
           <button onClick={()=>{onExport(canvasRef.current!.toDataURL()); playSound.success();}} className="py-5 bg-zinc-100 text-black rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md">Exportar</button>
           <button onClick={()=>{onCritiqueRequest(canvasRef.current!.toDataURL()); playSound.magic();}} className="py-5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all shadow-indigo-500/10">Análise IA</button>
        </div>
        
        <button onClick={clearCanvas} className="py-2 text-zinc-600 text-[9px] font-bold uppercase tracking-widest hover:text-red-500 transition-colors">Limpar Tudo</button>
      </div>
    </div>
  );
};

const ToolBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1.5 transition-all">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${active ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}>
      {icon}
    </div>
    <span className={`text-[8px] font-bold uppercase tracking-widest ${active ? 'text-indigo-400' : 'text-zinc-600'}`}>{label}</span>
  </button>
);

const SizeBtn = ({ active, onClick, label }: any) => (
  <button onClick={onClick} className={`py-5 rounded-xl text-[9px] font-bold border transition-all ${active ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
    {label}
  </button>
);

export default PixelEditor;
