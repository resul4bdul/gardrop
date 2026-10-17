/* Eager auth modalları: AuthPopup + SetPasswordModal (App həmişə yükləyir).
   Lazy auth SƏHİFƏLƏRİ (Login/Register/...) ./Auth-dadır — bu fayl onlardan ayrıdır
   ki, App-in static importu route chunk-larını main-də saxlamasın. */
import React from "react";
import { Ic, Spinner, Field, GoogleSignIn, API, bearer } from '../shared';
import type { NavFn } from '../types';

const { useState } = React;

export const AuthPopup = ({ onClose, nav }: { onClose: () => void; nav: NavFn }) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center px-4 anim-fade">
    <div className="absolute inset-0 bg-brand/40 backdrop-blur-sm" onClick={onClose}/>
    <div className="relative bg-white rounded-sheet2 p-8 w-full max-w-sm shadow-pop text-center anim-pop">
      <button className="absolute top-4 right-4 text-t3 hover:text-brand transition-colors" onClick={onClose}>
        <Ic.X className="w-5 h-5"/>
      </button>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{backgroundColor:'#69EA9B'}}>
        <Ic.Sparkles className="w-8 h-8" style={{color:'#0A4020'}}/>
      </div>
      <h2 className="text-xl font-bold text-brand mb-2">Hesaba daxil olun</h2>
      <p className="text-t2 text-sm mb-6 leading-relaxed max-w-xs mx-auto">
        Seçilmişlərə əlavə etmək, sifariş vermək və AI ölçü məsləhəti almaq üçün hesabınıza daxil olun.
      </p>
      <div className="space-y-3">
        <button className="w-full bg-brand text-white py-[11px] rounded-btn font-semibold hover:bg-brand-h transition-all active:scale-[0.98] text-[15px]"
          onClick={()=>{onClose();nav('login');}}>Daxil ol</button>
        <button className="w-full border border-bdr text-brand py-[11px] rounded-btn font-semibold hover:bg-bg2 transition-all active:scale-[0.98] text-[15px]"
          onClick={()=>{onClose();nav('register');}}>Qeydiyyatdan keç</button>
      </div>
      <div className="flex items-center gap-3 my-4"><div className="flex-1 h-px bg-bdr"/><span className="text-sm text-t3">və ya</span><div className="flex-1 h-px bg-bdr"/></div>
      <GoogleSignIn text="continue_with"/>
      <p className="text-t3 text-xs mt-5">Bu əməliyyat hesab tələb edir</p>
    </div>
  </div>
);

/* Google ilə İLK girişdən sonra bir dəfəlik şifrə qurma modalı. */
export const SetPasswordModal = ({ token, onDone, onSkip }: { token: string | null; onDone?: () => void; onSkip?: () => void }) => {
  const [nw,setNw]=useState(''); const [cf,setCf]=useState('');
  const [busy,setBusy]=useState(false); const [err,setErr]=useState('');
  const submit = async () => {
    setErr('');
    if(nw.length<6){ setErr('Şifrə ən az 6 simvol olmalıdır'); return; }
    if(nw!==cf){ setErr('Şifrələr uyğun gəlmir'); return; }
    setBusy(true);
    try{
      const r=await fetch(`${API}/api/profile/password`,{method:'POST',headers:bearer(token),body:JSON.stringify({password:nw})});
      const d=await r.json();
      if(r.ok) onDone&&onDone(); else setErr(d.error||'Xəta baş verdi');
    }catch{ setErr('Serverlə əlaqə yoxdur'); }
    setBusy(false);
  };
  return (
    <div className="fixed inset-0 z-[320] flex items-center justify-center px-4 anim-fade">
      <div className="absolute inset-0 bg-brand/40 backdrop-blur-sm"/>
      <div className="relative bg-white rounded-sheet2 p-8 w-full max-w-sm shadow-pop anim-pop">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{backgroundColor:'#69EA9B'}}>
          <Ic.Lock className="w-8 h-8" style={{color:'#0A4020'}}/>
        </div>
        <h2 className="text-xl font-bold text-brand mb-2 text-center">Şifrə təyin et</h2>
        <p className="text-t2 text-sm mb-5 leading-relaxed text-center">Təhlükəsizliyini qorumaq üçün hesabına şifrə təyin et</p>
        {err && <div className="bg-sale/10 text-sale text-sm rounded-btn px-3 py-2 mb-3">{err}</div>}
        <div className="space-y-3">
          <Field label="Yeni şifrə" type="password" value={nw} onChange={e=>setNw(e.target.value)} placeholder="ən az 6 simvol"/>
          <Field label="Yeni şifrə (təkrar)" type="password" value={cf} onChange={e=>setCf(e.target.value)}/>
        </div>
        <button disabled={busy} onClick={submit} className="w-full bg-brand text-white py-[11px] rounded-btn font-semibold mt-5 hover:bg-brand-h transition-all active:scale-[0.98] text-[15px] disabled:opacity-60 inline-flex items-center justify-center gap-2">{busy&&<Spinner className="w-4 h-4" light/>}Təyin et</button>
        <button onClick={onSkip} className="w-full text-t3 text-sm py-2.5 mt-1 hover:text-brand transition-colors">Sonra</button>
      </div>
    </div>
  );
};
