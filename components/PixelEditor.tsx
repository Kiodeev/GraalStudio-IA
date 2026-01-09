
import React, { useState, useRef, useEffect } from 'react';

interface PixelEditorProps {
  onCritiqueRequest: (dataUrl: string) => void;
  activeReference?: string | null;
  initialData?: string | null;
  onAutoSave?: (dataUrl: string) => void;
}

const PixelEditor: React.FC<PixelEditorProps> = ({ onCritiqueRequest, activeReference, initialData, onAutoSave }) => {
  const [activeLayer, setActiveLayer] = useState<'pixel' | 'sketch'>('pixel');
  const [gridMode, setGridMode] = useState<'head' | 'body'>('head');
  const [color, setColor] = useState('#ffffff');
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'picker'>('pencil');
  const [brushSize, setBrushSize] = useState(1);
  const [zoom, setZoom] = useState(12);
  const [sketchOpacity, setSketchOpacity] = useState(0.3);
  const [showTools, setShowTools] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Refs para os dois canvases independentes
  const pixelCanvasRef = useRef<HTMLCanvasElement>(null);
  const sketchCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number, y: number } | null>(null);

  const dims = gridMode === 'body' ? { w: 32, h: 64 } : { w: 32, h: 32 };

  // Inicialização e Persistência
  useEffect(() => {
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        const ctx = pixelCanvasRef.current?.getContext('2d');
        ctx?.clearRect(0, 0, dims.w, dims.h);
        ctx?.drawImage(img, 0, 0, dims.w, dims.h);
      };
      img.src = initialData;
    }
  }, []);

  const getPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    return activeLayer === 'pixel' ? { x: Math.floor(x), y: Math.floor(y) } : { x, y };
  };

  const draw = (from: {x: number, y: number}, to: {x: number, y: number}) => {
    const canvas = activeLayer === 'pixel' ? pixelCanvasRef.current : sketchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.beginPath();
    ctx.lineCap = activeLayer === 'pixel' ? 'square' : 'round';
    ctx.lineJoin = activeLayer === 'pixel' ? 'miter' : 'round';
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    const size = activeLayer === 'pixel' ? brushSize : brushSize * 4;
    ctx.lineWidth = size;

    if (activeLayer === 'pixel' && brushSize === 1 && tool !== 'eraser') {
      ctx.fillStyle = color;
      ctx.fillRect(to.x, to.y, 1, 1);
    } else {
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
    
    if (activeLayer === 'pixel' && onAutoSave) {
      onAutoSave(canvas.toDataURL());
    }
  };

  const handleStart = (e: any) => {
    const canvas = activeLayer === 'pixel' ? pixelCanvasRef.current : sketchCanvasRef.current;
    if (!canvas) return;
    const pos = getPos(e, canvas);
    if (!pos) return;

    setIsDrawing(true);
    
    if (tool === 'picker') {
      const ctx = canvas.getContext('2d');
      const data = ctx?.getImageData(pos.x, pos.y, 1, 1).data;
      if (data && data[3] > 0) {
        const hex = "#" + ((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2]).toString(16).slice(1);
        setColor(hex);
        setTool('pencil');
      }
      setIsDrawing(false);
      return;
    }

    lastPos.current = pos;
    draw(pos, pos);
  };

  const handleMove = (e: any) => {
    if (!isDrawing || !lastPos.current) return;
    const canvas = activeLayer === 'pixel' ? pixelCanvasRef.current : sketchCanvasRef.current;
    if (!canvas) return;
    const pos = getPos(e, canvas);
    if (!pos) return;
    
    draw(lastPos.current, pos);
    lastPos.current = pos;
  };

  const handleEnd = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    if (confirm(`Limpar camada de ${activeLayer === 'pixel' ? 'Pixel' : 'Rascunho'}?`)) {
      const canvas = activeLayer === 'pixel' ? pixelCanvasRef.current : sketchCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      ctx?.clearRect(0, 0, canvas!.width, canvas!.height);
      if (activeLayer === 'pixel' && onAutoSave) onAutoSave(canvas!.toDataURL());
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#020202] relative overflow-hidden">
      {/* Editor Main */}
      <div className="flex-1 checkerboard flex items-center justify-center p-4 touch-none overflow-hidden relative">
        <div 
          className="relative transition-all duration-300"
          style={{ width: dims.w * zoom, height: dims.h * zoom, boxShadow: '0 0 100px rgba(0,0,0,1)' }}
        >
          {/* Layer 1: Referência IA (Base) */}
          {activeReference && (
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
              <img src={activeReference} className="w-full h-full object-contain pixel-render brightness-75" alt="ref" />
            </div>
          )}

          {/* Layer 2: Sketch HD (Rascunho) */}
          <canvas
            ref={sketchCanvasRef}
            width={1024}
            height={gridMode === 'body' ? 2048 : 1024}
            className={`absolute inset-0 z-10 w-full h-full pointer-events-none transition-opacity duration-300`}
            style={{ opacity: activeLayer === 'sketch' ? 1 : sketchOpacity }}
          />

          {/* Layer 3: Pixel Layer (Graal) */}
          <canvas
            ref={pixelCanvasRef}
            width={dims.w}
            height={dims.h}
            onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
            onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
            className={`absolute inset-0 z-20 w-full h-full bg-transparent pixel-render ${activeLayer === 'pixel' ? 'cursor-crosshair' : 'pointer-events-none opacity-80'}`}
            style={{ touchAction: 'none' }}
          />

          {/* Captura de toques para a camada ativa */}
          <div 
            className={`absolute inset-0 z-30 ${activeLayer === 'sketch' ? 'block' : 'hidden'}`}
            onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
            onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
            style={{ touchAction: 'none' }}
          />
          
          {/* Grid visual */}
          {zoom > 8 && (
            <div className="absolute inset-0 pointer-events-none z-40 opacity-[0.03]" 
                 style={{ 
                   backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                   backgroundSize: `${zoom}px ${zoom}px`
                 }} 
            />
          )}
        </div>

        {/* HUD Flutuante Lateral */}
        <div className="absolute top-6 left-6 flex flex-col gap-3 z-50">
          <button onClick={() => setZoom(z => Math.min(z + 2, 60))} className="w-12 h-12 bg-zinc-900/90 border border-white/5 rounded-2xl flex items-center justify-center shadow-xl active:scale-90">➕</button>
          <button onClick={() => setZoom(z => Math.max(z - 2, 4))} className="w-12 h-12 bg-zinc-900/90 border border-white/5 rounded-2xl flex items-center justify-center shadow-xl active:scale-90">➖</button>
          <button onClick={clearCanvas} className="w-12 h-12 bg-red-900/20 border border-red-500/20 rounded-2xl flex items-center justify-center text-sm shadow-xl active:scale-90">🗑️</button>
        </div>

        <div className="absolute top-6 right-6 flex flex-col gap-3 z-50">
          <button onClick={() => setShowTools(!showTools)} className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-xl shadow-2xl transition-all ${showTools ? 'bg-indigo-600 border-indigo-400' : 'bg-zinc-900/90 border-white/5'}`}>
            ⚙️
          </button>
          <button onClick={() => onCritiqueRequest(pixelCanvasRef.current!.toDataURL())} className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center shadow-xl active:scale-95 text-xl">🗿</button>
        </div>
      </div>

      {/* Main Toolbar */}
      <div className="h-32 bg-black border-t border-zinc-900 px-6 py-4 flex flex-col justify-center z-[110] safe-pb">
        <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto w-full">
          
          {/* Layer Selector */}
          <div className="flex bg-zinc-900/80 p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveLayer('pixel')}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeLayer === 'pixel' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500'}`}
            >
              Pixel Art
            </button>
            <button 
              onClick={() => setActiveLayer('sketch')}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeLayer === 'sketch' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500'}`}
            >
              Rascunho
            </button>
          </div>

          {/* Tools */}
          <div className="flex gap-2">
            <ToolIcon active={tool === 'pencil'} onClick={() => setTool('pencil')} icon="✏️" />
            <ToolIcon active={tool === 'eraser'} onClick={() => setTool('eraser')} icon="🧹" />
            <ToolIcon active={tool === 'picker'} onClick={() => setTool('picker')} icon="💉" />
          </div>

          {/* Color & Info */}
          <div className="flex items-center gap-4">
             <div className="hidden sm:block text-right">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Pincel</p>
                <p className="text-[10px] font-bold text-white uppercase">{brushSize}px</p>
             </div>
             <div className="w-12 h-12 rounded-xl border-2 border-zinc-800 overflow-hidden relative shadow-inner shrink-0 group">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer" />
             </div>
          </div>

        </div>
      </div>

      {/* Settings Panel */}
      <div className={`fixed inset-x-0 bottom-0 bg-zinc-950/98 backdrop-blur-3xl border-t border-white/10 p-10 rounded-t-[40px] z-[120] transition-transform duration-500 ease-in-out ${showTools ? 'translate-y-0 shadow-2xl' : 'translate-y-full'}`}>
        <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto -mt-4 mb-8" />
        
        <div className="space-y-8 max-w-lg mx-auto">
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => {setGridMode('head'); setShowTools(false);}} className={`py-5 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${gridMode === 'head' ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>Graal Head (32x32)</button>
            <button onClick={() => {setGridMode('body'); setShowTools(false);}} className={`py-5 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${gridMode === 'body' ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>Graal Body (32x64)</button>
          </div>

          <div className="space-y-3">
             <div className="flex justify-between text-[9px] font-black uppercase text-zinc-500 tracking-widest">
               <span>Opacidade do Rascunho</span>
               <span className="text-white">{Math.round(sketchOpacity * 100)}%</span>
             </div>
             <input type="range" min="0" max="1" step="0.1" value={sketchOpacity} onChange={(e) => setSketchOpacity(parseFloat(e.target.value))} className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none accent-indigo-500" />
          </div>

          <div className="space-y-3">
             <div className="flex justify-between text-[9px] font-black uppercase text-zinc-500 tracking-widest">
               <span>Tamanho do Traço</span>
               <span className="text-white">{brushSize}px</span>
             </div>
             <input type="range" min="1" max="10" step="1" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none accent-indigo-500" />
          </div>

          <button onClick={() => {
            const link = document.createElement('a');
            link.download = `graal_pro_${gridMode}_${Date.now()}.png`;
            link.href = pixelCanvasRef.current!.toDataURL();
            link.click();
            setShowTools(false);
          }} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all">Exportar PNG Final</button>
          
          <button onClick={() => setShowTools(false)} className="w-full py-2 text-zinc-600 font-bold uppercase tracking-widest text-[8px]">Fechar Ajustes</button>
        </div>
      </div>

      <style>{`
        .pixel-render { image-rendering: pixelated; image-rendering: crisp-edges; }
        .checkerboard {
          background-image: linear-gradient(45deg, #050505 25%, transparent 25%), linear-gradient(-45deg, #050505 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #050505 75%), linear-gradient(-45deg, transparent 75%, #050505 75%);
          background-size: 24px 24px; background-color: #020202;
        }
      `}</style>
    </div>
  );
};

const ToolIcon = ({ active, icon, onClick }: any) => (
  <button onClick={onClick} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${active ? 'bg-indigo-600 shadow-lg scale-110 text-white border border-indigo-400' : 'bg-zinc-900/50 text-zinc-600 border border-white/5'}`}>
    {icon}
  </button>
);

export default PixelEditor;
