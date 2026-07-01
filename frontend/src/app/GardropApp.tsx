/* ============================================================
   Gardrop — App kök + routing (B.3: səhifələr ayrı modullara bölündü,
   ağır route-lar React.lazy ilə kod-bölünür). Primitivlər ./shared-də.
   JSX classic runtime; i18n createElement override ./shared yüklənəndə qurulur.
   ============================================================ */
import React from "react";
import { createRoot } from "react-dom/client";
import { Toast, setRuntimeLang, setGoogleCb, flyToTarget, API, bearer } from './shared';
import { Header, MobileNav } from './Header';
import { AuthPopup, SetPasswordModal } from './pages/AuthModals';
import type { AuthResult, CartItem, Category, NavFn, Order, Prefs, Product, RegisterForm, Store, ToastItem, User } from './types';

const { useState, useEffect, useRef, lazy, Suspense } = React;

/* ── Ağır route səhifələri tələb olunduqda yüklənir (kod-bölmə) ── */
const HomePage        = lazy(()=>import('./pages/Home'));
const CatalogPage     = lazy(()=>import('./pages/Catalog'));
const StoresPage      = lazy(()=>import('./pages/Catalog').then(m=>({default:m.StoresPage})));
const ProductDetailPage = lazy(()=>import('./pages/Product'));
const CartPage        = lazy(()=>import('./pages/Cart'));
const CheckoutPage    = lazy(()=>import('./pages/Checkout'));
const OrderSuccessPage= lazy(()=>import('./pages/Checkout').then(m=>({default:m.OrderSuccessPage})));
const FavoritesPage   = lazy(()=>import('./pages/Favorites'));
const SearchPage      = lazy(()=>import('./pages/Search'));
const ProfilePage     = lazy(()=>import('./pages/Profile'));
const GuestAccount    = lazy(()=>import('./pages/Profile').then(m=>({default:m.GuestAccount})));
const LoginPage       = lazy(()=>import('./pages/Auth').then(m=>({default:m.LoginPage})));
const RegisterPage    = lazy(()=>import('./pages/Auth').then(m=>({default:m.RegisterPage})));
const ForgotPage      = lazy(()=>import('./pages/Auth').then(m=>({default:m.ForgotPage})));
const EmailSentPage   = lazy(()=>import('./pages/Auth').then(m=>({default:m.EmailSentPage})));
const ResetPasswordPage = lazy(()=>import('./pages/Auth').then(m=>({default:m.ResetPasswordPage})));
const InfoPage        = lazy(()=>import('./pages/Info'));

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"/>
  </div>
);

interface HistEntry { page: string; selProd: Product | null; activeCat: string; activeStore: Store | string | null; searchQuery: string; profileTab: string }
const App = () => {
  const [lang,setLangState]=useState(()=>{ try{ return localStorage.getItem('gd_lang')||'az'; }catch{ return 'az'; } });
  setRuntimeLang(lang);  // render zamanı modul dilini sinxronla ki, bütün t() cari dili göstərsin
  const setLang=(l: string)=>{ setRuntimeLang(l); try{localStorage.setItem('gd_lang',l);}catch{} setLangState(l); };
  const [page,setPage]=useState('home');
  const [selProd,setSelProd]=useState<Product | null>(null);
  const [activeCat,setActiveCat]=useState('Hamısı');
  const [activeStore,setActiveStore]=useState<Store | string | null>(null);
  const [searchQuery,setSearchQuery]=useState('');
  const [profileTab,setProfileTab]=useState('sifarisler');
  const histRef=useRef<HistEntry[]>([]);  // naviqasiya tarixi (brauzer "geri" üçün)
  const routePendingRef=useRef<any>(null);  // URL-dən gələn product/store id — katalog yüklənəndə həll olunur
  const [toasts,setToasts]=useState<ToastItem[]>([]);
  const [orderNo,setOrderNo]=useState('');

  // catalog (from backend)
  const [products,setProducts]=useState<Product[]>([]);
  const [stores,setStores]=useState<Store[]>([]);
  const [categories,setCategories]=useState<Category[]>([]);
  const [content,setContent]=useState<Record<string,string>>({});  // CMS məzmunu (hero/kateqoriya şəkilləri/hüquqi)
  const [catalogLoading,setCatalogLoading]=useState(true);
  const [catalogError,setCatalogError]=useState(false);

  // preferences (persisted locally)
  const [prefs,setPrefs]=useState<Prefs>(()=>{ try{ return {bildiris:true,tovsiye:true,...(JSON.parse(localStorage.getItem('gd_prefs')||'null')||{})}; }catch{ return {bildiris:true,tovsiye:true}; } });
  const updatePref=(k: string,v: boolean)=>setPrefs(p=>{ const n={...p,[k]:v}; try{ localStorage.setItem('gd_prefs',JSON.stringify(n)); }catch{} return n; });

  // auth
  const [user,setUser]=useState<User | null>(null);
  const [token,setToken]=useState<string | null>(()=>{ try{return sessionStorage.getItem('gd_token')||null;}catch{return null;} });
  const [authPopup,setAuthPopup]=useState(false);
  const [pwSetup,setPwSetup]=useState(false);  // Google ilk girişdən sonra şifrə qurma modalı
  const [resetToken,setResetToken]=useState('');

  // user data
  const [cart,setCart]=useState<CartItem[]>([]);
  const [favs,setFavs]=useState<number[]>([]);

  const saveToken=(t: string | null)=>{ setToken(t); try{ t?sessionStorage.setItem('gd_token',t):sessionStorage.removeItem('gd_token'); }catch{} };

  /* ── Catalog ── */
  const loadCatalog=()=>{
    setCatalogLoading(true); setCatalogError(false);
    Promise.all([
      fetch(`${API}/api/products`).then(r=>r.json()),
      fetch(`${API}/api/stores`).then(r=>r.json()),
      fetch(`${API}/api/categories`).then(r=>r.json()),
      fetch(`${API}/api/content`).then(r=>r.json()).catch(()=>({})),
    ]).then(([p,s,c,co])=>{ setProducts(p.products||[]); setStores(s||[]); setCategories(c||[]); setContent(co&&typeof co==='object'?co:{}); })
      .catch(()=>setCatalogError(true)).finally(()=>setCatalogLoading(false));
  };
  useEffect(loadCatalog,[]);

  /* ── Track last pointer position (start point for fly-to animation) ── */
  useEffect(()=>{
    const h=(e: PointerEvent)=>{ window.__flyPt={x:e.clientX,y:e.clientY}; };
    document.addEventListener('pointerdown',h,true);
    return ()=>document.removeEventListener('pointerdown',h,true);
  },[]);

  /* ── User data (cart + favs) ── */
  const loadUserData=(t: string)=>{
    fetch(`${API}/api/cart`,{headers:bearer(t)}).then(r=>r.json()).then(c=>Array.isArray(c)&&setCart(c)).catch(()=>{});
    fetch(`${API}/api/favorites/ids`,{headers:bearer(t)}).then(r=>r.json()).then(f=>Array.isArray(f)&&setFavs(f)).catch(()=>{});
  };

  /* ── Verify token on mount ── */
  useEffect(()=>{
    if(!token) return;
    fetch(`${API}/api/auth/me`,{headers:bearer(token)})
      .then(r=>r.ok?r.json():null)
      .then(u=>{ if(u?.id){ setUser(u); loadUserData(token); } else saveToken(null); })
      .catch(()=>{});
  },[]);

  /* ── Şifrə bərpa linki (?reset=token) ilə açılıbsa → bərpa səhifəsi ── */
  useEffect(()=>{
    try{
      const params=new URLSearchParams(location.search);
      const rt=params.get('reset');
      if(rt){ setResetToken(rt); setPage('reset-password');
        window.history.replaceState({},'',location.pathname);
      }
    }catch{}
  },[]);

  const refreshUser=()=>fetch(`${API}/api/auth/me`,{headers:bearer(token)}).then(r=>r.json()).then(u=>u?.id&&setUser(u)).catch(()=>{});

  const afterAuth=(data: { token: string; user: User })=>{ saveToken(data.token); setUser(data.user); loadUserData(data.token); };

  const NETERR='Serverlə əlaqə yoxdur. Backend işləyirmi?';
  const postJson=async(path: string,body: unknown)=>{
    const r=await fetch(`${API}${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    return r.json();
  };
  // Giriş 1-ci addım: parol → OTP tələbi (və ya təsdiq tələbi). Token gəlmir.
  const doLogin=async(email: string,password: string): Promise<AuthResult>=>{
    try{ const d=await postJson('/api/auth/login',{email,password});
      if(d.otpRequired) return{otp:true,email};
      if(d.needsVerification) return{verify:true,email};
      if(d.token){afterAuth(d);return{ok:true};}
      return{ok:false,error:d.error}; }
    catch{ return{ok:false,error:NETERR}; }
  };
  // Giriş 2-ci addım: OTP kodu → token
  const doLoginVerify=async(email: string,code: string): Promise<AuthResult>=>{
    try{ const d=await postJson('/api/auth/login-verify',{email,code}); if(d.token){afterAuth(d);return{ok:true};} return{ok:false,error:d.error}; }
    catch{ return{ok:false,error:NETERR}; }
  };
  // Qeydiyyat: hesab yaranır, mailə təsdiq kodu gedir. Token gəlmir.
  const doRegister=async(form: RegisterForm): Promise<AuthResult>=>{
    try{ const d=await postJson('/api/auth/register',form);
      if(d.needsVerification) return{verify:true,email:form.email};
      if(d.token){afterAuth(d);return{ok:true};}
      return{ok:false,error:d.error}; }
    catch{ return{ok:false,error:NETERR}; }
  };
  // Qeydiyyat təsdiqi: kod → token (avtomatik giriş)
  const doVerifyEmail=async(email: string,code: string): Promise<AuthResult>=>{
    try{ const d=await postJson('/api/auth/verify-email',{email,code}); if(d.token){afterAuth(d);return{ok:true};} return{ok:false,error:d.error}; }
    catch{ return{ok:false,error:NETERR}; }
  };
  const doResend=async(kind: string,email: string): Promise<AuthResult>=>{ // kind: 'login' | 'verify'
    try{ await postJson(kind==='verify'?'/api/auth/resend-verification':'/api/auth/resend-login',{email}); return{ok:true}; }
    catch{ return{ok:false,error:NETERR}; }
  };
  const doForgot=async(email: string): Promise<AuthResult>=>{
    try{ const d=await postJson('/api/auth/forgot',{email}); return{ok:true,message:d.message}; }
    catch{ return{ok:false,error:NETERR}; }
  };
  const doReset=async(token: string,password: string): Promise<AuthResult>=>{
    try{ const d=await postJson('/api/auth/reset',{token,password}); if(d.ok) return{ok:true}; return{ok:false,error:d.error}; }
    catch{ return{ok:false,error:NETERR}; }
  };
  const doGoogle=async(credential: string): Promise<AuthResult>=>{
    try{ const r=await fetch(`${API}/api/auth/google`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential})}); const d=await r.json(); if(d.token){afterAuth(d);return{ok:true,needsPassword:!d.user?.hasPassword};} return{ok:false,error:d.error}; }
    catch{ return{ok:false,error:'Serverlə əlaqə yoxdur. Backend işləyirmi?'}; }
  };
  const doLogout=()=>{ saveToken(null); setUser(null); setCart([]); setFavs([]); nav('home'); };

  /* ── Google giriş callback-ini cari handler ilə doldur ── */
  useEffect(()=>{
    setGoogleCb(async(credential: string)=>{
      const res=await doGoogle(credential);
      if(res.ok){ addToast('Google ilə daxil oldunuz'); setAuthPopup(false); nav('home'); if(res.needsPassword) setPwSetup(true); }
      else addToast(res.error||'Google girişi alınmadı','remove');
    });
    return ()=>{ setGoogleCb(null); };
  },[]);

  /* ── Toasts ── */
  const addToast=(msg: string,type='success')=>{
    const id=Date.now()+Math.random();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.map(x=>x.id===id?{...x,leaving:true}:x)),2500); // çıxış animasiyası başlasın
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),2820);
  };

  /* ── Navigation (guards protected routes) ── */
  const nav: NavFn=(pg,data={})=>{
    if(pg==='checkout'&&!user){ setAuthPopup(true); return; }
    histRef.current.push({ page, selProd, activeCat, activeStore, searchQuery, profileTab });
    const _st={ selProd:data.product??selProd, activeCat:data.category??activeCat,
                activeStore:data.category?null:(('store' in data)?(data.store??null):activeStore),
                searchQuery:data.query??searchQuery, profileTab:data.tab??profileTab };
    try{ window.history.pushState({gd:true}, '', pageToPath(pg,_st)); }catch{}
    setPage(pg);
    if(data.product)  setSelProd(data.product);
    if(data.category){ setActiveCat(data.category); setActiveStore(null); }
    if(data.store)    setActiveStore(data.store);
    if(data.query)    setSearchQuery(data.query);
    if(data.tab)      setProfileTab(data.tab);
    window.scrollTo({top:0,behavior:'smooth'});
  };

  /* ── Brauzer "geri" düyməsi ── */
  useEffect(()=>{
    const onPop=()=>{
      const prev=histRef.current.pop();
      if(prev){
        setPage(prev.page); setSelProd(prev.selProd); setActiveCat(prev.activeCat);
        setActiveStore(prev.activeStore); setSearchQuery(prev.searchQuery); setProfileTab(prev.profileTab);
        window.scrollTo({top:0});
      } else { setPage('home'); }
    };
    window.addEventListener('popstate',onPop);
    return ()=>window.removeEventListener('popstate',onPop);
  },[]);

  /* ── İlk yüklənmədə URL hash-ini oxu (deep-link / refresh) ── */
  useEffect(()=>{
    if(new URLSearchParams(location.search).get('reset')) return; // şifrə bərpa axını üstündür
    const r=parsePath();
    if(r.category){ setActiveCat(r.category); setActiveStore(null); }
    if(r.query!=null) setSearchQuery(r.query);
    if(r.tab) setProfileTab(r.tab);
    if(r.prodId||r.storeId) routePendingRef.current=r;  // obyekt katalog yüklənəndə tapılır
    else setPage(r.page);
  },[]);
  /* ── URL-dəki product/store id-ni katalog yüklənəndən sonra obyektə çevir ── */
  useEffect(()=>{
    const r=routePendingRef.current; if(!r) return;
    if(r.prodId){ const p=products.find(x=>String(x.id)===String(r.prodId)); if(p){ setSelProd(p); setPage('product'); routePendingRef.current=null; } }
    else if(r.storeId){ const s=stores.find(x=>String(x.id)===String(r.storeId)); if(s){ setActiveStore(s); setPage('catalog'); routePendingRef.current=null; } }
  },[products,stores]);

  /* ── Cart (server-persisted, optimistik + ardıcıllıq qoruması) ── */
  const cartSeq=useRef(0);
  const syncCart=(data: unknown,seq: number)=>{ if(Array.isArray(data)&&seq===cartSeq.current) setCart(data); };
  const addCart=async(product: Product,size?: string)=>{
    if(!user){ setAuthPopup(true); return; }
    const from=window.__flyPt;
    const seq=++cartSeq.current;
    try{
      const r=await fetch(`${API}/api/cart`,{method:'POST',headers:bearer(token),body:JSON.stringify({productId:product.id,qty:1,size:size||product.size})});
      const c=await r.json();
      if(Array.isArray(c)){ flyToTarget('cart',from); syncCart(c,seq); addToast(`Səbətə əlavə edildi: ${product.name}`); }
    }catch{ addToast('Xəta baş verdi','remove'); }
  };
  const updateQty=async(id: number,q: number)=>{
    if(q<1){ removeFromCart(id); return; }
    setCart(cs=>cs.map(i=>i.id===id?{...i,qty:q}:i)); // optimistik — UI dərhal
    const seq=++cartSeq.current;
    try{ const r=await fetch(`${API}/api/cart/${id}`,{method:'PUT',headers:bearer(token),body:JSON.stringify({qty:q})}); syncCart(await r.json(),seq); }catch{}
  };
  const removeFromCart=async(id: number)=>{
    setCart(cs=>cs.filter(i=>i.id!==id)); // optimistik — UI dərhal
    const seq=++cartSeq.current;
    try{ const r=await fetch(`${API}/api/cart/${id}`,{method:'DELETE',headers:bearer(token)}); syncCart(await r.json(),seq); addToast('Məhsul silindi','remove'); }catch{}
  };
  const clearCart=()=>{ cartSeq.current++; setCart([]); };
  const reorder=async(order: Order)=>{
    if(!user||!Array.isArray(order?.items)||!order.items.length){ setAuthPopup(!user); return; }
    try{
      let latest=cart;
      const seq=++cartSeq.current;
      for(const it of order.items){
        const r=await fetch(`${API}/api/cart`,{method:'POST',headers:bearer(token),body:JSON.stringify({productId:it.id,qty:it.qty||1,size:it.selectedSize||it.size})});
        const c=await r.json(); if(Array.isArray(c)) latest=c;
      }
      syncCart(latest,seq); addToast('Məhsullar yenidən səbətə əlavə edildi'); nav('cart');
    }catch{ addToast('Xəta baş verdi','remove'); }
  };

  /* ── Favorites (server-persisted) ── */
  const togFav=async(id: number)=>{
    if(!user){ setAuthPopup(true); return; }
    const from=window.__flyPt;
    try{
      const r=await fetch(`${API}/api/favorites/${id}`,{method:'POST',headers:bearer(token)});
      const d=await r.json();
      if(!Array.isArray(d.favorites)) return; // xəta cavabı state-i əzməsin
      if(d.added) flyToTarget('fav',from);    // əvvəl uçuş başlasın, badge sonra artsın
      setFavs(d.favorites);
      addToast(d.added?'Seçilmişlərə əlavə edildi':'Seçilmişlərdən silindi', d.added?'fav':'remove');
    }catch{}
  };
  const clearFavs=async()=>{
    if(!user||!favs.length) return;
    try{
      const r=await fetch(`${API}/api/favorites`,{method:'DELETE',headers:bearer(token)});
      const d=await r.json();
      setFavs(Array.isArray(d.favorites)?d.favorites:[]);
      addToast('Seçilmişlər təmizləndi','remove');
    }catch{}
  };

  const isAuthPage=['login','register','forgot-password','email-sent','reset-password'].includes(page);
  const isFull=['order-success'].includes(page);
  const showShell=!isAuthPage&&!isFull;
  const cp={ nav, favs, togFav, clearFavs, addCart, removeFromCart, cart, user, products, stores, categories, catalogLoading, prefs, content, showAuthPopup:()=>setAuthPopup(true) };

  const renderPage=()=>{
    switch(page){
      case 'home':           return <HomePage {...cp}/>;
      case 'catalog':        return <CatalogPage {...cp} activeCat={activeCat} activeStore={activeStore}/>;
      case 'stores':         return <StoresPage nav={nav} stores={stores} products={products}/>;
      case 'product':        return <ProductDetailPage {...cp} p={selProd} token={token}/>;
      case 'cart':           return <CartPage cart={cart} nav={nav} removeFromCart={removeFromCart} updateQty={updateQty} user={user} token={token}/>;
      case 'checkout':       return <CheckoutPage cart={cart} nav={nav} clearCart={clearCart} token={token} user={user} setOrderNo={setOrderNo} refreshUser={refreshUser}/>;
      case 'order-success':  return <OrderSuccessPage nav={nav} orderNo={orderNo}/>;
      case 'favorites':      return <FavoritesPage {...cp}/>;
      case 'search':         return <SearchPage query={searchQuery} {...cp}/>;
      case 'profile':        return user ? <ProfilePage nav={nav} user={user} token={token} doLogout={doLogout} refreshUser={refreshUser} initialTab={profileTab} reorder={reorder} prefs={prefs} updatePref={updatePref} lang={lang} setLang={setLang}/> : <GuestAccount nav={nav} lang={lang} setLang={setLang}/>;
      case 'login':          return <LoginPage nav={nav} onLogin={doLogin} onVerifyLogin={doLoginVerify} onVerifyEmail={doVerifyEmail} onResend={doResend}/>;
      case 'register':       return <RegisterPage nav={nav} onRegister={doRegister} onVerifyEmail={doVerifyEmail} onResend={doResend}/>;
      case 'forgot-password':return <ForgotPage nav={nav} onForgot={doForgot}/>;
      case 'email-sent':     return <EmailSentPage nav={nav}/>;
      case 'reset-password': return <ResetPasswordPage nav={nav} token={resetToken} onReset={doReset}/>;
      case 'privacy': case 'terms': case 'cookies': case 'delivery': case 'returns':
                             return <InfoPage topic={page} nav={nav}/>;
      default:               return <HomePage {...cp}/>;
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Toast toasts={toasts}/>
      {authPopup && <AuthPopup onClose={()=>setAuthPopup(false)} nav={nav}/>}
      {pwSetup && <SetPasswordModal token={token} onDone={()=>{ setPwSetup(false); refreshUser(); addToast('Şifrə təyin edildi'); }} onSkip={()=>setPwSetup(false)}/>}
      {showShell && <Header nav={nav} cart={cart} favs={favs} page={page} user={user} products={products} removeFromCart={removeFromCart} updateQty={updateQty} togFav={togFav} doLogout={doLogout} lang={lang} setLang={setLang}/>}
      {catalogError && showShell && (
        <div className="bg-sale text-white text-center text-sm py-2 px-4">
          ⚠ Backend serverə qoşulmaq mümkün olmadı. <button className="underline font-semibold" onClick={loadCatalog}>Yenidən cəhd et</button> — və ya <code className="bg-white/20 px-1 rounded">cd backend-csharp &amp;&amp; dotnet run</code> işə salın.
        </div>
      )}
      <div key={page} className="anim-page"><Suspense fallback={<PageFallback/>}>{renderPage()}</Suspense></div>
      {showShell && <MobileNav nav={nav} page={page} cart={cart} favs={favs}/>}
    </div>
  );
};

/* ── History-əsaslı routing: page state ↔ real URL yolu (# YOX). SPA fallback:
   dev-də Vite index.html verir; prod-da statik server bütün yolları index.html-ə rewrite etməli. ── */
function pageToPath(pg: string, st: { selProd?: Product | null; activeCat?: string; activeStore?: Store | string | null; searchQuery?: string; profileTab?: string }){
  switch(pg){
    case 'home':    return '/';
    case 'product': return st.selProd?.id!=null ? `/product/${st.selProd.id}` : '/product';
    case 'catalog': {
      const storeId = (typeof st.activeStore==='object' && st.activeStore) ? st.activeStore.id : null;
      if(storeId!=null) return `/store/${storeId}`;
      return (st.activeCat && st.activeCat!=='Hamısı') ? `/catalog/${encodeURIComponent(st.activeCat)}` : '/catalog';
    }
    case 'search':  return `/search?q=${encodeURIComponent(st.searchQuery||'')}`;
    case 'profile': return (st.profileTab && st.profileTab!=='sifarisler') ? `/profile/${st.profileTab}` : '/profile';
    default:        return `/${pg}`;
  }
}
interface ParsedPath { page: string; category?: string; storeId?: string; prodId?: string; query?: string; tab?: string }
function parsePath(): ParsedPath{
  const path=(location.pathname||'/').replace(/^\/+/,'');
  const segs=path.split('/').filter(Boolean);
  const q=new URLSearchParams(location.search||'');
  if(!segs.length) return {page:'home'};
  switch(segs[0]){
    case 'catalog': return {page:'catalog', category: segs[1]?decodeURIComponent(segs[1]):'Hamısı'};
    case 'store':   return {page:'catalog', storeId: segs[1]};
    case 'product': return {page:'product', prodId: segs[1]};
    case 'search':  return {page:'search', query: q.get('q')||''};
    case 'profile': return {page:'profile', tab: segs[1]||'sifarisler'};
    case 'stores': case 'cart': case 'checkout': case 'favorites':
    case 'login':  case 'register': case 'forgot-password': case 'email-sent':
    case 'privacy': case 'terms': case 'cookies': case 'delivery': case 'returns':
      return {page:segs[0]};
    default: return {page:'home'};
  }
}

createRoot(document.getElementById('root')!).render(<App/>);
