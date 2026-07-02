/* FavoritesPage (B.3: GardropApp.tsx-dən çıxarıldı). */
import React from "react";
import { Ic, Img, SizeBadge, Stars, t } from '../shared';
import { recommendSize } from '../sizing';
import type { CommonProps } from '../types';

const FavoritesPage = ({ nav, favs, togFav, clearFavs, addCart, removeFromCart, cart, user, products }: CommonProps): React.ReactElement => {
  const favProds = products.filter(p=>favs.includes(p.id));
  return (
    <div className="pb-24 md:pb-0">
      <div className="bg-bg2 border-b border-bdr hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-t2">
          <button className="hover:text-brand transition-colors" onClick={()=>nav('home')}>Ana səhifə</button>
          <Ic.ChevR className="w-3 h-3"/><span className="text-brand font-medium">Seçilmişlər</span>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-brand">Seçilmişlər <span className="text-t3 font-normal text-lg">{favProds.length} məhsul</span></h1>
          {favProds.length>0 && <button className="text-sm text-t2 hover:text-red-500 transition-colors" onClick={()=>clearFavs&&clearFavs()}>Hamısını sil</button>}
        </div>
        {!favProds.length ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-bg2 rounded-full flex items-center justify-center mx-auto mb-5"><Ic.Heart filled={false} className="w-9 h-9 text-td"/></div>
            <h2 className="text-xl font-bold text-brand mb-2">Seçilmişlər boşdur</h2>
            <p className="text-t2 mb-7 text-sm">Bəyəndiyiniz məhsulları seçilmişlərə əlavə edin</p>
            <button className="bg-brand text-white px-8 py-3 rounded-btn font-semibold hover:bg-brand-h transition-all active:scale-[0.98]" onClick={()=>nav('catalog',{category:'Hamısı'})}>Kataloqa keç</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favProds.map(p=>{
              const inCart = cart.some(c=>c.id===p.id);
              return (
                <div key={p.id} className="bg-white rounded-card overflow-hidden border border-bdr shadow-xs hover:shadow-card-h hover:-translate-y-1 transition-all duration-200">
                  <div className="relative cursor-pointer" onClick={()=>nav('product',{product:p})}>
                    <Img className="w-full aspect-[3/4]" src={p.imageUrls && p.imageUrls[0]} alt={p.name}/>
                    {(()=>{ const rec=user?recommendSize(user,p):null; return rec&&rec.hasMeasurements ? <div className="absolute top-2 left-2"><SizeBadge size={rec.size}/></div> : null; })()}
                    <button className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-xs text-red-500 active:scale-90" onClick={e=>{e.stopPropagation();togFav(p.id);}}><Ic.Heart filled className="w-4 h-4"/></button>
                    {p.discount && <div className="absolute bottom-2 right-2 bg-sale text-white text-[10px] font-bold px-2 py-0.5 rounded-badge">-{p.discount}%</div>}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-t3 uppercase tracking-[0.08em] font-bold">{p.store}</p>
                    <p className="text-sm font-medium text-brand mt-0.5">{p.name}</p>
                    <div className="flex items-center justify-between mt-1.5 mb-3">
                      <div className="flex items-center gap-1"><span className="font-bold text-sm text-brand">{p.price} ₼</span>{p.oldPrice&&<span className="text-xs text-t3 line-through">{p.oldPrice}₼</span>}</div>
                      <Stars rating={p.rating} reviews={p.reviews} sm/>
                    </div>
                    <button className={`w-full py-2 rounded-btn text-sm font-semibold transition-all active:scale-[0.98] ${inCart?'bg-bg2 text-brand border border-bdr hover:border-bdr-s':'bg-brand text-white hover:bg-brand-h'}`} onClick={()=> inCart ? removeFromCart(p.id) : addCart(p)}>{inCart?t('✓ Səbətdə'):t('Səbətə əlavə et')}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
