/* ============================================================
   Gardrop — ortaq runtime + primitiv komponentlər (B.3: GardropApp.tsx
   monolitindən çıxarıldı). JSX classic runtime ilə işləyir ki, i18n-in
   React.createElement override-i bütün modullarda tutsun (override bu
   modul yüklənəndə bir dəfə qurulur; bütün səhifələr buradan import edir).
   ============================================================ */
import React from "react";
import { LANGS, I18N } from './i18n';
import { recommendSize } from './sizing';
import type { CommonProps, Product, ToastItem } from './types';

const { useState, useEffect, useRef } = React;

export const API = (location.protocol === 'file:') ? 'http://localhost:3001' : location.origin;
export const bearer = (t: string | null) => ({ 'Content-Type':'application/json', Authorization:`Bearer ${t}` });

/* Telefon nömrəsini +994 XX XXX XX XX formatına salır; +994 yazıldıqca avtomatik gəlir */
export const formatPhone = (raw: string) => {
  let d = String(raw||'').replace(/\D/g,'');
  if(d.startsWith('994')) d=d.slice(3);
  else if(d.startsWith('0')) d=d.slice(1);   // yerli 0XX → XX
  d=d.slice(0,9);                            // operator(2)+nömrə(7)
  if(!d) return '';
  let out='+994';
  if(d.length>0) out+=' '+d.slice(0,2);
  if(d.length>2) out+=' '+d.slice(2,5);
  if(d.length>5) out+=' '+d.slice(5,7);
  if(d.length>7) out+=' '+d.slice(7,9);
  return out;
};

/* ══════════════════════════════════════
   i18n runtime — AZ (default) / RU / EN
══════════════════════════════════════ */
let LANG = (typeof localStorage!=='undefined' && localStorage.getItem('gd_lang')) || 'az';
export const setRuntimeLang = (l: string) => { LANG = l; };
export const t = (s: string): string => {
  if(LANG==='az' || typeof s!=='string') return s;
  const dict = (I18N as Record<string, Record<string, string>>)[LANG]; if(!dict) return s;
  const trimmed = s.trim();
  const hit = dict[trimmed];
  if(!hit) return s;
  const lead = s.slice(0, s.length - s.trimStart().length);
  const trail = s.slice(s.trimEnd().length);
  return lead + hit + trail;  // ətrafdakı boşluqları qoru
};

/* Bütün interfeysi avtomatik tərcümə et: React.createElement-i wrap edib
   mətn uşaqlarını və mətn-daşıyan prop-ları t()-dən keçiririk. Lüğətdə olmayan
   sətir (məhsul adı, təsvir və s.) olduğu kimi qalır. */
(function(){
  const _ce = React.createElement;
  const TEXT_PROPS = ['placeholder','title','aria-label','alt'];
  // Yalnız AZ-spesifik hərf və ya hərf olan sətirləri tərcüməyə cəhd et (rəqəm/simvol/₼ ötür)
  const translatable = (s: unknown): s is string => typeof s==='string' && s.length>0 && /[A-Za-zƏəĞğİıÖöÜüÇçŞş]/.test(s);
  (React as { createElement: (...a: any[]) => any }).createElement = function(this: unknown, type: any, props: any, ...children: any[]){
    if(LANG!=='az'){
      let np = props;
      if(props){
        for(const k of TEXT_PROPS){
          if(typeof props[k]==='string' && translatable(props[k])){
            if(np===props) np={...props};
            np[k]=t(props[k]);
          }
        }
      }
      const tc = children.map(c => (typeof c==='string' && translatable(c)) ? t(c) : c);
      return _ce.call(this, type, np, ...tc);
    }
    return _ce.call(this, type, props, ...children);
  };
})();

// Cihazdan şəkil yükləmə (multipart) — yüklənmiş URL-ləri qaytarır
export async function uploadFiles(files: FileList | File[] | null, token: string | null): Promise<string[]>{
  if(!files || !files.length) return [];
  const fd = new FormData();
  Array.from(files).slice(0,5).forEach(f=>fd.append('files', f));
  const r = await fetch(`${API}/api/upload`,{ method:'POST', headers:{ Authorization:`Bearer ${token}` }, body:fd });
  const d = await r.json();
  if(!r.ok) throw new Error(d.error||'Yükləmə xətası');
  return Array.isArray(d.urls) ? d.urls : [];
}

/* ══════════════════════════════════════
   Google ilə giriş (Google Identity Services)
══════════════════════════════════════ */
const GOOGLE_CLIENT_ID = '210401234200-7v005t2n247l1681iethn4bve40n7kgk.apps.googleusercontent.com';
let __googleCb: ((credential: string) => void) | null = null;  // App tərəfindən təyin olunur
export const setGoogleCb = (fn: ((credential: string) => void) | null) => { __googleCb = fn; };
const __googleInit = () => {
  if(window.__gInited) return true;
  if(!window.google?.accounts?.id) return false;   // GSI scripti hələ yüklənməyib
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (resp: any) => { if(__googleCb && resp?.credential) __googleCb(resp.credential); },
  });
  window.__gInited = true;
  return true;
};

/* Saytın öz dizaynında Google düyməsi: rəsmi GSI düyməsi ekrandan kənarda gizli render
   olunur, bizim custom düyməyə basanda proqram vasitəsilə kliklənir → ID-token axını işləyir. */
export const GoogleSignIn = ({ text }: { text?: string }) => {
  const hidden = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let tries = 0, stop = false;
    const tick = () => {
      if(stop) return;
      if(__googleInit() && hidden.current){
        hidden.current.innerHTML = '';
        window.google.accounts.id.renderButton(hidden.current, { type:'standard', theme:'outline', size:'large', width:320 });
      } else if(tries++ < 50){ setTimeout(tick, 150); }   // ~7.5 san. gözlə
    };
    tick();
    return () => { stop = true; };
  }, []);
  const trigger = () => {
    const el = hidden.current?.querySelector('div[role="button"], [role="button"]') as HTMLElement | null;
    if(el){ el.click(); return; }
    try{ if(__googleInit()) window.google.accounts.id.prompt(); }catch{}   // ehtiyat: One Tap
  };
  const label = text==='signup_with' ? t('Google ilə qeydiyyat')
              : text==='continue_with' ? t('Google ilə davam et')
              : t('Google ilə daxil ol');
  return (
    <>
      <button type="button" onClick={trigger} className="w-full border border-bdr rounded-btn py-[10px] flex items-center justify-center gap-3 text-sm font-medium text-brand hover:bg-bg2 transition-colors"><Ic.Google className="w-5 h-5"/> {label}</button>
      <div ref={hidden} aria-hidden="true" style={{position:'absolute',left:'-9999px',top:0,overflow:'hidden'}}/>
    </>
  );
};

/* ══════════════════════════════════════
   FLY-TO-CART / FLY-TO-FAVORITE animation
══════════════════════════════════════ */
const FLY_SVG: Record<string, string> = {
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  fav:  '<svg viewBox="0 0 24 24" fill="#0A0A0A"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
};
const __flyInFlight: Record<string, number> = { cart: 0, fav: 0 };
export function flyToTarget(kind: string, from?: { x: number; y: number } | null){
  try{
    from = from || window.__flyPt;
    if(!from) return;
    let target: HTMLElement | null = null;
    document.querySelectorAll('[data-fly="'+kind+'"]').forEach(el=>{ const he = el as HTMLElement; if(he.offsetParent!==null) target=he; });
    if(!target) return;
    const tgt: HTMLElement = target;
    __flyInFlight[kind] = (__flyInFlight[kind]||0) + 1;
    const fp = from;
    const tr=tgt.getBoundingClientRect();
    const tx=tr.left+tr.width/2, ty=tr.top+tr.height/2;
    const el=document.createElement('div');
    el.className='fly-chip';
    el.innerHTML=FLY_SVG[kind]||FLY_SVG.fav;
    el.style.left=(fp.x-15)+'px'; el.style.top=(fp.y-15)+'px';
    el.style.transform='translate(0,0) scale(1)'; el.style.opacity='1';
    document.body.appendChild(el);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      el.style.transform='translate('+(tx-fp.x)+'px,'+(ty-fp.y)+'px) scale(0.3)';
      el.style.opacity='0.1';
    }));
    setTimeout(()=>{
      el.remove();
      tgt.classList.add('fly-pulse');
      setTimeout(()=>tgt.classList.remove('fly-pulse'),440);
      __flyInFlight[kind] = Math.max(0, __flyInFlight[kind]-1);
      window.dispatchEvent(new CustomEvent('flyland',{detail:{kind}}));
    },700);
  }catch{ /* animasiya kritik deyil */ }
}

/* Badge sayı: artım uçuş animasiyası bitənə qədər gözləyir; azalma dərhal görünür. */
function useFlyBadge(kind: string, count: number){
  const [shown,setShown]=useState(count);
  const latest=useRef(count); latest.current=count;
  useEffect(()=>{
    if(count<=shown){ setShown(count); return; }
    if(!__flyInFlight[kind]){ setShown(count); return; }
    let done=false;
    const land=(e: Event)=>{ const ce=e as CustomEvent; if(!done && ce.detail && ce.detail.kind===kind){ done=true; setShown(latest.current); } };
    window.addEventListener('flyland',land);
    const t=setTimeout(()=>{ if(!done){ done=true; setShown(latest.current); } },900); // ehtiyat
    return ()=>{ window.removeEventListener('flyland',land); clearTimeout(t); };
  },[count,shown,kind]);
  return shown;
}

export const CountBadge = ({ kind, count, className="" }: { kind: string; count: number; className?: string }) => {
  const shown = useFlyBadge(kind, count);
  const prev = useRef(shown);
  const [pop,setPop]=useState(false);
  useEffect(()=>{
    if(shown>prev.current){ setPop(true); const t=setTimeout(()=>setPop(false),460); prev.current=shown; return ()=>clearTimeout(t); }
    prev.current=shown;
  },[shown]);
  if(shown<=0) return null;
  return <span className={`${className} ${pop?'badge-pop':''}`}>{shown}</span>;
};

/* ══════════════════════════════════════
   ICONS
══════════════════════════════════════ */
export const Ic: Record<string, (p: any) => React.ReactElement> = {
  Search: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Heart: ({filled,...p}) => <svg {...p} viewBox="0 0 24 24" fill={filled?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Bag: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  User: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  ChevR: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevL: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevD: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Star: p => <svg {...p} viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Info: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Trash: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Plus: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Minus: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Mail: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Home: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Lock: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Grid: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  CheckCircle: p => <svg {...p} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>,
  Sparkles: p => <svg {...p} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 4.6L18 8l-4.4 1.4L12 14l-1.6-4.6L6 8l4.4-1.4L12 2zm6 10l.9 2.6L21 15l-2.1.4L18 18l-.9-2.6L15 15l2.1-.4L18 12zM6 13l.8 2.2L9 16l-2.2.8L6 19l-.8-2.2L3 16l2.2-.8L6 13z"/></svg>,
  Ruler: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4z"/><path d="m7.5 10.5 2 2M10.5 7.5l2 2M13.5 4.5l2 2M4.5 13.5l2 2"/></svg>,
  MapPin: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Settings: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Google: p => <svg {...p} viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
};

/* ══════════════════════════════════════
   SHARED PRIMITIVE COMPONENTS
══════════════════════════════════════ */
// Köhnə məlumatda şəkil URL-i mütləq host ilə saxlanıb ("http://localhost:3001/uploads/..").
// Bu telefonda/cloudflared tuneldə işləməz. /uploads/ qarşısındakı origin-i atıb nisbi yola
// çeviririk → cari domeyndən (proxy/tunnel) verilir. Xarici URL-lərə (picsum və s.) toxunmur.
export const resolveImg = (s?: string | null): string | null | undefined =>
  s ? s.replace(/^https?:\/\/[^/]+(\/uploads\/)/i, '$1') : s;

// Kart/siyahı üçün kiçik thumbnail URL-i: backend cütü X.webp + X_thumb.webp saxlayır.
// Yalnız .webp (yeni işlənmiş şəkillər) üçün; köhnə/xarici URL-lər olduğu kimi qalır.
export const thumbUrl = (s?: string | null): string | null | undefined =>
  s && /\.webp$/i.test(s) ? s.replace(/\.webp$/i, '_thumb.webp') : s;

// CMS: /api/content xəritəsindən bir açarı təhlükəsiz JSON-parse et (xəta/boş → fallback).
export function parseContent<T>(content: Record<string,string> | undefined, key: string, fallback: T): T {
  try { const v = content?.[key]; if(!v) return fallback; const p = JSON.parse(v); return (p ?? fallback) as T; }
  catch { return fallback; }
}

// thumb=true → kiçik _thumb.webp yüklə (kataloq kartları). Thumb tapılmasa (köhnə şəkil)
// tam şəklə düş, o da alınmasa placeholder.
export const Img = ({ className="", src, alt="", thumb=false }: { className?: string; src?: string | null; alt?: string; thumb?: boolean }) => {
  const full = resolveImg(src);
  const initial = thumb ? (thumbUrl(full) ?? full) : full;
  const [cur, setCur] = useState(initial);
  const [err, setErr] = useState(false);
  useEffect(()=>{ setCur(initial); setErr(false); }, [initial]);
  const onError = ()=>{ if (cur !== full && full) setCur(full); else setErr(true); };
  if (cur && !err)
    return <img src={cur} alt={alt} loading="lazy" onError={onError}
      className={`object-cover bg-bg2 ${className}`}/>;
  return (
    <div className={`bg-bg2 flex items-center justify-center overflow-hidden ${className}`}>
      <svg viewBox="0 0 80 80" className="w-10 h-10" fill="currentColor">
        <rect width="80" height="80" fill="#F7F7F7"/>
        <path d="M22 58 L22 36 Q22 32 26 32 L31 32 L36 22 L44 22 L49 32 L54 32 Q58 32 58 36 L58 58 Q58 62 54 62 L26 62 Q22 62 22 58 Z" fill="#E0E0E0"/>
        <circle cx="40" cy="44" r="7" fill="#EFEFEF"/>
      </svg>
    </div>
  );
};

/* Scroll zamanı görünəndə yumşaq fade-up (Apple-style) */
export const Reveal = ({ children, className="", delay=0 }: { children?: React.ReactNode; className?: string; delay?: number }) => {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const el=ref.current; if(!el) return;
    if(!('IntersectionObserver' in window)){ el.classList.add('in'); return; }
    const ob=new IntersectionObserver((entries)=>{ entries.forEach(en=>{ if(en.isIntersecting){ el.classList.add('in'); ob.disconnect(); } }); },{ threshold:0.1, rootMargin:'0px 0px -40px 0px' });
    ob.observe(el);
    return ()=>ob.disconnect();
  },[]);
  return <div ref={ref} className={`reveal ${className}`} style={delay?{transitionDelay:`${delay}ms`}:undefined}>{children}</div>;
};

export const SizeBadge = ({ size, className="" }: { size?: string; className?: string }) => (
  <span className={`text-[10px] font-bold uppercase tracking-[0.05em] px-[7px] py-[3px] rounded-badge whitespace-nowrap ${className}`}
    style={{backgroundColor:'#69EA9B',color:'#0A4020'}}>
    Sənə uyğun: {size}
  </span>
);

export const Stars = ({ rating, reviews, sm }: { rating?: number; reviews?: number; sm?: boolean }) => (
  <div className="flex items-center gap-1">
    <Ic.Star className={`${sm?"w-3 h-3":"w-3.5 h-3.5"} text-yellow-400`}/>
    <span className={`${sm?"text-xs":"text-sm"} font-semibold text-[#333333]`}>{rating}</span>
    {reviews !== undefined && <span className={`${sm?"text-xs":"text-sm"} text-t3`}>({reviews})</span>}
  </div>
);

/* Pure controlled input — CSS-only focus, no internal state (no focus-loss bug) */
export const Field = ({ label, sm, className="", ...props }: { label?: string; sm?: boolean; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    {label && <label className={`block font-medium text-brand mb-1.5 ${sm?'text-xs':'text-sm'}`}>{label}</label>}
    <input {...props}
      className={`w-full bg-white border border-bdr rounded-btn px-[14px] py-[10px] text-[15px] text-brand outline-none placeholder-t3 transition-all focus:border-brand focus:shadow-[0_0_0_3px_rgba(10,10,10,0.08)] ${className}`}/>
  </div>
);

export const Spinner = ({ className="w-5 h-5", light }: { className?: string; light?: boolean }) => (
  <div className={`${className} border-2 ${light?'border-white':'border-brand'} border-t-transparent rounded-full animate-spin`}/>
);

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-card overflow-hidden border border-bdr">
    <div className="skel w-full aspect-[3/4]"/>
    <div className="p-3 space-y-2">
      <div className="skel h-3 w-1/3 rounded"/>
      <div className="skel h-4 w-3/4 rounded"/>
      <div className="skel h-4 w-1/2 rounded"/>
    </div>
  </div>
);

type CardProps = Pick<CommonProps, 'nav' | 'favs' | 'togFav' | 'addCart' | 'cart' | 'user'> & { p: Product };
export const ProductCard = ({ p, nav, favs, togFav, user }: CardProps) => {
  const isFav = favs.includes(p.id);
  const rec = user ? recommendSize(user, p) : null;
  return (
    <div className="bg-white rounded-card overflow-hidden cursor-pointer group border border-bdr shadow-xs hover:shadow-card-h hover:-translate-y-1 transition-all duration-200" onClick={()=>nav('product',{product:p})}>
      <div className="relative">
        <Img className="w-full aspect-[3/4]" src={p.imageUrls && p.imageUrls[0]} alt={p.name} thumb/>
        {rec && rec.hasMeasurements && (rec.fits===false
          ? <div className="absolute top-2 left-2 bg-sale text-white text-[10px] font-bold px-2 py-0.5 rounded-badge">Uyğun deyil</div>
          : <div className="absolute top-2 left-2"><SizeBadge size={rec.size}/></div>)}
        {p.discount && <div className="absolute bottom-2 right-2 bg-sale text-white text-[10px] font-bold px-2 py-0.5 rounded-badge">-{p.discount}%</div>}
        <button className={`absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-full shadow-xs transition-colors active:scale-90 ${isFav?"text-red-500":"text-td hover:text-red-400"}`}
          onClick={e=>{e.stopPropagation();togFav(p.id);}}>
          <Ic.Heart filled={isFav} className="w-4 h-4"/>
        </button>
      </div>
      <div className="p-3">
        <p className="text-[10px] text-t3 uppercase tracking-[0.08em] font-bold">{p.store}</p>
        <p className="text-sm font-medium text-brand mt-0.5 leading-tight line-clamp-2">{p.name}</p>
        <div className="flex items-center justify-between mt-1.5 flex-wrap gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-brand">{p.price} ₼</span>
            {p.oldPrice && <span className="text-xs text-t3 line-through">{p.oldPrice} ₼</span>}
          </div>
          <Stars rating={p.rating} reviews={p.reviews} sm/>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   TOAST
══════════════════════════════════════ */
export const Toast = ({ toasts }: { toasts: ToastItem[] }) => (
  <div className="fixed top-4 right-4 z-[400] space-y-2 pointer-events-none">
    {toasts.map(t=>(
      <div key={t.id} className={`flex items-center gap-3 pl-2 pr-5 py-2 rounded-full shadow-pop text-sm font-semibold text-white min-w-[220px] bg-brand ${t.leaving?'toast-out':''}`} style={t.leaving?undefined:{animation:'slideIn .25s cubic-bezier(0.34,1.56,0.64,1)'}}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[13px]"
          style={{backgroundColor: t.type==='remove'?'#E53E3E':'#69EA9B', color: t.type==='remove'?'#fff':'#0A4020'}}>
          {t.type==='remove'?'✕':t.type==='fav'?'♥':'✓'}
        </div>
        <span className="leading-tight">{t.msg}</span>
      </div>
    ))}
  </div>
);

/* ══════════════════════════════════════
   LANGUAGE SWITCHER
══════════════════════════════════════ */
export const LanguageSwitcher = ({ lang, setLang, compact }: { lang: string; setLang: (l: string) => void; compact?: boolean }) => {
  const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{ if(!open) return; const h=(e: Event)=>{ if(ref.current&&!ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('pointerdown',h,true); return ()=>document.removeEventListener('pointerdown',h,true); },[open]);
  const cur=LANGS.find(l=>l.code===lang)||LANGS[0];
  return (
    <div className="relative" ref={ref}>
      <button onClick={()=>setOpen(o=>!o)} className={`flex items-center gap-1 rounded-full font-semibold transition-colors ${compact?'px-2 py-1 text-xs':'px-2.5 py-2 text-sm'} text-t2 hover:text-brand hover:bg-bg2`} aria-label="Dil">
        <span>🌐</span><span>{cur.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white rounded-card shadow-pop border border-bdr py-1 z-[60] min-w-[140px] anim-pop">
          {LANGS.map(l=>(
            <button key={l.code} onClick={()=>{setLang(l.code);setOpen(false);}} className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-bg2 ${l.code===lang?'text-brand font-semibold':'text-t2'}`}>
              <span>{l.name}</span>{l.code===lang&&<span className="text-accent-t">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export { LANGS } from './i18n';
