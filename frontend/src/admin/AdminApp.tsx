/* ============================================================
   Gardrop Admin — kök (fayllara bölmə). Ortaq qat ./shared, tab-lar
   ayrı fayllarda (Dashboard/Users/Products/...). Login + App + NAV burada.
   JSX classic runtime; B.1 tipli (API müqaviləsi ./types).
   ============================================================ */
import React from "react";
import { createRoot } from "react-dom/client";
import type { Me, ToastState } from "./types";
import { useApi, Field, Btn, Toast, TKEY } from "./shared";
import { Ic } from "../lib/panelIcons";
import Dashboard from "./Dashboard";
import Users from "./Users";
import Products from "./Products";
import Stores from "./Stores";
import Categories from "./Categories";
import Orders from "./Orders";
import Coupons from "./Coupons";
import Reviews from "./Reviews";
import Content from "./Content";

const { useState, useEffect, useCallback, useRef } = React;

// ─────────────────────────  Login  ─────────────────────────
function Login({ onLogin }: { onLogin: (token: string, user: Me) => void }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('cred');  // 'cred' | 'otp'
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const api = useApi(null);

  const finish = (r: { token: string; user?: Me }) => {
    if (!r.user || !r.user.isAdmin) { setErr('Bu hesabın admin icazəsi yoxdur.'); setBusy(false); return; }
    onLogin(r.token, r.user);
  };

  const submitCred = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setInfo(''); setBusy(true);
    try {
      const r = await api<{ otpRequired?: boolean; needsVerification?: boolean; token: string; user?: Me }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password: pw }) });
      if (r.otpRequired) { setStep('otp'); setInfo('Giriş kodu email ünvanınıza göndərildi.'); setBusy(false); return; }
      if (r.needsVerification) { setErr('Email təsdiqlənməyib — əvvəlcə əsas saytda təsdiqləyin.'); setBusy(false); return; }
      finish(r);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { finish(await api<{ token: string; user?: Me }>('/api/auth/login-verify', { method: 'POST', body: JSON.stringify({ email, code }) })); }
    catch (e) { setErr((e as Error).message); setBusy(false); }
  };

  const resend = async () => {
    setErr(''); setInfo('');
    try { await api('/api/auth/resend-login', { method: 'POST', body: JSON.stringify({ email }) }); setInfo('Yeni kod göndərildi.'); }
    catch (e) { setErr((e as Error).message); }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-bg2">
      <form onSubmit={step === 'cred' ? submitCred : submitOtp} className="bg-white rounded-sheet2 shadow-pop w-full max-w-sm p-8 anim-pop border border-bdr">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-card bg-blue text-white grid place-items-center font-black text-xl mb-3">G</div>
          <h1 className="font-bold text-xl leading-tight text-brand">Gardrop Admin</h1>
          <p className="text-xs text-t3 mt-0.5">İdarəetmə paneli</p>
        </div>
        {step === 'cred' ? (
          <React.Fragment>
            <p className="text-sm text-t2 mt-3 mb-4">Admin hesabı ilə daxil olun.</p>
            {err && <div className="bg-sale/10 text-sale text-sm rounded-btn px-3 py-2 mb-3">{err}</div>}
            <div className="space-y-3">
              <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@gardrop.az" required />
              <Field label="Şifrə" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••" required />
            </div>
            <Btn type="submit" disabled={busy} className="w-full mt-5">{busy ? 'Yoxlanılır…' : 'Daxil ol'}</Btn>
            <p className="text-xs text-t3 mt-3">Google ilə yaratdığın hesab? Əsas saytda profil → Tənzimləmələr-dən şifrə təyin et.</p>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <p className="text-sm text-t2 mt-3 mb-2"><b>{email}</b> ünvanına göndərilən 6 rəqəmli kodu daxil edin.</p>
            {info && <div className="bg-bg2 text-t2 text-sm rounded-btn px-3 py-2 mb-2">{info}</div>}
            {err && <div className="bg-sale/10 text-sale text-sm rounded-btn px-3 py-2 mb-2">{err}</div>}
            <Field label="Giriş kodu" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" required />
            <Btn type="submit" disabled={busy || code.length !== 6} className="w-full mt-5">{busy ? 'Yoxlanılır…' : 'Təsdiqlə və daxil ol'}</Btn>
            <div className="flex items-center justify-between mt-3 text-xs">
              <button type="button" className="text-t2 hover:text-brand transition-colors" onClick={() => { setStep('cred'); setErr(''); setInfo(''); setCode(''); }}>‹ Geri</button>
              <button type="button" className="text-brand font-semibold hover:opacity-80 transition-opacity" onClick={resend}>Kodu yenidən göndər</button>
            </div>
          </React.Fragment>
        )}
      </form>
    </div>
  );
}

const NAV = [
  { k: 'dashboard', label: 'İdarə paneli', icon: 'dashboard' },
  { k: 'users', label: 'İstifadəçilər', icon: 'users' },
  { k: 'products', label: 'Məhsullar', icon: 'products' },
  { k: 'stores', label: 'Mağazalar', icon: 'stores' },
  { k: 'categories', label: 'Kateqoriyalar', icon: 'categories' },
  { k: 'orders', label: 'Sifarişlər', icon: 'orders' },
  { k: 'coupons', label: 'Kuponlar', icon: 'coupons' },
  { k: 'reviews', label: 'Rəylər', icon: 'reviews' },
  { k: 'content', label: 'Sayt məzmunu', icon: 'content' },
];

function App() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TKEY) || localStorage.getItem(TKEY));
  const [me, setMe] = useState<Me | null>(null);
  const [page, setPage] = useState<string>(() => {
    const p = localStorage.getItem('gardrop_admin_page');
    return NAV.some((n) => n.k === p) ? p! : 'dashboard';
  });
  useEffect(() => { localStorage.setItem('gardrop_admin_page', page); }, [page]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const toastT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((msg: string, kind?: 'error' | 'success') => {
    setToast({ msg, kind });
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TKEY); localStorage.removeItem(TKEY);
    setToken(null); setMe(null);
  }, []);

  const api = useApi(token, logout);

  useEffect(() => {
    if (token && !me) {
      api<Me>('/api/auth/me').then((u) => {
        if (!u.isAdmin) { showToast('Admin icazəsi yoxdur', 'error'); logout(); }
        else setMe(u);
      }).catch(() => logout());
    }
  }, [token, me, api, logout, showToast]);

  const onLogin = (t: string, u: Me) => { sessionStorage.setItem(TKEY, t); localStorage.setItem(TKEY, t); setToken(t); setMe(u); };

  if (!token) return <><Login onLogin={onLogin} /><Toast toast={toast} /></>;
  if (!me) return <div className="min-h-screen grid place-items-center text-t3">Yüklənir…</div>;

  const props = { api, toast: showToast, me };
  const pages: Record<string, React.ReactElement> = {
    dashboard: <Dashboard {...props} />, users: <Users {...props} />, products: <Products {...props} />,
    stores: <Stores {...props} />, categories: <Categories {...props} />, orders: <Orders {...props} />,
    coupons: <Coupons {...props} />, reviews: <Reviews {...props} />, content: <Content {...props} />,
  };
  const cur = NAV.find((n) => n.k === page);

  const initials = `${(me.ad || '?')[0] || ''}${(me.soyad || '')[0] || ''}`.toUpperCase();
  const PRIMARY = ['dashboard', 'orders', 'products', 'users'];
  const Sidebar = (
    <aside className="w-64 shrink-0 bg-white border-r border-bdr flex flex-col h-full">
      <div className="px-5 h-16 flex items-center gap-2.5 border-b border-bdr">
        <div className="w-9 h-9 rounded-btn bg-blue text-white grid place-items-center font-black">G</div>
        <div><div className="font-bold leading-tight text-brand">Gardrop</div><div className="text-[11px] text-t3 tracking-wide">ADMIN PANEL</div></div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-auto">
        {NAV.map((n) => {
          const I = Ic[n.icon]; const active = page === n.k;
          return (
            <button key={n.k} onClick={() => { setPage(n.k); setNavOpen(false); }}
              className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium text-left transition-colors ${active ? 'bg-bg2 text-brand' : 'text-t2 hover:text-brand hover:bg-bg2/60'}`}>
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-blue" />}
              <I className={`w-[18px] h-[18px] ${active ? 'text-blue' : 'text-t3'}`} />{n.label}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-bdr">
        <div className="flex items-center gap-2.5 px-1 py-1.5 mb-1">
          <div className="w-9 h-9 rounded-full bg-bg2 grid place-items-center text-xs font-bold text-t2 shrink-0">{initials}</div>
          <div className="min-w-0"><div className="text-sm font-medium truncate text-brand">{me.ad} {me.soyad}</div><div className="text-[11px] text-t3 truncate">{me.email}</div></div>
        </div>
        <a href="/gardrop.html" className="flex items-center justify-center gap-1.5 text-xs text-t2 hover:text-brand py-2 rounded-btn hover:bg-bg2 transition-colors"><Ic.external className="w-3.5 h-3.5" /> Sayta keç</a>
        <button onClick={logout} className="w-full flex items-center justify-center gap-1.5 text-sm text-t2 hover:text-brand py-2 mt-0.5 rounded-btn hover:bg-bg2 transition-colors"><Ic.logout className="w-4 h-4" /> Çıxış</button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-bg2">
      <div className="hidden md:flex h-screen sticky top-0">{Sidebar}</div>
      {navOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setNavOpen(false)} />
          <div className="absolute left-0 top-0 h-full anim-slide-l">{Sidebar}</div>
        </div>
      )}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white/85 backdrop-blur border-b border-bdr px-4 sm:px-6 flex items-center gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">{cur && (() => { const I = Ic[cur.icon]; return <span className="grid w-8 h-8 rounded-btn bg-brand/[0.06] text-brand place-items-center"><I className="w-[18px] h-[18px]" /></span>; })()}<h1 className="text-lg sm:text-xl font-bold text-brand">{cur?.label}</h1></div>
        </header>
        <div className="p-4 sm:p-6 anim-fade flex-1 pb-24 md:pb-6" key={page}>
          {pages[page]}
        </div>
      </main>

      {/* Mobil alt naviqasiya: 4 əsas + Daha çox */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-bdr flex pb-[env(safe-area-inset-bottom)]">
        {PRIMARY.map((k) => {
          const n = NAV.find((x) => x.k === k)!; const I = Ic[n.icon]; const active = page === k;
          return (
            <button key={k} onClick={() => setPage(k)} className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${active ? 'text-brand' : 'text-t3'}`}>
              <I className="w-5 h-5" />{n.label.split(' ')[0]}
            </button>
          );
        })}
        <button onClick={() => setNavOpen(true)} className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${!PRIMARY.includes(page) ? 'text-brand' : 'text-t3'}`}>
          <Ic.menu className="w-5 h-5" />Daha çox
        </button>
      </nav>
      <Toast toast={toast} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
