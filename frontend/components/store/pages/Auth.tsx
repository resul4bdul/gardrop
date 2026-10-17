/* Lazy auth SƏHİFƏLƏRİ: OtpForm, Login/Register/Forgot/EmailSent/Reset
   (B.3: GardropApp.tsx-dən çıxarıldı). Eager modallar ./AuthModals-dadır. */
import React from "react";
import { Ic, Spinner, Field, GoogleSignIn, formatPhone, t } from '../shared';
import { LegalModal } from './Info';
import type { AuthResult, NavFn, RegisterForm } from '../types';

const { useState, useEffect } = React;

/* Birdəfəlik kod (OTP / email təsdiqi) forması — 6 rəqəm + yenidən göndər sayğacı */
const OtpForm = ({ email, title, subtitle, onVerify, onResend, onBack }: { email: string; title: string; subtitle: string; onVerify: (code: string) => Promise<AuthResult>; onResend: () => void | Promise<unknown>; onBack: () => void }) => {
  const [code,setCode]=useState(''); const [loading,setLoading]=useState(false);
  const [error,setError]=useState(''); const [cooldown,setCooldown]=useState(0); const [sent,setSent]=useState(false);
  useEffect(()=>{ if(cooldown<=0) return; const tm=setTimeout(()=>setCooldown(c=>c-1),1000); return ()=>clearTimeout(tm); },[cooldown]);
  const submit=async(e: React.FormEvent)=>{ e.preventDefault(); setError('');
    if(code.length!==6){ setError(t('6 rəqəmli kodu daxil edin')); return; }
    setLoading(true); const res=await onVerify(code); setLoading(false);
    if(!res.ok) setError(res.error||t('Kod yanlışdır'));
  };
  const resend=async()=>{ if(cooldown>0) return; await onResend(); setCooldown(45); setSent(true); setError(''); };
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg2 px-4 py-12 pb-20 md:pb-12">
      <div className="w-full max-w-sm bg-white rounded-sheet2 border border-bdr shadow-card p-8 anim-pop">
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-bg2 rounded-full flex items-center justify-center mx-auto mb-4"><Ic.Mail className="w-7 h-7 text-t3"/></div>
          <h1 className="text-2xl font-bold text-brand">{title}</h1>
          <p className="text-t2 mt-1 text-sm">{subtitle}<br/><span className="font-semibold text-brand">{email}</span></p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-btn mb-4 flex items-center gap-2"><Ic.Info className="w-4 h-4 shrink-0"/>{error}</div>}
        {sent && !error && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-btn mb-4">{t('Yeni kod göndərildi')}</div>}
        <form onSubmit={submit} className="space-y-4">
          <input inputMode="numeric" autoFocus maxLength={6} value={code}
            onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))}
            placeholder="••••••"
            className="w-full text-center text-2xl tracking-[0.5em] font-bold text-brand border border-bdr rounded-btn py-3 focus:border-brand outline-none transition-colors"/>
          <button type="submit" disabled={loading} className="w-full bg-brand text-white py-[11px] rounded-btn font-semibold hover:bg-brand-h transition-all active:scale-[0.98] text-[15px] disabled:opacity-60 flex items-center justify-center gap-2">{loading&&<Spinner className="w-4 h-4" light/>}{loading?'…':t('Təsdiqlə')}</button>
        </form>
        <div className="text-center mt-5 text-sm text-t2">
          {t('Kod gəlmədi?')} <button type="button" disabled={cooldown>0} onClick={resend} className="text-brand font-semibold hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-default">{cooldown>0?`${t('Yenidən göndər')} (${cooldown})`:t('Yenidən göndər')}</button>
        </div>
        <button type="button" onClick={onBack} className="w-full text-sm text-t2 hover:text-brand py-2 mt-1 transition-colors">← {t('Geri')}</button>
      </div>
    </div>
  );
};

export const LoginPage = ({ nav, onLogin, onVerifyLogin, onVerifyEmail, onResend }: { nav: NavFn; onLogin: (email: string, password: string) => Promise<AuthResult>; onVerifyLogin: (email: string, code: string) => Promise<AuthResult>; onVerifyEmail: (email: string, code: string) => Promise<AuthResult>; onResend: (kind: string, email: string) => Promise<AuthResult> }) => {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [loading,setLoading]=useState(false); const [error,setError]=useState('');
  const [step,setStep]=useState('pw');  // 'pw' | 'otp' | 'verify'
  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if(!email||!password){ setError('Email və şifrəni daxil edin'); return; }
    setLoading(true); const res = await onLogin(email,password); setLoading(false);
    if(res.ok) nav('home');
    else if(res.otp) setStep('otp');
    else if(res.verify) setStep('verify');
    else setError(res.error||'Xəta baş verdi');
  };
  if(step==='otp') return <OtpForm email={email}
    title={t('Giriş kodu')} subtitle={t('Giriş kodunu email ünvanınıza göndərdik:')}
    onVerify={async c=>{ const r=await onVerifyLogin(email,c); if(r.ok) nav('home'); return r; }}
    onResend={()=>onResend('login',email)} onBack={()=>setStep('pw')}/>;
  if(step==='verify') return <OtpForm email={email}
    title={t('Email təsdiqi')} subtitle={t('Təsdiq kodunu email ünvanınıza göndərdik:')}
    onVerify={async c=>{ const r=await onVerifyEmail(email,c); if(r.ok) nav('home'); return r; }}
    onResend={()=>onResend('verify',email)} onBack={()=>setStep('pw')}/>;
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg2 px-4 py-12 pb-20 md:pb-12">
      <div className="w-full max-w-sm bg-white rounded-sheet2 border border-bdr shadow-card p-8 anim-pop">
        <div className="text-center mb-7">
          <button className="text-2xl font-black tracking-widest text-brand mb-5 block mx-auto" onClick={()=>nav('home')}>GARDROP</button>
          <h1 className="text-2xl font-bold text-brand">{t('Xoş gəldiniz')}</h1>
          <p className="text-t2 mt-1 text-sm">{t('Hesabınıza daxil olun')}</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-btn mb-4 flex items-center gap-2"><Ic.Info className="w-4 h-4 shrink-0"/>{error}</div>}
        <form onSubmit={handle} className="space-y-4">
          <Field type="email" label={t('Email')} placeholder="email@numune.com" value={email} onChange={e=>setEmail(e.target.value)}/>
          <div>
            <Field type="password" label={t('Şifrə')} placeholder="••••••••••••" value={password} onChange={e=>setPassword(e.target.value)}/>
            <div className="text-right mt-1.5"><button type="button" className="text-xs text-t2 hover:text-brand transition-colors" onClick={()=>nav('forgot-password')}>{t('Şifrəni unutmusunuz?')}</button></div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-brand text-white py-[11px] rounded-btn font-semibold hover:bg-brand-h transition-all active:scale-[0.98] text-[15px] disabled:opacity-60 flex items-center justify-center gap-2">{loading&&<Spinner className="w-4 h-4" light/>}{loading?'…':t('Daxil ol')}</button>
        </form>
        <div className="flex items-center gap-3 my-5"><div className="flex-1 h-px bg-bdr"/><span className="text-sm text-t3">{t('və ya')}</span><div className="flex-1 h-px bg-bdr"/></div>
        <GoogleSignIn text="signin_with"/>
        <p className="text-center text-sm text-t2 mt-5">{t('Hesabınız yoxdur?')} <button className="text-brand font-semibold hover:underline" onClick={()=>nav('register')}>{t('Qeydiyyatdan keçin')}</button></p>
      </div>
    </div>
  );
};

export const RegisterPage = ({ nav, onRegister, onVerifyEmail, onResend }: { nav: NavFn; onRegister: (form: RegisterForm) => Promise<AuthResult>; onVerifyEmail: (email: string, code: string) => Promise<AuthResult>; onResend: (kind: string, email: string) => Promise<AuthResult> }) => {
  const [form,setForm]=useState<RegisterForm>({ad:'',soyad:'',email:'',telefon:'',password:''});
  const [agreed,setAgreed]=useState(false); const [loading,setLoading]=useState(false); const [error,setError]=useState('');
  const [legal,setLegal]=useState('');  // '' | 'terms' | 'privacy' — açıq modal
  const [step,setStep]=useState('form');  // 'form' | 'verify'
  const upd=(k: keyof RegisterForm,v: string)=>setForm(f=>({...f,[k]:v}));
  // Bütün sahələr düzgün dolmayınca düymə passiv (boz) qalır
  const emailOk = /^\S+@\S+\.\S+$/.test(form.email.trim());
  const phoneOk = form.telefon.replace(/\D/g,'').length===12;  // 994 + 9 rəqəm
  const valid = form.ad.trim() && form.soyad.trim() && emailOk && phoneOk && form.password.length>=6 && agreed;
  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if(!valid){ setError('Bütün sahələri düzgün doldurun və şərtləri qəbul edin'); return; }
    setLoading(true); const res = await onRegister(form); setLoading(false);
    if(res.ok) nav('home');
    else if(res.verify) setStep('verify');
    else setError(res.error||'Xəta baş verdi');
  };
  if(step==='verify') return <OtpForm email={form.email}
    title={t('Email təsdiqi')} subtitle={t('Təsdiq kodunu email ünvanınıza göndərdik:')}
    onVerify={async c=>{ const r=await onVerifyEmail(form.email,c); if(r.ok) nav('home'); return r; }}
    onResend={()=>onResend('verify',form.email)} onBack={()=>setStep('form')}/>;
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg2 px-4 py-12 pb-20 md:pb-12">
      <div className="w-full max-w-sm bg-white rounded-sheet2 border border-bdr shadow-card p-8 anim-pop">
        <div className="text-center mb-7">
          <button className="text-2xl font-black tracking-widest text-brand mb-5 block mx-auto" onClick={()=>nav('home')}>GARDROP</button>
          <h1 className="text-2xl font-bold text-brand">{t('Hesab yaradın')}</h1>
          <p className="text-t2 mt-1 text-sm">{t('Minlərlə brend, bir platformada')}</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-btn mb-4 flex items-center gap-2"><Ic.Info className="w-4 h-4 shrink-0"/>{error}</div>}
        <form onSubmit={handle} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field sm label={t('Ad')} placeholder={t('Adınız')} value={form.ad} onChange={e=>upd('ad',e.target.value)}/>
            <Field sm label={t('Soyad')} placeholder={t('Soyadınız')} value={form.soyad} onChange={e=>upd('soyad',e.target.value)}/>
          </div>
          <Field sm type="email" label={t('Email')} placeholder="numune@mail.com" value={form.email} onChange={e=>upd('email',e.target.value)}/>
          <Field sm type="tel" label={t('Telefon')} placeholder="+994 50 123 45 67" value={formatPhone(form.telefon)} onChange={e=>upd('telefon',formatPhone(e.target.value))}/>
          <Field sm type="password" label={t('Şifrə')} placeholder={t('Ən az 6 simvol')} value={form.password} onChange={e=>upd('password',e.target.value)}/>
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} className="rounded accent-[#0A0A0A]"/>
            <span className="text-xs text-t2">
              <button type="button" onClick={()=>setLegal('terms')} className="text-brand font-semibold underline hover:no-underline">{t('İstifadə şərtləri')}</button>
              {' '}{t('və')}{' '}
              <button type="button" onClick={()=>setLegal('privacy')} className="text-brand font-semibold underline hover:no-underline">{t('Məxfilik siyasəti')}</button>
              {' '}{t('ilə razıyam')}
            </span>
          </label>
          <button type="submit" disabled={loading||!valid} className={`w-full py-[11px] rounded-btn font-semibold transition-all text-[15px] flex items-center justify-center gap-2 ${valid?'bg-brand text-white hover:bg-brand-h active:scale-[0.98] disabled:opacity-60':'bg-bg2 text-t3 cursor-not-allowed border border-bdr'}`}>{loading&&<Spinner className="w-4 h-4" light/>}{loading?'…':t('Qeydiyyatdan keç')}</button>
        </form>
        <div className="flex items-center gap-3 my-5"><div className="flex-1 h-px bg-bdr"/><span className="text-sm text-t3">{t('və ya')}</span><div className="flex-1 h-px bg-bdr"/></div>
        <GoogleSignIn text="signup_with"/>
        <p className="text-center text-sm text-t2 mt-5">{t('Artıq hesabınız var?')} <button className="text-brand font-semibold hover:underline" onClick={()=>nav('login')}>{t('Daxil olun')}</button></p>
      </div>
      {legal && <LegalModal topic={legal} onClose={()=>setLegal('')}/>}
    </div>
  );
};

export const ForgotPage = ({ nav, onForgot }: { nav: NavFn; onForgot: (email: string) => Promise<AuthResult> }) => {
  const [email,setEmail]=useState(''); const [loading,setLoading]=useState(false); const [error,setError]=useState('');
  const submit=async(e: React.FormEvent)=>{ e.preventDefault(); setError('');
    if(!/^\S+@\S+\.\S+$/.test(email.trim())){ setError('Düzgün email daxil edin'); return; }
    setLoading(true); const r=await onForgot(email.trim()); setLoading(false);
    if(r.ok) nav('email-sent'); else setError(r.error||'Xəta baş verdi');
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg2 px-4 pb-20 md:pb-0">
      <div className="w-full max-w-sm bg-white rounded-sheet2 border border-bdr shadow-card p-8 anim-pop">
        <div className="text-center mb-7">
          <button className="text-2xl font-black tracking-widest text-brand mb-5 block mx-auto" onClick={()=>nav('home')}>GARDROP</button>
          <div className="w-14 h-14 bg-bg2 rounded-full flex items-center justify-center mx-auto mb-4"><Ic.Mail className="w-7 h-7 text-t3"/></div>
          <h1 className="text-2xl font-bold text-brand">Şifrəni bərpa et</h1>
          <p className="text-t2 mt-1 text-sm">Email ünvanınıza bərpa linki göndərəcəyik</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-btn mb-4 flex items-center gap-2"><Ic.Info className="w-4 h-4 shrink-0"/>{error}</div>}
        <form className="space-y-4" onSubmit={submit}>
          <Field type="email" label="Email" placeholder="email@numune.com" value={email} onChange={e=>setEmail(e.target.value)}/>
          <button type="submit" disabled={loading} className="w-full bg-brand text-white py-[11px] rounded-btn font-semibold hover:bg-brand-h transition-all active:scale-[0.98] text-[15px] disabled:opacity-60 flex items-center justify-center gap-2">{loading&&<Spinner className="w-4 h-4" light/>}{loading?'…':'Link göndər'}</button>
          <button type="button" className="w-full text-sm text-t2 hover:text-brand py-2 transition-colors" onClick={()=>nav('login')}>← Geri qayıt</button>
        </form>
      </div>
    </div>
  );
};

export const EmailSentPage = ({ nav }: { nav: NavFn }) => (
  <div className="min-h-screen flex items-center justify-center bg-bg2 px-4 pb-20 md:pb-0">
    <div className="w-full max-w-sm bg-white rounded-sheet2 border border-bdr shadow-card p-10 text-center anim-pop">
      <button className="text-2xl font-black tracking-widest text-brand mb-8 block mx-auto" onClick={()=>nav('home')}>GARDROP</button>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{backgroundColor:'#69EA9B'}}><Ic.CheckCircle className="w-11 h-11" style={{color:'#0A4020'}}/></div>
      <h1 className="text-2xl font-bold text-brand mb-2">Email göndərildi!</h1>
      <p className="text-t2 text-sm mb-8 leading-relaxed">Şifrə bərpa linki email ünvanınıza göndərildi. Zəhmət olmasa gələn qutunuzu yoxlayın.</p>
      <button className="w-full bg-brand text-white py-[11px] rounded-btn font-semibold hover:bg-brand-h transition-all active:scale-[0.98] mb-3 text-[15px]" onClick={()=>nav('login')}>Daxil olmağa qayıt</button>
      <button className="w-full text-sm text-t2 hover:text-brand py-2 transition-colors" onClick={()=>nav('forgot-password')}>Yenidən göndər</button>
    </div>
  </div>
);

export const ResetPasswordPage = ({ nav, token, onReset }: { nav: NavFn; token: string; onReset: (token: string, password: string) => Promise<AuthResult> }) => {
  const [pw,setPw]=useState(''); const [pw2,setPw2]=useState('');
  const [loading,setLoading]=useState(false); const [error,setError]=useState(''); const [done,setDone]=useState(false);
  const submit=async(e: React.FormEvent)=>{ e.preventDefault(); setError('');
    if(pw.length<6){ setError('Şifrə ən az 6 simvol olmalıdır'); return; }
    if(pw!==pw2){ setError('Şifrələr uyğun gəlmir'); return; }
    if(!token){ setError('Bərpa linki etibarsızdır'); return; }
    setLoading(true); const r=await onReset(token,pw); setLoading(false);
    if(r.ok) setDone(true); else setError(r.error||'Link yanlış və ya vaxtı keçib');
  };
  if(done) return (
    <div className="min-h-screen flex items-center justify-center bg-bg2 px-4 pb-20 md:pb-0">
      <div className="w-full max-w-sm bg-white rounded-sheet2 border border-bdr shadow-card p-10 text-center anim-pop">
        <button className="text-2xl font-black tracking-widest text-brand mb-8 block mx-auto" onClick={()=>nav('home')}>GARDROP</button>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{backgroundColor:'#69EA9B'}}><Ic.CheckCircle className="w-11 h-11" style={{color:'#0A4020'}}/></div>
        <h1 className="text-2xl font-bold text-brand mb-2">Şifrə yeniləndi!</h1>
        <p className="text-t2 text-sm mb-8 leading-relaxed">Yeni şifrənizlə daxil ola bilərsiniz.</p>
        <button className="w-full bg-brand text-white py-[11px] rounded-btn font-semibold hover:bg-brand-h transition-all active:scale-[0.98] text-[15px]" onClick={()=>nav('login')}>Daxil ol</button>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg2 px-4 pb-20 md:pb-0">
      <div className="w-full max-w-sm bg-white rounded-sheet2 border border-bdr shadow-card p-8 anim-pop">
        <div className="text-center mb-7">
          <button className="text-2xl font-black tracking-widest text-brand mb-5 block mx-auto" onClick={()=>nav('home')}>GARDROP</button>
          <div className="w-14 h-14 bg-bg2 rounded-full flex items-center justify-center mx-auto mb-4"><Ic.Lock className="w-7 h-7 text-t3"/></div>
          <h1 className="text-2xl font-bold text-brand">Yeni şifrə təyin et</h1>
          <p className="text-t2 mt-1 text-sm">Hesabınız üçün yeni şifrə daxil edin</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-btn mb-4 flex items-center gap-2"><Ic.Info className="w-4 h-4 shrink-0"/>{error}</div>}
        <form className="space-y-4" onSubmit={submit}>
          <Field type="password" label="Yeni şifrə" placeholder="Ən az 6 simvol" value={pw} onChange={e=>setPw(e.target.value)}/>
          <Field type="password" label="Şifrəni təkrarla" placeholder="••••••••••••" value={pw2} onChange={e=>setPw2(e.target.value)}/>
          <button type="submit" disabled={loading} className="w-full bg-brand text-white py-[11px] rounded-btn font-semibold hover:bg-brand-h transition-all active:scale-[0.98] text-[15px] disabled:opacity-60 flex items-center justify-center gap-2">{loading&&<Spinner className="w-4 h-4" light/>}{loading?'…':'Şifrəni yenilə'}</button>
          <button type="button" className="w-full text-sm text-t2 hover:text-brand py-2 transition-colors" onClick={()=>nav('login')}>← Geri qayıt</button>
        </form>
      </div>
    </div>
  );
};
