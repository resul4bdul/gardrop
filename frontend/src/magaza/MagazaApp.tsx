/* ============================================================
   Gardrop Satıcı Paneli (Merchant Dashboard) — kök.
   Dizayn: Inter, green #0B8457, slate fon, radius 16px (Shopify/Stripe/Linear).
   Atomlar ./ui, ikonlar ../lib/panelIcons (Lucide), tab-lar ayrı fayllarda.
   ============================================================ */
import React from "react";
import { createRoot } from "react-dom/client";
import type { Store, ToastState, Category } from "./types";
import { API, TKEY, useApi, Toast, NotificationBell } from "./shared";
import { Ic } from "../lib/panelIcons";
import { Button, Input, Field, Avatar, cx } from "./ui";
import Dashboard from "./Dashboard";
import Products from "./Products";
import Orders from "./Orders";
import Reviews from "./Reviews";
import Payments from "./Payments";
import StoreProfile from "./Profile";

const { useState, useEffect, useCallback, useRef } = React;

// Qaranlıq/işıqlı rejim keçidi — html.dark class + localStorage.
function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const toggle = () => { const n = !dark; setDark(n); document.documentElement.classList.toggle("dark", n); try { localStorage.setItem("gardrop_theme", n ? "dark" : "light"); } catch { /* ignore */ } };
  return <button onClick={toggle} title={dark ? "İşıqlı rejim" : "Qaranlıq rejim"} aria-label="Tema" className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-lg">{dark ? "☀️" : "🌙"}</button>;
}

// ───────────────────────── Login ─────────────────────────
function Login({ onLogin }: { onLogin: (token: string, stores: Store[]) => void }) {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [step, setStep] = useState('pw'); const [code, setCode] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  const finish = async (token: string) => {
    const meR = await fetch(API + '/api/store/me', { headers: { Authorization: 'Bearer ' + token } });
    const me = meR.ok ? await meR.json() : null;
    if (!me || !me.hasStore) throw new Error('Bu hesaba mağaza təyin olunmayıb. Admin ilə əlaqə saxlayın.');
    onLogin(token, me.stores);
  };
  const submitPw = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = await fetch(API + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pw }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Giriş alınmadı');
      if (d.token) await finish(d.token);
      else if (d.otpRequired) setStep('otp');
      else if (d.needsVerification) throw new Error('Əvvəlcə email ünvanını əsas saytda təsdiqləyin.');
      else throw new Error('Gözlənilməz cavab');
    } catch (e2) { setErr((e2 as Error).message); }
    setBusy(false);
  };
  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = await fetch(API + '/api/auth/login-verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Kod yanlış və ya vaxtı keçib');
      await finish(d.token);
    } catch (e2) { setErr((e2 as Error).message); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-slate-50">
      <form onSubmit={step === 'pw' ? submitPw : submitOtp} className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white grid place-items-center font-black text-xl mx-auto mb-3">G</div>
          <h1 className="text-xl font-bold text-slate-900">Satıcı Paneli</h1>
          <p className="text-slate-500 text-sm mt-1">{step === 'pw' ? 'Mağaza hesabınızla daxil olun' : `${email} ünvanına göndərilən kodu daxil edin`}</p>
        </div>
        {err && <div className="bg-red-50 text-red-600 text-sm px-3 py-2.5 rounded-xl mb-4">{err}</div>}
        {step === 'pw' ? (
          <div className="space-y-3">
            <Field label="E-poçt"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="satici@gardrop.az" /></Field>
            <Field label="Şifrə"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••" /></Field>
            <Button className="w-full" loading={busy} disabled={!email || !pw}>Daxil ol</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Field label="Giriş kodu"><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6 rəqəmli kod" /></Field>
            <Button className="w-full" loading={busy} disabled={!code}>Təsdiqlə</Button>
            <button type="button" className="w-full text-sm text-slate-500 hover:text-slate-800" onClick={() => { setStep('pw'); setCode(''); setErr(''); }}>‹ Geri</button>
          </div>
        )}
      </form>
    </div>
  );
}

// [key, label, iconKey, short]
const NAV: [string, string, string, string][] = [
  ['dashboard', 'Analitika', 'analytics', 'Analitika'],
  ['orders', 'Sifarişlər', 'orders', 'Sifariş'],
  ['products', 'Məhsullar', 'products', 'Məhsul'],
  ['reviews', 'Rəylər', 'reviews', 'Rəy'],
  ['payments', 'Ödənişlər', 'wallet', 'Ödəniş'],
  ['settings', 'Mağaza Ayarları', 'settings', 'Ayar'],
];
const BOTTOM = ['dashboard', 'orders', 'products', 'payments'];

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TKEY));
  const [stores, setStores] = useState<Store[] | null>(null);
  const [storeIdx, setStoreIdx] = useState(() => Number(localStorage.getItem('gardrop_store_idx')) || 0);
  const [page, setPage] = useState<string>(() => {
    const p = localStorage.getItem('gardrop_store_page');
    return NAV.some(n => n[0] === p) ? p! : 'dashboard';
  });
  useEffect(() => { localStorage.setItem('gardrop_store_page', page); }, [page]);
  useEffect(() => { localStorage.setItem('gardrop_store_idx', String(storeIdx)); }, [storeIdx]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const toastT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((msg: string, kind?: 'error' | 'success') => { setToast({ msg, kind }); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(null), 2600); }, []);
  const logout = useCallback(() => { localStorage.removeItem(TKEY); setToken(null); setStores(null); }, []);
  const api = useApi(token, logout);

  useEffect(() => {
    if (token && !stores) { api<{ hasStore: boolean; stores: Store[] }>('/api/store/me').then((m) => { if (m.hasStore) setStores(m.stores); else logout(); }).catch(() => logout()); }
  }, [token, stores, api, logout]);
  useEffect(() => { fetch(API + '/api/categories').then(r => r.json()).then(d => Array.isArray(d) && setCats(d)).catch(() => {}); }, []);

  const onLogin = (t: string, s: Store[]) => { localStorage.setItem(TKEY, t); setToken(t); setStores(s); };

  if (!token) return <><Login onLogin={onLogin} /><Toast toast={toast} /></>;
  if (!stores) return <div className="min-h-screen grid place-items-center text-slate-400">Yüklənir…</div>;

  const store = stores[storeIdx] || stores[0];
  const updateStore = (upd: Partial<Store>) => setStores((ss) => (ss || []).map((s, i) => i === storeIdx ? { ...s, ...upd } : s));
  const props = { api, toast: showToast, store, cats };
  const pages: Record<string, React.ReactElement> = {
    dashboard: <Dashboard {...props} />, products: <Products {...props} />, orders: <Orders {...props} />,
    reviews: <Reviews {...props} />, payments: <Payments {...props} />, settings: <StoreProfile {...props} onUpdated={updateStore} />,
  };
  const cur = NAV.find(n => n[0] === page);
  const go = (k: string) => { setPage(k); setNavOpen(false); setMenuOpen(false); };

  const StoreBadge = ({ small }: { small?: boolean }) => (
    <div className="flex items-center gap-2.5 min-w-0">
      <Avatar name={store.name} src={store.logo} className={small ? 'w-9 h-9' : 'w-10 h-10'} />
      <div className="min-w-0">
        <div className="font-semibold text-slate-900 truncate flex items-center gap-1.5 leading-tight">
          {store.name}<Ic.verified className="w-4 h-4 text-emerald-600 shrink-0" />
        </div>
        <div className="text-[11px] text-slate-400">Təsdiqlənmiş mağaza</div>
      </div>
    </div>
  );

  const Sidebar = (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="px-5 h-16 flex items-center gap-2 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white grid place-items-center font-black text-sm">G</div>
        <span className="font-bold text-slate-900">Gardrop</span>
        <span className="text-[10px] font-semibold text-slate-400 ml-auto tracking-wide">SATICI</span>
      </div>
      {stores.length > 1 && (
        <div className="px-3 pt-3"><select value={storeIdx} onChange={(e) => setStoreIdx(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-sm">{stores.map((s, i) => <option key={s.id} value={i}>{s.name}</option>)}</select></div>
      )}
      <nav className="flex-1 p-3 space-y-1 overflow-auto">
        {NAV.map(([k, label, icon]) => {
          const I = Ic[icon]; const active = page === k;
          return (
            <button key={k} onClick={() => go(k)} className={cx("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors",
              active ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50")}>
              <I className={cx("w-[18px] h-[18px]", active ? "text-emerald-600" : "text-slate-400")} />{label}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-100">
        <div className="px-2 py-2 mb-1"><StoreBadge /></div>
        <a href="/gardrop.html" className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"><Ic.external className="w-4 h-4 text-slate-400" /> Sayta keç</a>
        <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><Ic.logout className="w-4 h-4 text-slate-400" /> Hesabdan çıxış</button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden md:flex h-screen sticky top-0">{Sidebar}</div>
      {navOpen && (<div className="fixed inset-0 z-50 md:hidden"><div className="absolute inset-0 bg-slate-900/40" onClick={() => setNavOpen(false)} /><div className="absolute left-0 top-0 h-full anim-slide-l">{Sidebar}</div></div>)}

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white/80 backdrop-blur border-b border-slate-200 px-4 sm:px-6 flex items-center gap-3 sticky top-0 z-30">
          <button className="md:hidden -ml-1 w-9 h-9 grid place-items-center rounded-xl hover:bg-slate-100" onClick={() => setNavOpen(true)} aria-label="Menyu"><Ic.menu className="w-5 h-5 text-slate-700" /></button>
          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-sm">
            <span className="text-slate-400">Mağaza</span><Ic.chevR className="w-3.5 h-3.5 text-slate-300" /><span className="font-semibold text-slate-900">{cur?.[1]}</span>
          </div>
          <h1 className="sm:hidden text-lg font-bold text-slate-900">{cur?.[1]}</h1>
          <div className="flex items-center gap-1 ml-auto">
            <ThemeToggle />
            <NotificationBell api={api} />
            {/* Profil menyusu */}
            <div className="relative">
              <button onClick={() => setMenuOpen(o => !o)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100"><Avatar name={store.name} src={store.logo} className="w-8 h-8" /><Ic.chevDown className="w-4 h-4 text-slate-400 hidden sm:block" /></button>
              {menuOpen && (<>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-60 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 p-2 anim-pop">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1"><StoreBadge small /></div>
                  <button onClick={() => go('settings')} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl"><Ic.settings className="w-4 h-4 text-slate-400" /> Mağaza Ayarları</button>
                  <a href="/gardrop.html" className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl"><Ic.external className="w-4 h-4 text-slate-400" /> Sayta keç</a>
                  <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl"><Ic.logout className="w-4 h-4" /> Hesabdan çıxış</button>
                </div>
              </>)}
            </div>
          </div>
        </header>
        <div className="p-4 sm:p-6 flex-1 pb-24 md:pb-6 anim-fade" key={page}>{pages[page]}</div>
      </main>

      {/* Mobil alt naviqasiya */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 flex pb-[env(safe-area-inset-bottom)]">
        {BOTTOM.map((k) => {
          const n = NAV.find(x => x[0] === k)!; const I = Ic[n[2]]; const active = page === k;
          return (
            <button key={k} onClick={() => setPage(k)} className={cx("flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium", active ? "text-emerald-600" : "text-slate-400")}>
              <I className="w-5 h-5" />{n[3]}
            </button>
          );
        })}
        <button onClick={() => setNavOpen(true)} className={cx("flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-medium", !BOTTOM.includes(page) ? "text-emerald-600" : "text-slate-400")}>
          <Ic.menu className="w-5 h-5" />Daha çox
        </button>
      </nav>
      <Toast toast={toast} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
