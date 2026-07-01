/* Sifarişlər — Merchant (blue). Filtr (axtarış/status/tarix) + cədvəl + pagination + detal sheet + timeline.
   Satıcı statusları: Hazırlanır / Hazırlandı / Kuryerə verildi. Ləğv/Çatdırıldı/Qaytarıldı = admin/sistem. */
import React from "react";
const { useState, useEffect, useCallback, useMemo } = React;
import { money, date, statusLabel, ExpressTimer, Modal } from "./shared";
import { Ic } from "../lib/panelIcons";
import { Button, Card, Th, Td, Badge, Input, Select, Pagination, EmptyState, Avatar, Skeleton, STATUS_COLOR } from "./ui";
import type { ApiFn, ToastFn, Order, Store } from "./types";
import { downloadCsv, csvStamp, csvDate, csvBool, itemsStr } from "../lib/csv";

const PER = 10;
const STATUS_OPTS: [string, string][] = [['', 'Hamısı'], ['Hazırlanır', 'Hazırlanır'], ['Hazırlandı', 'Hazırlandı'], ['Yolda', 'Kuryerə verildi'], ['Çatdırıldı', 'Çatdırıldı'], ['İptal', 'Ləğv edildi']];
// Satıcının seçə biləcəyi statuslar — Live Status BİR-YÖNLÜ (geri dönüş yoxdur).
const STORE_STATUS: [string, string][] = [['Hazırlandı', 'Hazırlandı'], ['Yolda', 'Kuryerə verildi']];
const CAN_ACT = ['Hazırlanır', 'Hazırlandı'];

// Qaimə çapı — sifariş datasından təmiz A5 qaimə açıb çap dialoqu göstərir (backend lazım deyil).
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
function printInvoice(o: Order, storeName: string) {
  const a = o.deliveryAddress || {};
  const rows = (o.myItems || []).map((it) => `<tr>
    <td>${esc(it.name)}</td>
    <td>${esc([it.selectedSize && `Ölçü ${it.selectedSize}`, it.color].filter(Boolean).join(' / ') || '—')}</td>
    <td class="c">${it.qty}</td>
    <td class="r">${money(it.price || 0)}</td>
    <td class="r">${money((it.price || 0) * (it.qty || 1))}</td></tr>`).join('');
  const html = `<!doctype html><html lang="az"><head><meta charset="utf-8"><title>Qaimə ${esc(o.orderNo)}</title>
  <style>
    *{box-sizing:border-box} body{font:13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;margin:0;padding:32px;max-width:760px}
    .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:16px;margin-bottom:20px}
    .brand{font-size:20px;font-weight:800} .muted{color:#64748b} h1{font-size:15px;margin:0 0 4px} .meta{text-align:right;font-size:12px}
    .grid{display:flex;gap:40px;margin:18px 0}
    table{width:100%;border-collapse:collapse;margin-top:8px} th,td{padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:left}
    th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#64748b} .c{text-align:center} .r{text-align:right}
    .tot{display:flex;justify-content:flex-end;margin-top:14px} .tot table{width:auto;min-width:240px} .tot td{border:0;padding:4px 10px}
    .grand{font-weight:800;font-size:15px;border-top:2px solid #0f172a!important}
    .foot{margin-top:32px;font-size:11px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:12px}
    @media print{body{padding:0}}
  </style></head><body>
  <div class="top">
    <div><div class="brand">${esc(storeName)}</div><div class="muted">Gardrop marketplace</div></div>
    <div class="meta"><h1>QAİMƏ</h1><div>№ ${esc(o.orderNo)}</div><div class="muted">${esc(date(o.createdAt))}</div></div>
  </div>
  <div class="grid">
    <div><div class="muted">Müştəri</div><b>${esc(a.ad || o.userName || '—')}</b>
      ${a.telefon ? `<div>${esc(a.telefon)}</div>` : ''}
      <div class="muted">${esc([a.sehir, a.unvan].filter(Boolean).join(', ') || o.userEmail || '')}</div></div>
    <div><div class="muted">Ödəniş</div><b>${esc(o.paymentMethod || '—')}</b>
      <div class="muted">Çatdırılma: ${esc(o.deliveryType || 'Standart')}</div></div>
  </div>
  <table><thead><tr><th>Məhsul</th><th>Variant</th><th class="c">Say</th><th class="r">Qiymət</th><th class="r">Cəm</th></tr></thead>
    <tbody>${rows}</tbody></table>
  <div class="tot"><table><tr class="grand"><td>Yekun</td><td class="r">${money(o.mySubtotal)}</td></tr></table></div>
  <div class="foot">Bu sənəd Gardrop sistemi tərəfindən yaradılıb · ${esc(o.orderNo)}</div>
  </body></html>`;
  const w = window.open('', '_blank', 'width=820,height=920');
  if (!w) return;
  w.document.write(html); w.document.close(); w.focus();
  w.onload = () => w.print();
}

export function Orders({ api, toast, store }: { api: ApiFn; toast: ToastFn; store: Store }) {
  const [rows, setRows] = useState<Order[] | null>(null);
  const [q, setQ] = useState(''); const [status, setStatus] = useState(''); const [day, setDay] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<Order | null>(null);

  const load = useCallback((silent?: boolean) => {
    if (!silent) setRows(null);
    api<Order[]>(`/api/store/${store.id}/orders`).then(setRows).catch((e) => { if (!silent) toast((e as Error).message, 'error'); });
  }, [api, store.id, toast]);
  useEffect(() => { load(true); const i = setInterval(() => { if (!document.hidden) load(true); }, 15000); return () => clearInterval(i); }, [load]);

  const setOrderStatus = async (o: Order, s: string) => {
    try {
      const r = await api<Order>(`/api/store/${store.id}/orders/${o.id}/status`, { method: 'PUT', body: JSON.stringify({ status: s }) });
      toast('Status yeniləndi'); setView(v => v && v.id === o.id ? { ...v, ...r, status: (r as { status?: string }).status || s } : v); load(true);
    } catch (e) { toast((e as Error).message, 'error'); }
  };

  const callCourier = async (o: Order) => {
    try { await api(`/api/store/${store.id}/orders/${o.id}/courier`, { method: 'POST' }); toast('Kuryer çağırıldı — dispatch xəbərdar edildi', 'success'); }
    catch (e) { toast((e as Error).message, 'error'); }
  };
  const courierReady = (o: Order) => o.status === 'Hazırlandı' || o.status === 'Yolda';

  const filtered = useMemo(() => {
    let r = rows || [];
    if (status) r = r.filter(o => o.status === status);
    if (day) r = r.filter(o => (o.createdAt || '').slice(0, 10) === day);
    if (q.trim()) { const s = q.toLowerCase(); r = r.filter(o => o.orderNo.toLowerCase().includes(s) || (o.userName || '').toLowerCase().includes(s) || (o.userEmail || '').toLowerCase().includes(s)); }
    return r;
  }, [rows, status, day, q]);
  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const pageRows = filtered.slice((page - 1) * PER, page * PER);
  useEffect(() => { setPage(1); }, [q, status, day]);

  const itemCount = (o: Order) => (o.myItems || []).reduce((a, it) => a + (it.qty || 0), 0);

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Filtrlər */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Ic.search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="№ və ya müştəri axtar…" className="pl-9" />
        </div>
        <Select value={status} onChange={e => setStatus(e.target.value)} className="w-auto">{STATUS_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
        <Input type="date" value={day} onChange={e => setDay(e.target.value)} className="w-auto" />
        {(q || status || day) && <Button variant="ghost" size="sm" onClick={() => { setQ(''); setStatus(''); setDay(''); }}>Sıfırla</Button>}
        <Button variant="secondary" size="sm" className="ml-auto" icon={<Ic.external className="w-4 h-4" />} onClick={() => rows && downloadCsv(`sifarisler_${store.name}_${csvStamp()}`, filtered, [
          { key: 'orderNo', label: 'Sifariş №' }, { key: 'status', label: 'Status', map: o => statusLabel(o.status) }, { key: 'createdAt', label: 'Tarix', map: o => csvDate(o.createdAt) },
          { key: 'userName', label: 'Müştəri' }, { key: 'deliveryType', label: 'Çatdırılma' }, { key: 'paymentMethod', label: 'Ödəniş' },
          { key: 'items', label: 'Məhsullar', map: o => itemsStr(o.myItems) }, { key: 'mySubtotal', label: 'Məbləğ' }, { key: 'myPrepared', label: 'Hazır', map: o => csvBool(o.myPrepared) },
        ])}>CSV</Button>
      </div>

      <Card className="overflow-hidden">
        {!rows ? <div className="p-4 space-y-2">{[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
          : filtered.length === 0 ? <EmptyState icon={<Ic.orders className="w-6 h-6" />} title="Sifariş tapılmadı" desc="Filtrləri dəyişin və ya yeni sifariş gözləyin." />
            : (<>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead><tr className="bg-slate-50 border-b border-slate-100"><Th>Sifariş №</Th><Th>Müştəri</Th><Th>Məhsul</Th><Th>Məbləğ</Th><Th>Ödəniş</Th><Th>Tarix</Th><Th>Status</Th><Th className="text-right">Əməliyyat</Th></tr></thead>
                  <tbody>
                    {pageRows.map(o => (
                      <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                        <Td><div className="font-semibold text-slate-900 flex items-center gap-1.5">{o.orderNo}{o.deliveryType === 'Ekspress' && <Badge color="amber">⚡</Badge>}</div></Td>
                        <Td><div className="text-slate-900">{o.userName || '—'}</div><div className="text-xs text-slate-400">{o.userEmail}</div></Td>
                        <Td className="text-slate-500">{itemCount(o)} ədəd</Td>
                        <Td className="font-semibold text-slate-900">{money(o.mySubtotal)}</Td>
                        <Td className="text-slate-500">{o.paymentMethod || '—'}</Td>
                        <Td className="text-slate-500 whitespace-nowrap">{date(o.createdAt)}</Td>
                        <Td>{o.myPrepared && CAN_ACT.includes(o.status) ? <Badge color="green" dot>Hazır</Badge> : <Badge color={STATUS_COLOR[o.status] || 'slate'} dot>{statusLabel(o.status)}</Badge>}</Td>
                        <Td className="text-right whitespace-nowrap">
                          <div className="inline-flex gap-1.5">
                            <Button variant="secondary" size="sm" onClick={() => printInvoice(o, store.name)}>Çap</Button>
                            {courierReady(o) && <Button variant="secondary" size="sm" onClick={() => callCourier(o)}>Kuryer</Button>}
                            <Button variant="secondary" size="sm" onClick={() => setView(o)}>Bax</Button>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={pages} onPage={setPage} />
            </>)}
      </Card>

      {view && <OrderDetail order={view} onClose={() => setView(null)} onStatus={setOrderStatus}
        onPrint={() => printInvoice(view, store.name)} onCourier={() => callCourier(view)} courierReady={courierReady(view)} />}
    </div>
  );
}

// ───────────── Sifariş detalı (sheet) ─────────────
function OrderDetail({ order: o, onClose, onStatus, onPrint, onCourier, courierReady }: { order: Order; onClose: () => void; onStatus: (o: Order, s: string) => void; onPrint: () => void; onCourier: () => void; courierReady: boolean }) {
  const addr = o.deliveryAddress || {};
  const canAct = CAN_ACT.includes(o.status);
  const steps: [string, string, string | null | undefined][] = [
    ['Hazırlanır', 'Sifariş qəbul edildi', o.createdAt],
    ['Hazırlandı', 'Hazırlandı', o.confirmedAt],
    ['Yolda', 'Kuryerə verildi', o.shippedAt],
    ['Çatdırıldı', 'Çatdırıldı', o.deliveredAt],
  ];
  const lastIdx = steps.reduce((acc, s, i) => s[2] ? i : acc, 0);

  return (
    <Modal title={<span className="flex items-center gap-2">{o.orderNo}{o.deliveryType === 'Ekspress' && <Badge color="amber">⚡ Ekspress</Badge>}</span>} onClose={onClose} wide>
      <div className="space-y-5">
        {/* Müştəri */}
        <section>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Müştəri</h4>
          <div className="bg-slate-50 rounded-xl p-3.5 flex items-start gap-3">
            <Avatar name={o.userName} className="w-10 h-10" />
            <div className="text-sm">
              <div className="font-semibold text-slate-900">{addr.ad || o.userName || '—'}</div>
              {addr.telefon && <div className="text-slate-600">{addr.telefon}</div>}
              <div className="text-slate-500">{[addr.sehir, addr.unvan].filter(Boolean).join(', ') || o.userEmail}</div>
            </div>
          </div>
        </section>

        {/* Məhsullar */}
        <section>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Məhsullar</h4>
          <div className="border border-slate-100 rounded-xl divide-y divide-slate-50">
            {(o.myItems || []).map((it, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0" />
                <div className="min-w-0 flex-1"><div className="font-medium text-slate-900 truncate text-sm">{it.name}</div>
                  <div className="text-xs text-slate-400">{[it.selectedSize && `Ölçü: ${it.selectedSize}`, it.color && `Rəng: ${it.color}`, `Say: ${it.qty}`].filter(Boolean).join(' · ')}</div></div>
                <div className="font-semibold text-slate-900 text-sm">{money((it.price || 0) * (it.qty || 1))}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm font-semibold"><span className="text-slate-500">Cəm</span><span className="text-slate-900">{money(o.mySubtotal)}</span></div>
        </section>

        {/* Sifariş məlumatı */}
        <section className="grid grid-cols-2 gap-3 text-sm">
          <div><div className="text-xs text-slate-400">Sifariş tarixi</div><div className="text-slate-900 font-medium">{date(o.createdAt)}</div></div>
          <div><div className="text-xs text-slate-400">Ödəniş üsulu</div><div className="text-slate-900 font-medium">{o.paymentMethod || '—'}</div></div>
          <div><div className="text-xs text-slate-400">Çatdırılma</div><div className="text-slate-900 font-medium">{o.deliveryType || 'Standart'}</div></div>
          <div><div className="text-xs text-slate-400">Status</div><Badge color={STATUS_COLOR[o.status] || 'slate'} dot>{statusLabel(o.status)}</Badge></div>
        </section>

        {/* Timeline */}
        <section>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Sifariş axını</h4>
          {o.status === 'İptal' ? (
            <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm"><b>Ləğv edildi</b>{o.cancelReason ? ` — ${o.cancelReason}` : ''}{o.cancelledBy ? ` (${o.cancelledBy})` : ''}</div>
          ) : (
            <div className="space-y-0">
              {steps.map(([key, label, ts], i) => {
                const done = i <= lastIdx; const current = i === lastIdx;
                return (
                  <div key={key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 ${done ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-300'}`} />
                      {i < steps.length - 1 && <div className={`w-0.5 flex-1 min-h-[24px] ${i < lastIdx ? 'bg-emerald-600' : 'bg-slate-200'}`} />}
                    </div>
                    <div className={`pb-4 ${current ? '' : ''}`}>
                      <div className={`text-sm font-medium ${done ? 'text-slate-900' : 'text-slate-400'}`}>{label}</div>
                      {ts && <div className="text-xs text-slate-400">{date(ts)}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Express timer */}
        {o.deliveryType === 'Ekspress' && canAct && !o.myPrepared && (
          <div className="bg-amber-50 text-amber-800 rounded-xl p-3 text-sm flex items-center gap-2">
            <ExpressTimer since={o.createdAt} /> ərzində hazırlamasanız sifariş avtomatik ləğv olunacaq.
          </div>
        )}

        {/* Sürətli əməliyyatlar */}
        <section>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Sürətli əməliyyatlar</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={<Ic.external className="w-4 h-4" />} onClick={onPrint}>Qaiməni çap et</Button>
            <Button variant="secondary" size="sm" disabled={!courierReady} onClick={onCourier}>Kuryeri çağır</Button>
          </div>
          {!courierReady && <p className="text-xs text-slate-400 mt-1.5">Kuryer yalnız sifariş «Hazırlandı» olduqda çağırıla bilər.</p>}
        </section>

        {/* Status dəyiş */}
        <section>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Status dəyiş</h4>
          {canAct ? (
            <div className="flex flex-wrap gap-2">
              {STORE_STATUS.map(([v, l]) => {
                const isCur = o.status === v || (v === 'Hazırlandı' && o.myPrepared);
                const disabled = v === 'Yolda' && o.status !== 'Hazırlandı';
                return <Button key={v} variant={isCur ? 'primary' : 'secondary'} size="sm" disabled={disabled} onClick={() => onStatus(o, v)}>{l}</Button>;
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Bu sifariş artıq emal mərhələsindədir — status sistem/admin tərəfindən idarə olunur.</p>
          )}
          <p className="text-xs text-slate-400 mt-2">«Çatdırıldı», «Ləğv edildi» və «Qaytarıldı» statusları yalnız sistem/admin tərəfindən idarə olunur.</p>
        </section>
      </div>
    </Modal>
  );
}

export default Orders;
