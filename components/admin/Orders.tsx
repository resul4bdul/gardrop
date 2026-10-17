/* Admin tab (fayllara bölmə): ./shared-dən import, api/toast props. */
declare const L: any;
import React from "react";
const { useState, useEffect, useCallback, useRef } = React;
import { money, date, statusLabel, STATUSES, STATUS_COLORS, Btn, Modal, Confirm, TableSkeleton, EmptyRow, Toolbar, Th, Td, Card, MAP_CENTER, useLive } from "./shared";
import type { ApiFn, ToastFn, AdminOrder, OrderStore } from "./types";
import { downloadCsv, csvStamp, csvDate, itemsStr } from "../lib/csv";
import { Segmented, MCard, MobileListState } from "../lib/iosUi";

export function Orders({ api, toast }: { api: ApiFn; toast: ToastFn }) {
    const [rows, setRows] = useState<AdminOrder[] | null>(null);
    const [filter, setFilter] = useState('');
    const [view, setView] = useState<AdminOrder | null>(null);
    const [del, setDel] = useState<AdminOrder | null>(null);
    const [cancel, setCancel] = useState<AdminOrder | null>(null);   // ləğv ediləcək sifariş
    const [reason, setReason] = useState('');

    const load = useCallback((silent?: boolean) => {
      if (!silent) setRows(null);
      api<AdminOrder[]>('/api/admin/orders' + (filter ? '?status=' + encodeURIComponent(filter) : '')).then(setRows).catch((e) => { if (!silent) toast((e as Error).message, 'error'); });
    }, [api, filter, toast]);
    useEffect(() => { load(); }, [load]);
    useLive(useCallback(() => load(true), [load]));

    const setStatus = async (o: AdminOrder, status: string, rsn?: string) => {
      if (status === 'İptal' && !rsn) { setCancel(o); setReason(''); return; }  // səbəb tələb et
      try {
        await api('/api/admin/orders/' + o.id + '/status', { method: 'PUT', body: JSON.stringify({ status, reason: rsn || '' }) });
        toast('Status dəyişdi'); setCancel(null); setReason(''); load();
        if (view) setView({ ...view, status, cancelReason: rsn || view.cancelReason, cancelledBy: status === 'İptal' ? 'Admin' : view.cancelledBy });
      }
      catch (e) { toast((e as Error).message, 'error'); }
    };
    const remove = async (o: AdminOrder) => {
      try { await api('/api/admin/orders/' + o.id, { method: 'DELETE' }); toast('Silindi'); setDel(null); setView(null); load(); }
      catch (e) { toast((e as Error).message, 'error'); setDel(null); }
    };

    const filterBar = (
      <div className="flex gap-1">
        <Segmented value={filter} onChange={setFilter} options={[['', 'Hamısı'], ...STATUSES.map((s) => [s, statusLabel(s)] as [string, string])]} />
        <button onClick={() => rows && downloadCsv(`sifarisler_${csvStamp()}`, rows, [
          { key: 'orderNo', label: 'Sifariş №' }, { key: 'status', label: 'Status', map: (o) => statusLabel(o.status) },
          { key: 'createdAt', label: 'Tarix', map: (o) => csvDate(o.createdAt) },
          { key: 'userName', label: 'Müştəri' }, { key: 'userEmail', label: 'Email' },
          { key: 'deliveryType', label: 'Çatdırılma' }, { key: 'km', label: 'Məsafə (km)' },
          { key: 'city', label: 'Şəhər', map: (o) => o.deliveryAddress?.sehir || '' },
          { key: 'address', label: 'Ünvan', map: (o) => o.deliveryAddress?.unvan || '' },
          { key: 'itemCount', label: 'Məhsul sayı', map: (o) => (o.items || []).reduce((a, it) => a + (it.qty || 0), 0) },
          { key: 'items', label: 'Məhsullar', map: (o) => itemsStr(o.items) },
          { key: 'stores', label: 'Mağazalar', map: (o) => (o.stores || []).map(s => s.name).join('; ') },
          { key: 'total', label: 'Cəm (₼)' }, { key: 'deliveryFee', label: 'Çatdırılma haqqı' },
          { key: 'discount', label: 'Endirim' }, { key: 'couponCode', label: 'Kupon' },
          { key: 'payment', label: 'Ödəniş', map: (o) => o.payment?.method || '' },
          { key: 'cancelReason', label: 'Ləğv səbəbi' }, { key: 'cancelledBy', label: 'Ləğv edən' },
        ])} disabled={!rows || !rows.length} className="px-3 py-1.5 rounded-btn text-sm font-medium bg-white border border-bdr text-t2 hover:border-brand disabled:opacity-40" title="CSV ixrac">⬇ CSV</button>
      </div>
    );

    return (
      <div>
        <Toolbar right={filterBar} />
        <div className="hidden md:block"><Card>
          <table className="w-full min-w-[760px]">
            <thead><tr className="bg-bg2"><Th>№</Th><Th>Müştəri</Th><Th>Məhsul</Th><Th>Məbləğ</Th><Th>Status</Th><Th>Tarix</Th><Th className="text-right">Əməliyyat</Th></tr></thead>
            {!rows ? <TableSkeleton cols={7} /> : rows.length === 0 ? <EmptyRow cols={7} text="Sifariş yoxdur" /> : (
              <tbody>
                {rows.map((o) => {
                  const items = Array.isArray(o.items) ? o.items : [];
                  const count = items.reduce((a, it) => a + (it.qty || 1), 0);
                  return (
                    <tr key={o.id} className="border-t border-bdr row-h">
                      <Td className="font-medium">{o.orderNo}{o.deliveryType === 'Ekspress' && <span className="ml-1.5 text-[10px] font-bold text-amber bg-amber/10 px-1.5 py-0.5 rounded-full">⚡ Ekspress</span>}</Td>
                      <Td><div className="leading-tight">{o.userName || '—'}<div className="text-t3 text-xs">{o.userEmail}</div></div></Td>
                      <Td className="text-t2">{count} ədəd</Td>
                      <Td className="font-semibold">{money(o.total)}<div className="text-t3 text-xs font-normal">{o.km != null ? Number(o.km).toFixed(1) + ' km · ' : ''}{money(o.deliveryFee || 0)} çatd.</div></Td>
                      <Td>
                        <select value={o.status} onChange={(e) => setStatus(o, e.target.value)}
                          className={`rounded-full text-xs font-semibold px-2.5 py-1 border-0 cursor-pointer ${STATUS_COLORS[o.status] || 'bg-bg3 text-t2'}`}>
                          {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                        </select>
                      </Td>
                      <Td className="text-t3 text-xs">{date(o.createdAt)}</Td>
                      <Td className="text-right whitespace-nowrap">
                        <button onClick={() => setView(o)} className="text-blue hover:underline text-sm mr-3">Bax</button>
                        <button onClick={() => setDel(o)} className="text-sale hover:underline text-sm">Sil</button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </Card></div>

        {/* Mobil kartlar */}
        <div className="md:hidden space-y-2.5">
          <MobileListState loading={!rows} empty={!!rows && rows.length === 0} emptyText="Sifariş yoxdur" />
          {rows && rows.map((o) => {
            const items = Array.isArray(o.items) ? o.items : [];
            const count = items.reduce((a, it) => a + (it.qty || 1), 0);
            return (
              <MCard key={o.id}
                title={<>{o.orderNo}{o.deliveryType === 'Ekspress' && <span className="ml-1.5 text-[10px] font-bold text-amber bg-amber/10 px-1.5 py-0.5 rounded-full">⚡</span>}</>}
                subtitle={<>{o.userName || '—'} · {o.userEmail}</>}
                badge={<select value={o.status} onChange={(e) => setStatus(o, e.target.value)} className={`rounded-full text-xs font-semibold px-2.5 py-1 border-0 cursor-pointer ${STATUS_COLORS[o.status] || 'bg-bg3 text-t2'}`}>{STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</select>}
                rows={[
                  ['Məhsul', `${count} ədəd`],
                  ['Məbləğ', <span key="m">{money(o.total)} <span className="text-t3">· {o.km != null ? Number(o.km).toFixed(1) + ' km · ' : ''}{money(o.deliveryFee || 0)} çatd.</span></span>],
                  ['Tarix', date(o.createdAt)],
                ]}
                actions={<>
                  <button onClick={() => setView(o)} className="text-blue font-medium">Bax</button>
                  <button onClick={() => setDel(o)} className="text-sale font-medium ml-auto">Sil</button>
                </>}
              />
            );
          })}
        </div>
        {view && <OrderView order={view} onClose={() => setView(null)} onStatus={setStatus} onDelete={() => setDel(view)} />}
        {del && <Confirm text={`"${del.orderNo}" sifarişini silmək istəyirsiniz?`} onYes={() => remove(del)} onNo={() => setDel(null)} />}
        {cancel && (
          <Modal title={`"${cancel.orderNo}" sifarişini ləğv et`} onClose={() => setCancel(null)}>
            <label className="block text-sm font-medium text-brand mb-1">Ləğv səbəbi <span className="text-sale">*</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Səbəbi qeyd edin — müştəriyə bildiriş kimi göndəriləcək." className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm resize-none" />
            <div className="flex gap-2 justify-end mt-4"><Btn variant="ghost" onClick={() => setCancel(null)}>İmtina</Btn><Btn variant="danger" disabled={reason.trim().length < 3} onClick={() => setStatus(cancel, 'İptal', reason.trim())}>Ləğv et</Btn></div>
          </Modal>
        )}
      </div>
    );
  }

  // Sifariş marşrutu — mağaza(lar)dan müştəriyə (yalnız oxu, Leaflet)
export function OrderMap({ stores, custLat, custLng }: { stores: OrderStore[]; custLat?: number | null; custLng?: number | null }) {
    const el = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (!(window as any).L || !el.current) return;
      const map = L.map(el.current, { zoomControl: true, attributionControl: false, minZoom: 6 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      const pts: number[][] = [];
      (stores || []).forEach((s) => {
        if (s.lat != null && s.lng != null) {
          L.circleMarker([s.lat, s.lng], { radius: 9, color: '#fff', weight: 2, fillColor: '#16A34A', fillOpacity: 1 }).addTo(map).bindTooltip('🏪 ' + s.name);
          pts.push([s.lat, s.lng]);
          if (custLat != null && custLng != null) L.polyline([[s.lat, s.lng], [custLat, custLng]], { color: '#2F6BFF', weight: 2, dashArray: '6 6' }).addTo(map);
        }
      });
      if (custLat != null && custLng != null) {
        L.circleMarker([custLat, custLng], { radius: 9, color: '#fff', weight: 2, fillColor: '#E53E3E', fillOpacity: 1 }).addTo(map).bindTooltip('📍 Müştəri');
        pts.push([custLat, custLng]);
      }
      if (pts.length > 1) map.fitBounds(pts, { padding: [30, 30], maxZoom: 14 });
      else if (pts.length === 1) map.setView(pts[0], 13);
      else map.setView([MAP_CENTER.lat, MAP_CENTER.lng], 11);
      setTimeout(() => map.invalidateSize(), 120);
      return () => map.remove();
    }, []);
    return <div ref={el} className="w-full h-64 rounded-card overflow-hidden bg-bg2 border border-bdr" style={{ zIndex: 0 }} />;
  }

export function OrderView({ order, onClose, onStatus, onDelete }: { order: AdminOrder; onClose: () => void; onStatus: (o: AdminOrder, status: string, rsn?: string) => void; onDelete: () => void }) {
    const items = Array.isArray(order.items) ? order.items : [];
    const addr = order.deliveryAddress || {};
    const pay = order.payment || {};
    const stores = Array.isArray(order.stores) ? order.stores : [];
    const hasGeo = (order.customerLat != null && order.customerLng != null) || stores.some((s) => s.lat != null);
    return (
      <Modal title={'Sifariş ' + order.orderNo} onClose={onClose} wide>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-bg2 rounded-card p-3">
            <div className="text-xs font-semibold text-t3 uppercase mb-1">Müştəri</div>
            <div className="font-medium">{order.userName || '—'}</div>
            <div className="text-sm text-t2">{order.userEmail}</div>
          </div>
          <div className="bg-bg2 rounded-card p-3">
            <div className="text-xs font-semibold text-t3 uppercase mb-1">Status / Ödəniş</div>
            <div className="flex items-center gap-2">
              <select value={order.status} onChange={(e) => onStatus(order, e.target.value)} className={`rounded-full text-xs font-semibold px-2.5 py-1 border-0 ${STATUS_COLORS[order.status]}`}>
                {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
              <span className="text-sm text-t2">{pay.method || '—'}</span>
            </div>
            {order.status === 'İptal' && order.cancelReason && <div className="text-xs text-sale mt-1.5">Ləğv səbəbi{order.cancelledBy ? ` (${order.cancelledBy})` : ''}: {order.cancelReason}</div>}
          </div>
          <div className="bg-bg2 rounded-card p-3">
            <div className="text-xs font-semibold text-t3 uppercase mb-1">Çatdırılma ünvanı</div>
            <div className="text-sm">{addr.unvan || addr.sehir ? `${addr.sehir || ''} ${addr.unvan || ''}`.trim() : '—'}</div>
          </div>
          <div className="bg-bg2 rounded-card p-3">
            <div className="text-xs font-semibold text-t3 uppercase mb-1">Çatdırılma</div>
            <div className="text-sm flex flex-wrap gap-x-4 gap-y-0.5">
              <span>Növ: <b className="text-brand">{order.deliveryType || 'Standart'}</b></span>
              <span>Xərc: <b className="text-brand">{Number(order.deliveryFee || 0) === 0 ? 'Pulsuz' : money(order.deliveryFee || 0)}</b></span>
              {order.km != null && <span>Məsafə: <b className="text-brand">{Number(order.km).toFixed(1)} km</b></span>}
              {(order.discount || 0) > 0 && <span>Endirim: <b className="text-green">−{money(order.discount || 0)}</b>{order.couponCode ? ' (' + order.couponCode + ')' : ''}</span>}
            </div>
            <div className="text-xs text-t3 mt-1">{stores.length > 0 ? stores.map((s) => s.name).join(', ') : '—'}</div>
          </div>
        </div>
        {hasGeo && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-t3 uppercase mb-1.5">🗺️ Marşrut (🏪 mağaza → 📍 müştəri)</div>
            <OrderMap stores={stores} custLat={order.customerLat} custLng={order.customerLng} />
          </div>
        )}
        <div className="border border-bdr rounded-card overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-bg2"><Th>Məhsul</Th><Th>Mağaza</Th><Th>Ölçü</Th><Th>Say</Th><Th className="text-right">Qiymət</Th></tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan={5} className="px-4 py-4 text-center text-t3 text-sm">Detallar yoxdur</td></tr> :
                items.map((it, i) => (
                  <tr key={i} className="border-t border-bdr">
                    <Td>{it.name || it.productId || '—'}</Td>
                    <Td className="text-t2">{it.store || '—'}</Td>
                    <Td className="text-t2">{it.selectedSize || it.size || '—'}</Td>
                    <Td className="text-t2">{it.qty || 1}</Td>
                    <Td className="text-right">{it.price != null ? money(it.price) : '—'}</Td>
                  </tr>
                ))}
            </tbody>
            <tfoot><tr className="border-t border-bdr bg-bg2"><td className="px-4 py-2.5 font-bold" colSpan={4}>Cəmi</td><td className="px-4 py-2.5 text-right font-bold">{money(order.total)}</td></tr></tfoot>
          </table>
        </div>
        <div className="flex justify-between mt-5">
          <Btn variant="danger" onClick={onDelete}>Sifarişi sil</Btn>
          <Btn variant="ghost" onClick={onClose}>Bağla</Btn>
        </div>
      </Modal>
    );
  }



export default Orders;
