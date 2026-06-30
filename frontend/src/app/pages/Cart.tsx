/* CartPage + DeliveryWhyPopup (B.3: GardropApp.tsx-dən çıxarıldı). */
import React from "react";
import { Ic, Img, SizeBadge, Stars, API, bearer, t } from '../shared';
import type { CartItem, DeliveryInfo, NavFn, User } from '../types';

const { useState, useEffect } = React;

/* Çatdırılma qiyməti niyə bahadır? — izah pop-upu */
export const DeliveryWhyPopup = ({ info, fee, onClose }: { info: DeliveryInfo | null; fee: number; onClose: () => void }) => (
  <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" onClick={onClose}>
    <div className="absolute inset-0 bg-brand/40 backdrop-blur-sm"/>
    <div className="relative bg-white rounded-sheet shadow-pop w-full max-w-sm p-6 anim-pop" onClick={e=>e.stopPropagation()}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-brand text-lg">{t('Çatdırılma qiyməti')}</h3>
        <button className="text-t3 hover:text-brand text-xl leading-none" onClick={onClose}>✕</button>
      </div>
      <div className="bg-bg2 rounded-card p-4 mb-3 text-center">
        <p className="text-3xl font-black text-brand">{Number(fee||0).toFixed(2)} ₼</p>
        {info && info.km!=null && <p className="text-xs text-t3 mt-1">≈ {Number(info.km).toFixed(1)} km</p>}
      </div>
      <ul className="space-y-2 text-sm text-t2">
        <li className="flex gap-2"><span className="text-accent-t">•</span>{t('0–5 km arası hər km 0.60 ₼ (minimum 3 ₼).')}</li>
        <li className="flex gap-2"><span className="text-accent-t">•</span>{t('5 km-dən sonra hər əlavə km üçün 0.50 ₼ ödənilir.')}</li>
        <li className="flex gap-2"><span className="text-accent-t">•</span>{t('Standart çatdırılma maksimum 10 ₼-dir.')}</li>
        <li className="flex gap-2"><span className="text-accent-t">•</span>{t('Ekspress (gün içində) çatdırılma +5 ₼ təşkil edir.')}</li>
        <li className="flex gap-2"><span className="text-accent-t">•</span>{t('200 ₼-dan yuxarı sifarişlərə standart çatdırılma pulsuzdur.')}</li>
        {info && info.multiStore && <li className="flex gap-2"><span className="text-accent-t">•</span>{t('Səbətinizdə fərqli mağazalardan məhsullar var — qiymət mağazalara olan məsafələrin ortalaması və mağazalar arası məsafə üzrə hesablanır.')}</li>}
      </ul>
      <button className="w-full bg-brand text-white py-3 rounded-btn font-semibold mt-5 hover:bg-brand-h transition-all active:scale-[0.99]" onClick={onClose}>{t('Anladım')}</button>
    </div>
  </div>
);

const CartPage = ({ cart, nav, removeFromCart, updateQty, user, token }: { cart: CartItem[]; nav: NavFn; removeFromCart: (id: number) => void; updateQty: (id: number, q: number) => void; user: User | null; token: string | null }) => {
  const total = cart.reduce((s,i)=>s+i.price*(i.qty||1),0);
  // Səbətdəki məhsulları qiymətə görə (baha→ucuz) sırala
  const sortedCart = [...cart].sort((a,b)=> (b.price||0)-(a.price||0));
  const [delivery,setDelivery]=useState(cart.length?3:0);
  const [delInfo,setDelInfo]=useState<DeliveryInfo | null>(null);
  const [whyOpen,setWhyOpen]=useState(false);
  const addrs=user?.addresses||[];
  const eLat=addrs[0]?.lat??null, eLng=addrs[0]?.lng??null;
  useEffect(()=>{
    if(!cart.length||!token) return;
    let cancel=false;
    fetch(`${API}/api/delivery/quote`,{method:'POST',headers:bearer(token),body:JSON.stringify({lat:eLat,lng:eLng,subtotal:total})})
      .then(r=>r.json()).then(d=>{ if(!cancel&&typeof d.fee==='number'){ setDelivery(d.fee); setDelInfo(d); } }).catch(()=>{});
    return ()=>{cancel=true;};
  },[eLat,eLng,token,cart.length,total]);

  if (!cart.length) return (
    <div className="min-h-[60vh] pb-24 md:pb-0 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-24 h-24 bg-bg2 rounded-full flex items-center justify-center mx-auto mb-6"><Ic.Bag className="w-10 h-10 text-td"/></div>
        <h2 className="text-2xl font-bold text-brand mb-2">{t('Səbətiniz boşdur')}</h2>
        <p className="text-t2 mb-8 text-sm leading-relaxed">Alış-verişə başlamaq üçün geyim kataloquna keçin</p>
        <button className="bg-brand text-white px-8 py-3 rounded-btn font-semibold hover:bg-brand-h transition-all active:scale-[0.98]" onClick={()=>nav('catalog',{category:'Hamısı'})}>Kataloq</button>
      </div>
    </div>
  );

  return (
    <div className="pb-24 md:pb-0">
      <div className="bg-bg2 border-b border-bdr hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-t2">
          <button className="hover:text-brand transition-colors" onClick={()=>nav('home')}>Ana səhifə</button>
          <Ic.ChevR className="w-3 h-3"/><span className="text-brand font-medium">Səbət</span>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-brand mb-8">{t('Səbət')} <span className="text-t3 font-normal text-lg">{cart.length} {t('məhsul')}</span></h1>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {sortedCart.map(item=>(
              <div key={item.id} className="flex gap-4 bg-white border border-bdr rounded-sheet p-4 shadow-xs">
                <div className="relative shrink-0">
                  <Img className="w-24 h-28 rounded-card" src={item.imageUrls && item.imageUrls[0]} alt={item.name}/>
                  <div className="absolute top-1 left-1 scale-75 origin-top-left"><SizeBadge size={item.selectedSize||item.size||'L'}/></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-brand leading-tight text-sm">{item.name}</p>
                      <Stars rating={item.rating} reviews={item.reviews} sm/>
                      <div className="flex flex-wrap gap-x-4 mt-1.5 text-xs text-t2">
                        <span>Mağaza: <span className="text-brand">{item.store}</span></span>
                        <span>Rəng: <span className="text-brand">{item.color}</span></span>
                        <span>Ölçü: <span className="text-brand">{item.selectedSize||item.size}</span></span>
                      </div>
                    </div>
                    <button aria-label="Sil" className="text-td hover:text-red-400 transition-colors shrink-0" onClick={()=>removeFromCart(item.id)}><Ic.X className="w-5 h-5"/></button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-bdr rounded-btn overflow-hidden">
                      <button aria-label="Azalt" className="w-8 h-8 flex items-center justify-center hover:bg-bg2 transition-colors" onClick={()=>updateQty(item.id,(item.qty||1)-1)}><Ic.Minus className="w-3.5 h-3.5"/></button>
                      <span className="w-8 text-center text-sm font-semibold text-brand">{item.qty||1}</span>
                      <button aria-label="Artır" className="w-8 h-8 flex items-center justify-center hover:bg-bg2 transition-colors" onClick={()=>updateQty(item.id,(item.qty||1)+1)}><Ic.Plus className="w-3.5 h-3.5"/></button>
                    </div>
                    <span className="font-bold text-brand">{(item.price*(item.qty||1)).toFixed(2)} ₼</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:w-72 shrink-0">
            <div className="bg-white border border-bdr rounded-sheet p-6 shadow-xs lg:sticky lg:top-24">
              <h2 className="font-bold text-brand mb-5">{t('Sifariş xülasəsi')}</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-t2"><span>{t('Məbləğ')}</span><span className="font-medium text-brand">{total.toFixed(2)} AZN</span></div>
                <div className="flex items-center justify-between text-t2">
                  <span className="flex items-center gap-1.5">{t('Çatdırılma')}{delivery>5 && <button onClick={()=>setWhyOpen(true)} className="text-[11px] text-blue underline underline-offset-2 hover:opacity-80 leading-none">{t('Niyə bahadır?')}</button>}</span>
                  <span className="font-medium text-brand">{delInfo&&delInfo.free ? <span className="text-accent-t">{t('Pulsuz')}</span> : `${delivery.toFixed(2)} AZN`}</span>
                </div>
                {delInfo && delInfo.free && <p className="text-[11px] text-accent-t -mt-1">✓ {t('200 ₼-dan yuxarı — çatdırılma pulsuz')}</p>}
                {delInfo && !delInfo.free && total<200 && <p className="text-[11px] text-t3 -mt-1">{t('Pulsuz çatdırılmaya')} {(200-total).toFixed(2)} ₼ {t('qaldı')}</p>}
                {delInfo && !delInfo.hasCoords && <p className="text-[11px] text-t3 -mt-1">{t('Təxmini — ünvan seçildikdə dəqiqləşəcək')}</p>}
                {delInfo && delInfo.multiStore && <p className="text-[11px] text-t3 -mt-1">{t('Fərqli mağazalardan məhsullar var')}</p>}
                <div className="border-t border-bdr pt-3 flex justify-between font-bold text-brand"><span>{t('Cəmi')}</span><span>{(total+delivery).toFixed(2)} AZN</span></div>
              </div>
              <button className="w-full bg-brand text-white py-3.5 rounded-btn font-semibold mt-5 hover:bg-brand-h transition-all active:scale-[0.99]" onClick={()=>nav('checkout')}>{t('Sifarişi rəsmiləşdir')} →</button>
            </div>
          </div>
        </div>
      </div>
      {whyOpen && <DeliveryWhyPopup info={delInfo} fee={delivery} onClose={()=>setWhyOpen(false)}/>}
    </div>
  );
};

export default CartPage;
