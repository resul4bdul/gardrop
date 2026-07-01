/* CatalogPage + StoresPage (B.3: GardropApp.tsx-dən çıxarıldı). */
import React from "react";
import { Ic, ProductCard, ProductCardSkeleton, resolveImg, t } from '../shared';
import { recommendSize } from '../sizing';
import type { CommonProps, NavFn, Product, Store } from '../types';

const { useState, useEffect } = React;

const CatalogPage = ({ nav, favs, togFav, addCart, cart, user, activeCat, activeStore, products, stores, categories, catalogLoading }: CommonProps & { activeCat: string; activeStore: Store | string | null }) => {
  const [cat, setCat] = useState(activeCat||'Kişi');
  const [sort, setSort] = useState('newest');
  const [subcats, setSubcats] = useState<string[]>([]);
  const [subsub, setSubsub] = useState<string[]>([]);
  const [colorSel, setColorSel] = useState<string[]>([]);
  const [sizeSel, setSizeSel] = useState<string[]>([]);
  const [matSel, setMatSel] = useState<string[]>([]);
  const [onlyDisc, setOnlyDisc] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(9999);
  const [mFilters, setMFilters] = useState(false);
  useEffect(()=>{ if(activeCat){ setCat(activeCat); } },[activeCat]);
  useEffect(()=>{ setSubsub([]); },[subcats]);

  const isAll     = cat==='Hamısı';
  const isSpecial = isAll || ['Yeni gələnlər','Endirimlər','Sənə uyğun'].includes(cat);
  const isStore   = !!activeStore;
  // activeStore obyekt (tam profil) və ya köhnə ad string ola bilər — hər ikisini normalizə et
  const storeObj  = (typeof activeStore==='object' && activeStore) ? activeStore
    : (typeof activeStore==='string' ? (stores.find(s=>s.name===activeStore) || null) : null);
  const storeName = storeObj ? storeObj.name : (typeof activeStore==='string' ? activeStore : '');
  const catObj   = categories.find(c=>c.name===cat);
  const subs     = catObj?.subcategories || ['T-shirt','Köynək','Polo','Hoodie','Şalvar','Paltar'];
  // Seçilmiş alt-kateqoriyaların alt-alt-kateqoriyaları (3-cü səviyyə)
  const subChildren = [...new Set((catObj?.tree||[]).filter(t=>subcats.includes(t.name)).flatMap(t=>t.children||[]))];
  const leftCats = categories.length ? categories.map(c=>c.name) : ['Kişi','Qadın','Uşaq','Ayaqqabı'];
  const showFilters = !isSpecial && !isStore;
  const crumb = isAll ? 'Bütün məhsullar' : cat;

  // Bu kateqoriya/mağaza üçün baza dəst — facet (rəng/ölçü/material) seçimləri bundan çıxır
  const baseSet = isStore ? products.filter(p=>p.store===storeName)
    : cat==='Endirimlər' ? products.filter(p=>p.discount)
    : cat==='Sənə uyğun' ? products.filter(p=>{
        if(!user) return true;
        const pg=p.gender||p.category;
        if(user.cins==='Kişi'&&pg==='Qadın') return false;
        if(user.cins==='Qadın'&&pg==='Kişi') return false;
        if(p.category==='Uşaq') return false;
        const rec=recommendSize(user,p);
        return !(rec.hasMeasurements&&rec.fits===false);
      })
    : (cat==='Yeni gələnlər'||isAll) ? products
    : products.filter(p=>p.category===cat);

  const SZORD = ['XS','S','M','L','XL','XXL','XXXL'];
  const sizeSortFn = (a: string,b: string)=>{ const na=Number(a),nb=Number(b); if(!isNaN(na)&&!isNaN(nb)) return na-nb; const ia=SZORD.indexOf(a),ib=SZORD.indexOf(b); return (ia<0?99:ia)-(ib<0?99:ib); };
  const inStockSizes = (p: Product)=>{ const ss=p.sizeStock||{}; const keys=Object.keys(ss); return keys.length?keys.filter(k=>(ss[k]||0)>0):(p.sizes||[]); };
  const facetColors = [...new Set(baseSet.map(p=>p.color).filter((c): c is string => !!c))].sort();
  const facetSizes  = [...new Set(baseSet.flatMap(p=>p.sizes||[]))].sort(sizeSortFn);
  const facetMats   = [...new Set(baseSet.map(p=>p.material).filter((m): m is string => !!m))].sort();
  const priceCeil   = Math.max(50, ...baseSet.map(p=>Math.ceil(p.price||0)));

  // Kateqoriya/mağaza dəyişəndə bütün filtrləri sıfırla
  useEffect(()=>{ setSubcats([]); setSubsub([]); setColorSel([]); setSizeSel([]); setMatSel([]); setOnlyDisc(false); setMinPrice(0); setMaxPrice(priceCeil); },[cat,activeStore]);

  const activeFilterCount = subcats.length+subsub.length+colorSel.length+sizeSel.length+matSel.length+(onlyDisc?1:0)+(minPrice>0?1:0)+(maxPrice<priceCeil?1:0);
  const clearFilters = ()=>{ setSubcats([]); setSubsub([]); setColorSel([]); setSizeSel([]); setMatSel([]); setOnlyDisc(false); setMinPrice(0); setMaxPrice(priceCeil); };
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>)=>(v: string)=> setter(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);

  let filtered = baseSet;
  if (showFilters && subcats.length) filtered = filtered.filter(p=>subcats.includes(p.subcategory||''));
  if (showFilters && subsub.length) filtered = filtered.filter(p=>subsub.includes(p.subSubcategory||''));
  if (colorSel.length) filtered = filtered.filter(p=>colorSel.includes(p.color||''));
  if (matSel.length) filtered = filtered.filter(p=>matSel.includes(p.material||''));
  if (sizeSel.length) filtered = filtered.filter(p=>{ const av=inStockSizes(p); return sizeSel.some(s=>av.includes(s)); });
  if (onlyDisc) filtered = filtered.filter(p=>p.discount);
  filtered = filtered.filter(p=>p.price>=minPrice && p.price<=maxPrice);
  filtered = [...filtered].sort((a,b)=> sort==='price_asc'?a.price-b.price : sort==='price_desc'?b.price-a.price : sort==='rating'?(b.rating||0)-(a.rating||0) : b.id-a.id );
  const cp = { nav, favs, togFav, addCart, cart, user };
  const sortLabels: Record<string, string> = { newest:'Ən yenilər', price_asc:'Ucuzdan bahaya', price_desc:'Bahadan ucuza', rating:'Ən yüksək reytinq' };
  const heading = isStore ? storeName : isAll ? 'Bütün məhsullar' : isSpecial ? cat : `${cat} üçün geyimlər`;

  // Mağaza profil başlığı (banner + logo + reyting + haqqında + sosial + çatdırılma/qaytarma)
  const socials = storeObj ? ([
    ['Instagram', storeObj.instagram && (storeObj.instagram.startsWith('http')?storeObj.instagram:`https://instagram.com/${storeObj.instagram.replace(/^@/,'')}`)],
    ['Facebook',  storeObj.facebook  && (storeObj.facebook.startsWith('http')?storeObj.facebook:`https://facebook.com/${storeObj.facebook}`)],
    ['TikTok',    storeObj.tiktok    && (storeObj.tiktok.startsWith('http')?storeObj.tiktok:`https://tiktok.com/@${storeObj.tiktok.replace(/^@/,'')}`)],
    ['WhatsApp',  storeObj.whatsapp  && `https://wa.me/${storeObj.whatsapp.replace(/[^\d]/g,'')}`],
  ] as [string, string|false|undefined][]).filter(([,u])=>!!u) : [];
  const storeHeader = isStore ? (
    <div className="mb-6">
      {storeObj?.banner && (
        <div className="h-32 sm:h-44 w-full rounded-sheet2 overflow-hidden bg-bg3 mb-4">
          <img src={resolveImg(storeObj.banner) || undefined} alt={storeName} className="w-full h-full object-cover" loading="lazy" onError={e=>{e.currentTarget.style.display='none';}}/>
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-bg3 flex items-center justify-center shrink-0 overflow-hidden border border-bdr">
          {storeObj?.logo ? <img src={resolveImg(storeObj.logo) || undefined} alt={storeName} className="w-full h-full object-cover" loading="lazy" onError={e=>{e.currentTarget.style.display='none';}}/> : <span className="text-2xl font-bold text-t2">{storeName[0]}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-brand">{storeName}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-sm">
            <span className="flex items-center gap-1"><Ic.Star className="w-4 h-4 text-yellow-400"/><span className="font-semibold text-brand">{storeObj?.rating ?? 0}</span><span className="text-t3">({storeObj?.reviews ?? 0} rəy)</span></span>
            {storeObj?.city && <><span className="text-bdr-s">•</span><span className="text-t2">{storeObj.city}</span></>}
            <span className="text-bdr-s">•</span><span className="text-t2">{baseSet.length} məhsul</span>
            {storeObj?.established ? <><span className="text-bdr-s">•</span><span className="text-t2">{storeObj.established}-dən</span></> : null}
          </div>
          {storeObj?.about && <p className="text-sm text-t2 leading-relaxed mt-2 max-w-2xl">{storeObj.about}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {socials.map(([label,url])=>(
              <a key={label} href={url as string} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-t2 border border-bdr rounded-full px-3 py-1 hover:border-brand hover:text-brand transition-colors">{label}</a>
            ))}
            {(storeObj?.prepDays!=null || storeObj?.returnDays!=null) && (
              <span className="text-xs text-t3">
                {storeObj?.prepDays!=null && `Hazırlıq: ${storeObj.prepDays} gün`}
                {storeObj?.prepDays!=null && storeObj?.returnDays!=null && ' · '}
                {storeObj?.returnDays!=null && `Qaytarma: ${storeObj.returnDays} gün`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // Filtr paneli (həm masaüstü yan panel, həm mobil açılan panel üçün)
  const isDiscountPage = cat==='Endirimlər';
  const filterPanel = isDiscountPage ? (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-t2 uppercase tracking-wide">{t('Filtrlər')}</h4>
      <label className="flex items-center gap-2 py-1 cursor-pointer">
        <input type="checkbox" checked readOnly className="rounded accent-[#0A0A0A]" onChange={()=>nav('catalog',{category:'Hamısı'})}/>
        <span className="text-sm font-medium text-brand">Endirimli</span>
      </label>
    </div>
  ) : isAll ? (
    <div className="space-y-5">
      <div>
        <h4 className="text-xs font-semibold text-t2 mb-2 uppercase tracking-wide">{t('Qiymət')}: <span className="text-brand normal-case">{minPrice}–{maxPrice} ₼</span></h4>
        <input type="range" min="0" max={priceCeil} value={minPrice} onChange={e=>setMinPrice(Math.min(Number(e.target.value),maxPrice))} className="w-full accent-[#0A0A0A]"/>
        <input type="range" min="0" max={priceCeil} value={maxPrice} onChange={e=>setMaxPrice(Math.max(Number(e.target.value),minPrice))} className="w-full accent-[#0A0A0A]"/>
        <div className="flex justify-between text-xs text-t3"><span>0 ₼</span><span>{priceCeil} ₼</span></div>
      </div>
      <label className="flex items-center gap-2 py-1 cursor-pointer border-t border-bdr pt-3">
        <input type="checkbox" className="rounded accent-[#0A0A0A]" checked={onlyDisc} onChange={e=>setOnlyDisc(e.target.checked)}/>
        <span className="text-sm font-medium text-brand">Endirimli</span>
      </label>
    </div>
  ) : (
    <div className="space-y-5">
      {showFilters && (
        <div>
          <h4 className="text-xs font-semibold text-t2 mb-2 uppercase tracking-wide">{t('Alt kateqoriya')}</h4>
          {subs.slice(0,8).map(s=>(
            <label key={s} className="flex items-center gap-2 py-1 cursor-pointer">
              <input type="checkbox" className="rounded accent-[#0A0A0A]" checked={subcats.includes(s)} onChange={()=>toggle(setSubcats)(s)}/>
              <span className="text-sm text-t2">{s}</span>
            </label>
          ))}
        </div>
      )}
      <div>
        <h4 className="text-xs font-semibold text-t2 mb-2 uppercase tracking-wide">{t('Qiymət')}: <span className="text-brand normal-case">{minPrice}–{maxPrice} ₼</span></h4>
        <input type="range" min="0" max={priceCeil} value={minPrice} onChange={e=>setMinPrice(Math.min(Number(e.target.value),maxPrice))} className="w-full accent-[#0A0A0A]"/>
        <input type="range" min="0" max={priceCeil} value={maxPrice} onChange={e=>setMaxPrice(Math.max(Number(e.target.value),minPrice))} className="w-full accent-[#0A0A0A]"/>
        <div className="flex justify-between text-xs text-t3"><span>0 ₼</span><span>{priceCeil} ₼</span></div>
      </div>
      {facetSizes.length>0 && (
        <div>
          <h4 className="text-xs font-semibold text-t2 mb-2 uppercase tracking-wide">{t('Ölçü (stokda)')}</h4>
          <div className="flex flex-wrap gap-1.5">
            {facetSizes.map(s=>(
              <button key={s} onClick={()=>toggle(setSizeSel)(s)} className={`min-w-9 px-2 py-1 rounded-btn border text-xs font-semibold transition-colors ${sizeSel.includes(s)?'bg-brand text-white border-brand':'bg-white text-t2 border-bdr hover:border-bdr-s'}`}>{s}</button>
            ))}
          </div>
        </div>
      )}
      {facetColors.length>0 && (
        <div>
          <h4 className="text-xs font-semibold text-t2 mb-2 uppercase tracking-wide">{t('Rəng')}</h4>
          {facetColors.map(c=>(
            <label key={c} className="flex items-center gap-2 py-1 cursor-pointer">
              <input type="checkbox" className="rounded accent-[#0A0A0A]" checked={colorSel.includes(c)} onChange={()=>toggle(setColorSel)(c)}/>
              <span className="text-sm text-t2">{c}</span>
            </label>
          ))}
        </div>
      )}
      {facetMats.length>0 && (
        <div>
          <h4 className="text-xs font-semibold text-t2 mb-2 uppercase tracking-wide">{t('Material')}</h4>
          {facetMats.slice(0,8).map(m=>(
            <label key={m} className="flex items-center gap-2 py-1 cursor-pointer">
              <input type="checkbox" className="rounded accent-[#0A0A0A]" checked={matSel.includes(m)} onChange={()=>toggle(setMatSel)(m)}/>
              <span className="text-sm text-t2 leading-tight">{m}</span>
            </label>
          ))}
        </div>
      )}
      <label className="flex items-center gap-2 py-1 cursor-pointer border-t border-bdr pt-3">
        <input type="checkbox" className="rounded accent-[#0A0A0A]" checked={onlyDisc} onChange={e=>setOnlyDisc(e.target.checked)}/>
        <span className="text-sm font-medium text-brand">Endirimli</span>
      </label>
      {activeFilterCount>0 && <button onClick={clearFilters} className="text-sm text-t2 hover:text-sale underline">{t('Filtrləri təmizlə')} ({activeFilterCount})</button>}
    </div>
  );

  return (
    <div className="pb-24 md:pb-0">
      <div className="bg-bg2 border-b border-bdr hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-t2 flex-wrap">
          <button className="hover:text-brand transition-colors" onClick={()=>nav('home')}>Ana səhifə</button>
          <Ic.ChevR className="w-3 h-3 shrink-0"/>
          {isStore
            ? <button className="hover:text-brand transition-colors" onClick={()=>nav('stores')}>Mağazalar</button>
            : isAll
              ? <span className="text-brand font-medium">Kataloq</span>
              : <button className="hover:text-brand transition-colors" onClick={()=>nav('catalog',{category:'Hamısı'})}>Kataloq</button>}
          {!isAll && <><Ic.ChevR className="w-3 h-3 shrink-0"/><span className="text-brand font-medium">{isStore?(typeof activeStore==='string'?activeStore:activeStore?.name):crumb}</span></>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isStore ? storeHeader : <h1 className="text-2xl md:text-3xl font-bold text-brand mb-5">{heading}</h1>}
        {isAll && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
            {leftCats.map(c=>(
              <button key={c} className="shrink-0 px-4 py-2 rounded-full text-sm font-medium border bg-white text-t2 border-bdr hover:border-brand hover:text-brand transition-all" onClick={()=>nav('catalog',{category:c})}>{c}</button>
            ))}
          </div>
        )}
        {showFilters && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
            {subs.map(s=>(
              <button key={s} className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${subcats.includes(s)?'bg-brand text-white border-brand':'bg-white text-t2 border-bdr hover:border-bdr-s'}`}
                onClick={()=>setSubcats(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])}>{s}</button>
            ))}
          </div>
        )}
        {showFilters && subChildren.length>0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
            {subChildren.map(s=>(
              <button key={s} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${subsub.includes(s)?'bg-accent text-accent-t border-accent':'bg-bg2 text-t2 border-bdr hover:border-bdr-s'}`}
                onClick={()=>setSubsub(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])}>{s}</button>
            ))}
          </div>
        )}

        <div className="flex gap-6">
          <aside className="hidden md:block w-52 shrink-0">
            <div className="mb-6">
              <h3 className="font-bold text-brand mb-3 text-sm">{t('Kateqoriyalar')}</h3>
              {leftCats.map(c=>(
                <button key={c} className={`block w-full text-left py-1.5 text-sm transition-colors ${!isStore&&cat===c?'text-brand font-semibold':'text-t2 hover:text-brand'}`} onClick={()=>nav('catalog',{category:c})}>{t(c)}</button>
              ))}
            </div>
            <div className="border-t border-bdr pt-5">
              <h3 className="font-bold text-brand mb-3 text-sm">{t('Filtrlər')}</h3>
              {filterPanel}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button className="md:hidden flex items-center gap-1.5 text-sm font-medium border border-bdr rounded-btn px-3 py-1.5 bg-white text-brand" onClick={()=>setMFilters(true)}>
                  <span className="text-base leading-none">⚙</span> {t('Filtrlər')}{activeFilterCount>0?` (${activeFilterCount})`:''}
                </button>
                <span className="text-sm text-t2">{filtered.length} {t('məhsul')}</span>
              </div>
              <select className="text-sm border border-bdr rounded-btn px-3 py-1.5 bg-white text-brand outline-none focus:border-brand" value={sort} onChange={e=>setSort(e.target.value)}>
                {Object.entries(sortLabels).map(([k,l])=><option key={k} value={k}>{t(l)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {catalogLoading ? Array.from({length:8}).map((_,i)=><ProductCardSkeleton key={i}/>)
                              : filtered.length ? filtered.map(p=><ProductCard key={p.id} p={p} {...cp}/>)
                              : <p className="col-span-full text-center text-t2 py-16">Bu kateqoriyada məhsul tapılmadı</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Mobil filtr çekməcəsi */}
      {mFilters && (
        <div className="fixed inset-0 z-[200] md:hidden anim-fade">
          <div className="absolute inset-0 bg-brand/40 backdrop-blur-sm" onClick={()=>setMFilters(false)}/>
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-sheet2 max-h-[80vh] overflow-y-auto anim-pop">
            <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-bdr">
              <h3 className="font-bold text-brand">{t('Filtrlər')}</h3>
              <button className="text-t3 hover:text-brand text-xl leading-none" onClick={()=>setMFilters(false)}>✕</button>
            </div>
            <div className="p-5">{filterPanel}</div>
            <div className="sticky bottom-0 bg-white border-t border-bdr p-4">
              <button className="w-full bg-brand text-white py-3 rounded-btn font-semibold" onClick={()=>setMFilters(false)}>{filtered.length} {t('məhsul')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const StoresPage = ({ nav, stores, products }: { nav: NavFn; stores: Store[]; products: Product[] }) => {
  const count = (name: string) => products.filter(p=>p.store===name).length;
  return (
    <div className="pb-24 md:pb-0">
      <div className="bg-bg2 border-b border-bdr hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-t2">
          <button className="hover:text-brand transition-colors" onClick={()=>nav('home')}>Ana səhifə</button>
          <Ic.ChevR className="w-3 h-3 shrink-0"/><span className="text-brand font-medium">Mağazalar</span>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-brand mb-1">Mağazalar</h1>
        <p className="text-t2 mb-6 text-sm">{stores.length} mağaza · Bəyəndiyiniz mağazanın bütün məhsullarına baxın</p>
        {stores.length===0 ? <p className="text-t2 text-sm py-16 text-center">Mağaza tapılmadı</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map(s=>(
              <button key={s.id} className="bg-white rounded-card border border-bdr shadow-xs p-5 text-left hover:shadow-card-h hover:-translate-y-0.5 transition-all flex items-center gap-4" onClick={()=>nav('catalog',{store:s})}>
                <div className="w-14 h-14 bg-bg3 rounded-full flex items-center justify-center shrink-0 overflow-hidden">{s.logo ? <img src={resolveImg(s.logo) || undefined} alt={s.name} className="w-full h-full object-cover" loading="lazy" onError={e=>{e.currentTarget.style.display='none';}}/> : <span className="text-xl font-bold text-t2">{s.name[0]}</span>}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-brand truncate">{s.name}</p>
                  <div className="flex items-center gap-1 mt-0.5"><Ic.Star className="w-3.5 h-3.5 text-yellow-400"/><span className="text-sm text-t2">{s.rating}</span><span className="text-xs text-t3">({s.reviews})</span></div>
                  <p className="text-xs text-t3 mt-0.5">{s.city} · {count(s.name)} məhsul mövcuddur</p>
                </div>
                <Ic.ChevR className="w-4 h-4 text-t3 shrink-0"/>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogPage;
