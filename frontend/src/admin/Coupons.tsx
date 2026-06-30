/* Admin tab (fayllara bölmə): ./shared-dən import, api/toast props. */
import React from "react";
const { useState, useEffect, useCallback } = React;
import { money, date, Btn, Field, Modal, Confirm, TableSkeleton, EmptyRow, Toolbar, Th, Td, Card, SELECT_CLS, EMPTY_COUPON, useLive } from "./shared";
import type { ApiFn, ToastFn, Coupon } from "./types";
import { Switch, MCard, MobileListState } from "../lib/iosUi";

export function Coupons({ api, toast }: { api: ApiFn; toast: ToastFn }) {
    const [rows, setRows] = useState<Coupon[] | null>(null);
    const [edit, setEdit] = useState<Coupon | null>(null);
    const [del, setDel] = useState<Coupon | null>(null);
    const load = useCallback((silent?: boolean) => { if (!silent) setRows(null); api<Coupon[]>('/api/admin/coupons').then(setRows).catch((e) => { if (!silent) toast((e as Error).message, 'error'); }); }, [api, toast]);
    useEffect(() => { load(); }, [load]);
    useLive(useCallback(() => load(true), [load]));

    const save = async (c: Coupon) => {
      try {
        const body = {
          code: c.code, type: c.type, active: !!c.active,
          value: Number(c.value) || 0,
          minOrder: Number(c.minOrder) || 0,
          maxUses: c.maxUses === '' || c.maxUses == null ? null : Number(c.maxUses),
          expiresAt: c.expiresAt ? new Date(c.expiresAt + 'T23:59:59Z').toISOString() : null,
        };
        if (c.id) await api('/api/admin/coupons/' + c.id, { method: 'PUT', body: JSON.stringify(body) });
        else await api('/api/admin/coupons', { method: 'POST', body: JSON.stringify(body) });
        toast('Yadda saxlanıldı'); setEdit(null); load();
      } catch (e) { toast((e as Error).message, 'error'); }
    };
    const remove = async (c: Coupon) => {
      try { await api('/api/admin/coupons/' + c.id, { method: 'DELETE' }); toast('Silindi'); setDel(null); load(); }
      catch (e) { toast((e as Error).message, 'error'); setDel(null); }
    };

    return (
      <div>
        <Toolbar onAdd={() => setEdit({ ...EMPTY_COUPON })} addLabel="Kupon əlavə et" />
        <div className="hidden md:block"><Card>
          <table className="w-full min-w-[680px]">
            <thead><tr className="bg-bg2"><Th>Kod</Th><Th>Növ</Th><Th>Dəyər</Th><Th>Min. sifariş</Th><Th>İstifadə</Th><Th>Bitmə</Th><Th>Status</Th><Th className="text-right">Əməliyyat</Th></tr></thead>
            {!rows ? <TableSkeleton cols={8} /> : rows.length === 0 ? <EmptyRow cols={8} text="Kupon yoxdur" /> : (
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t border-bdr row-h">
                    <Td className="font-mono font-semibold">{c.code}</Td>
                    <Td className="text-t2">{c.type === 'percent' ? 'Faiz' : 'Məbləğ'}</Td>
                    <Td>{c.type === 'percent' ? c.value + '%' : money(Number(c.value))}</Td>
                    <Td className="text-t2">{Number(c.minOrder) > 0 ? money(Number(c.minOrder)) : '—'}</Td>
                    <Td className="text-t2">{c.used}{c.maxUses ? ' / ' + c.maxUses : ''}</Td>
                    <Td className="text-t2">{c.expiresAt ? date(c.expiresAt) : '—'}</Td>
                    <Td><Switch checked={!!c.active} onChange={(v) => save({ ...c, active: v })} /></Td>
                    <Td className="text-right whitespace-nowrap">
                      <button onClick={() => setEdit(c)} className="text-blue hover:underline text-sm mr-3">Redaktə</button>
                      <button onClick={() => setDel(c)} className="text-sale hover:underline text-sm">Sil</button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </Card></div>

        {/* Mobil kartlar */}
        <div className="md:hidden space-y-2.5">
          <MobileListState loading={!rows} empty={!!rows && rows.length === 0} emptyText="Kupon yoxdur" />
          {rows && rows.map((c) => (
            <MCard key={c.id}
              title={<span className="font-mono">{c.code}</span>}
              subtitle={c.type === 'percent' ? 'Faiz endirim' : 'Məbləğ endirim'}
              badge={<Switch checked={!!c.active} onChange={(v) => save({ ...c, active: v })} />}
              rows={[
                ['Dəyər', c.type === 'percent' ? c.value + '%' : money(Number(c.value))],
                ['Min. sifariş', Number(c.minOrder) > 0 ? money(Number(c.minOrder)) : '—'],
                ['İstifadə', `${c.used}${c.maxUses ? ' / ' + c.maxUses : ''}`],
                ['Bitmə', c.expiresAt ? date(c.expiresAt) : '—'],
              ]}
              actions={<>
                <button onClick={() => setEdit(c)} className="text-blue font-medium">Redaktə</button>
                <button onClick={() => setDel(c)} className="text-sale font-medium ml-auto">Sil</button>
              </>}
            />
          ))}
        </div>
        {edit && <CouponEdit coupon={edit} onClose={() => setEdit(null)} onSave={save} />}
        {del && <Confirm text={`"${del.code}" kuponunu silmək istəyirsiniz?`} onYes={() => remove(del)} onNo={() => setDel(null)} />}
      </div>
    );
  }

export function CouponEdit({ coupon, onClose, onSave }: { coupon: Coupon; onClose: () => void; onSave: (c: Coupon) => void }) {
    const [f, setF] = useState<Coupon>({ ...coupon, expiresAt: coupon.expiresAt ? String(coupon.expiresAt).slice(0, 10) : '' });
    const str = (k: keyof Coupon) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
    const num = (k: keyof Coupon) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value === '' ? '' : Number(e.target.value) });
    const valid = f.code && f.code.trim() && Number(f.value) > 0;
    return (
      <Modal title={coupon.id ? 'Kuponu redaktə et' : 'Yeni kupon'} onClose={onClose}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Field label="Kupon kodu" value={f.code || ''} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="YAY10" /></div>
          <label className="block">
            <span className="block text-xs font-semibold text-t2 mb-1">Endirim növü</span>
            <select className={SELECT_CLS} value={f.type} onChange={str('type')}>
              <option value="amount">Məbləğ (₼)</option>
              <option value="percent">Faiz (%)</option>
            </select>
          </label>
          <Field label={f.type === 'percent' ? 'Faiz (%)' : 'Məbləğ (₼)'} type="number" value={f.value ?? ''} onChange={num('value')} />
          <Field label="Minimum sifariş (₼)" type="number" value={f.minOrder ?? ''} onChange={num('minOrder')} placeholder="0 = şərtsiz" />
          <Field label="Maks. istifadə" type="number" value={f.maxUses ?? ''} onChange={num('maxUses')} placeholder="boş = limitsiz" />
          <div className="col-span-2"><Field label="Bitmə tarixi (istəyə bağlı)" type="date" value={f.expiresAt || ''} onChange={str('expiresAt')} /></div>
          <div className="col-span-2 flex items-center justify-between gap-2 bg-bg2 rounded-card px-3.5 py-3">
            <span className="text-sm font-medium">Aktiv</span>
            <Switch checked={!!f.active} onChange={(v) => setF({ ...f, active: v })} />
          </div>
        </div>
        <p className="text-xs text-t3 mt-2">Nümunə: <b>Məbləğ</b> + dəyər 10 + min. sifariş 100 → "100 ₼-dən yuxarı alışda 10 ₼ endirim".</p>
        <div className="flex gap-2 justify-end mt-5">
          <Btn variant="ghost" onClick={onClose}>İmtina</Btn>
          <Btn onClick={() => onSave(f)} disabled={!valid}>Yadda saxla</Btn>
        </div>
      </Modal>
    );
  }



export default Coupons;
