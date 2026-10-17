'use client';
/* ============================================================
   Şəkil kəsmə (crop) — sayt-boyu aspect-ratio standartı:
     logo 1:1 · banner/hero 16:9 · məhsul/kateqoriya 3:4
   Asılılıqsız canvas cropper: istifadəçi şəkli sürüşdürür/yaxınlaşdırır,
   sabit nisbətli pəncərədən kəsilir. Çıxış JPEG → backend onsuz WebP+thumb edir.
   İstifadə: const crop = useCropper(RATIOS.product);
             const files = await crop.start(e.target.files); // null = imtina
             JSX-də {crop.ui} render olunmalıdır.
   ============================================================ */
import React from "react";
const { useState, useRef, useEffect, useCallback } = React;

export const RATIOS = {
  logo: 1,          // kvadrat
  banner: 16 / 9,   // mağaza banneri / CMS hero
  product: 3 / 4,   // məhsul + kateqoriya kartları (portret)
} as const;

/* Çıxış ölçüləri (uzun tərəf ~1600px — backend max1600 ilə uyğun) */
function outSize(aspect: number): [number, number] {
  if (Math.abs(aspect - 1) < 0.01) return [1024, 1024];
  if (aspect > 1) return [1600, Math.round(1600 / aspect)];
  return [Math.round(1600 * aspect), 1600];
}

function CropModal({ file, aspect, onDone, onCancel }:
  { file: File; aspect: number; onDone: (f: File) => void; onCancel: () => void }) {
  const [url, setUrl] = useState('');
  const imgRef = useRef<HTMLImageElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [nat, setNat] = useState<[number, number] | null>(null);   // natural w/h
  const [zoom, setZoom] = useState(1);                              // 1 = cover
  const [off, setOff] = useState<[number, number]>([0, 0]);         // pan (böyük şəkil px-i yox, ekran px-i)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u); setZoom(1); setOff([0, 0]); setNat(null);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  /* cover miqyası: şəkil pəncərəni tam örtsün */
  const geom = useCallback(() => {
    const box = boxRef.current; if (!box || !nat) return null;
    const bw = box.clientWidth, bh = box.clientHeight;
    const cover = Math.max(bw / nat[0], bh / nat[1]);
    const s = cover * zoom;
    const iw = nat[0] * s, ih = nat[1] * s;
    // pan sərhədləri: şəkil pəncərədən çıxmasın
    const maxX = (iw - bw) / 2, maxY = (ih - bh) / 2;
    return { bw, bh, s, iw, ih, maxX, maxY };
  }, [nat, zoom]);

  const clampOff = useCallback((x: number, y: number): [number, number] => {
    const g = geom(); if (!g) return [x, y];
    return [Math.max(-g.maxX, Math.min(g.maxX, x)), Math.max(-g.maxY, Math.min(g.maxY, y))];
  }, [geom]);

  useEffect(() => { setOff((o) => clampOff(o[0], o[1])); }, [zoom, clampOff]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: off[0], oy: off[1] };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setOff(clampOff(drag.current.ox + (e.clientX - drag.current.x), drag.current.oy + (e.clientY - drag.current.y)));
  };
  const onPointerUp = () => { drag.current = null; };
  const onWheel = (e: React.WheelEvent) => {
    setZoom((z) => Math.max(1, Math.min(4, z * (e.deltaY < 0 ? 1.08 : 0.925))));
  };

  const doCrop = async () => {
    const g = geom(); const img = imgRef.current;
    if (!g || !img || !nat) return;
    setBusy(true);
    try {
      // Pəncərənin şəkil koordinatlarında yeri
      const sx = (g.iw / 2 - g.bw / 2 - off[0]) / g.s;
      const sy = (g.ih / 2 - g.bh / 2 - off[1]) / g.s;
      const sw = g.bw / g.s, sh = g.bh / g.s;
      const [ow, oh] = outSize(aspect);
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(ow, Math.round(sw)); canvas.height = Math.min(oh, Math.round(sh));
      // ölçü nisbəti qorunsun (kiçik mənbədə upscale etmirik)
      if (canvas.width / canvas.height !== aspect) {
        canvas.width = Math.round(canvas.height * aspect) || ow;
      }
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => b ? res(b) : rej(new Error('crop alınmadı')), 'image/jpeg', 0.9));
      onDone(new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }));
    } catch { onCancel(); }
    finally { setBusy(false); }
  };

  const ratioLabel = Math.abs(aspect - 1) < 0.01 ? '1:1' : aspect > 1 ? '16:9' : '3:4';

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.72)' }}>
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-lg overflow-hidden anim-pop">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <h3 className="font-bold">Şəkli kəs <span className="text-xs font-semibold opacity-50 ml-1">{ratioLabel}</span></h3>
          <button onClick={onCancel} className="w-8 h-8 grid place-items-center rounded-full hover:bg-black/5 text-xl leading-none">×</button>
        </div>
        <div className="px-5">
          <div ref={boxRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onWheel={onWheel}
            className="relative w-full overflow-hidden rounded-xl bg-black/80 cursor-grab active:cursor-grabbing select-none touch-none"
            style={{ aspectRatio: String(aspect) }}>
            {url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img ref={imgRef} src={url} alt="" draggable={false}
                onLoad={(e) => setNat([e.currentTarget.naturalWidth, e.currentTarget.naturalHeight])}
                className="absolute left-1/2 top-1/2 max-w-none pointer-events-none"
                style={nat ? (() => {
                  const g = geom(); if (!g) return { opacity: 0 };
                  return { width: g.iw, height: g.ih, transform: `translate(calc(-50% + ${off[0]}px), calc(-50% + ${off[1]}px))` };
                })() : { opacity: 0 }} />
            )}
            {/* 3×3 tor (rule of thirds) */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/70" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/70" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/70" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/70" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs opacity-60">Zoom</span>
            <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1" />
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold border border-black/10 hover:bg-black/5">Ləğv et</button>
          <button onClick={doCrop} disabled={busy || !nat}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
            {busy ? 'Kəsilir…' : 'Kəs və istifadə et'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CropJob { files: File[]; idx: number; out: File[]; resolve: (f: File[] | null) => void }

/** Sabit nisbətli crop axını. start(files) → Promise<File[] | null> (null = istifadəçi imtina etdi). */
export function useCropper(aspect: number) {
  const [job, setJob] = useState<CropJob | null>(null);

  const start = useCallback((files: FileList | File[] | null): Promise<File[] | null> =>
    new Promise((resolve) => {
      const arr = files ? Array.from(files).filter((f) => f.type.startsWith('image/')) : [];
      if (!arr.length) { resolve(null); return; }
      setJob({ files: arr, idx: 0, out: [], resolve });
    }), []);

  const ui = job ? (
    <CropModal
      key={job.idx}
      file={job.files[job.idx]}
      aspect={aspect}
      onCancel={() => { job.resolve(job.out.length ? job.out : null); setJob(null); }}
      onDone={(f) => {
        const out = [...job.out, f];
        if (job.idx + 1 < job.files.length) setJob({ ...job, idx: job.idx + 1, out });
        else { job.resolve(out); setJob(null); }
      }} />
  ) : null;

  return { start, ui };
}
