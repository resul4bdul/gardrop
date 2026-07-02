/* Admin — Problemlər (geri qaytarma/şikayət, Trendyol modeli arbitraj mərkəzi).
   Axın: müştəri açır → satıcı 48 saatda qəbul/rədd (bitərsə avto-arbitraj) →
   admin qərar verir: kuryer qaytarması (xərci kim ödəyir — SƏBƏBƏ görə admin seçir),
   birbaşa refund, rədd, və ya mağaza payout dondurma. */
import React from "react";
const { useState, useEffect, useCallback } = React;
import { Btn, Card, Confirm, useLive, date } from "./shared";
import { Ic } from "../lib/panelIcons";
import type { ApiFn, ToastFn } from "./types";

export interface ProblemEvent { status: string; actorRole: string; note: string; createdAt: string }
export interface Problem {
  id: number; orderId: number; orderNo: string; userId: number; userName: string;
  storeId: number | null; storeName: string;
  reason: string; description: string; photos: string[];
  status: string; storeDeadline: string; storeResponseNote: string; storeRespondedAt: string | null;
  returnRequired: boolean; returnCostPayer: string; returnStartedAt: string | null; returnReceivedAt: string | null;
  resolution: string; resolvedAt: string | null; createdAt: string;
  events: ProblemEvent[] | null;
}

const ST = {
  awaiting: 'Satıcı cavabı gözlənilir',
  accepted: 'Satıcı qəbul etdi',
  arbitration: 'Arbitrajda',
  returning: 'Qaytarma kuryerdədir',
  refunded: 'Pul qaytarıldı',
  rejected: 'Rədd edildi',
  cancelled: 'Ləğv edildi',
};
const TERMINAL = [ST.refunded, ST.rejected, ST.cancelled];

const FILTERS: [string, string][] = [
  [ST.arbitration, 'Arbitraj'],
  [ST.accepted, 'Qəbul edilib'],
  [ST.awaiting, 'Satıcıda'],
  [ST.returning, 'Qaytarmada'],
  ['', 'Hamısı'],
];

const badge = (s: string) =>
  s === ST.arbitration ? 'bg-sale/10 text-sale'
  : s === ST.awaiting ? 'bg-amber-100 text-amber-800'
  : s === ST.accepted || s === ST.returning ? 'bg-blue-50 text-blue-700'
  : s === ST.refunded ? 'bg-green/10 text-green'
  : 'bg-bg2 text-t2';

/* Müştəriyə görünən status zaman xətti (hadisə jurnalından) */
function Timeline({ events }: { events: ProblemEvent[] }) {
  return (
    <ol className="mt-3 space-y-2 border-l-2 border-bdr pl-4">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand" />
          <div className="text-xs font-semibold text-brand">{e.status} <span className="font-normal text-t3">· {e.actorRole} · {date(e.createdAt)}</span></div>
          {e.note && <div className="text-xs text-t2 mt-0.5">{e.note}</div>}
        </li>
      ))}
    </ol>
  );
}

export function Problems({ api, toast }: { api: ApiFn; toast: ToastFn }) {
  const [rows, setRows] = useState<Problem[] | null>(null);
  const [filter, setFilter] = useState(ST.arbitration);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [payers, setPayers] = useState<Record<number, string>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [pending, setPending] = useState<{ p: Problem; action: string; label: string; msg: string } | null>(null);

  const load = useCallback((silent?: boolean) => {
    if (!silent) setRows(null);
    const qs = filter ? `?status=${encodeURIComponent(filter)}` : '';
    api<Problem[]>(`/api/admin/problems${qs}`).then(setRows).catch((e) => { if (!silent) toast((e as Error).message, 'error'); });
  }, [api, filter, toast]);
  useEffect(() => { load(); }, [load]);
  useLive(useCallback(() => load(true), [load]));

  const decide = async (p: Problem, action: string) => {
    try {
      await api(`/api/admin/problems/${p.id}/decide`, {
        method: 'POST',
        body: JSON.stringify({ action, note: notes[p.id] || '', costPayer: payers[p.id] || '' }),
      });
      toast('Qərar tətbiq olundu'); setPending(null); load(true);
    } catch (e) { toast((e as Error).message, 'error'); setPending(null); }
  };

  const ask = (p: Problem, action: string) => {
    const msgs: Record<string, string> = {
      return: `${p.orderNo}: kuryer qaytarması başladılsın? Xərci ${payers[p.id] || '—'} ödəyəcək. Mal satıcıya çatıb təsdiqlənəndə pul avtomatik qaytarılacaq.`,
      refund: `${p.orderNo}: müştəriyə pul birbaşa qaytarılsın? (mal qaytarılmadan)`,
      reject: `${p.orderNo} problemi əsassız sayılıb bağlansın?`,
      freeze: `${p.storeName || 'Mağaza'} ödənişləri araşdırma üçün dondurulsun?`,
    };
    if (action === 'return' && !payers[p.id]) { toast('Əvvəl kuryer xərcini kimin ödəyəcəyini seçin', 'error'); return; }
    setPending({ p, action, label: action, msg: msgs[action] });
  };

  return (
    <div className="space-y-4">
      {/* Filtr — mobil üçün üfüqi sürüşən */}
      <div className="inline-flex max-w-full overflow-x-auto scrollbar-hide bg-bg2 rounded-btn p-1 gap-1">
        {FILTERS.map(([v, l]) => (
          <button key={v || 'all'} onClick={() => setFilter(v)}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === v ? 'bg-white text-brand shadow-xs' : 'text-t2 hover:text-brand'}`}>{l}</button>
        ))}
      </div>

      {!rows ? <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skel h-28 rounded-sheet" />)}</div>
        : rows.length === 0 ? (
          <Card><div className="flex flex-col items-center text-center py-14 px-6">
            <div className="w-14 h-14 rounded-2xl bg-bg2 text-t3 grid place-items-center mb-3"><Ic.reviews className="w-6 h-6" /></div>
            <h3 className="font-semibold text-brand">Problem yoxdur</h3>
            <p className="text-sm text-t2 mt-1">Bu filtrdə problem tapılmadı.</p>
          </div></Card>
        ) : (
          <div className="space-y-3">
            {rows.map((p) => {
              const actionable = !TERMINAL.includes(p.status);
              return (
                <div key={p.id} className="bg-white border border-bdr rounded-sheet p-4 shadow-xs">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-brand">{p.orderNo}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge(p.status)}`}>{p.status}</span>
                        {p.returnRequired && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-bg2 text-t2">Kuryer xərci: {p.returnCostPayer}</span>}
                      </div>
                      <div className="text-xs text-t3 mt-0.5">{date(p.createdAt)} · Müştəri: {p.userName}{p.storeName ? ` · Mağaza: ${p.storeName}` : ''}</div>
                    </div>
                    <button className="text-xs text-t2 underline shrink-0" onClick={() => setExpanded((x) => ({ ...x, [p.id]: !x[p.id] }))}>
                      {expanded[p.id] ? 'Bağla' : 'Timeline'}
                    </button>
                  </div>

                  <p className="text-sm text-brand mt-2 bg-bg2 rounded-btn p-3">
                    <b>{p.reason}</b>{p.description ? ` — ${p.description}` : ''}
                  </p>
                  {p.storeResponseNote && (
                    <p className="text-xs text-t2 mt-1.5">Satıcı cavabı: <span className="text-brand">{p.storeResponseNote}</span></p>
                  )}
                  {p.photos?.length > 0 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide">
                      {p.photos.map((u, i) => (
                        <a key={i} href={u} target="_blank" rel="noreferrer" className="shrink-0">
                          <img src={u} alt="" className="w-16 h-16 object-cover rounded-btn border border-bdr" />
                        </a>
                      ))}
                    </div>
                  )}

                  {expanded[p.id] && p.events && <Timeline events={p.events} />}

                  {actionable ? (
                    <div className="mt-3 space-y-2">
                      <input value={notes[p.id] || ''} onChange={(e) => setNotes((n) => ({ ...n, [p.id]: e.target.value }))}
                        placeholder="Qərar qeydi (müştəriyə göstərilir)" className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" />
                      {p.status !== ST.returning && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-t2">Kuryer xərcini ödəyir:</span>
                          {['Mağaza', 'Müştəri'].map((v) => (
                            <button key={v} onClick={() => setPayers((x) => ({ ...x, [p.id]: v }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${payers[p.id] === v ? 'bg-brand text-white border-brand' : 'bg-white text-t2 border-bdr hover:border-bdr-s'}`}>
                              {v}{v === 'Mağaza' ? ' (qüsur)' : ' (fikir dəyişdi)'}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {p.status !== ST.returning && <Btn onClick={() => ask(p, 'return')}>Kuryer qaytarması</Btn>}
                        <Btn variant="ghost" onClick={() => ask(p, 'refund')}>Birbaşa refund</Btn>
                        <Btn variant="subtle" onClick={() => ask(p, 'reject')}>Rədd et</Btn>
                        {p.storeId != null && <Btn variant="subtle" onClick={() => ask(p, 'freeze')}>Payout dondur</Btn>}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-t2 mt-2">Yekun: <b className="text-brand">{p.resolution || p.status}</b>{p.resolvedAt ? ` · ${date(p.resolvedAt)}` : ''}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {pending && <Confirm text={pending.msg} onYes={() => decide(pending.p, pending.action)} onNo={() => setPending(null)} />}
    </div>
  );
}

export default Problems;
