/* ProductDetailPage + SizeGuideModal (B.3: GardropApp.tsx-dən çıxarıldı). */
import React from "react";
import { Ic, Img, Stars, Spinner, ProductCard, API, bearer, uploadFiles, resolveImg, t } from '../shared';
import type { CommonProps, Product, Review, SizeChartRow, SizeResult } from '../types';

const { useState, useEffect, useRef } = React;

/* ══════════════════════════════════════ SIZE GUIDE MODAL ══════════════════════════════════════ */
export const SizeGuideModal = ({ isShoe, gender='Kişi', custom=null, onClose }: { isShoe: boolean; gender?: string; custom?: { system?: string; rows: SizeChartRow[] } | null; onClose: () => void }) => {
  // Mağazanın öz ölçü sistemi — yalnız bu məhsulun cədvəlini göstər (cinsi/INT/TR yox)
  if (custom) {
    const rows = (custom.rows||[]).filter(r=>r && r.size);
    const fmt = (mn?: number | null, mx?: number | null)=> mn!=null&&mx!=null?`${mn}–${mx}`:mn!=null?`${mn}+`:mx!=null?`≤${mx}`:'—';
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center px-4 anim-fade">
        <div className="absolute inset-0 bg-brand/40 backdrop-blur-sm" onClick={onClose}/>
        <div className="relative bg-white rounded-sheet2 p-6 sm:p-8 w-full max-w-md shadow-pop anim-pop max-h-[85vh] overflow-y-auto">
          <button className="absolute top-4 right-4 text-t3 hover:text-brand transition-colors" onClick={onClose}><Ic.X className="w-5 h-5"/></button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{backgroundColor:'#69EA9B'}}><Ic.Ruler className="w-5 h-5" style={{color:'#0A4020'}}/></div>
            <div><h2 className="text-lg font-bold text-brand">Ölçü cədvəli</h2><p className="text-xs text-t2">Bu məhsula özəl ölçü sistemi{custom.system?` — ${custom.system}`:''}</p></div>
          </div>
          {rows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-t3 text-xs uppercase tracking-wide border-b border-bdr"><th className="py-2 pr-3">Ölçü</th><th className="py-2 pr-3">Boy (sm)</th><th className="py-2 pr-3">Çəki (kg)</th></tr></thead>
                <tbody>{rows.map((r,i)=>(<tr key={i} className="border-b border-bdr last:border-0"><td className="py-2.5 pr-3 font-bold text-brand">{r.size}</td><td className="py-2.5 pr-3 text-t2">{fmt(r.boyMin,r.boyMax)}</td><td className="py-2.5 pr-3 text-t2">{fmt(r.cekiMin,r.cekiMax)}</td></tr>))}</tbody>
              </table>
            </div>
          ) : (<p className="text-sm text-t2">Bu məhsul üçün ölçü cədvəli əlavə olunmayıb.</p>)}
          <p className="text-xs text-t3 mt-3 leading-relaxed">💡 Boy və çəkinizi profilinizdə doldurun — AI bu cədvələ görə sizə uyğun ölçünü avtomatik seçəcək.</p>
        </div>
      </div>
    );
  }
  const tables: Record<string, { head: string[]; rows: string[][] }> = {
    'Qadın': {
      head: ['INT','TR','Sinə (sm)','Bel (sm)','Omba (sm)'],
      rows: [
        ['XS','34','78–82','60–64','86–90'],
        ['S','36','82–86','64–68','90–94'],
        ['M','38','86–92','68–74','94–100'],
        ['L','40','92–98','74–80','100–106'],
        ['XL','42','98–104','80–86','106–112'],
        ['XXL','44','104–112','86–94','112–118'],
      ],
    },
    'Kişi': {
      head: ['INT','Sinə (sm)','Bel (sm)','Omba (sm)'],
      rows: [
        ['XS','82–88','70–76','84–90'],
        ['S','88–94','76–82','90–96'],
        ['M','94–100','82–88','96–102'],
        ['L','100–106','88–94','102–108'],
        ['XL','106–112','94–100','108–114'],
        ['XXL','112–118','100–108','114–120'],
      ],
    },
    shoe: {
      head: ['EU','Ayaq (sm)','UK'],
      rows: [['40','25.0','6.5'],['41','25.7','7.5'],['42','26.5','8.5'],['43','27.3','9.5'],['44','28.0','10']],
    },
  };
  const tbl = isShoe ? tables.shoe : (tables[gender] || tables['Kişi']);
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4 anim-fade">
      <div className="absolute inset-0 bg-brand/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-sheet2 p-6 sm:p-8 w-full max-w-lg shadow-pop anim-pop max-h-[85vh] overflow-y-auto">
        <button className="absolute top-4 right-4 text-t3 hover:text-brand transition-colors" onClick={onClose}><Ic.X className="w-5 h-5"/></button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{backgroundColor:'#69EA9B'}}><Ic.Ruler className="w-5 h-5" style={{color:'#0A4020'}}/></div>
          <div><h2 className="text-lg font-bold text-brand">Ölçü cədvəli</h2><p className="text-xs text-t2">{isShoe?'Ayaqqabı ölçüləri':`Beynəlxalq INT standartı (sm) — ${gender}`}</p></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-t3 text-xs uppercase tracking-wide border-b border-bdr">{tbl.head.map(h=><th key={h} className="py-2 pr-3">{h}</th>)}</tr></thead>
            <tbody>{tbl.rows.map(r=>(<tr key={r[0]} className="border-b border-bdr last:border-0">{r.map((c,i)=><td key={i} className={`py-2.5 pr-3 ${i===0?'font-bold text-brand':'text-t2'}`}>{c}</td>)}</tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════ PRODUCT DETAIL ══════════════════════════════════════ */
const ProductDetailPage = ({ p, nav, favs, togFav, addCart, removeFromCart, cart, user, token, products, showAuthPopup }: CommonProps & { p: Product | null; token: string | null }) => {
  const [sz, setSz] = useState(p?.size||'L');
  const [imgIdx, setImgIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);  // mobil karusel scroll konteyneri
  const [descOpen, setDescOpen] = useState(true);
  const [sizeRec, setSizeRec] = useState<SizeResult | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const [recLoading, setRecLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [revRating, setRevRating] = useState(5);
  const [revText, setRevText] = useState('');
  const [revBusy, setRevBusy] = useState(false);
  const [revPhotos, setRevPhotos] = useState<string[]>([]);
  const [revUploading, setRevUploading] = useState(false);
  const [revError, setRevError] = useState('');
  const [canReview, setCanReview] = useState(false);
  const [reviewedAlready, setReviewedAlready] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const sizes = p?.sizes || ['S','M','L','XL','XXL'];
  const isFav = p && favs.includes(p.id);
  const inCart = p && cart.some(c=>c.id===p.id);
  const cp = { nav, favs, togFav, addCart, cart, user };

  useEffect(()=>{
    if(!p) return;
    setImgIdx(0);
    // Stok datası varsa stokda olan ilk ölçünü seç (defolt ölçü bitibsə)
    const ss = p.sizeStock||{};
    if(Object.keys(ss).length){
      const inStock = (p.sizes||[]).filter(s=>(ss[s]||0)>0);
      const def = p.size||'';
      setSz(inStock.includes(def)?def:(inStock[0]||def||'L'));
    } else setSz(p.size||'L');
  },[p?.id]);

  useEffect(()=>{
    if(!p) return;
    fetch(`${API}/api/reviews/${p.id}`).then(r=>r.json()).then(d=>Array.isArray(d)&&setReviews(d)).catch(()=>{});
    if(user){
      setRecLoading(true);
      fetch(`${API}/api/size-recommendation/${p.id}`,{headers:bearer(token),cache:'no-store'})
        .then(r=>r.json()).then(rec=>{ setSizeRec(rec); if(rec?.size) setSz(rec.size); })
        .catch(()=>{}).finally(()=>setRecLoading(false));
      // Rəy haqqı: yalnız alıb-çatdırılmış, hələ rəy verməmiş istifadəçi
      fetch(`${API}/api/reviews/eligible`,{headers:bearer(token)}).then(r=>r.json()).then(d=>{
        if(d&&Array.isArray(d.pending)){ setCanReview(d.pending.includes(p.id)); setReviewedAlready(Array.isArray(d.reviewed)&&d.reviewed.includes(p.id)); }
      }).catch(()=>{});
    } else { setSizeRec(null); setCanReview(false); setReviewedAlready(false); }
  },[p?.id, user, token]);

  if (!p) return <div className="flex items-center justify-center h-64 text-t3">Məhsul tapılmadı</div>;

  const related = products.filter(x=>x.id!==p.id && x.category===p.category).slice(0,4);
  const imgs = (p.imageUrls && p.imageUrls.length) ? p.imageUrls.map(u=>resolveImg(u) as string) : [];
  const imgTotal = imgs.length || 1;
  // Per-ölçü stok: data varsa stokda olmayan ölçülər deaktiv olunur
  const hasStockData = !!(p.sizeStock && Object.keys(p.sizeStock).length>0);
  const stockOf = (s: string)=> hasStockData ? (p.sizeStock?.[s]||0) : 1;
  const szOut = hasStockData && stockOf(sz)<=0;

  const addRevPhotos = async (files: FileList | null) => {
    if(!files||!files.length) return;
    setRevUploading(true); setRevError('');
    try{ const urls = await uploadFiles(files, token); setRevPhotos(prev=>[...prev,...urls].slice(0,5)); }
    catch(e){ setRevError((e as Error)?.message||'Şəkil yüklənmədi'); }
    setRevUploading(false);
  };
  const submitReview = async () => {
    if(!user){ showAuthPopup?.(); return; }
    setRevBusy(true); setRevError('');
    try{
      const r = await fetch(`${API}/api/reviews/${p.id}`,{method:'POST',headers:bearer(token),body:JSON.stringify({rating:revRating,comment:revText,imageUrls:revPhotos})});
      const nr = await r.json();
      if(nr.id){ setReviews(prev=>[nr,...prev]); setRevText(''); setRevRating(5); setRevPhotos([]); setCanReview(false); setReviewedAlready(true); }
      else setRevError(nr.error||'Rəy göndərilmədi');
    }catch{ setRevError('Xəta baş verdi'); }
    setRevBusy(false);
  };

  return (
    <div className="pb-24 md:pb-0">
      <div className="bg-bg2 border-b border-bdr hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-t2 flex-wrap">
          <button className="hover:text-brand transition-colors" onClick={()=>nav('home')}>Ana səhifə</button>
          <Ic.ChevR className="w-3 h-3 shrink-0"/>
          <button className="hover:text-brand transition-colors" onClick={()=>nav('catalog',{category:p.category})}>{p.category}</button>
          <Ic.ChevR className="w-3 h-3 shrink-0"/><span className="text-brand font-medium truncate max-w-40">{p.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Gallery */}
          <div className="md:w-1/2">
            <div className="md:max-w-[420px] md:mx-auto">
              {/* Mobil: barmaqla axan hamar karusel (scroll-snap) */}
              <div className="relative md:hidden">
                <div ref={trackRef}
                  onScroll={e=>{ const el=e.currentTarget; const i=Math.round(el.scrollLeft/el.clientWidth); if(i!==imgIdx) setImgIdx(i); }}
                  className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide rounded-sheet2"
                  style={{ WebkitOverflowScrolling:'touch' }}>
                  {(imgs.length?imgs:['']).map((u,i)=>(
                    <div key={i} className="snap-center shrink-0 w-full" onClick={()=>imgs.length&&setLightbox(true)}>
                      <Img className="w-full aspect-square" src={u} alt={p.name}/>
                    </div>
                  ))}
                </div>
                {imgTotal>1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {imgs.map((_,i)=>(
                      <button key={i} aria-label={`Şəkil ${i+1}`}
                        onClick={()=>{ const el=trackRef.current; if(el) el.scrollTo({left:i*el.clientWidth, behavior:'smooth'}); }}
                        className={`h-1.5 rounded-full transition-all ${imgIdx%imgTotal===i?'bg-brand w-4':'bg-white/80 w-1.5 shadow'}`}/>
                    ))}
                  </div>
                )}
              </div>
              {/* Desktop: tək şəkil + oxlar (dəyişməyib) */}
              <div className="relative hidden md:block">
                <div className="cursor-zoom-in select-none" onClick={()=>imgs.length&&setLightbox(true)} title="Böyütmək üçün klikləyin">
                  <Img className="w-full aspect-square rounded-sheet2" src={imgs[imgIdx%imgTotal]} alt={p.name}/>
                </div>
                {imgTotal>1 && <>
                  <button className="flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-card items-center justify-center text-brand hover:scale-105 transition" onClick={()=>setImgIdx(i=>(i-1+imgTotal)%imgTotal)}><Ic.ChevL className="w-5 h-5"/></button>
                  <button className="flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-card items-center justify-center text-brand hover:scale-105 transition" onClick={()=>setImgIdx(i=>(i+1)%imgTotal)}><Ic.ChevR className="w-5 h-5"/></button>
                </>}
              </div>
              <div className="flex gap-2 mt-3">
                {(imgs.length?imgs:[null,null,null,null]).map((u,i)=>(
                  <button key={i} className={`rounded-card overflow-hidden border-2 transition-all ${imgIdx===i?'border-brand':'border-transparent'}`} onClick={()=>{ setImgIdx(i); const el=trackRef.current; if(el&&el.clientWidth) el.scrollTo({left:i*el.clientWidth, behavior:'smooth'}); }}><Img className="w-16 h-16" src={u} alt=""/></button>
                ))}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="md:w-1/2">
            <p className="text-[10px] text-t3 uppercase tracking-[0.08em] font-bold mb-1">{p.store}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-brand mb-2">{p.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <Ic.Star className="w-4 h-4 text-yellow-400"/><span className="font-semibold text-brand">{p.rating}</span>
              <span className="text-bdr-s">•</span><span className="text-t2 text-sm">{p.reviews} qiymətləndirmə</span>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-black text-brand">{p.price} ₼</span>
              {p.oldPrice && <span className="text-lg text-t3 line-through">{p.oldPrice} ₼</span>}
              {p.discount && <span className="bg-sale text-white text-sm font-bold px-2 py-0.5 rounded-badge">-{p.discount}%</span>}
            </div>

            {/* Size selector */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-brand text-sm">Ölçü: <strong>{sz}</strong></span>
                <button className="text-sm text-t3 underline hover:text-brand transition-colors" onClick={()=>setGuideOpen(true)}>Ölçü bələdçisi</button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {sizes.map(s=>{
                  const out = hasStockData && stockOf(s)<=0;
                  return (
                    <button key={s} disabled={out} title={out?'Stokda yoxdur':(hasStockData?`Stokda: ${stockOf(s)}`:'')}
                      className={`relative min-w-12 h-10 px-3 rounded-btn border-2 text-sm font-semibold transition-all ${out?'border-bdr text-t3 line-through opacity-50 cursor-not-allowed':sz===s?'border-brand bg-brand text-white':'border-bdr text-t2 hover:border-bdr-s'}`}
                      onClick={()=>!out&&setSz(s)}>{s}</button>
                  );
                })}
              </div>
              {hasStockData && !szOut && <p className="text-xs text-t3 mt-2">{sz} ölçüsündən stokda: <b className="text-brand">{stockOf(sz)}</b> ədəd</p>}
              {szOut && <p className="text-xs text-sale mt-2">Seçilmiş ölçü stokda yoxdur — başqa ölçü seçin.</p>}
            </div>

            {/* AI Size box */}
            {!user ? (
              <button className="w-full border border-bdr rounded-card p-4 mb-5 text-left hover:bg-bg2 transition-colors group/ai" onClick={showAuthPopup}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{backgroundColor:'#69EA9B'}}><Ic.Sparkles className="w-5 h-5" style={{color:'#0A4020'}}/></div>
                  <div className="flex-1"><p className="font-semibold text-brand text-sm">AI ölçü məsləhəti</p><p className="text-xs text-t2 mt-0.5">Aktivləşdirmək üçün hesaba daxil olun</p></div>
                  <Ic.ChevR className="w-4 h-4 text-t3 group-hover/ai:text-brand transition-colors shrink-0"/>
                </div>
              </button>
            ) : recLoading ? (
              <div className="rounded-card p-4 mb-5 bg-bg2 flex items-center gap-3 text-t2 text-sm"><Spinner className="w-5 h-5"/> AI ölçü hesablanır…</div>
            ) : sizeRec && sizeRec.fits===false ? (
              <div className="rounded-card p-4 mb-5" style={{backgroundColor:'#FFF1F1',border:'1px solid #FECACA'}}>
                <div className="flex items-start gap-2.5">
                  <Ic.X className="w-5 h-5 shrink-0 mt-0.5" style={{color:'#B91C1C'}}/>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg" style={{color:'#B91C1C'}}>Sənə uyğun deyil</p>
                    <p className="text-sm mt-1" style={{color:'#7F1D1D'}}>{sizeRec.message || 'Bu geyimin sizin ölçünüzə uyğun forması yoxdur.'}</p>
                  </div>
                </div>
              </div>
            ) : sizeRec ? (
              <div className="rounded-card p-4 mb-5" style={{backgroundColor:'#69EA9B'}}>
                <div className="flex items-start gap-2.5">
                  <Ic.Sparkles className="w-5 h-5 shrink-0 mt-0.5" style={{color:'#0A3020'}}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg leading-none" style={{color:'#0A3020'}}>Sənə uyğun: {sizeRec.size}</span>
                      <span className="text-[11px] font-bold px-2 py-1 rounded-badge leading-none" style={{backgroundColor:'#0A3020',color:'#69EA9B'}}>{sizeRec.accuracy}% doğruluq</span>
                    </div>
                    {sizeRec.hasMeasurements ? (
                      <>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-[13px]" style={{color:'#0A4020'}}>
                          {sizeRec.fit && <span><b>Oturuş:</b> {sizeRec.fit}</span>}
                          {sizeRec.alternative && sizeRec.accuracy<85 && <span><b>Alternativ ölçü:</b> {sizeRec.alternative}</span>}
                        </div>
                        {Array.isArray(sizeRec.risks) && sizeRec.risks.length>0 && (
                          <ul className="mt-2 space-y-0.5">
                            {sizeRec.risks.slice(0,3).map((r,i)=>(<li key={i} className="text-[12px] flex gap-1.5" style={{color:'#0A4020'}}><span>⚠</span><span>{r}</span></li>))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <button className="text-sm font-semibold mt-1 underline" style={{color:'#0A3020'}} onClick={()=>nav('profile',{tab:'olculer'})}>Ölçülərinizi əlavə edin →</button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Buttons — toggle: səbətdədirsə yenidən klik səbətdən çıxarır */}
            <button disabled={szOut && !inCart}
              className={`w-full py-3.5 rounded-btn font-semibold mb-3 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${inCart?'bg-bg2 text-brand border-2 border-bdr hover:border-bdr-s':'bg-brand text-white hover:bg-brand-h'}`}
              onClick={()=> inCart ? removeFromCart(p.id) : addCart(p, sz)}>
              {inCart?t('✓ Səbətdə'):szOut?t('Stokda yoxdur'):t('Səbətə əlavə et')}
            </button>
            <button className={`w-full border-2 py-3.5 rounded-btn font-semibold transition-all active:scale-[0.99] ${isFav?'border-red-300 text-red-500 bg-red-50':'border-bdr text-brand hover:border-bdr-s'}`} onClick={()=>togFav(p.id)}>
              {isFav?`♥ ${t('Seçilmişlər')}`:`♡ ${t('Seçilmişlərə əlavə et')}`}
            </button>

            {/* Description */}
            <div className="mt-5 border border-bdr rounded-card overflow-hidden">
              <button className="w-full flex items-center justify-between px-5 py-4 font-semibold text-brand text-sm" onClick={()=>setDescOpen(x=>!x)}>
                {t('Məhsul haqqında')}<Ic.ChevD className={`w-4 h-4 text-t3 transition-transform ${descOpen?'rotate-180':''}`}/>
              </button>
              {descOpen && (
                <div className="px-5 pb-5 text-sm text-t2 leading-relaxed space-y-3 anim-fade">
                  <p>{p.description}</p>
                  <ul className="space-y-1.5 list-disc list-inside">
                    <li><strong>Rəng:</strong> {p.color}</li>
                    <li><strong>Material:</strong> {p.material}</li>
                    <li><strong>Mağaza:</strong> {p.store}</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-14 max-w-3xl">
          <h2 className="text-2xl font-bold text-brand mb-6">{t('Rəylər')} <span className="text-t3 font-normal text-lg">({reviews.length})</span></h2>
          {canReview ? (
            <div className="bg-bg2 rounded-card p-5 mb-6">
              <p className="font-semibold text-brand text-sm mb-1">Rəy yazın</p>
              <p className="text-xs text-t3 mb-3">Bu məhsulu aldınız — təcrübənizi ulduz, şərh və şəkillə paylaşın.</p>
              <div className="flex items-center gap-1 mb-3">
                {[1,2,3,4,5].map(n=>(
                  <button key={n} onClick={()=>setRevRating(n)}><Ic.Star className={`w-6 h-6 ${n<=revRating?'text-yellow-400':'text-bdr'}`}/></button>
                ))}
              </div>
              <textarea value={revText} onChange={e=>setRevText(e.target.value)} placeholder="Təcrübənizi paylaşın..."
                className="w-full bg-white border border-bdr rounded-btn px-4 py-3 text-sm text-brand outline-none placeholder-t3 focus:border-brand focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] transition-all resize-none" rows={3}/>
              {/* Şəkil yükləmə */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {revPhotos.map((u,i)=>(
                  <div key={i} className="relative w-16 h-16 rounded-[10px] overflow-hidden border border-bdr group">
                    <Img className="w-full h-full" src={u} alt="rəy şəkli"/>
                    <button onClick={()=>setRevPhotos(ps=>ps.filter((_,j)=>j!==i))} className="absolute top-0.5 right-0.5 w-5 h-5 bg-brand/80 text-white rounded-full text-xs flex items-center justify-center">✕</button>
                  </div>
                ))}
                {revPhotos.length<5 && (
                  <label className="w-16 h-16 rounded-[10px] border-2 border-dashed border-bdr-s flex items-center justify-center cursor-pointer hover:border-brand transition-colors text-t3">
                    {revUploading ? <Spinner className="w-5 h-5"/> : <span className="text-2xl leading-none">＋</span>}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e=>{addRevPhotos(e.target.files); e.target.value='';}}/>
                  </label>
                )}
              </div>
              {revError && <p className="text-xs text-sale mt-2">{revError}</p>}
              <button onClick={submitReview} disabled={revBusy||revUploading}
                className="mt-3 bg-brand text-white px-6 py-2.5 rounded-btn text-sm font-semibold hover:bg-brand-h transition-all active:scale-[0.98] disabled:opacity-60 flex items-center gap-2">
                {revBusy && <Spinner className="w-4 h-4" light/>}Rəy göndər
              </button>
            </div>
          ) : (
            <div className="bg-bg2 rounded-card p-4 mb-6 text-sm text-t2 flex items-start gap-2">
              <Ic.Info className="w-4 h-4 shrink-0 mt-0.5 text-t3"/>
              <span>{!user ? 'Rəy yazmaq üçün hesabınıza daxil olun və məhsulu alın.' : reviewedAlready ? 'Bu məhsula artıq rəy vermisiniz. Təşəkkürlər!' : 'Rəy yalnız bu məhsulu alıb çatdırılmasını aldıqdan sonra yazıla bilər.'}</span>
            </div>
          )}
          <div className="space-y-4">
            {reviews.length===0 && <p className="text-t2 text-sm">Hələ rəy yoxdur.</p>}
            {reviews.map(r=>(
              <div key={r.id} className="border border-bdr rounded-card p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-brand text-sm">{r.userName}</span>
                  <Stars rating={r.rating}/>
                </div>
                {r.comment && <p className="text-sm text-t2 leading-relaxed">{r.comment}</p>}
                {Array.isArray(r.imageUrls) && r.imageUrls.length>0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {r.imageUrls.map((u,i)=>(<Img key={i} className="w-20 h-20 rounded-[10px] border border-bdr" src={u} alt="rəy şəkli"/>))}
                  </div>
                )}
                {r.storeReply && (
                  <div className="mt-3 ml-3 pl-3 border-l-2 border-accent bg-bg2 rounded-r-card p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-bg3 overflow-hidden flex items-center justify-center shrink-0">
                        {p.storeLogo ? <img src={resolveImg(p.storeLogo) || undefined} alt={p.store} className="w-full h-full object-cover" onError={e=>{e.currentTarget.style.display='none';}}/> : <span className="text-[10px] font-bold text-t2">{(p.store||'?')[0]}</span>}
                      </div>
                      <p className="text-xs font-bold text-accent-t">{p.store} <span className="text-t3 font-normal">cavab verdi</span></p>
                    </div>
                    <p className="text-sm text-t2 leading-relaxed">{r.storeReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Related */}
        {related.length>0 && (
          <div className="mt-14">
            <h2 className="text-2xl font-bold text-brand mb-6">{t('Bunları da bəyənə bilərsiniz')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{related.map(x=><ProductCard key={x.id} p={x} {...cp}/>)}</div>
          </div>
        )}
      </div>

      {guideOpen && <SizeGuideModal isShoe={p.category==='Ayaqqabı'} custom={(p.sizeSystem&&p.sizeSystem!=='INT'&&p.sizeSystem!=='TR')?{system:p.sizeSystem,rows:p.sizeChart||[]}:null} gender={(p.gender==='Qadın'||p.gender==='Kişi')?p.gender:(p.category==='Qadın'?'Qadın':p.category==='Kişi'?'Kişi':(user?.cins||'Kişi'))} onClose={()=>setGuideOpen(false)}/>}
      {lightbox && (
        <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4 anim-fade" onClick={()=>setLightbox(false)}>
          <button className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition" onClick={()=>setLightbox(false)}><Ic.X className="w-6 h-6"/></button>
          <img src={imgs[imgIdx%imgTotal]} alt={p.name} className="max-w-full max-h-[90vh] object-contain rounded-sheet select-none" onClick={e=>e.stopPropagation()}/>
          {imgTotal>1 && <>
            <button className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition" onClick={e=>{e.stopPropagation();setImgIdx(i=>(i-1+imgTotal)%imgTotal);}}><Ic.ChevL className="w-6 h-6"/></button>
            <button className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition" onClick={e=>{e.stopPropagation();setImgIdx(i=>(i+1)%imgTotal);}}><Ic.ChevR className="w-6 h-6"/></button>
          </>}
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
