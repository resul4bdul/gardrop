/* Sifariş problemi (geri qaytarma/şikayət — Trendyol modeli) — müştəri tərəfi.
   Səbəb seçimi + təsvir + sübut şəkilləri ilə problem açılır; açılandan sonra
   status + zaman xətti (timeline) göstərilir. 14 gün pəncərə/status qaydalarını
   backend yoxlayır — xəta mesajı olduğu kimi göstərilir. */
import React from "react";
import { API, bearer } from '../shared';
import type { Order } from '../types';

const { useState } = React;

export interface ProblemEventView { status: string; actorRole: string; note: string; createdAt: string }
export interface ProblemView {
  id: number; orderId: number; orderNo: string;
  reason: string; description: string; photos: string[];
  status: string; storeDeadline: string; storeResponseNote: string;
  returnRequired: boolean; returnCostPayer: string;
  resolution: string; resolvedAt: string | null; createdAt: string;
  events?: ProblemEventView[] | null;
}

const REASONS = ['Qüsurlu məhsul', 'Yanlış məhsul', 'Təsvirə uyğun deyil', 'Ölçü uyğun gəlmədi', 'Fikrim dəyişdi', 'Çatdırılmadı', 'Digər'];
const TERMINAL = ['Pul qaytarıldı', 'Rədd edildi', 'Ləğv edildi'];

const stColor = (s: string) =>
  s === 'Pul qaytarıldı' ? 'text-accent-t' : s === 'Rədd edildi' || s === 'Ləğv edildi' ? 'text-t3' :
  s === 'Arbitrajda' ? 'text-sale' : 'text-blue-600';
const fmt = (s: string) => new Date(s).toLocaleString('az-AZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export function OrderProblem({ order, token, problem, onChanged }:
  { order: Order; token: string | null; problem?: ProblemView; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [desc, setDesc] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [showTl, setShowTl] = useState(false);
  const [detail, setDetail] = useState<ProblemView | null>(null);

  // Siyahı endpointi timeline-sız gəlir — "Ətraflı" açılanda detal çəkilir
  const toggleTl = () => {
    const next = !showTl;
    setShowTl(next);
    if (next && problem && !detail) {
      fetch(`${API}/api/problems/${problem.id}`, { headers: bearer(token) })
        .then((r) => r.ok ? r.json() : null).then((d) => d?.id && setDetail(d)).catch(() => {});
    }
  };

  // Sübut şəkilləri (crop tələb olunmur — dəlil fotosudur)
  const upload = async (files: FileList | null) => {
    if (!files?.length || !token) return;
    setUploading(true); setMsg('');
    try {
      const fd = new FormData();
      Array.from(files).slice(0, 5 - photos.length).forEach((f) => fd.append('files', f));
      const r = await fetch(`${API}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const d = await r.json();
      const urls: string[] = Array.isArray(d) ? d : (d.urls || []);
      setPhotos((p) => [...p, ...urls].slice(0, 5));
    } catch { setMsg('Şəkil yüklənmədi'); }
    setUploading(false);
  };

  const submit = async () => {
    setMsg('');
    if (!reason) { setMsg('Səbəb seçin'); return; }
    if (desc.trim().length < 5) { setMsg('Problemi ətraflı yazın (ən az 5 simvol)'); return; }
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/orders/${order.id}/problem`, {
        method: 'POST', headers: bearer(token),
        body: JSON.stringify({ reason, description: desc.trim(), photos }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg(d.error || 'Göndərilmədi'); setBusy(false); return; }
      setOpen(false); setReason(''); setDesc(''); setPhotos([]);
      onChanged();
    } catch { setMsg('Serverlə əlaqə yoxdur'); }
    setBusy(false);
  };

  const cancel = async () => {
    if (!problem) return;
    try {
      const r = await fetch(`${API}/api/problems/${problem.id}/cancel`, { method: 'POST', headers: bearer(token) });
      if (r.ok) onChanged();
    } catch { /* şəbəkə xətası — status dəyişməz qalır */ }
  };

  /* ── Mövcud problem: status + timeline ── */
  if (problem) {
    const terminal = TERMINAL.includes(problem.status);
    const events = detail?.events || problem.events;
    return (
      <div className="bg-bg2 rounded-card p-3 space-y-2 anim-fade">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-brand">Problem: <span className={stColor(problem.status)}>{problem.status}</span></p>
          <button className="text-[11px] text-t2 underline" onClick={toggleTl}>{showTl ? 'Bağla' : 'Ətraflı'}</button>
        </div>
        <p className="text-xs text-t2">{problem.reason}{problem.returnRequired ? ` · Kuryer xərci: ${problem.returnCostPayer}` : ''}</p>
        {showTl && events && (
          <ol className="space-y-1.5 border-l-2 border-bdr pl-3 ml-1">
            {events.map((e, i) => (
              <li key={i}>
                <p className="text-[11px] font-semibold text-brand leading-tight">{e.status} <span className="font-normal text-t3">· {fmt(e.createdAt)}</span></p>
                {e.note && <p className="text-[11px] text-t2">{e.note}</p>}
              </li>
            ))}
          </ol>
        )}
        {!terminal && showTl && (
          <button className="text-[11px] text-sale underline" onClick={cancel}>Problemi geri götür</button>
        )}
      </div>
    );
  }

  /* ── Yeni problem aç ── */
  if (!open) {
    return (
      <button className="w-full text-xs font-medium py-2 rounded-btn border border-bdr text-t2 hover:border-bdr-s hover:text-brand transition-colors"
        onClick={() => { setOpen(true); setMsg(''); }}>Problem bildir</button>
    );
  }

  return (
    <div className="bg-bg2 rounded-card p-3 space-y-2 anim-fade">
      <p className="text-xs font-semibold text-brand">Problemi bildirin:</p>
      <select value={reason} onChange={(e) => setReason(e.target.value)}
        className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-xs focus:border-brand transition-colors">
        <option value="">Səbəb seçin…</option>
        {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
        placeholder="Məs: məhsul qüsurlu gəldi, tikişi sökülüb…"
        className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-xs resize-none focus:border-brand transition-colors" />
      <div className="flex items-center gap-2 flex-wrap">
        {photos.map((u, i) => (
          <div key={i} className="relative">
            <img src={u} alt="" className="w-12 h-12 object-cover rounded-btn border border-bdr" />
            <button className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-sale text-white text-[9px] leading-none grid place-items-center"
              onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
        {photos.length < 5 && (
          <label className="w-12 h-12 rounded-btn border border-dashed border-bdr-s grid place-items-center text-t3 text-lg cursor-pointer hover:border-brand hover:text-brand transition-colors">
            {uploading ? '…' : '+'}
            <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
          </label>
        )}
        <span className="text-[10px] text-t3">Sübut şəkli (istəyə bağlı)</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="text-xs font-semibold text-t2 px-2.5 py-1.5 rounded-btn hover:text-brand transition-colors"
          onClick={() => { setOpen(false); setMsg(''); }}>Vaz keç</button>
        <button className="flex-1 text-xs font-semibold text-white px-3 py-1.5 rounded-btn active:scale-95 transition-transform disabled:opacity-50 bg-brand"
          disabled={busy || !reason || desc.trim().length < 5} onClick={submit}>{busy ? 'Göndərilir…' : 'Problemi göndər'}</button>
      </div>
      {msg && <p className="text-xs" style={{ color: '#E53E3E' }}>{msg}</p>}
      <p className="text-[10px] text-t3">Satıcı 48 saat ərzində cavab verməlidir; qaytarma pəncərəsi çatdırılmadan 14 gündür.</p>
    </div>
  );
}

export default OrderProblem;
