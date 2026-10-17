/* Mağaza — Problemlər (geri qaytarma/şikayət). Satıcının 48 saat cavab pəncərəsi var:
   qəbul → admin qaytarma qərarı verir; rədd → admin arbitrajına keçir (səbəb yazmaq şərtdir).
   Kuryer qaytarmasında mal təhvil alınanda satıcı təsdiqləyir → pul avtomatik qaytarılır. */
import React from "react";
const { useState, useEffect, useCallback } = React;
import { Button, Input, cx } from "./ui";
import { Ic } from "../lib/panelIcons";
import type { ApiFn, ToastFn, Store } from "./types";

interface ProblemEvent { status: string; actorRole: string; note: string; createdAt: string }
interface Problem {
  id: number; orderNo: string; userName: string;
  reason: string; description: string; photos: string[];
  status: string; storeDeadline: string; storeResponseNote: string;
  returnRequired: boolean; returnCostPayer: string;
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

const fmtDate = (s: string | null) => s ? new Date(s).toLocaleString('az-AZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

/* Satıcı cavab deadline-ına qalan vaxt (48 saat pəncərəsi) */
const remaining = (deadline: string) => {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return 'vaxt bitib — arbitraja keçir';
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return `${h} saat ${m} dəq qalıb`;
};

const badge = (s: string) =>
  s === ST.awaiting ? 'bg-amber-100 text-amber-800'
  : s === ST.arbitration ? 'bg-red-50 text-red-600'
  : s === ST.accepted || s === ST.returning ? 'bg-emerald-50 text-emerald-700'
  : s === ST.refunded ? 'bg-emerald-50 text-emerald-700'
  : 'bg-slate-100 text-slate-500';

export default function Problems({ api, toast, store }: { api: ApiFn; toast: ToastFn; store: Store; cats?: unknown }) {
  const [rows, setRows] = useState<Problem[] | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback((silent?: boolean) => {
    if (!silent) setRows(null);
    api<Problem[]>(`/api/store/${store.id}/problems`).then(setRows).catch((e) => { if (!silent) toast((e as Error).message, 'error'); });
  }, [api, store.id, toast]);
  useEffect(() => { load(); }, [load]);

  const respond = async (p: Problem, accept: boolean) => {
    const note = notes[p.id] || '';
    if (!accept && note.trim().length < 5) { toast('Rədd üçün səbəb yazın (min 5 simvol)', 'error'); return; }
    setBusy(p.id);
    try {
      await api(`/api/store/${store.id}/problems/${p.id}/respond`, { method: 'POST', body: JSON.stringify({ accept, note }) });
      toast(accept ? 'Problem qəbul edildi — qaytarma qərarını admin verəcək' : 'Rədd edildi — iş arbitraja keçdi');
      load(true);
    } catch (e) { toast((e as Error).message, 'error'); } finally { setBusy(null); }
  };

  const received = async (p: Problem) => {
    setBusy(p.id);
    try {
      await api(`/api/store/${store.id}/problems/${p.id}/received`, { method: 'POST' });
      toast('Mal təhvil alındı — müştəriyə pul avtomatik qaytarıldı');
      load(true);
    } catch (e) { toast((e as Error).message, 'error'); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-4">
      {!rows ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center mx-auto mb-3"><Ic.reviews className="w-6 h-6" /></div>
          <h3 className="font-semibold text-slate-900">Problem yoxdur 🎉</h3>
          <p className="text-sm text-slate-500 mt-1">Müştərilərinizdən heç bir şikayət/geri qaytarma tələbi yoxdur.</p>
        </div>
      ) : (
        rows.map((p) => (
          <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900">{p.orderNo}</span>
                  <span className={cx('text-[11px] font-semibold px-2 py-0.5 rounded-full', badge(p.status))}>{p.status}</span>
                  {p.returnRequired && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Kuryer xərci: {p.returnCostPayer}</span>}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{fmtDate(p.createdAt)} · Müştəri: {p.userName}</div>
              </div>
              {p.status === ST.awaiting && (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full shrink-0">⏱ {remaining(p.storeDeadline)}</span>
              )}
            </div>

            <p className="text-sm text-slate-800 mt-2.5 bg-slate-50 rounded-xl p-3"><b>{p.reason}</b>{p.description ? ` — ${p.description}` : ''}</p>
            {p.photos?.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {p.photos.map((u, i) => (
                  <a key={i} href={u} target="_blank" rel="noreferrer" className="shrink-0">
                    <img src={u} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                  </a>
                ))}
              </div>
            )}

            {p.status === ST.awaiting && (
              <div className="mt-3 space-y-2">
                <Input value={notes[p.id] || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes((n) => ({ ...n, [p.id]: e.target.value }))}
                  placeholder="Cavab qeydi (rədd üçün mütləqdir — müştəriyə göstərilir)" />
                <div className="flex flex-wrap gap-2">
                  <Button disabled={busy === p.id} onClick={() => respond(p, true)}>Qəbul et</Button>
                  <Button variant="ghost" disabled={busy === p.id} onClick={() => respond(p, false)}>Rədd et (arbitraja gedir)</Button>
                </div>
                <p className="text-[11px] text-slate-400">48 saat ərzində cavab verməsəniz problem avtomatik platforma arbitrajına keçir.</p>
              </div>
            )}

            {p.status === ST.returning && (
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <Button disabled={busy === p.id} onClick={() => received(p)}>Malı təhvil aldım</Button>
                <span className="text-xs text-slate-500">Təsdiqləyəndə müştəriyə pul avtomatik qaytarılır.</span>
              </div>
            )}

            {p.storeResponseNote && p.status !== ST.awaiting && (
              <p className="text-xs text-slate-500 mt-2">Cavabınız: <span className="text-slate-800">{p.storeResponseNote}</span></p>
            )}
            {p.resolvedAt && (
              <div className="text-xs text-slate-500 mt-2">Yekun: <b className="text-slate-800">{p.resolution || p.status}</b> · {fmtDate(p.resolvedAt)}</div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
