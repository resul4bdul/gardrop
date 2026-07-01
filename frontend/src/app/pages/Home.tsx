/* HomePage + SectionHead (B.3: GardropApp.tsx-dən çıxarıldı). */
import React from "react";
import { Ic, Img, Reveal, ProductCard, ProductCardSkeleton, resolveImg, parseContent } from '../shared';
import { recommendSize } from '../sizing';
import type { CommonProps, Product, HeroSlide } from '../types';

const { useState, useEffect } = React;

export const SectionHead = ({ title, onAll }: { title: string; onAll?: () => void }) => (
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold text-brand">{title}</h2>
    {onAll && <button className="text-sm text-t2 hover:text-brand flex items-center gap-1 transition-colors" onClick={onAll}>Hamısına bax <Ic.ChevR className="w-4 h-4"/></button>}
  </div>
);

const HomePage = ({ nav, favs, togFav, addCart, cart, user, products, stores, categories, catalogLoading, prefs, content }: CommonProps) => {
  const [slide, setSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // CMS hero slaydları (admin paneldən); boşdursa daxili defaultlar.
  const goForLink = (link?: string, category?: string) => () => {
    const l = link || 'catalog';
    if (l === 'catalog') nav('catalog', { category: category || 'Hamısı' });
    else if (l === 'register') user ? nav('profile', { tab: 'olculer' }) : nav('register');
    else nav(l);
  };
  const cmsHero = parseContent<HeroSlide[]>(content, 'home_hero', []);
  const defaultSlides = [
    { badge:'YENİ KOLLEKSİYA', title:['Stiliniz,','qaydalarınızı','yazır.'],     sub:'Keyfiyyətli parçalar, eleqant dizayn və AI ölçü məsləhəti bir arada.', cta:'Alış-verişə başla', image:'', go:()=>nav('catalog',{category:'Hamısı'}) },
    { badge:'ENDİRİM SEZONU',  title:['Sevdiyin','brendlər,','daha sərfəli.'],   sub:'Seçilmiş məhsullarda 20%-dək endirim. Fürsəti qaçırma.',              cta:'Endirimlərə bax',  image:'', go:()=>nav('catalog',{category:'Endirimlər'}) },
    { badge:'AI ÖLÇÜ',         title:['Ölçünü','bizə burax,','sən rahat ol.'],   sub:'Bədən ölçülərinə əsasən hər məhsul üçün uyğun ölçünü tövsiyə edirik.', cta:user?'Ölçülərimi əlavə et':'Hesab yarat', image:'', go:()=>user?nav('profile',{tab:'olculer'}):nav('register') },
    { badge:'MAĞAZALAR',       title:['Minlərlə','brend,','bir platformada.'],   sub:'Azərbaycanın aparıcı geyim mağazaları Gardrop-da.',                   cta:'Mağazalara bax',   image:'', go:()=>nav('stores') },
  ];
  const slides = cmsHero.length ? cmsHero.map(s => ({
    badge: s.badge || '', title: (s.title || '').split('\n').filter(Boolean), sub: s.subtitle || '',
    cta: s.ctaText || 'Bax', image: s.image || '', go: goForLink(s.ctaLink, s.ctaCategory),
  })) : defaultSlides;
  const catImages = parseContent<Record<string,string>>(content, 'category_images', {});
  const total = slides.length;
  const cur = slides[slide];

  useEffect(()=>{ const t=setInterval(()=>setSlide(s=>(s+1)%total),3500); return ()=>clearInterval(t); },[total]);

  const faqs=[
    {q:"Biz kimik?", a:"Gardrop, Azərbaycanın çoxsatıcılı geyim marketplace-idir. Minlərlə brendin məhsullarını bir platformada toplayırıq."},
    {q:"AI ölçü sistemi nədir?", a:"Bədən ölçülərinizə əsasən hər məhsul üçün uyğun ölçünü tövsiyə edirik. Dəqiqlik 90%+ təşkil edir."},
    {q:"Çatdırılma necə işləyir?", a:"Bakı daxilindən 1-2 iş günü, regionlara 3-5 iş günü ərzində çatdırılma həyata keçirilir."},
    {q:"Geri qaytarma şərtləri nədir?", a:"14 gün ərzində istifadə edilməmiş məhsulları geri qaytara bilərsiniz."},
  ];
  const cp = { nav, favs, togFav, addCart, cart, user };
  const grid = (items: Product[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {catalogLoading ? Array.from({length:5}).map((_,i)=><ProductCardSkeleton key={i}/>)
                      : items.map(p=><ProductCard key={p.id} p={p} {...cp}/>)}
    </div>
  );

  return (
    <div className="pb-24 md:pb-0">
      {/* Hero */}
      <section className="bg-bg2 relative">
        <div className="max-w-7xl mx-auto px-4 py-14 md:py-20 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1" key={slide}>
            <span className="inline-flex items-center gap-1.5 bg-brand text-white text-[11px] font-bold tracking-widest px-3 py-1.5 rounded-full mb-5 anim-hero"><Ic.Sparkles className="w-3 h-3"/> {cur.badge}</span>
            <h1 className="text-4xl md:text-6xl font-black text-brand leading-[1.08] mb-4 anim-hero" style={{animationDelay:'.07s'}}>{cur.title.map((l,i)=><React.Fragment key={i}>{l}{i<cur.title.length-1&&<br/>}</React.Fragment>)}</h1>
            <p className="text-t2 text-lg mb-8 max-w-md leading-relaxed anim-hero" style={{animationDelay:'.14s'}}>{cur.sub}</p>
            <button className="bg-brand text-white px-8 py-3.5 rounded-btn font-semibold hover:bg-brand-h transition-all active:scale-[0.98] anim-hero" style={{animationDelay:'.2s'}} onClick={cur.go}>{cur.cta}</button>
          </div>
          <div className="hidden md:block w-80 shrink-0"><Img className="w-full h-72 rounded-sheet2" src={resolveImg(cur.image)} alt={cur.badge}/></div>
        </div>
        <div className="flex justify-center gap-2 pb-6">
          {Array.from({length:total}).map((_,i)=>(
            <button key={i} className={`rounded-full transition-all ${i===slide?'w-6 h-2 bg-brand':'w-2 h-2 bg-bdr-s'}`} onClick={()=>setSlide(i)}/>
          ))}
        </div>
        <button className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-card flex items-center justify-center text-brand hover:scale-105 transition" onClick={()=>setSlide(s=>(s-1+total)%total)}><Ic.ChevL className="w-4 h-4"/></button>
        <button className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-card flex items-center justify-center text-brand hover:scale-105 transition" onClick={()=>setSlide(s=>(s+1)%total)}><Ic.ChevR className="w-4 h-4"/></button>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <Reveal>
        <SectionHead title="Kataloq" onAll={()=>nav('catalog',{category:'Hamısı'})}/>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {(catalogLoading?[]:[...categories].sort((a,b)=>(b.count||0)-(a.count||0)).slice(0,5)).map(c=>(
            <button key={c.name} className="bg-bg2 rounded-card p-4 text-center hover:bg-bg3 transition-all hover:-translate-y-0.5" onClick={()=>nav('catalog',{category:c.name})}>
              <Img className="w-full aspect-square rounded-[10px] mb-3" src={resolveImg(catImages[c.name])} alt={c.name}/>
              <p className="font-semibold text-brand text-sm">{c.name}</p>
              <p className="text-xs text-t3 mt-0.5">{(c.count||0).toLocaleString()} məhsul</p>
            </button>
          ))}
          {catalogLoading && Array.from({length:5}).map((_,i)=><div key={i} className="bg-bg2 rounded-card p-4"><div className="skel w-full aspect-square rounded-[10px] mb-3"/><div className="skel h-4 w-1/2 mx-auto rounded"/></div>)}
        </div>
        </Reveal>
      </section>

      {/* For You */}
      {(prefs?.tovsiye!==false) && (()=>{
        let forYou = products, personal = false;
        if (user) {
          const f = products.filter(p=>{
            const pg = p.gender || p.category;
            if (user.cins==='Kişi'  && pg==='Qadın') return false;
            if (user.cins==='Qadın' && pg==='Kişi')  return false;
            if (p.category==='Uşaq') return false;
            const rec = recommendSize(user, p);
            return !(rec.hasMeasurements && !rec.available);
          });
          if (f.length) { forYou = f; personal = !!(user.cins || f.length!==products.length); }
        }
        return (
          <section className="max-w-7xl mx-auto px-4 pb-10">
            <Reveal>
            <SectionHead title="Sənin üçün seçdik" onAll={()=>nav('catalog',{category:'Sənə uyğun'})}/>
            {personal && <p className="text-sm text-t2 -mt-3 mb-5 flex items-center gap-1.5"><Ic.Sparkles className="w-3.5 h-3.5" style={{color:'#0A4020'}}/> {user?.cins?`${user.cins} geyimləri — `:''}ölçünə uyğun olmayan məhsullar gizlədilib</p>}
            {grid(forYou.slice(0,5))}
            </Reveal>
          </section>
        );
      })()}

      {/* New Arrivals */}
      <section className="bg-bg2 py-12">
        <Reveal className="max-w-7xl mx-auto px-4">
          <SectionHead title="Yeni gələnlər" onAll={()=>nav('catalog',{category:'Yeni gələnlər'})}/>
          {grid(products.slice(2,7))}
        </Reveal>
      </section>

      {/* Discounts */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <Reveal>
        <SectionHead title="Endirimlər" onAll={()=>nav('catalog',{category:'Endirimlər'})}/>
        {grid(products.filter(p=>p.discount))}
        </Reveal>
      </section>

      {/* Top Stores */}
      <section className="bg-bg2 py-12">
        <Reveal className="max-w-7xl mx-auto px-4">
          <SectionHead title="Top mağazalar" onAll={()=>nav('stores')}/>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {stores.map(s=>(
              <button key={s.id} className="shrink-0 bg-white rounded-card p-4 text-center w-36 shadow-xs border border-bdr hover:shadow-card-h hover:-translate-y-0.5 transition-all" onClick={()=>nav('catalog',{store:s})}>
                <div className="w-14 h-14 bg-bg3 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden">{s.logo ? <img src={resolveImg(s.logo) || undefined} alt={s.name} className="w-full h-full object-cover" loading="lazy" onError={e=>{e.currentTarget.style.display='none';}}/> : <span className="text-lg font-bold text-t2">{s.name[0]}</span>}</div>
                <p className="font-semibold text-sm text-brand truncate">{s.name}</p>
                <div className="flex items-center justify-center gap-1 mt-1"><Ic.Star className="w-3 h-3 text-yellow-400"/><span className="text-xs text-t2">{s.rating}</span><span className="text-xs text-t3">({s.reviews})</span></div>
                <p className="text-xs text-t3 mt-0.5">{s.products} məhsul</p>
              </button>
            ))}
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <Reveal>
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 bg-bg2 text-t2 text-[11px] font-bold tracking-widest px-3 py-1.5 rounded-full mb-4">FAQ</span>
          <h2 className="text-3xl md:text-4xl font-black text-brand">Tez-tez verilən suallar</h2>
          <p className="text-t2 mt-3 text-base">Ən çox soruşulan sualların cavabları</p>
        </div>
        <div className="space-y-3 max-w-2xl mx-auto">
          {faqs.map((f,i)=>{
            const open=openFaq===i;
            return (
              <div key={i} className={`bg-white border rounded-card overflow-hidden transition-all duration-300 ${open?'border-brand shadow-card':'border-bdr hover:border-bdr-s'}`}>
                <button className="w-full text-left px-5 py-4 font-semibold text-brand flex items-center justify-between gap-4" onClick={()=>setOpenFaq(open?null:i)}>
                  <span>{f.q}</span>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${open?'bg-brand text-white rotate-180':'bg-bg2 text-t2'}`}><Ic.ChevD className="w-4 h-4"/></span>
                </button>
                <div className={`faq-panel ${open?'open':''}`}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-t2 text-sm leading-relaxed">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="bg-brand text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-black tracking-widest mb-4">GARDROP</h3>
              <p className="text-t3 text-sm mb-4">Azərbaycanın multi-vendor geyim marketplace-i.</p>
              <div className="flex gap-2">{['F','in','ig','tw'].map(s=><div key={s} className="w-8 h-8 bg-[#1F1F1F] rounded-full flex items-center justify-center text-xs font-bold text-t2">{s}</div>)}</div>
            </div>
            <div><h4 className="font-semibold mb-3 text-sm">Kataloq</h4><ul className="space-y-2 text-[#757575] text-sm">{([['Mağazalar',()=>nav('stores')],['Kateqoriyalar',()=>nav('catalog',{category:'Hamısı'})],['Endirimlər',()=>nav('catalog',{category:'Endirimlər'})],['Yeni gələnlər',()=>nav('catalog',{category:'Yeni gələnlər'})]] as [string, () => void][]).map(([l,go])=><li key={l}><button className="hover:text-white transition-colors" onClick={go}>{l}</button></li>)}</ul></div>
            <div><h4 className="font-semibold mb-3 text-sm">Dəstək</h4><ul className="space-y-2 text-[#757575] text-sm"><li>mail@support.com</li><li>+994 12 345 67 89</li><li><button className="hover:text-white transition-colors" onClick={()=>nav('delivery')}>Çatdırılma</button></li><li><button className="hover:text-white transition-colors" onClick={()=>nav('returns')}>Geri qaytarma</button></li></ul></div>
            <div><h4 className="font-semibold mb-3 text-sm">Hüquqi</h4><ul className="space-y-2 text-[#757575] text-sm">{([['Gizlilik','privacy'],['Qaydalar','terms'],['Cookies','cookies']] as [string,string][]).map(([l,pg])=><li key={pg}><button className="hover:text-white transition-colors" onClick={()=>nav(pg)}>{l}</button></li>)}</ul></div>
          </div>
          <div className="border-t border-[#1F1F1F] pt-6 text-center text-[#555555] text-sm">© 2026 Gardrop • <button className="hover:text-[#9E9E9E] transition-colors" onClick={()=>nav('privacy')}>Gizlilik</button> • <button className="hover:text-[#9E9E9E] transition-colors" onClick={()=>nav('terms')}>Qaydalar</button></div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
