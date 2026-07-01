/* Profil ekosistemi: OrderTimeline, BodySilhouette, Fit sihirbazı, GuestAccount, ProfilePage
   (B.3: GardropApp.tsx-dən çıxarıldı). */
import React from "react";
import { Ic, Img, Spinner, Field, LANGS, formatPhone, API, bearer, t } from '../shared';
import { recommendSize } from '../sizing';
import { MapPicker } from './MapPicker';
import type { Address, NavFn, Order, Prefs, User } from '../types';

const { useState, useEffect } = React;

/* ══════════════════════════════════════ ORDER TRACKING TIMELINE ══════════════════════════════════════ */
const OrderTimeline = ({ order }: { order: Order }) => {
  const tfmt = (iso?: string)=>{ if(!iso) return ''; try{ const d=new Date(iso); return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }catch{ return ''; } };
  if(order.status==='İptal'){
    return (
      <div className="bg-red-50 border border-red-200 rounded-card p-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-sale text-white flex items-center justify-center shrink-0 text-sm">✕</div>
        <div className="min-w-0"><p className="text-sm font-semibold text-sale">Sifariş ləğv edildi{order.cancelledBy?` (${order.cancelledBy})`:''}</p>{order.cancelledAt && <p className="text-xs text-t3">{tfmt(order.cancelledAt)}</p>}{order.cancelReason && <p className="text-xs text-t2 mt-0.5">Səbəb: {order.cancelReason}</p>}</div>
      </div>
    );
  }
  const steps = [
    { k:'Hazırlanır', label:'Hazırlanır', icon:'📦', at:order.createdAt },
    { k:'Hazırlandı', label:'Hazırlandı', icon:'✅', at:order.confirmedAt },
    { k:'Yolda',      label:'Yolda',      icon:'🚚', at:order.shippedAt },
    { k:'Çatdırıldı', label:'Çatdırıldı', icon:'✓',  at:order.deliveredAt },
  ];
  const curIdx = order.status==='Çatdırıldı'?3 : order.status==='Yolda'?2 : order.status==='Hazırlandı'?1 : 0;
  const isExpress = order.deliveryType==='Ekspress';
  return (
    <div className="bg-bg2 rounded-card p-4">
      <p className="text-xs font-bold text-t2 uppercase tracking-wide mb-3 flex items-center gap-2">🚚 Sifariş izləmə {isExpress && <span className="text-[10px] font-bold text-amber bg-amber/10 px-1.5 py-0.5 rounded-full normal-case">⚡ Ekspress</span>}</p>
      <div className="flex items-start">
        {steps.map((s,i)=>{
          const done=i<=curIdx, active=i===curIdx;
          return (
            <React.Fragment key={s.k}>
              <div className="flex flex-col items-center text-center" style={{minWidth:64}}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 transition-colors" style={{backgroundColor:done?'#69EA9B':'#EFEFEF',color:done?'#0A4020':'#9E9E9E'}}>{s.icon}</div>
                <span className={`text-[11px] mt-1 font-medium ${done?'text-brand':'text-t3'} ${active?'font-bold':''}`}>{s.label}</span>
                {s.at && done && <span className="text-[10px] text-t3">{tfmt(s.at)}</span>}
              </div>
              {i<3 && <div className="flex-1 h-0.5 mt-4 rounded" style={{backgroundColor:i<curIdx?'#69EA9B':'#E0E0E0'}}/>}
            </React.Fragment>
          );
        })}
      </div>
      {order.status!=='Çatdırıldı' && <p className="text-[11px] text-t3 mt-3 text-center">Təxmini çatdırılma: {isExpress?'bu gün (gün içində)':'2–5 iş günü ərzində'}</p>}
    </div>
  );
};

/* ══════════════════════════════════════ BODY SILHOUETTE ══════════════════════════════════════ */
const BodySilhouette = ({ gender='Kişi', height, weight, build='orta' }: { gender?: string; height?: string | number; weight?: string | number; build?: string }) => {
  const isF = gender==='Qadın';
  const h = Number(height)||0;
  const w = Number(weight)||0;
  const clamp=(v: number,a: number,b: number)=>Math.max(a,Math.min(b,v));
  const vs = h>0 ? clamp(0.84+(h-150)/210, 0.84, 1.16) : 1;
  const wIdx=(kg: number)=>{
    const tb = isF ? [50,58,66,75,85] : [58,68,78,90,102];
    return kg<tb[0]?0:kg<tb[1]?1:kg<tb[2]?2:kg<tb[3]?3:kg<tb[4]?4:5;
  };
  const hsArr=[0.82,0.9,1.0,1.1,1.2,1.3];
  const hs = w>0 ? hsArr[wIdx(w)] : (build==='dar'?0.85:build==='geniş'?1.18:1);
  const buildLabel = w>0 ? ['arıq','incə','normal','dolğun','iri','çox iri'][wIdx(w)] : (build==='dar'?'dar':build==='geniş'?'geniş':'orta');
  const top = 208 - 190*vs;
  const mid = (top+208)/2;
  return (
    <div className="bg-bg2 rounded-sheet border border-bdr p-4 flex flex-col items-center">
      <svg viewBox="0 0 160 230" className="w-full max-w-[200px] h-auto">
        <line x1="20" y1={top} x2="20" y2="208" stroke="#C2C2C2" strokeWidth="1.5" strokeDasharray="3 3"/>
        <line x1="15" y1={top} x2="25" y2={top} stroke="#C2C2C2" strokeWidth="1.5"/>
        <line x1="15" y1="208" x2="25" y2="208" stroke="#C2C2C2" strokeWidth="1.5"/>
        {h>0 ? <text x="36" y={mid} fontSize="13" fontWeight="700" fill="#0A0A0A" transform={`rotate(-90 36 ${mid})`} textAnchor="middle">{h} sm</text> : null}
        <g transform={`translate(80 208) scale(${hs} ${vs}) translate(-80 -208)`} fill="#0A0A0A">
          {isF ? (
            <React.Fragment>
              <ellipse cx="80" cy="30" rx="12" ry="14.5"/>
              <path d="M75,43 Q80,48 85,43 L85,52 Q80,55 75,52 Z"/>
              <path d="M64,68 C68,60 74,57 80,57 C86,57 92,60 96,68 C97,82 91,92 90,104 C94,116 98,128 98,148 Q98,152 95,150 L65,150 Q62,152 62,148 C62,128 66,116 70,104 C69,92 63,82 64,68 Z"/>
              <path d="M65,69 C56,85 53,104 55,122 C55,128 61,128 62,122 C64,104 68,87 73,72 C70,69 67,69 65,69 Z"/>
              <path d="M95,69 C104,85 107,104 105,122 C105,128 99,128 98,122 C96,104 92,87 87,72 C90,69 93,69 95,69 Z"/>
              <path d="M66,150 C64,168 64,188 67,205 Q67,209 72,209 Q78,209 79,204 C80,188 80,168 79,151 Z"/>
              <path d="M94,150 C96,168 96,188 93,205 Q93,209 88,209 Q82,209 81,204 C80,188 80,168 81,151 Z"/>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <ellipse cx="80" cy="29" rx="13.5" ry="15.5"/>
              <path d="M73,41 Q80,47 87,41 L87,52 Q80,56 73,52 Z"/>
              <path d="M56,71 C62,60 72,56 80,56 C88,56 98,60 104,71 C103,90 97,102 96,120 C96,134 96,142 95,150 L65,150 C64,142 64,134 64,120 C63,102 57,90 56,71 Z"/>
              <path d="M58,71 C49,89 46,108 48,126 C48,132 55,132 56,126 C58,108 62,89 68,73 C64,70 61,70 58,71 Z"/>
              <path d="M102,71 C111,89 114,108 112,126 C112,132 105,132 104,126 C102,108 98,89 92,73 C96,70 99,70 102,71 Z"/>
              <path d="M65,150 C62,170 63,190 66,205 Q66,209 72,209 Q78,209 78,204 C79,188 80,168 79,151 Z"/>
              <path d="M95,150 C98,170 97,190 94,205 Q94,209 88,209 Q82,209 82,204 C81,188 80,168 81,151 Z"/>
            </React.Fragment>
          )}
        </g>
      </svg>
      <div className="flex items-center gap-2 mt-2 text-xs flex-wrap justify-center">
        <span className="font-semibold text-brand">{isF?'Qadın':'Kişi'}</span>
        <span className="text-t3">·</span>
        <span className="text-t2">{h>0?`${h} sm`:'boy —'}</span>
        <span className="text-t3">·</span>
        <span className="text-t2">{w>0?`${w} kg`:'çəki —'}</span>
        <span className="text-t3">·</span>
        <span className="text-t2">{buildLabel}</span>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════ FIT WIZARD SİLUETLƏRİ ══════════════════════════════════════ */
const FIG = { body:'#E9E9E9', arm:'#DCDCDC', acc:'#E53E3E' };

const FigShoulder = ({ opt }: { opt?: string }) => {
  const sw = ({dar:24, orta:31, 'geniş':40} as Record<string,number>)[opt||'orta'], L = 100-sw, R = 100+sw;
  return (
    <svg viewBox="0 0 200 215" className="w-40 h-44 mx-auto block">
      <ellipse cx="100" cy="24" rx="14" ry="16" fill={FIG.body}/>
      <path d="M93,37 Q100,43 107,37 L107,49 Q100,53 93,49 Z" fill={FIG.body}/>
      <path d={`M${L},58 C${L+5},50 ${R-5},50 ${R},58 C${R-3},92 121,120 122,150 C122,176 124,190 126,206 L74,206 C76,190 78,176 78,150 C79,120 ${L+3},92 ${L},58 Z`} fill={FIG.body}/>
      <path d={`M${L+3},60 C${L-15},86 ${L-17},132 ${L-11},158 C${L-11},164 ${L-3},164 ${L-2},158 C${L-5},130 ${L+7},92 ${L+15},64 Z`} fill={FIG.arm}/>
      <path d={`M${R-3},60 C${R+15},86 ${R+17},132 ${R+11},158 C${R+11},164 ${R+3},164 ${R+2},158 C${R+5},130 ${R-7},92 ${R-15},64 Z`} fill={FIG.arm}/>
      <path d={`M${L},56 Q100,43 ${R},56`} stroke={FIG.acc} strokeWidth="2.5" strokeDasharray="6 5" fill="none" strokeLinecap="round"/>
    </svg>
  );
};

const FigTummy = ({ opt }: { opt?: string }) => {
  const bb = ({dar:0, orta:11, 'geniş':24} as Record<string,number>)[opt||'orta'];
  return (
    <svg viewBox="0 0 200 215" className="w-40 h-44 mx-auto block">
      <ellipse cx="96" cy="26" rx="14" ry="16" fill={FIG.body}/>
      <path d="M89,39 Q96,45 103,39 L103,51 Q96,55 89,51 Z" fill={FIG.body}/>
      <path d={`M88,52 C80,78 80,110 84,150 Q86,180 92,206 L120,206 Q116,176 114,150 C${128+bb},126 ${130+bb},96 120,68 Q114,54 104,52 Z`} fill={FIG.body}/>
      <path d="M94,64 C88,96 88,124 94,152 C95,158 102,158 103,152 C97,124 97,96 102,66 Z" fill={FIG.arm}/>
      <path d={`M${130+bb},98 Q${137+bb},124 ${126+bb},150`} stroke={FIG.acc} strokeWidth="2.5" strokeDasharray="6 5" fill="none" strokeLinecap="round"/>
    </svg>
  );
};

const FigWaist = ({ opt }: { opt?: string }) => {
  const ww = ({dar:16, orta:23, 'geniş':32} as Record<string,number>)[opt||'orta'], WL = 100-ww, WR = 100+ww;
  return (
    <svg viewBox="0 0 200 215" className="w-40 h-44 mx-auto block">
      <ellipse cx="100" cy="24" rx="14" ry="16" fill={FIG.body}/>
      <path d="M93,37 Q100,43 107,37 L107,49 Q100,53 93,49 Z" fill={FIG.body}/>
      <path d={`M70,58 C76,50 124,50 130,58 C132,88 ${WR},108 ${WR},130 C${WR},152 126,180 126,206 L74,206 C74,180 ${WL},152 ${WL},130 C${WL},108 68,88 70,58 Z`} fill={FIG.body}/>
      <path d={`M${WR+5},110 Q${WR+9},130 ${WR+3},150`} stroke={FIG.acc} strokeWidth="2.5" strokeDasharray="6 5" fill="none" strokeLinecap="round"/>
      <path d={`M${WL-5},110 Q${WL-9},130 ${WL-3},150`} stroke={FIG.acc} strokeWidth="2.5" strokeDasharray="6 5" fill="none" strokeLinecap="round"/>
    </svg>
  );
};

const FigLegs = ({ opt }: { opt?: string }) => {
  const len = ({'qısa':104, orta:132, 'uzun':158} as Record<string,number>)[opt||'orta'], y0 = 58, yb = y0+len;
  return (
    <svg viewBox="0 0 200 215" className="w-40 h-44 mx-auto block">
      <path d="M70,26 Q100,18 130,26 C133,44 131,54 128,64 Q100,72 72,64 C69,54 67,44 70,26 Z" fill={FIG.body}/>
      <path d={`M74,62 C70,${y0+len*0.45} 72,${yb-8} 76,${yb} L90,${yb} C92,${yb-8} 91,${y0+len*0.45} 96,64 Z`} fill={FIG.body}/>
      <path d={`M126,62 C130,${y0+len*0.45} 128,${yb-8} 124,${yb} L110,${yb} C108,${yb-8} 109,${y0+len*0.45} 104,64 Z`} fill={FIG.body}/>
      <line x1="50" y1={y0} x2="50" y2={yb} stroke="#C2C2C2" strokeWidth="2" strokeDasharray="4 4"/>
      <line x1="44" y1={y0} x2="56" y2={y0} stroke="#C2C2C2" strokeWidth="2"/>
      <line x1="44" y1={yb} x2="56" y2={yb} stroke="#C2C2C2" strokeWidth="2"/>
      <line x1="66" y1={yb+5} x2="134" y2={yb+5} stroke={FIG.acc} strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round"/>
    </svg>
  );
};

const optAscii = (o?: string) => ({'geniş':'genis','qısa':'qisa'} as Record<string,string>)[o||''] || o || 'orta';

const FitImg = ({ src, children }: { src: string; children: React.ReactNode }) => {
  const [err,setErr] = useState(false);
  if (err) return <>{children}</>;
  return <img src={src} alt="" className="w-40 h-44 mx-auto block object-contain anim-fade" onError={()=>setErr(true)}/>;
};

const FitFigure = ({ kind, opt, gender }: { kind: string; opt?: string; gender?: string }) => {
  const g = gender==='Qadın' ? 'qadin' : 'kisi';
  const src = `/fit/${kind}-${g}-${optAscii(opt)}.png`;
  const svg = kind==='shoulder' ? <FigShoulder opt={opt}/>
    : kind==='tummy' ? <FigTummy opt={opt}/>
    : kind==='waist' ? <FigWaist opt={opt}/>
    : <FigLegs opt={opt}/>;
  return (
    <div key={`${kind}-${opt}-${g}`} className="anim-fade">
      <FitImg key={src} src={src}>{svg}</FitImg>
    </div>
  );
};

const FIT_OPTS_DOG: string[][] = [['dar','Dar'],['orta','Orta'],['geniş','Geniş']];
const FIT_OPTS_LEG: string[][] = [['qısa','Qısa'],['orta','Orta'],['uzun','Uzun']];

const FitRadios = ({ value, onPick, opts=FIT_OPTS_DOG, hint }: { value?: string; onPick: (v: string) => void; opts?: string[][]; hint?: string }) => (
  <div>
    <div className="flex items-start justify-center gap-10 mt-2">
      {opts.map(([v,l])=>(
        <button key={v} type="button" className="flex flex-col items-center gap-2 group" onClick={()=>onPick(v)}>
          <span className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${value===v?'bg-brand border-brand text-white scale-105':'border-bdr-s text-transparent group-hover:border-brand'}`}>✓</span>
          <span className={`text-sm font-medium transition-colors ${value===v?'text-brand':'text-t2'}`}>{l}</span>
        </button>
      ))}
    </div>
    {hint && <p className="text-xs text-t3 text-center mt-3">{hint}</p>}
  </div>
);

const FitBigNum = ({ label, unit, value, onChange, placeholder, min=0, max=999, onEnter }: { label: string; unit: string; value: string; onChange: (v: string) => void; placeholder?: string; min?: number; max?: number; onEnter?: () => void }) => (
  <div>
    <label className="block text-xs font-bold text-brand uppercase tracking-widest mb-2">{label}</label>
    <div className="flex items-center gap-3">
      <input type="number" inputMode="numeric" min={min} max={max} value={value} placeholder={placeholder}
        onChange={e=>{ let v=e.target.value; if(v!==''){ let n=Math.floor(Math.abs(Number(v)||0)); if(n>max)n=max; v=String(n); } onChange(v); }}
        onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); onEnter&&onEnter(); } }}
        className="w-36 bg-white border-2 border-bdr rounded-card px-4 py-3.5 text-3xl font-black text-center text-brand outline-none focus:border-brand transition-colors placeholder-td"/>
      <span className="text-sm font-bold text-t3">{unit}</span>
    </div>
  </div>
);

const FitAssistant = ({ user, token, refreshUser }: { user: User | null; token: string | null; refreshUser: () => void | Promise<unknown> }) => {
  const me = user?.measurements || {};
  const hasData = !!(me.boy||me.ceki||me.yas||me.dosFit||me.belFit||me.qarinFit||me.ayaqFit||me.ayaqqabi||me.fitPreference);
  const SUMMARY = 10, TOTAL = 9;
  const [step,setStep] = useState(hasData ? SUMMARY : 1);
  const [cins,setCins] = useState(user?.cins||'');
  const str = (v: unknown) => v==null ? '' : String(v);
  const [m,setM] = useState({boy:str(me.boy),ceki:str(me.ceki),yas:str(me.yas),dosFit:me.dosFit||'',belFit:me.belFit||'',qarinFit:me.qarinFit||'',ombaFit:me.ombaFit||'',ayaqFit:me.ayaqFit||'',ayaqqabi:str(me.ayaqqabi),fitPreference:me.fitPreference||''});
  const [busy,setBusy] = useState(false);
  const [saved,setSaved] = useState(false);
  const [err,setErr] = useState('');

  const inRange=(v: string,lo: number,hi: number)=> v!==''&&v!=null && Number(v)>=lo && Number(v)<=hi;
  const boyOk=inRange(m.boy,50,250), cekiOk=inRange(m.ceki,10,150), yasOk=inRange(m.yas,1,100);

  const save = async () => {
    setBusy(true); setErr('');
    try{
      const body = {boy:str(m.boy),ceki:str(m.ceki),yas:str(m.yas),dos:'',bel:'',
        dosFit:m.dosFit||'',belFit:m.belFit||'',qarinFit:m.qarinFit||'',ombaFit:m.ombaFit||'',ayaqFit:m.ayaqFit||'',
        ayaqqabi:str(m.ayaqqabi),fitPreference:m.fitPreference||''};
      const r = await fetch(`${API}/api/profile/measurements`,{method:'PUT',headers:bearer(token),body:JSON.stringify(body)});
      if(!r.ok){ const d=await r.json().catch(()=>({})); throw new Error(d.error||`Yadda saxlanmadı (${r.status})`); }
      if(cins && cins!==user?.cins) await fetch(`${API}/api/profile`,{method:'PUT',headers:bearer(token),body:JSON.stringify({cins})});
      if(refreshUser) await refreshUser();
      setSaved(true); setTimeout(()=>setSaved(false),2500);
    }catch(e){ setErr((e as Error)?.message||'Yadda saxlanmadı'); }
    setBusy(false);
  };
  const finish = async () => { await save(); setStep(SUMMARY); };

  const est = recommendSize({cins, measurements:m}, {category:cins||'Kişi', subcategory:'T-shirt', size:'M', sizes:['XS','S','M','L','XL','XXL']});

  const NextBtn = ({ onClick, disabled, children='Davam et' }: { onClick: () => void; disabled?: boolean; children?: React.ReactNode }) => (
    <button type="button" disabled={disabled} onClick={onClick}
      className="w-full bg-brand text-white py-3 rounded-btn font-semibold mt-7 hover:bg-brand-h transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-[15px]">{children}</button>
  );
  const BackBtn = () => (
    <button type="button" className="w-full text-sm text-t2 hover:text-brand py-2.5 mt-1 transition-colors" onClick={()=>setStep(s=>Math.max(1,s-1))}>‹ Geri</button>
  );

  return (
    <div className="bg-white rounded-sheet border border-bdr shadow-xs p-6 max-w-md mx-auto">
      {err && <div className="bg-sale/10 text-sale text-sm px-3 py-2 rounded-btn mb-4">{err}</div>}
      {step<=TOTAL && (
        <React.Fragment>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand">Ölçü bələdçisi</p>
            <span className="text-xs text-t3">Addım {step} / {TOTAL}</span>
          </div>
          <p className="text-xs text-t2 mb-4">Ölçü lenti lazım deyil — bir neçə seçimlə fərdi ölçünü dəqiqləşdir.</p>
          <div className="h-1 bg-bg3 rounded-full mb-7 overflow-hidden">
            <div className="h-full bg-brand rounded-full transition-all duration-500" style={{width:`${(step/TOTAL)*100}%`}}/>
          </div>
        </React.Fragment>
      )}

      {step===1 && (
        <div className="anim-tab">
          <h3 className="font-bold text-brand text-lg mb-1">Cinsiyyətin</h3>
          <p className="text-sm text-t2 mb-5">Ölçü cədvəlləri qadın və kişi üçün fərqlidir — tövsiyələr buna əsaslanır.</p>
          <div className="grid grid-cols-2 gap-3">
            {['Kişi','Qadın'].map(g=>(
              <button key={g} type="button" onClick={()=>setCins(g)}
                className={`py-6 rounded-card border-2 flex flex-col items-center gap-2 transition-all ${cins===g?'border-brand bg-bg2':'border-bdr hover:border-bdr-s'}`}>
                <span className="text-3xl">{g==='Kişi'?'♂':'♀'}</span>
                <span className={`text-sm font-semibold ${cins===g?'text-brand':'text-t2'}`}>{g}</span>
              </button>
            ))}
          </div>
          <NextBtn disabled={!cins} onClick={()=>setStep(2)}/>
        </div>
      )}

      {step===2 && (
        <div className="anim-tab">
          <h3 className="font-bold text-brand text-lg mb-1">Boy və çəki</h3>
          <p className="text-sm text-t2 mb-6">Bədən siluetini və başlanğıc ölçünü bunlardan hesablayırıq.</p>
          <div className="space-y-5">
            <FitBigNum label="Boy" unit="SM" placeholder="178" min={50} max={250} value={m.boy} onChange={v=>setM(s=>({...s,boy:v}))} onEnter={()=>boyOk&&cekiOk&&setStep(3)}/>
            <FitBigNum label="Çəki" unit="KG" placeholder="72" min={10} max={150} value={m.ceki} onChange={v=>setM(s=>({...s,ceki:v}))} onEnter={()=>boyOk&&cekiOk&&setStep(3)}/>
          </div>
          <NextBtn disabled={!(boyOk&&cekiOk)} onClick={()=>setStep(3)}/>
          <BackBtn/>
        </div>
      )}

      {step===3 && (
        <div className="anim-tab">
          <h3 className="font-bold text-brand text-lg mb-1">Yaşın</h3>
          <p className="text-sm text-t2 mb-6">Yaş çəkinin bədəndə necə paylandığına təsir edir — bu, düzgün ölçü tövsiyəsinə kömək edir.</p>
          <FitBigNum label="Yaş" unit="" placeholder="25" min={1} max={100} value={m.yas} onChange={v=>setM(s=>({...s,yas:v}))} onEnter={()=>yasOk&&setStep(4)}/>
          <NextBtn disabled={!yasOk} onClick={()=>setStep(4)}/>
          <BackBtn/>
        </div>
      )}

      {step===4 && (
        <div className="anim-tab">
          <h3 className="font-bold text-brand text-lg mb-1">Çiyin genişliyin</h3>
          <p className="text-sm text-t2 mb-4">Çiyinlərin digərləri ilə müqayisədə necədir?</p>
          <FitFigure kind="shoulder" opt={m.dosFit||'orta'} gender={cins}/>
          <FitRadios value={m.dosFit} onPick={v=>setM(s=>({...s,dosFit:s.dosFit===v?'':v}))} hint="Üst geyimlərin (köynək, t-shirt) ölçüsünə təsir edir"/>
          <NextBtn disabled={!m.dosFit} onClick={()=>setStep(5)}/>
          <BackBtn/>
        </div>
      )}

      {step===5 && (
        <div className="anim-tab">
          <h3 className="font-bold text-brand text-lg mb-1">Qarın genişliyin <span className="text-t3 text-sm font-normal">(yandan)</span></h3>
          <p className="text-sm text-t2 mb-4">Yandan baxanda qarın nahiyən necədir?</p>
          <FitFigure kind="tummy" opt={m.qarinFit||'orta'} gender={cins}/>
          <FitRadios value={m.qarinFit} onPick={v=>setM(s=>({...s,qarinFit:s.qarinFit===v?'':v}))} hint="Çəkinin paylanmasını dəqiqləşdirir"/>
          <NextBtn disabled={!m.qarinFit} onClick={()=>setStep(6)}/>
          <BackBtn/>
        </div>
      )}

      {step===6 && (
        <div className="anim-tab">
          <h3 className="font-bold text-brand text-lg mb-1">Bel genişliyin</h3>
          <p className="text-sm text-t2 mb-4">Bel nahiyən necədir?</p>
          <FitFigure kind="waist" opt={m.belFit||'orta'} gender={cins}/>
          <FitRadios value={m.belFit} onPick={v=>setM(s=>({...s,belFit:s.belFit===v?'':v}))} hint="Şalvar və alt geyimlərin ölçüsünə təsir edir"/>
          <div className="mt-5 pt-4 border-t border-bdr">
            <h4 className="font-bold text-brand text-base mb-1">Omba (hip) genişliyin</h4>
            <p className="text-sm text-t2 mb-3">Xüsusən qadın alt geyimlərində (şalvar, cins, ətək) ölçünü dəqiqləşdirir.</p>
            <FitRadios value={m.ombaFit} onPick={v=>setM(s=>({...s,ombaFit:s.ombaFit===v?'':v}))}/>
          </div>
          <NextBtn disabled={!m.belFit} onClick={()=>setStep(7)}/>
          <BackBtn/>
        </div>
      )}

      {step===7 && (
        <div className="anim-tab">
          <h3 className="font-bold text-brand text-lg mb-1">Ayaq uzunluğun</h3>
          <p className="text-sm text-t2 mb-4">Boyuna nisbətən ayaqların necədir?</p>
          <FitFigure kind="legs" opt={m.ayaqFit||'orta'} gender={cins}/>
          <FitRadios opts={FIT_OPTS_LEG} value={m.ayaqFit} onPick={v=>setM(s=>({...s,ayaqFit:s.ayaqFit===v?'':v}))} hint="Şalvar modeli seçimində (qısa/uzun) kömək edir"/>
          <NextBtn disabled={!m.ayaqFit} onClick={()=>setStep(8)}/>
          <BackBtn/>
        </div>
      )}

      {step===8 && (
        <div className="anim-tab">
          <h3 className="font-bold text-brand text-lg mb-1">Ayaqqabı ölçün</h3>
          <p className="text-sm text-t2 mb-5">EU standartı, 36–46 (etiketdəki rəqəm).</p>
          <select value={m.ayaqqabi} onChange={e=>setM(s=>({...s,ayaqqabi:e.target.value}))}
            className="w-full bg-white border-2 border-bdr rounded-card px-4 py-3 text-lg font-bold text-brand outline-none focus:border-brand">
            <option value="" disabled hidden>Ölçünü seç</option>
            {Array.from({length:11},(_,i)=>36+i).map(n=><option key={n} value={n}>{n}</option>)}
          </select>
          <NextBtn disabled={!m.ayaqqabi} onClick={()=>setStep(9)}/>
          <BackBtn/>
        </div>
      )}

      {step===9 && (
        <div className="anim-tab">
          <h3 className="font-bold text-brand text-lg mb-1">Necə geyinməyi sevirsən?</h3>
          <p className="text-sm text-t2 mb-4">Sevdiyin oturuş tövsiyə olunan ölçünü tənzimləyir — eyni bədən üçün dar oturuş daha sıx, çox bol daha geniş seçilir.</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Slim','Dar','Geyimin əynimə dar (slim) oturmasını sevirəm'],
              ['Regular','Normal','Nə dar, nə bol — standart, normal oturuş'],
              ['Relaxed','Rahat','Bir az boş, sərbəst və rahat oturuş sevirəm'],
              ['Oversize','Çox bol','Geyimin əynimə çox bol oturmasını sevirəm'],
            ].map(([v,title,desc])=>(
              <button key={v} type="button" onClick={()=>setM(s=>({...s,fitPreference:s.fitPreference===v?'':v}))}
                className={`py-4 px-3 rounded-card border-2 text-left transition-all ${m.fitPreference===v?'border-brand bg-bg2':'border-bdr hover:border-bdr-s'}`}>
                <span className={`block text-sm font-bold ${m.fitPreference===v?'text-brand':'text-t2'}`}>{title}</span>
                <span className="block text-xs text-t3 mt-0.5 leading-snug">{desc}</span>
              </button>
            ))}
          </div>
          <NextBtn disabled={!m.fitPreference||busy} onClick={finish}>{busy?'Yadda saxlanılır…':'Tamamla və yadda saxla'}</NextBtn>
          <BackBtn/>
        </div>
      )}

      {step===SUMMARY && (
        <div className="anim-tab">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-brand text-lg">Ölçü profilin</h3>
              <p className="text-xs text-t2 mt-0.5">{saved?'✓ Yadda saxlanıldı':'AI tövsiyələri bu məlumatlara əsaslanır'}</p>
            </div>
            {est.hasMeasurements && (
              <div className="text-center shrink-0 rounded-card px-4 py-2" style={{backgroundColor:'#69EA9B'}}>
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{color:'#0A4020'}}>Təxmini ölçün</p>
                <p className="text-2xl font-black" style={{color:'#0A3020'}}>{est.size}</p>
              </div>
            )}
          </div>
          <BodySilhouette gender={cins||'Kişi'} height={m.boy} weight={m.ceki} build={m.dosFit||m.belFit||'orta'}/>
          <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
            {[['Cinsiyyət',cins||'—'],['Yaş',m.yas||'—'],['Boy',m.boy?`${m.boy} sm`:'—'],['Çəki',m.ceki?`${m.ceki} kg`:'—'],['Çiyin',m.dosFit||'—'],['Qarın',m.qarinFit||'—'],['Bel',m.belFit||'—'],['Ayaq',m.ayaqFit||'—'],['Ayaqqabı',m.ayaqqabi?`EU ${m.ayaqqabi}`:'—'],['Oturuş',({Slim:'Dar',Regular:'Normal',Relaxed:'Rahat',Oversize:'Çox bol'} as Record<string,string>)[m.fitPreference]||'—']].map(([k,v])=>(
              <div key={k} className="bg-bg2 rounded-card px-3 py-2 flex items-center justify-between"><span className="text-t2 text-xs">{k}</span><span className="font-semibold text-brand capitalize">{v}</span></div>
            ))}
          </div>
          <button type="button" className="w-full border-2 border-bdr text-brand py-3 rounded-btn font-semibold mt-5 hover:border-bdr-s transition-colors text-[15px]" onClick={()=>setStep(1)}>🔄 Yenilə</button>
        </div>
      )}
    </div>
  );
};

/* Qonaq (qeydiyyatsız) üçün hesab səhifəsi */
export const GuestAccount = ({ nav, lang, setLang }: { nav: NavFn; lang: string; setLang: (l: string) => void }) => (
  <div className="pb-24 md:pb-0 min-h-screen bg-bg2">
    <div className="bg-bg2 border-b border-bdr hidden md:block">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-t2">
        <button className="hover:text-brand transition-colors" onClick={()=>nav('home')}>Ana səhifə</button>
        <Ic.ChevR className="w-3 h-3"/><span className="text-brand font-medium">Hesabım</span>
      </div>
    </div>
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-sheet2 border border-bdr shadow-card p-8 text-center anim-pop">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{backgroundColor:'#69EA9B'}}>
          <Ic.User className="w-8 h-8" style={{color:'#0A4020'}}/>
        </div>
        <h1 className="text-xl font-bold text-brand mb-2">Hesabınıza daxil olun</h1>
        <p className="text-t2 text-sm mb-6 leading-relaxed">Sifarişlərinizi izləmək, seçilmişlər və AI ölçü məsləhəti üçün daxil olun və ya qeydiyyatdan keçin.</p>
        <div className="space-y-3">
          <button className="w-full bg-brand text-white py-[11px] rounded-btn font-semibold hover:bg-brand-h transition-all active:scale-[0.98] text-[15px]" onClick={()=>nav('login')}>Daxil ol</button>
          <button className="w-full border border-bdr text-brand py-[11px] rounded-btn font-semibold hover:bg-bg2 transition-all active:scale-[0.98] text-[15px]" onClick={()=>nav('register')}>Qeydiyyatdan keç</button>
        </div>
        <div className="mt-7 pt-5 border-t border-bdr">
          <p className="text-xs font-semibold text-t3 uppercase tracking-wide mb-2">🌐 {t('Dil')}</p>
          <div className="flex gap-2">
            {LANGS.map(l=>(
              <button key={l.code} onClick={()=>setLang&&setLang(l.code)} className={`flex-1 py-2 rounded-btn text-sm font-semibold transition-colors ${lang===l.code?'bg-brand text-white':'bg-bg2 text-t2 hover:text-brand border border-bdr'}`}>{l.name}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ProfilePage = ({ nav, user, token, doLogout, refreshUser, initialTab, reorder, prefs, updatePref, lang, setLang }: { nav: NavFn; user: User; token: string | null; doLogout: () => void; refreshUser: () => void | Promise<unknown>; initialTab?: string; reorder: (o: Order) => void; prefs: Prefs; updatePref: (k: string, v: boolean) => void; lang: string; setLang: (l: string) => void }) => {
  const [tab,setTab]=useState(initialTab||'sifarisler');
  const selectTab=(k: string)=>{ setTab(k); try{ window.history.replaceState(window.history.state,'',k==='sifarisler'?'/profile':`/profile/${k}`); }catch{} };
  const [orders,setOrders]=useState<Order[]>([]); const [loadingOrders,setLoadingOrders]=useState(false);
  const [expanded,setExpanded]=useState<number | null>(null);
  const [addresses,setAddresses]=useState<Address[]>(user?.addresses||[]);
  const [newAddr,setNewAddr]=useState<{ unvan: string; lat: number | null; lng: number | null }>({unvan:'',lat:null,lng:null}); const [addrOpen,setAddrOpen]=useState(false); const [mapOpen,setMapOpen]=useState(false);
  const [prof,setProf]=useState({ad:user?.ad||'',soyad:user?.soyad||'',telefon:user?.telefon||''});
  const [profBusy,setProfBusy]=useState(false); const [profSaved,setProfSaved]=useState(false);
  const [cancelId,setCancelId]=useState<number | null>(null); const [cancelMsg,setCancelMsg]=useState(''); const [cancelReason,setCancelReason]=useState('');
  const [disputeId,setDisputeId]=useState<number | null>(null); const [disputeMsg,setDisputeMsg]=useState(''); const [disputeReason,setDisputeReason]=useState(''); const [disputed,setDisputed]=useState<Set<number>>(new Set());

  const sc: Record<string,string>={'Çatdırıldı':'text-accent-t','Hazırlanır':'text-yellow-600','Hazırlandı':'text-teal-700','Yolda':'text-blue-600','İptal':'text-sale'};
  const scBg: Record<string,string>={'Çatdırıldı':'#69EA9B','Hazırlanır':'#FEF3C7','Hazırlandı':'#CCFBF1','Yolda':'#DBEAFE','İptal':'#FEE2E2'};
  const statusLabel=(s: string)=>s==='İptal'?'Ləğv edildi':s;

  useEffect(()=>{
    if(tab!=='sifarisler'||!token) return;
    let stop=false;
    const load=(initial: boolean)=>{
      if(initial) setLoadingOrders(true);
      fetch(`${API}/api/orders`,{headers:bearer(token)}).then(r=>r.json()).then(d=>{ if(!stop&&Array.isArray(d)) setOrders(d); }).catch(()=>{}).finally(()=>{ if(initial) setLoadingOrders(false); });
    };
    load(true);
    const iv=setInterval(()=>{ if(!document.hidden) load(false); },15000);
    return ()=>{ stop=true; clearInterval(iv); };
  },[tab,token]);

  const fmt=(iso: string)=>{const d=new Date(iso);return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;};

  const addAddress = async () => {
    if(!newAddr.unvan.trim()) return;
    try{ const r=await fetch(`${API}/api/addresses`,{method:'POST',headers:bearer(token),body:JSON.stringify(newAddr)}); const d=await r.json(); setAddresses(d); refreshUser&&refreshUser(); setNewAddr({unvan:'',lat:null,lng:null}); setAddrOpen(false);}catch{}
  };
  const delAddress = async (id: number) => {
    try{ const r=await fetch(`${API}/api/addresses/${id}`,{method:'DELETE',headers:bearer(token)}); setAddresses(await r.json()); refreshUser&&refreshUser();}catch{}
  };
  const saveProfile = async () => {
    if(!prof.ad.trim()||!prof.soyad.trim()) return;
    setProfBusy(true);
    try{ await fetch(`${API}/api/profile`,{method:'PUT',headers:bearer(token),body:JSON.stringify(prof)}); refreshUser&&refreshUser(); setProfSaved(true); setTimeout(()=>setProfSaved(false),2000);}catch{}
    setProfBusy(false);
  };
  const cancelOrder = async (id: number) => {
    setCancelMsg('');
    if(cancelReason.trim().length<3){ setCancelMsg('Ləğv səbəbini qeyd edin (ən az 3 simvol)'); return; }
    try{
      const r=await fetch(`${API}/api/orders/${id}/cancel`,{method:'POST',headers:bearer(token),body:JSON.stringify({reason:cancelReason.trim()})});
      const d=await r.json();
      if(d.status){ setOrders(os=>os.map(o=>o.id===id?{...o,status:d.status,cancelReason:d.cancelReason,cancelledBy:d.cancelledBy,cancelledAt:d.cancelledAt}:o)); setCancelId(null); setCancelReason(''); }
      else { setCancelMsg(d.error||'Xəta baş verdi'); }
    }catch{ setCancelMsg('Serverlə əlaqə yoxdur'); }
  };

  const openDispute = async (id: number) => {
    setDisputeMsg('');
    if(disputeReason.trim().length<5){ setDisputeMsg('Problemi ətraflı yazın (ən az 5 simvol)'); return; }
    try{
      const r=await fetch(`${API}/api/orders/${id}/dispute`,{method:'POST',headers:bearer(token),body:JSON.stringify({reason:disputeReason.trim()})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok){ setDisputeMsg(d.error||'Göndərilmədi'); return; }
      setDisputed(s=>new Set(s).add(id)); setDisputeId(null); setDisputeReason('');
    }catch{ setDisputeMsg('Serverlə əlaqə yoxdur'); }
  };

  const tabs=[['sifarisler','📦','Sifarişlərim'],['olculer','📏','Ölçülərim'],['adresler','📍','Ünvanlar'],['ayarlar','⚙️','Tənzimləmələr']];

  return (
    <div className="pb-24 md:pb-0">
      <div className="bg-bg2 border-b border-bdr hidden md:block">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-t2">
          <button className="hover:text-brand transition-colors" onClick={()=>nav('home')}>Ana səhifə</button>
          <Ic.ChevR className="w-3 h-3"/><span className="text-brand font-medium">Hesabım</span>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="anim-rise bg-white rounded-sheet border border-bdr p-6 shadow-xs mb-6 flex items-center gap-5">
          <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center shrink-0"><span className="text-white text-xl font-bold">{user?.ad?.[0]}{user?.soyad?.[0]}</span></div>
          <div className="flex-1"><h2 className="text-xl font-bold text-brand">{user?.ad} {user?.soyad}</h2><p className="text-t2 text-sm">{user?.email}</p>{user?.telefon&&<p className="text-t3 text-xs mt-0.5">{user.telefon}</p>}</div>
          <button className="hidden sm:block border border-bdr text-brand px-4 py-2 rounded-btn text-sm font-medium hover:border-bdr-s transition-colors" onClick={()=>selectTab('ayarlar')}>Redaktə</button>
        </div>

        <div className="anim-rise flex gap-1 bg-bg2 p-1 rounded-card mb-6 border border-bdr overflow-x-auto scrollbar-hide" style={{animationDelay:'.08s'}}>
          {tabs.map(([k,emoji,word])=>(
            <button key={k} className={`flex-1 whitespace-nowrap py-2.5 px-3 rounded-[10px] text-xs sm:text-sm font-medium transition-all ${tab===k?'bg-white text-brand shadow-xs':'text-t2 hover:text-brand'}`} onClick={()=>selectTab(k)}>{emoji} {t(word)}</button>
          ))}
        </div>

        <div key={tab} className="anim-tab">
        {tab==='sifarisler' && (
          loadingOrders ? <div className="flex items-center justify-center py-16 text-t3"><Spinner className="w-6 h-6 mr-3"/> Yüklənir…</div>
          : orders.length===0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-bg2 rounded-full flex items-center justify-center mx-auto mb-4"><Ic.Bag className="w-8 h-8 text-td"/></div>
              <p className="font-semibold text-brand mb-1">Hələ sifariş yoxdur</p><p className="text-sm text-t2 mb-5">İlk sifarişinizi verin</p>
              <button className="bg-brand text-white px-6 py-2.5 rounded-btn text-sm font-semibold hover:bg-brand-h transition-all active:scale-[0.98]" onClick={()=>nav('catalog',{category:'Hamısı'})}>Kataloqa keç</button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(o=>(
                <div key={o.id} className="bg-white rounded-sheet border border-bdr p-5 shadow-xs">
                  <div className="flex items-start justify-between mb-3">
                    <div><span className="font-bold text-brand">{o.orderNo}</span><p className="text-xs text-t3 mt-0.5">{fmt(o.createdAt)}</p></div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-badge ${sc[o.status]||'text-t2'}`} style={{backgroundColor:scBg[o.status]||'#F7F7F7'}}>{t(statusLabel(o.status))}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-3"><span className="text-t2">{Array.isArray(o.items)?o.items.reduce((s,i)=>s+(i.qty||1),0):0} məhsul</span><span className="font-bold text-brand">{Number(o.total).toFixed(2)} ₼</span></div>
                  {expanded===o.id && (
                    <div className="border-t border-bdr pt-3 mb-3 anim-fade space-y-3">
                      <OrderTimeline order={o}/>
                      <div className="divide-y divide-bdr">
                        {(Array.isArray(o.items)?o.items:[]).map((it,idx)=>(
                          <div key={idx} className="flex items-center gap-3 py-2">
                            <Img className="w-11 h-11 rounded-[8px] shrink-0" src={it.imageUrls && it.imageUrls[0]} alt={it.name}/>
                            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-brand truncate">{it.name}</p><p className="text-xs text-t2">{it.store} · {it.selectedSize||it.size||'—'} · x{it.qty||1}</p></div>
                            <span className="text-sm font-bold text-brand shrink-0">{(Number(it.price||0)*(it.qty||1)).toFixed(2)} ₼</span>
                          </div>
                        ))}
                      </div>
                      {o.deliveryAddress?.unvan && (
                        <div className="bg-bg2 rounded-card p-3 text-xs"><p className="font-bold text-t2 uppercase tracking-wide mb-0.5">📍 Çatdırılma</p><p className="text-brand">{o.deliveryAddress.ad} {o.deliveryAddress.soyad}{o.deliveryAddress.telefon?` · ${o.deliveryAddress.telefon}`:''}</p><p className="text-t2">{o.deliveryAddress.sehir}, {o.deliveryAddress.unvan}</p></div>
                      )}
                      <div className="bg-bg2 rounded-card p-3 text-xs"><p className="font-bold text-t2 uppercase tracking-wide mb-0.5">💳 Ödəniş</p><p className="text-brand">{o.payment?.method||'Kart'}{o.payment?.last4?` •••• ${o.payment.last4}`:''}</p></div>
                      <div className="bg-bg2 rounded-card p-3 text-xs space-y-1">
                        <p className="font-bold text-t2 uppercase tracking-wide mb-1">🧾 Hesab</p>
                        {(()=>{ const sub=(Array.isArray(o.items)?o.items:[]).reduce((s,i)=>s+Number(i.price||0)*(i.qty||1),0); return (<>
                          <div className="flex justify-between text-t2"><span>Məbləğ</span><span>{sub.toFixed(2)} ₼</span></div>
                          {Number(o.discount)>0 && <div className="flex justify-between text-accent-t"><span>Endirim{o.couponCode?` (${o.couponCode})`:''}</span><span>−{Number(o.discount).toFixed(2)} ₼</span></div>}
                          <div className="flex justify-between text-t2"><span>Çatdırılma{o.deliveryType?` (${o.deliveryType})`:''}</span><span>{Number(o.deliveryFee||0)===0?'Pulsuz':`${Number(o.deliveryFee||0).toFixed(2)} ₼`}</span></div>
                          <div className="flex justify-between font-bold text-brand pt-1 border-t border-bdr"><span>Cəmi</span><span>{Number(o.total).toFixed(2)} ₼</span></div>
                        </>); })()}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button className="flex-1 border border-bdr text-brand py-2 rounded-btn text-xs font-medium hover:border-bdr-s transition-colors" onClick={()=>setExpanded(e=>e===o.id?null:o.id)}>{expanded===o.id?'Gizlət':'Detallar'}</button>
                      <button className="flex-1 bg-brand text-white py-2 rounded-btn text-xs font-medium hover:bg-brand-h transition-colors" onClick={()=>reorder&&reorder(o)}>Yenidən sifariş</button>
                    </div>
                    {(o.status==='Hazırlanır'||o.status==='Hazırlandı') && (cancelId===o.id ? (
                      <div className="bg-bg2 rounded-card p-3 space-y-2 anim-fade">
                        <p className="text-xs font-semibold text-brand">Sifarişi ləğv etmək istəyirsiniz? Səbəbi qeyd edin:</p>
                        <textarea value={cancelReason} onChange={e=>setCancelReason(e.target.value)} rows={2} placeholder="Məs: fikrimi dəyişdim, yanlış ölçü seçdim..." className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-xs resize-none focus:border-brand transition-colors"/>
                        <div className="flex items-center gap-2">
                          <button className="text-xs font-semibold text-t2 px-2.5 py-1.5 rounded-btn hover:text-brand transition-colors" onClick={()=>{setCancelId(null);setCancelMsg('');setCancelReason('');}}>Vaz keç</button>
                          <button className="flex-1 text-xs font-semibold text-white px-3 py-1.5 rounded-btn active:scale-95 transition-transform disabled:opacity-50" style={{backgroundColor:'#E53E3E'}} disabled={cancelReason.trim().length<3} onClick={()=>cancelOrder(o.id)}>Bəli, ləğv et</button>
                        </div>
                        {cancelMsg && <p className="text-xs" style={{color:'#E53E3E'}}>{cancelMsg}</p>}
                      </div>
                    ) : (
                      <button className="w-full text-xs font-medium py-2 rounded-btn border transition-colors hover:bg-[#FFF8F8]" style={{color:'#E53E3E',borderColor:'#FECACA'}} onClick={()=>{setCancelId(o.id);setCancelMsg('');setCancelReason('');}}>Sifarişi ləğv et</button>
                    ))}
                    {o.status==='Yolda' && <p className="text-xs text-t3 text-center pt-1">Ləğv etmək üçün dəstəklə əlaqə saxlayın</p>}
                    {o.status==='Çatdırıldı' && (disputed.has(o.id) ? (
                      <p className="text-xs text-t3 text-center pt-1">Şikayətiniz qeydə alındı — admin araşdırır.</p>
                    ) : disputeId===o.id ? (
                      <div className="bg-bg2 rounded-card p-3 space-y-2 anim-fade">
                        <p className="text-xs font-semibold text-brand">Problemi bildirin (defekt/yanlış məhsul):</p>
                        <textarea value={disputeReason} onChange={e=>setDisputeReason(e.target.value)} rows={2} placeholder="Məs: məhsul defektli gəldi, ölçü yanlışdır..." className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-xs resize-none focus:border-brand transition-colors"/>
                        <div className="flex items-center gap-2">
                          <button className="text-xs font-semibold text-t2 px-2.5 py-1.5 rounded-btn hover:text-brand transition-colors" onClick={()=>{setDisputeId(null);setDisputeMsg('');setDisputeReason('');}}>Vaz keç</button>
                          <button className="flex-1 text-xs font-semibold text-white px-3 py-1.5 rounded-btn active:scale-95 transition-transform disabled:opacity-50 bg-brand" disabled={disputeReason.trim().length<5} onClick={()=>openDispute(o.id)}>Şikayəti göndər</button>
                        </div>
                        {disputeMsg && <p className="text-xs" style={{color:'#E53E3E'}}>{disputeMsg}</p>}
                      </div>
                    ) : (
                      <button className="w-full text-xs font-medium py-2 rounded-btn border border-bdr text-t2 hover:border-bdr-s hover:text-brand transition-colors" onClick={()=>{setDisputeId(o.id);setDisputeMsg('');setDisputeReason('');}}>Problem bildir</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab==='olculer' && <FitAssistant user={user} token={token} refreshUser={refreshUser}/>}

        {tab==='adresler' && (
          <div className="space-y-4">
            {addresses.length===0 && !addrOpen && <p className="text-t2 text-sm text-center py-6">Hələ ünvan əlavə edilməyib</p>}
            {addresses.map(x=>(
              <div key={x.id} className="bg-white rounded-sheet border border-bdr p-5 shadow-xs flex items-start justify-between">
                <div className="flex gap-3">
                  <Ic.MapPin className="w-5 h-5 text-t3 shrink-0 mt-0.5"/>
                  <p className="text-sm text-brand">{x.unvan}</p>
                </div>
                <button className="text-sm text-t3 hover:text-sale ml-4 shrink-0 transition-colors" onClick={()=>delAddress(x.id)}><Ic.Trash className="w-4 h-4"/></button>
              </div>
            ))}
            {addrOpen ? (
              <div className="bg-white rounded-sheet border border-bdr p-5 shadow-xs space-y-3">
                <Field sm label="Ünvan (Bakı daxili)" placeholder="Küçə, bina, mənzil" value={newAddr.unvan} onChange={e=>setNewAddr(s=>({...s,unvan:e.target.value}))}/>
                <button className="w-full flex items-center justify-center gap-2 border border-bdr text-brand py-2.5 rounded-btn text-sm font-semibold hover:border-brand transition-colors" onClick={()=>setMapOpen(true)}><Ic.MapPin className="w-4 h-4"/> {newAddr.lat ? 'Xəritədə dəyiş' : 'Xəritədən seç'}</button>
                {newAddr.lat!=null && newAddr.lng!=null && <p className="text-xs text-t3 flex items-center gap-1"><Ic.MapPin className="w-3 h-3"/> Koordinat: {newAddr.lat.toFixed(5)}, {newAddr.lng.toFixed(5)}</p>}
                <div className="flex gap-2">
                  <button className="flex-1 border border-bdr text-brand py-2.5 rounded-btn text-sm font-semibold hover:border-bdr-s transition-colors" onClick={()=>setAddrOpen(false)}>Ləğv et</button>
                  <button className="flex-1 bg-brand text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-brand-h transition-all active:scale-[0.98]" onClick={addAddress}>Əlavə et</button>
                </div>
              </div>
            ) : (
              <button className="w-full border-2 border-dashed border-bdr rounded-sheet py-4 text-sm font-medium text-t2 hover:border-bdr-s hover:text-brand transition-all" onClick={()=>setAddrOpen(true)}>+ Yeni ünvan əlavə et</button>
            )}
            {mapOpen && <MapPicker initial={(newAddr.lat!=null&&newAddr.lng!=null)?{lat:newAddr.lat,lng:newAddr.lng}:null} onClose={()=>setMapOpen(false)} onSelect={({lat,lng,addr})=>setNewAddr(s=>({...s,lat,lng,unvan:addr||s.unvan}))}/>}
          </div>
        )}

        {tab==='ayarlar' && (
          <div className="space-y-6">
            <div className="bg-white rounded-sheet border border-bdr p-6 shadow-xs">
              <h3 className="font-bold text-brand mb-4">Hesab məlumatları</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field sm label="Ad" placeholder="Adınız" value={prof.ad} onChange={e=>setProf(s=>({...s,ad:e.target.value}))}/>
                  <Field sm label="Soyad" placeholder="Soyadınız" value={prof.soyad} onChange={e=>setProf(s=>({...s,soyad:e.target.value}))}/>
                </div>
                <Field sm type="tel" label="Telefon" placeholder="+994 50 123 45 67" value={formatPhone(prof.telefon)} onChange={e=>setProf(s=>({...s,telefon:formatPhone(e.target.value)}))}/>
                <p className="text-xs text-t3">Cinsiyyət və bədən ölçüləri <button className="underline text-brand" onClick={()=>selectTab('olculer')}>📏 Ölçülərim</button> bölməsindədir.</p>
                <div>
                  <label className="block text-xs font-medium text-brand mb-1.5">Email</label>
                  <input disabled value={user?.email||''} className="w-full bg-bg2 border border-bdr rounded-btn px-[14px] py-[10px] text-sm text-t3 outline-none cursor-not-allowed"/>
                </div>
              </div>
              <button onClick={saveProfile} disabled={profBusy} className="mt-5 bg-brand text-white px-6 py-2.5 rounded-btn text-sm font-semibold hover:bg-brand-h transition-all active:scale-[0.98] disabled:opacity-60 flex items-center gap-2">{profBusy&&<Spinner className="w-4 h-4" light/>}{profSaved?'✓ Yadda saxlanıldı':'Yadda saxla'}</button>
            </div>

            <div className="bg-white rounded-sheet border border-bdr p-6 shadow-xs space-y-5">
              <h3 className="font-bold text-brand">Tənzimləmələr</h3>
              {[['bildiris','E-poçt bildirişləri','Sifariş və kampaniya məlumatlarını e-poçtla al'],['tovsiye','Şəxsi tövsiyələr','Ana səhifədə "Sənin üçün seçdik" bölməsini göstər']].map(([key,k,l])=>(
                <div key={key} className="flex items-center justify-between gap-4"><div><p className="font-medium text-brand text-sm">{k}</p><p className="text-xs text-t2">{l}</p></div>
                  <button onClick={()=>updatePref&&updatePref(key,!prefs?.[key])} className={`w-11 h-6 rounded-full relative shrink-0 transition-colors ${prefs?.[key]?'bg-brand':'bg-bdr-s'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-xs transition-all ${prefs?.[key]?'right-1':'left-1'}`}/>
                  </button>
                </div>
              ))}
              <div className="border-t border-bdr pt-5">
                <p className="font-medium text-brand text-sm mb-2">🌐 {t('Dil')}</p>
                <div className="flex gap-2 max-w-xs">
                  {LANGS.map(l=>(
                    <button key={l.code} onClick={()=>setLang&&setLang(l.code)} className={`flex-1 py-2 rounded-btn text-sm font-semibold transition-colors ${lang===l.code?'bg-brand text-white':'bg-bg2 text-t2 hover:text-brand border border-bdr'}`}>{l.name}</button>
                  ))}
                </div>
              </div>
              <div className="border-t border-bdr pt-5"><button className="text-sale text-sm font-medium hover:opacity-80 transition-opacity" onClick={doLogout}>{t('Hesabdan çıx')}</button></div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
