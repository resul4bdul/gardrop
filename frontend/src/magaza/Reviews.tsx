/* Mağaza tab (fayllara bölmə): ./shared-dən import, api/toast props. */
import React from "react";
const { useState, useEffect, useCallback } = React;
import { date, Btn, Card, useLive, resolveImg } from "./shared";
import type { ApiFn, ToastFn, Review, Store } from "./types";

const initials = (name: string) => (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const AVA_BG = ['#DBEAFE', '#FCE7F3', '#DCFCE7', '#FEF3C7', '#EDE9FE', '#FEE2E2'];
const avaColor = (name: string) => AVA_BG[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVA_BG.length];

export function Reviews({ api, toast, store }: { api: ApiFn; toast: ToastFn; store: Store }) {
    const [rows, setRows] = useState<Review[] | null>(null);
    const [editId, setEditId] = useState<number | null>(null), [text, setText] = useState('');
    const [fRating, setFRating] = useState(0), [onlyUnanswered, setOnlyUnanswered] = useState(false);
    const load = useCallback((silent?: boolean) => { if (!silent) setRows(null); api<Review[]>(`/api/store/${store.id}/reviews`).then(setRows).catch((e) => { if (!silent) toast((e as Error).message, 'error'); }); }, [api, store.id, toast]);
    useEffect(() => { load(); }, [load]);
    useLive(useCallback(() => load(true), [load]));
    const sendReply = async (r: Review) => {
      try { await api(`/api/store/${store.id}/reviews/${r.id}/reply`, { method: 'PUT', body: JSON.stringify({ reply: text.trim() }) }); toast('Cavab göndərildi'); setEditId(null); setText(''); load(); } catch (e) { toast((e as Error).message, 'error'); }
    };
    const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);
    if (!rows) return <div className="space-y-3">{[0, 1, 2].map(i => <div key={i} className="skel h-24" />)}</div>;
    if (rows.length === 0) return <Card><div className="px-4 py-10 text-center text-t3 text-sm">Hələ rəy yoxdur</div></Card>;
    const avg = rows.reduce((a, r) => a + r.rating, 0) / rows.length;
    const unanswered = rows.filter(r => !r.storeReply).length;
    // Ulduz paylanması 5→1 (rows-dan hesablanır — bütün rəylər yüklənir).
    const dist = [5, 4, 3, 2, 1].map(s => ({ s, n: rows.filter(r => Math.round(r.rating) === s).length }));
    const shown = rows.filter(r => (!fRating || Math.round(r.rating) === fRating) && (!onlyUnanswered || !r.storeReply));
    return (
      <div className="space-y-3">
        <div className="bg-white border border-bdr rounded-card p-5 shadow-xs flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="text-center shrink-0 sm:pr-5 sm:border-r sm:border-bdr">
            <div className="text-4xl font-black text-brand leading-none">{avg.toFixed(1)}</div>
            <div className="text-amber text-base mt-1">{stars(Math.round(avg))}</div>
            <div className="text-xs text-t3 mt-1"><b className="text-t2">{rows.length}</b> rəy{unanswered > 0 && <> · <span className="text-amber font-semibold">{unanswered}</span> cavabsız</>}</div>
          </div>
          <div className="flex-1 space-y-1">
            {dist.map(({ s, n }) => { const pct = rows.length ? Math.round((n / rows.length) * 100) : 0; const active = fRating === s; return (
              <button key={s} onClick={() => setFRating(active ? 0 : s)} className={`w-full flex items-center gap-2 group ${active ? '' : ''}`} title={`${s} ulduz — ${n}`}>
                <span className={`text-xs w-8 text-left ${active ? 'font-bold text-brand' : 'text-t2'}`}>{s} ★</span>
                <span className="flex-1 h-2 rounded-full bg-bg3 overflow-hidden"><span className="block h-full rounded-full bg-amber transition-all" style={{ width: pct + '%' }} /></span>
                <span className="text-xs text-t3 w-9 text-right">{n}</span>
              </button>
            ); })}
          </div>
        </div>

        {(fRating > 0 || onlyUnanswered) && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-t3">Filtr:</span>
            {fRating > 0 && <span className="inline-flex items-center gap-1 bg-amber/15 text-amber rounded-full px-2.5 py-0.5 text-xs font-semibold">{fRating} ★<button onClick={() => setFRating(0)} className="hover:text-sale">✕</button></span>}
            {onlyUnanswered && <span className="inline-flex items-center gap-1 bg-bg2 text-t2 rounded-full px-2.5 py-0.5 text-xs font-semibold">Cavabsız<button onClick={() => setOnlyUnanswered(false)} className="hover:text-sale">✕</button></span>}
            <span className="text-t3 ml-auto">{shown.length} nəticə</span>
          </div>
        )}
        {unanswered > 0 && !onlyUnanswered && fRating === 0 && (
          <button onClick={() => setOnlyUnanswered(true)} className="text-sm text-blue hover:underline">Yalnız cavabsızları göstər ({unanswered})</button>
        )}

        {shown.length === 0 ? <Card><div className="px-4 py-8 text-center text-t3 text-sm">Filtrə uyğun rəy yoxdur</div></Card> : shown.map((r) => (
          <div key={r.id} className="bg-white border border-bdr rounded-card p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ background: avaColor(r.userName), color: '#334155' }}>{initials(r.userName)}</span>
              <div className="min-w-0 flex-1"><span className="font-semibold text-brand">{r.userName}</span> <span className="text-amber text-sm">{stars(r.rating)}</span><p className="text-xs text-t3">{r.productName} · {date(r.createdAt)}</p></div>
            </div>
            {r.comment && <p className="text-sm text-t2 mt-1.5 leading-relaxed">{r.comment}</p>}
            {Array.isArray(r.imageUrls) && r.imageUrls.length > 0 && <div className="flex gap-2 mt-2 flex-wrap">{r.imageUrls.map((u, i) => <img key={i} src={resolveImg(u)} className="w-16 h-16 rounded object-cover border border-bdr" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />)}</div>}
            {r.storeReply && editId !== r.id ? (
              <div className="mt-3 bg-bg2 rounded-card p-3 border-l-2 border-green">
                <p className="text-xs font-bold text-green mb-0.5">🏪 Cavabınız</p>
                <p className="text-sm text-t2">{r.storeReply}</p>
                <button className="text-xs text-blue hover:underline mt-1" onClick={() => { setEditId(r.id); setText(r.storeReply || ''); }}>Düzəlt</button>
              </div>
            ) : editId === r.id ? (
              <div className="mt-3 space-y-2">
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Müştəriyə cavab yazın…" className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm resize-none" />
                <div className="flex gap-2 justify-end"><Btn variant="ghost" onClick={() => { setEditId(null); setText(''); }}>İmtina</Btn><Btn disabled={text.trim().length < 2} onClick={() => sendReply(r)}>Göndər</Btn></div>
              </div>
            ) : (
              <button className="mt-2 text-sm text-blue hover:underline" onClick={() => { setEditId(r.id); setText(''); }}>↩ Cavab yaz</button>
            )}
          </div>
        ))}
      </div>
    );
  }


export default Reviews;
