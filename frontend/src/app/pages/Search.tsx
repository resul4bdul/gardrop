/* SearchPage (B.3: GardropApp.tsx-dən çıxarıldı). */
import React from "react";
import { Ic, ProductCard, ProductCardSkeleton, API } from '../shared';
import type { CommonProps, Product } from '../types';

const { useState, useEffect } = React;

const SearchPage = ({ query, nav, favs, togFav, addCart, cart, user, products }: CommonProps & { query: string }) => {
  /* Backend pg_trgm axtarışı (fuzzy + diakritiksiz). Xəta olsa lokal filtrə düşür. */
  const [results, setResults] = useState<Product[] | null>(null); // null = yüklənir
  useEffect(()=>{
    let alive = true;
    const qq = (query||'').trim();
    if (!qq) { setResults([]); return; }
    setResults(null);
    fetch(`${API}/api/products?search=${encodeURIComponent(qq)}`)
      .then(r=>r.json())
      .then(d=>{ if(alive) setResults(Array.isArray(d.products) ? d.products : []); })
      .catch(()=>{ if(!alive) return;
        const q = qq.toLowerCase();
        setResults(products.filter(p=>p.name.toLowerCase().includes(q)||(p.store||'').toLowerCase().includes(q)||p.category.toLowerCase().includes(q)||(p.color||'').toLowerCase().includes(q)));
      });
    return ()=>{ alive = false; };
  }, [query]);

  const cp = { nav, favs, togFav, addCart, cart, user };
  const loading = results === null;
  const list = results || [];
  return (
    <div className="pb-24 md:pb-0">
      <div className="bg-bg2 border-b border-bdr hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-t2">
          <button className="hover:text-brand transition-colors" onClick={()=>nav('home')}>Ana səhifə</button>
          <Ic.ChevR className="w-3 h-3"/><span className="text-brand font-medium">"{query}"</span>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-brand mb-1">Axtarış nəticələri</h1>
        <p className="text-t2 mb-6 text-sm">"{query}" üzrə {loading ? <span className="text-t3">axtarılır…</span> : <><strong className="text-brand">{list.length}</strong> məhsul tapıldı</>}</p>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">{Array.from({length:5}).map((_,i)=><ProductCardSkeleton key={i}/>)}</div>
        ) : list.length===0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-brand mb-2">Nəticə tapılmadı</h2>
            <p className="text-t2 mb-6 text-sm">Başqa açar söz ilə axtarın</p>
            <button className="bg-brand text-white px-8 py-3 rounded-btn font-semibold text-sm hover:bg-brand-h transition-all active:scale-[0.98]" onClick={()=>nav('catalog',{category:'Hamısı'})}>Bütün məhsullar</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">{list.map(p=><ProductCard key={p.id} p={p} {...cp}/>)}</div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
