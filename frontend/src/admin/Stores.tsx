/* Admin tab (fayllara bölmə): ./shared-dən import, api/toast props. */
import React from "react";
const { useState, useEffect, useCallback } = React;
import { Btn, Field, Modal, Confirm, TableSkeleton, EmptyRow, Toolbar, Th, Td, Card, MapPicker, EMPTY_STORE, uploadFilesAdmin, useLive } from "./shared";
import { MCard, MobileListState } from "../lib/iosUi";
import type { ApiFn, ToastFn, Store } from "./types";

export function Stores({ api, toast }: { api: ApiFn; toast: ToastFn }) {
    const [rows, setRows] = useState<Store[] | null>(null);
    const [edit, setEdit] = useState<Store | null>(null);
    const [del, setDel] = useState<Store | null>(null);
    const load = useCallback((silent?: boolean) => { if (!silent) setRows(null); api<Store[]>('/api/admin/stores').then(setRows).catch((e) => { if (!silent) toast((e as Error).message, 'error'); }); }, [api, toast]);
    useEffect(() => { load(); }, [load]);
    useLive(useCallback(() => load(true), [load]));

    const save = async (s: Store) => {
      try {
        if (s.id) await api('/api/admin/stores/' + s.id, { method: 'PUT', body: JSON.stringify(s) });
        else await api('/api/admin/stores', { method: 'POST', body: JSON.stringify(s) });
        toast('Yadda saxlanıldı'); setEdit(null); load();
      } catch (e) { toast((e as Error).message, 'error'); }
    };
    const remove = async (s: Store) => {
      try { await api('/api/admin/stores/' + s.id, { method: 'DELETE' }); toast('Silindi'); setDel(null); load(); }
      catch (e) { toast((e as Error).message, 'error'); setDel(null); }
    };

    return (
      <div>
        <Toolbar onAdd={() => setEdit({ ...EMPTY_STORE })} addLabel="Mağaza əlavə et" />
        <div className="hidden md:block"><Card>
          <table className="w-full min-w-[640px]">
            <thead><tr className="bg-bg2"><Th>ID</Th><Th>Ad</Th><Th>Şəhər</Th><Th>Reytinq</Th><Th>Rəy</Th><Th>Məhsul</Th><Th>İl</Th><Th className="text-right">Əməliyyat</Th></tr></thead>
            {!rows ? <TableSkeleton cols={8} /> : rows.length === 0 ? <EmptyRow cols={8} text="Mağaza yoxdur" /> : (
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-t border-bdr row-h">
                    <Td className="text-t3">#{s.id}</Td>
                    <Td className="font-medium">{s.name}</Td>
                    <Td className="text-t2">{s.city}</Td>
                    <Td>★ {s.rating}</Td>
                    <Td className="text-t2">{s.reviews}</Td>
                    <Td className="text-t2">{s.products}</Td>
                    <Td className="text-t2">{s.established}</Td>
                    <Td className="text-right whitespace-nowrap">
                      <button onClick={() => setEdit(s)} className="text-blue hover:underline text-sm mr-3">Redaktə</button>
                      <button onClick={() => setDel(s)} className="text-sale hover:underline text-sm">Sil</button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </Card></div>

        {/* Mobil kartlar */}
        <div className="md:hidden space-y-2.5">
          <MobileListState loading={!rows} empty={!!rows && rows.length === 0} emptyText="Mağaza yoxdur" />
          {rows && rows.map((s) => (
            <MCard key={s.id}
              lead={<div className="w-11 h-11 rounded-full bg-bg2 border border-bdr overflow-hidden grid place-items-center font-bold text-t2 shrink-0">{s.logo ? <img src={s.logo} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : (s.name || '?')[0]}</div>}
              title={s.name}
              subtitle={`#${s.id} · ${s.city || '—'}`}
              rows={[
                ['Reytinq', `★ ${s.rating} (${s.reviews} rəy)`],
                ['Məhsul', s.products ?? 0],
                ['Təsis ili', s.established ?? '—'],
              ]}
              actions={<>
                <button onClick={() => setEdit(s)} className="text-blue font-medium">Redaktə</button>
                <button onClick={() => setDel(s)} className="text-sale font-medium ml-auto">Sil</button>
              </>}
            />
          ))}
        </div>
        {edit && <StoreEdit store={edit} api={api} toast={toast} onClose={() => setEdit(null)} onSave={save} />}
        {del && <Confirm text={`"${del.name}" mağazasını silmək istəyirsiniz?`} onYes={() => remove(del)} onNo={() => setDel(null)} />}
      </div>
    );
  }

interface ComRow { category: string; percent: number | string }
export function StoreEdit({ store, api, toast, onClose, onSave }: { store: Store; api: ApiFn; toast: ToastFn; onClose: () => void; onSave: (s: Store) => void }) {
    const [f, setF] = useState<Store>({ ...store, ownerEmail: store.ownerEmail || '' });
    const [mapOpen, setMapOpen] = useState(false), [uploading, setUploading] = useState(false);
    // Komissiyalar (yalnız mövcud mağaza üçün)
    const [defPct, setDefPct] = useState<number | string>('');
    const [catRows, setCatRows] = useState<ComRow[]>([]);
    const [comBusy, setComBusy] = useState(false);
    useEffect(() => {
      if (!store.id) return;
      api<{ category: string; percent: number }[]>(`/api/admin/stores/${store.id}/commissions`).then((r) => {
        const d = r.find((x) => x.category === ''); if (d) setDefPct(d.percent);
        setCatRows(r.filter((x) => x.category !== '').map((x) => ({ category: x.category, percent: x.percent })));
      }).catch(() => {});
    }, [store.id, api]);
    const saveCommissions = async () => {
      if (!store.id) return;
      setComBusy(true);
      const rows: ComRow[] = [];
      if (defPct !== '' && Number(defPct) >= 0) rows.push({ category: '', percent: Number(defPct) });
      for (const r of catRows) if (r.category.trim() && r.percent !== '') rows.push({ category: r.category.trim(), percent: Number(r.percent) });
      try { await api(`/api/admin/stores/${store.id}/commissions`, { method: 'PUT', body: JSON.stringify(rows.map(r => ({ Category: r.category, Percent: Number(r.percent) }))) }); toast('Komissiyalar saxlanıldı'); }
      catch (e) { toast((e as Error).message, 'error'); }
      setComBusy(false);
    };
    const num = (k: keyof Store) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value === '' ? null : Number(e.target.value) });
    const str = (k: keyof Store) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
    const uploadLogo = async (files: FileList | null) => { if (!files || !files.length) return; setUploading(true); try { const urls = await uploadFilesAdmin(files); if (urls[0]) setF((s) => ({ ...s, logo: urls[0] })); } catch (e) {} setUploading(false); };
    return (
      <Modal title={store.id ? 'Mağazanı redaktə et' : 'Yeni mağaza'} onClose={onClose}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-16 h-16 rounded-full bg-bg2 border border-bdr overflow-hidden flex items-center justify-center shrink-0">
            {f.logo ? <img src={f.logo} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <span className="text-xl font-bold text-t3">{(f.name || '?')[0]}</span>}
          </div>
          <div className="flex-1">
            <span className="block text-xs font-semibold text-t2 mb-1">Profil şəkli (logo)</span>
            <div className="flex flex-wrap items-center gap-2">
              <label className={`inline-flex items-center gap-2 border rounded-btn px-3 py-1.5 text-sm cursor-pointer ${uploading ? 'border-bdr text-t3' : 'border-bdr-s text-brand hover:border-brand'}`}>
                {uploading ? 'Yüklənir…' : '📷 Yüklə'}
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { uploadLogo(e.target.files); e.target.value = ''; }} />
              </label>
              {f.logo && <button type="button" onClick={() => setF({ ...f, logo: '' })} className="text-sm text-sale hover:underline">Sil</button>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Field label="Logo URL" value={f.logo || ''} onChange={str('logo')} placeholder="https://… və ya yuxarıdan yüklə" /></div>
          <div className="col-span-2"><Field label="Ad" value={f.name || ''} onChange={str('name')} /></div>
          <Field label="Şəhər" value={f.city || ''} onChange={str('city')} />
          <Field label="Təsis ili" type="number" value={f.established ?? ''} onChange={num('established')} />
          <div className="col-span-2"><Field label="Sahib (istifadəçi e-poçtu)" value={f.ownerEmail || ''} onChange={(e) => setF({ ...f, ownerEmail: e.target.value })} placeholder="satici@gardrop.az — mağaza panelinə giriş üçün" /></div>
          <div className="col-span-2"><Field label="Ünvan (mağaza məkanı)" value={f.address || ''} onChange={str('address')} placeholder="Küçə, bina, şəhər" /></div>
          <Field label="En dairəsi (Lat)" type="number" value={f.lat ?? ''} onChange={num('lat')} placeholder="40.4093" />
          <Field label="Uzunluq (Lng)" type="number" value={f.lng ?? ''} onChange={num('lng')} placeholder="49.8671" />
        </div>
        <button type="button" onClick={() => setMapOpen(true)} className="w-full mt-2 flex items-center justify-center gap-2 border border-bdr text-brand py-2.5 rounded-btn text-sm font-semibold hover:border-brand transition-colors">📍 {f.lat ? 'Xəritədə dəyiş' : 'Xəritədən məkan seç'}</button>
        <p className="text-xs text-t3 mt-2">📍 Koordinatlar çatdırılma xərcinin hesablanması üçündür (mağaza↔müştəri məsafəsi: 0–5 km 3 ₼, sonra hər km +0.50 ₼).</p>
        {mapOpen && <MapPicker initial={f.lat ? { lat: f.lat, lng: f.lng ?? 0 } : null} onClose={() => setMapOpen(false)} onSelect={({ lat, lng, addr }) => setF((s) => ({ ...s, lat, lng, address: addr || s.address }))} />}
        {store.id && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {[['Reytinq', `★ ${f.rating ?? 0}`], ['Rəylər', f.reviews ?? 0], ['Məhsullar', f.products ?? 0]].map(([k, v]) => (
              <div key={k} className="bg-bg2 rounded-card p-3 text-center"><div className="text-xs text-t3">{k}</div><div className="font-bold mt-0.5">{v}</div></div>
            ))}
          </div>
        )}
        <p className="text-xs text-t3 mt-2">Reytinq, rəy və məhsul sayı avtomatik hesablanır (sifariş, dəyərləndirmə və imtinalara görə) — əl ilə dəyişdirilmir.</p>

        {store.id && (
          <div className="mt-4 border-t border-bdr pt-4">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-sm text-brand">Komissiyalar (platforma payı %)</h4>
              <button type="button" onClick={() => setCatRows([...catRows, { category: '', percent: '' }])} className="text-blue text-sm hover:underline">＋ Kateqoriya</button>
            </div>
            <p className="text-xs text-t3 mb-3">Mağaza gəlir olaraq net payını görür (100% − komissiya). Kateqoriya payı təyin edilməyibsə default tətbiq olunur.</p>
            <label className="block mb-2"><span className="block text-xs font-semibold text-t2 mb-1">Default — bütün kateqoriyalar (%)</span>
              <input type="number" min="0" max="100" value={defPct} onChange={(e) => setDefPct(e.target.value === '' ? '' : Number(e.target.value))} placeholder="məs. 15" className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" />
            </label>
            <div className="space-y-2">
              {catRows.map((r, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={r.category} onChange={(e) => setCatRows(catRows.map((x, j) => j === i ? { ...x, category: e.target.value } : x))} placeholder="Kateqoriya (məs. Ayaqqabı)" className="flex-1 bg-white border border-bdr rounded-btn px-3 py-2 text-sm" />
                  <input type="number" min="0" max="100" value={r.percent} onChange={(e) => setCatRows(catRows.map((x, j) => j === i ? { ...x, percent: e.target.value === '' ? '' : Number(e.target.value) } : x))} placeholder="%" className="w-20 bg-white border border-bdr rounded-btn px-3 py-2 text-sm" />
                  <button type="button" onClick={() => setCatRows(catRows.filter((_, j) => j !== i))} className="text-sale text-lg px-1 leading-none">×</button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3"><Btn variant="ghost" onClick={saveCommissions} disabled={comBusy}>{comBusy ? 'Saxlanılır…' : 'Komissiyaları saxla'}</Btn></div>
          </div>
        )}

        <div className="flex gap-2 justify-end mt-5">
          <Btn variant="ghost" onClick={onClose}>İmtina</Btn>
          <Btn onClick={() => onSave(f)} disabled={!f.name}>Yadda saxla</Btn>
        </div>
      </Modal>
    );
  }



export default Stores;
