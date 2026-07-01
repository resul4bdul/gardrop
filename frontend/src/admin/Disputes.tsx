/* Admin — Münaqişələr (Dispute & Refund mərkəzi). Müştəri şikayətləri; admin dondurur/qaytarır/rədd edir. */
import React from "react";
const { useState, useEffect, useCallback } = React;
import { Btn, Card, Confirm, useLive, date } from "./shared";
import { Ic } from "../lib/panelIcons";
import type { ApiFn, ToastFn, Dispute } from "./types";

const FILTERS: [string, string][] = [['Açıq', 'Açıq'], ['Həll olundu', 'Həll olunmuş'], ['', 'Hamısı']];
const ACTIONS: Record<string, { label: string; msg: (d: Dispute) => string }> = {
  refund: { label: 'Müştəriyə pulu qaytar', msg: (d) => `${d.orderNo}: müştəriyə pul qaytarılsın? Ödəniş "geri qaytarıldı" olacaq.` },
  freeze: { label: 'Mağaza ödənişini dondur', msg: (d) => `${d.storeName || 'Mağaza'} ödənişi dondurulsun? Araşdırma bitənə qədər payout edilə bilməyəcək.` },
  dismiss: { label: 'Rədd et', msg: (d) => `${d.orderNo} şikayəti rədd edilsin?` },
};

export function Disputes({ api, toast }: { api: ApiFn; toast: ToastFn }) {
  const [rows, setRows] = useState<Dispute[] | null>(null);
  const [filter, setFilter] = useState('Açıq');
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [pending, setPending] = useState<{ d: Dispute; action: string } | null>(null);

  const load = useCallback((silent?: boolean) => {
    if (!silent) setRows(null);
    const qs = filter ? `?status=${encodeURIComponent(filter)}` : '';
    api<Dispute[]>(`/api/admin/disputes${qs}`).then(setRows).catch((e) => { if (!silent) toast((e as Error).message, 'error'); });
  }, [api, filter, toast]);
  useEffect(() => { load(); }, [load]);
  useLive(useCallback(() => load(true), [load]));

  const resolve = async (d: Dispute, action: string) => {
    try {
      await api(`/api/admin/disputes/${d.id}/resolve`, { method: 'POST', body: JSON.stringify({ action, note: notes[d.id] || '' }) });
      toast('Münaqişə həll olundu'); setPending(null); load(true);
    } catch (e) { toast((e as Error).message, 'error'); setPending(null); }
  };

  return (
    <div className="space-y-4">
      <div className="inline-flex bg-bg2 rounded-btn p-1 gap-1">
        {FILTERS.map(([v, l]) => (
          <button key={v || 'all'} onClick={() => setFilter(v)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === v ? 'bg-white text-brand shadow-xs' : 'text-t2 hover:text-brand'}`}>{l}</button>
        ))}
      </div>

      {!rows ? <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skel h-28 rounded-sheet" />)}</div>
        : rows.length === 0 ? (
          <Card><div className="flex flex-col items-center text-center py-14 px-6">
            <div className="w-14 h-14 rounded-2xl bg-bg2 text-t3 grid place-items-center mb-3"><Ic.reviews className="w-6 h-6" /></div>
            <h3 className="font-semibold text-brand">Münaqişə yoxdur</h3>
            <p className="text-sm text-t2 mt-1">Bu filtrdə açıq şikayət tapılmadı.</p>
          </div></Card>
        ) : (
          <div className="space-y-3">
            {rows.map((d) => {
              const open = d.status === 'Açıq';
              return (
                <div key={d.id} className="bg-white border border-bdr rounded-sheet p-4 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand">{d.orderNo}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${open ? 'bg-sale/10 text-sale' : 'bg-green/10 text-green'}`}>{d.status}</span>
                      </div>
                      <div className="text-xs text-t3 mt-0.5">{date(d.createdAt)} · Müştəri: {d.userName}{d.storeName ? ` · Mağaza: ${d.storeName}` : ''}</div>
                    </div>
                  </div>
                  <p className="text-sm text-brand mt-2 bg-bg2 rounded-btn p-3">{d.reason}</p>

                  {open ? (
                    <div className="mt-3 space-y-2">
                      <input value={notes[d.id] || ''} onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
                        placeholder="Qeyd (istəyə bağlı — müştəriyə göstərilmir)" className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" />
                      <div className="flex flex-wrap gap-2">
                        <Btn onClick={() => setPending({ d, action: 'refund' })}>Pulu qaytar</Btn>
                        <Btn variant="ghost" onClick={() => setPending({ d, action: 'freeze' })}>Ödənişi dondur</Btn>
                        <Btn variant="subtle" onClick={() => setPending({ d, action: 'dismiss' })}>Rədd et</Btn>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-t2 mt-2">Həll: <b className="text-brand">{d.resolution || '—'}</b>{d.resolvedAt ? ` · ${date(d.resolvedAt)}` : ''}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {pending && <Confirm text={ACTIONS[pending.action].msg(pending.d)} onYes={() => resolve(pending.d, pending.action)} onNo={() => setPending(null)} />}
    </div>
  );
}

export default Disputes;
