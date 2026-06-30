/* Header + MobileNav (B.3: GardropApp.tsx monolitindən çıxarıldı). */
import React from "react";
import { Ic, Img, CountBadge, LanguageSwitcher, t, LANGS } from './shared';
import type { CartItem, NavFn, Product, User } from './types';

const { useState, useEffect, useRef } = React;

interface HeaderProps {
  nav: NavFn; cart: CartItem[]; favs: number[]; page: string; user: User | null;
  products?: Product[]; removeFromCart: (id: number) => void; updateQty: (id: number, q: number) => void;
  togFav: (id: number) => void; doLogout: () => void; lang: string; setLang: (l: string) => void;
}
export const Header = ({ nav, cart, favs, page, user, products=[], removeFromCart, updateQty, togFav, doLogout, lang, setLang }: HeaderProps) => {
  const [q, setQ] = useState('');
  // Axtarış səhifəsindən kənara keçəndə axtarış mətnini təmizlə
  useEffect(()=>{ if(page!=='search') setQ(''); },[page]);
  const [mSearch, setMSearch] = useState(false);
  const [pop, setPop] = useState<string | null>(null); // 'fav' | 'cart' | 'profile'
  const mInputRef = useRef<HTMLInputElement>(null);
  const clusterRef = useRef<HTMLDivElement>(null);
  const closePop = () => setPop(null);
  const togglePop = (k: string) => setPop(p => p===k ? null : k);
  const favProds = products.filter(p=>favs.includes(p.id));
  const cartTotal = cart.reduce((s,i)=>s+(i.price||0)*(i.qty||1),0);
  useEffect(()=>{ closePop(); },[page]);
  /* ── Close popup on outside click / Esc (Apple-style) ── */
  useEffect(()=>{
    if(!pop) return;
    const onDown=(e: Event)=>{ if(clusterRef.current && !clusterRef.current.contains(e.target as Node)) closePop(); };
    const onKey=(e: KeyboardEvent)=>{ if(e.key==='Escape') closePop(); };
    document.addEventListener('pointerdown',onDown,true);
    document.addEventListener('keydown',onKey);
    return ()=>{ document.removeEventListener('pointerdown',onDown,true); document.removeEventListener('keydown',onKey); };
  },[pop]);
  const navItems = ['Kişi','Qadın','Uşaq','Ayaqqabı','Yeni gələnlər','Mağazalar'];
  const goNav = (it: string) => it==='Mağazalar' ? nav('stores') : nav('catalog',{category:it});
  const doSearch = () => { if(q.trim()){ nav('search',{query:q.trim()}); setMSearch(false); } };
  const openMobileSearch = () => { setMSearch(s=>!s); };
  useEffect(()=>{ if(mSearch&&mInputRef.current) mInputRef.current.focus(); },[mSearch]);

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-bdr/70 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 py-3">
          <button className="text-xl sm:text-2xl font-black tracking-widest text-brand shrink-0" onClick={()=>nav('home')}>GARDROP</button>
          <div className="flex-1 hidden sm:flex items-center gap-2 bg-bg2 rounded-full px-4 py-2.5 max-w-lg border border-transparent focus-within:border-brand focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] transition-all">
            <Ic.Search className="w-4 h-4 text-t3 shrink-0"/>
            <input className="bg-transparent flex-1 outline-none text-sm text-brand placeholder-t3 min-w-0"
              placeholder={t('Məhsul, marka və ya kateqoriya axtarın...')} value={q} onChange={e=>setQ(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&doSearch()}/>
            {q && <button className="text-t3 hover:text-brand" onClick={()=>setQ('')}><Ic.X className="w-3.5 h-3.5"/></button>}
          </div>
          <div ref={clusterRef} className="flex items-center gap-1 sm:gap-2 ml-auto relative">
            <button className="sm:hidden p-2 text-t2" onClick={openMobileSearch}><Ic.Search className="w-5 h-5"/></button>
            {!user && <div className="hidden sm:block"><LanguageSwitcher lang={lang} setLang={setLang}/></div>}

            <button className={`hidden sm:flex items-center gap-2 px-2.5 py-2 rounded-full transition-colors ${pop==='fav'?'bg-bg2 text-brand':'text-t2 hover:text-brand hover:bg-bg2/60'}`} onClick={()=>togglePop('fav')} aria-label="Seçilmişlər">
              <span className="relative" data-fly="fav">
                <Ic.Heart filled={false} className="w-5 h-5"/>
                <CountBadge kind="fav" count={favs.length} className="absolute -top-2 -right-2 bg-brand text-white text-[10px] font-bold leading-none min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white"/>
              </span>
              <span className="text-sm hidden lg:block">{t('Seçilmişlər')}</span>
            </button>

            <button className={`hidden sm:flex items-center gap-2 px-2.5 py-2 rounded-full transition-colors ${pop==='cart'?'bg-bg2 text-brand':'text-t2 hover:text-brand hover:bg-bg2/60'}`} onClick={()=>togglePop('cart')} aria-label="Səbət">
              <span className="relative" data-fly="cart">
                <Ic.Bag className="w-5 h-5"/>
                <CountBadge kind="cart" count={cart.length} className="absolute -top-2 -right-2 bg-brand text-white text-[10px] font-bold leading-none min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white"/>
              </span>
              <span className="text-sm hidden lg:block">{t('Səbət')}</span>
            </button>

            {user ? (
              <button className={`hidden sm:flex items-center gap-2 pl-1 pr-2 py-1 rounded-full transition-colors ${pop==='profile'?'bg-bg2':'hover:bg-bg2/60'}`} onClick={()=>togglePop('profile')} aria-label="Profil">
                <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{user.ad[0]}{user.soyad[0]}</span>
                </div>
                <span className="text-sm hidden lg:block font-medium text-brand">{user.ad}</span>
              </button>
            ) : (
              <button className="lg-btn hidden sm:flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-btn text-sm font-semibold ml-1" onClick={()=>nav('login')}>
                <Ic.User className="w-4 h-4"/><span className="hidden sm:block">Daxil ol</span>
              </button>
            )}

            {/* ── Top-right popups (outside-click & Esc close via effect) ── */}
            {pop==='fav' && (
              <div className="absolute right-0 top-[calc(100%+12px)] w-80 max-w-[calc(100vw-2rem)] glass-pop rounded-sheet2 p-4 z-50 anim-pop">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-brand">Seçilmişlər</h3>
                  <span className="text-xs text-t3">{favProds.length} məhsul</span>
                </div>
                {favProds.length===0 ? (
                  <div className="text-center py-7"><div className="w-12 h-12 bg-bg2/70 rounded-full flex items-center justify-center mx-auto mb-3"><Ic.Heart filled={false} className="w-6 h-6 text-td"/></div><p className="text-sm text-t2">Hələ seçilmiş məhsul yoxdur</p></div>
                ) : (
                  <div className="space-y-1 max-h-72 overflow-auto scrollbar-hide -mx-1 px-1">
                    {favProds.slice(0,5).map(p=>(
                      <div key={p.id} onClick={()=>{closePop();nav('product',{product:p});}} className="flex items-center gap-3 p-2 rounded-card hover:bg-white/70 transition-colors cursor-pointer">
                        <Img className="w-11 h-12 rounded-lg shrink-0" src={p.imageUrls && p.imageUrls[0]} alt={p.name}/>
                        <div className="min-w-0 flex-1"><p className="text-sm font-medium text-brand truncate">{p.name}</p><p className="text-xs text-t2">{p.price.toFixed(2)} ₼</p></div>
                        <button onClick={e=>{e.stopPropagation();togFav&&togFav(p.id);}} className="text-sale shrink-0 p-1" aria-label="Sil"><Ic.Heart filled={true} className="w-4 h-4"/></button>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={()=>{closePop();nav('favorites');}} className="lg-btn w-full bg-brand text-white py-2.5 rounded-btn font-semibold mt-3 text-sm">Seçilmişlərə keç →</button>
              </div>
            )}

            {pop==='cart' && (
              <div className="absolute right-0 top-[calc(100%+12px)] w-80 max-w-[calc(100vw-2rem)] glass-pop rounded-sheet2 p-4 z-50 anim-pop">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-brand">Səbət</h3>
                  <span className="text-xs text-t3">{cart.length} məhsul</span>
                </div>
                {cart.length===0 ? (
                  <div className="text-center py-7"><div className="w-12 h-12 bg-bg2/70 rounded-full flex items-center justify-center mx-auto mb-3"><Ic.Bag className="w-6 h-6 text-td"/></div><p className="text-sm text-t2">Səbətiniz boşdur</p></div>
                ) : (
                  <>
                    <div className="space-y-1 max-h-64 overflow-auto scrollbar-hide -mx-1 px-1">
                      {cart.slice(0,5).map(it=>(
                        <div key={it.id} className="flex items-center gap-3 p-2 rounded-card hover:bg-white/70 transition-colors">
                          <Img className="w-11 h-12 rounded-lg shrink-0" src={it.imageUrls && it.imageUrls[0]} alt={it.name}/>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-brand truncate">{it.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center border border-bdr/70 rounded-full bg-white/80">
                                <button onClick={()=>updateQty&&updateQty(it.id,(it.qty||1)-1)} className="w-6 h-6 flex items-center justify-center text-t2 hover:text-brand transition-colors" aria-label="Azalt"><Ic.Minus className="w-3 h-3"/></button>
                                <span className="w-5 text-center text-xs font-semibold text-brand">{it.qty||1}</span>
                                <button onClick={()=>updateQty&&updateQty(it.id,(it.qty||1)+1)} className="w-6 h-6 flex items-center justify-center text-t2 hover:text-brand transition-colors" aria-label="Artır"><Ic.Plus className="w-3 h-3"/></button>
                              </div>
                              <span className="text-xs text-t2">{(it.price*(it.qty||1)).toFixed(2)} ₼</span>
                            </div>
                          </div>
                          <button onClick={()=>removeFromCart&&removeFromCart(it.id)} className="text-td hover:text-sale shrink-0 p-1" aria-label="Sil"><Ic.X className="w-4 h-4"/></button>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center border-t border-bdr/60 mt-2 pt-3 text-sm"><span className="text-t2">Ümumi</span><span className="font-bold text-brand">{cartTotal.toFixed(2)} ₼</span></div>
                  </>
                )}
                <button onClick={()=>{closePop();nav('cart');}} className="lg-btn w-full bg-brand text-white py-2.5 rounded-btn font-semibold mt-3 text-sm">Səbətə keç →</button>
              </div>
            )}

            {pop==='profile' && user && (
              <div className="absolute right-0 top-[calc(100%+12px)] w-72 max-w-[calc(100vw-2rem)] glass-pop rounded-sheet2 p-4 z-50 anim-pop">
                <div className="flex items-center gap-3 pb-3 mb-3 border-b border-bdr/60">
                  <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center shrink-0"><span className="text-white text-sm font-bold">{user.ad[0]}{user.soyad[0]}</span></div>
                  <div className="min-w-0"><p className="font-bold text-brand truncate">{user.ad} {user.soyad}</p><p className="text-xs text-t2 truncate">{user.email}</p></div>
                </div>
                <div className="space-y-1">
                  <button onClick={()=>{closePop();nav('profile',{tab:'sifarisler'});}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-card text-sm font-medium text-t2 hover:text-brand hover:bg-white/70 transition-colors"><Ic.Bag className="w-4 h-4"/> {t('Sifarişlərim')}</button>
                  <button onClick={()=>{closePop();nav('profile',{tab:'olculer'});}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-card text-sm font-medium text-t2 hover:text-brand hover:bg-white/70 transition-colors"><Ic.Ruler className="w-4 h-4"/> {t('Ölçülərim')}</button>
                  <button onClick={()=>{closePop();nav('profile',{tab:'adresler'});}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-card text-sm font-medium text-t2 hover:text-brand hover:bg-white/70 transition-colors"><Ic.MapPin className="w-4 h-4"/> {t('Ünvanlar')}</button>
                  <button onClick={()=>{closePop();nav('profile',{tab:'ayarlar'});}} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-card text-sm font-medium text-t2 hover:text-brand hover:bg-white/70 transition-colors"><Ic.Settings className="w-4 h-4"/> {t('Tənzimləmələr')}</button>
                </div>
                {/* Dil seçimi */}
                <div className="mt-3 pt-3 border-t border-bdr/60">
                  <p className="px-1 text-xs font-semibold text-t3 uppercase tracking-wide mb-1.5">🌐 {t('Dil')}</p>
                  <div className="flex gap-1.5">
                    {LANGS.map(l=>(
                      <button key={l.code} onClick={()=>setLang(l.code)} className={`flex-1 py-2 rounded-btn text-xs font-semibold transition-colors ${lang===l.code?'bg-brand text-white':'bg-white/70 text-t2 hover:text-brand border border-bdr/60'}`}>{l.label}</button>
                    ))}
                  </div>
                </div>
                <button onClick={()=>{closePop();doLogout&&doLogout();}} className="w-full text-center py-2.5 rounded-btn text-sm font-semibold text-sale hover:bg-sale/10 transition-colors mt-2 border-t border-bdr/60 pt-3">{t('Çıxış')}</button>
              </div>
            )}
          </div>
        </div>
        {mSearch && (
          <div className="sm:hidden pb-3 anim-fade">
            <div className="flex items-center gap-2 bg-bg2 rounded-full px-4 py-2.5 border border-transparent focus-within:border-brand focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] transition-all">
              <Ic.Search className="w-4 h-4 text-t3 shrink-0"/>
              <input ref={mInputRef} className="bg-transparent flex-1 outline-none text-sm text-brand placeholder-t3 min-w-0"
                placeholder="Məhsul, marka axtarın..." value={q} onChange={e=>setQ(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&doSearch()}/>
              {q
                ? <button className="text-t3 hover:text-brand" onClick={()=>setQ('')}><Ic.X className="w-3.5 h-3.5"/></button>
                : <button className="text-t3 hover:text-brand" onClick={()=>setMSearch(false)}><Ic.X className="w-3.5 h-3.5"/></button>}
            </div>
          </div>
        )}
        <nav className="hidden md:flex items-center gap-5 pb-3">
          {navItems.map(it=>(
            <button key={it} className="text-sm text-t2 hover:text-brand font-medium transition-colors" onClick={()=>goNav(it)}>{t(it)}</button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export const MobileNav = ({ nav, page, cart, favs }: { nav: NavFn; page: string; cart: CartItem[]; favs: number[] }) => {
  const items: { k: string; label: string; I: (p: any) => React.ReactElement; count?: number }[] = [
    { k:'home',      label:'Ana səhifə', I:Ic.Home  },
    { k:'catalog',   label:'Kataloq',    I:Ic.Grid  },
    { k:'favorites', label:'Seçilmişlər',I:Ic.Heart, count:favs.length },
    { k:'cart',      label:'Səbət',      I:Ic.Bag,  count:cart.length },
    { k:'profile',   label:'Profil',     I:Ic.User  },
  ];
  const activeIdx = items.findIndex(it => it.k === page);
  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-50 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] pointer-events-none">
      <nav className="ios-tabbar pointer-events-auto relative mx-auto max-w-md flex items-stretch rounded-[26px] p-1.5">
        {activeIdx>=0 && (
          <span className="ios-tab-pill" style={{width:`calc((100% - 12px)/${items.length})`, transform:`translateX(calc(${activeIdx} * 100%))`}}/>
        )}
        {items.map(({k,label,I,count})=>{
          const active = page===k;
          return (
            <button key={k} className={`relative z-10 flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-[20px] transition-colors duration-300 ${active?'text-brand':'text-t3'}`} onClick={()=>k==='catalog'?nav('catalog',{category:'Hamısı'}):nav(k)}>
              <div className="relative" data-fly={k==='favorites'?'fav':k==='cart'?'cart':undefined}>
                <I {...(k==='favorites'?{filled:active}:{})} className={`w-[22px] h-[22px] transition-transform duration-300 ${active?'-translate-y-px scale-110':''}`}/>
                {(k==='favorites'||k==='cart') && <CountBadge kind={k==='favorites'?'fav':'cart'} count={count||0} className="absolute -top-1.5 -right-2 bg-brand text-white text-[9px] font-bold leading-none min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center ring-2 ring-white"/>}
              </div>
              <span className={`text-[9px] leading-none font-semibold transition-opacity duration-300 ${active?'opacity-100':'opacity-75'}`}>{t(label)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
