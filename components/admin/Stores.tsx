/* Admin — Mağazalar: siyahı → detal səhifəsi (maliyyə + komissiya + payout). ./shared atomları. */
import React from "react";
const { useState, useEffect, useCallback } = React;
import { Btn, Field, Modal, Confirm, TableSkeleton, EmptyRow, Toolbar, Th, Td, Card, MapPicker, EMPTY_STORE, uploadFilesAdmin, useLive, money } from "./shared";
import { MCard, MobileListState, StatTile } from "../lib/iosUi";
import { Ic } from "../lib/panelIcons";
import type { ApiFn, ToastFn, Store, Payout, AdminStoreDetail } from "./types";
import { useCropper, RATIOS } from "../lib/cropper";

export function Stores({ api, toast }: { api: ApiFn; toast: ToastFn }) {
    const [rows, setRows] = useState<Store[] | null>(null);
    const [edit, setEdit] = useState<Store | null>(null);
    const [del, setDel] = useState<Store | null>(null);
    const [detail, setDetail] = useState<Store | null>(null);   // detal səhifəsi
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

    // Detal səhifəsi açıqdırsa siyahı əvəzinə onu göstər.
    if (detail) return (
      <>
        <StoreDetail store={detail} api={api} toast={toast} onBack={() => { setDetail(null); load(true); }} onEdit={() => setEdit(detail)} />
        {edit && <StoreEdit store={edit} onClose={() => setEdit(null)} onSave={async (s) => { await save(s); setDetail((d) => d && d.id === s.id ? { ...d, ...s } : d); }} />}
      </>
    );

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
                    <Td className="font-medium"><button onClick={() => setDetail(s)} className="text-blue hover:underline text-left">{s.name}</button></Td>
                    <Td className="text-t2">{s.city}</Td>
                    <Td>★ {s.rating}</Td>
                    <Td className="text-t2">{s.reviews}</Td>
                    <Td className="text-t2">{s.products}</Td>
                    <Td className="text-t2">{s.established}</Td>
                    <Td className="text-right whitespace-nowrap">
                      <button onClick={() => setDetail(s)} className="text-blue hover:underline text-sm mr-3">Detal</button>
                      <button onClick={() => setEdit(s)} className="text-t2 hover:underline text-sm mr-3">Redaktə</button>
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
                <button onClick={(e) => { e.stopPropagation(); setDetail(s); }} className="text-blue font-medium">Detal</button>
                <button onClick={(e) => { e.stopPropagation(); setEdit(s); }} className="text-t2 font-medium ml-3">Redaktə</button>
                <button onClick={(e) => { e.stopPropagation(); setDel(s); }} className="text-sale font-medium ml-auto">Sil</button>
              </>}
            />
          ))}
        </div>
        {edit && <StoreEdit store={edit} onClose={() => setEdit(null)} onSave={save} />}
        {del && <Confirm text={`"${del.name}" mağazasını silmək istəyirsiniz?`} onYes={() => remove(del)} onNo={() => setDel(null)} />}
      </div>
    );
  }

// ─────────────────────── Mağaza detal səhifəsi ───────────────────────
interface ComRow { category: string; percent: number | string }

function StoreDetail({ store, api, toast, onBack, onEdit }: { store: Store; api: ApiFn; toast: ToastFn; onBack: () => void; onEdit: () => void }) {
    const sid = store.id!;
    const [d, setD] = useState<AdminStoreDetail | null>(null);
    const [cats, setCats] = useState<string[]>([]);
    const loadDetail = useCallback(() => { api<AdminStoreDetail>(`/api/admin/stores/${sid}/detail`).then(setD).catch((e) => toast((e as Error).message, 'error')); }, [api, sid, toast]);
    useEffect(() => { loadDetail(); }, [loadDetail]);
    useEffect(() => { api<{ name: string }[]>('/api/categories').then((r) => setCats(r.map((c) => c.name))).catch(() => {}); }, [api]);

    // Komissiyalar
    const [defPct, setDefPct] = useState<number | string>('');
    const [catRows, setCatRows] = useState<ComRow[]>([]);
    const [comBusy, setComBusy] = useState(false);
    useEffect(() => {
      api<{ category: string; percent: number }[]>(`/api/admin/stores/${sid}/commissions`).then((r) => {
        const def = r.find((x) => x.category === ''); setDefPct(def ? def.percent : '');
        setCatRows(r.filter((x) => x.category !== '').map((x) => ({ category: x.category, percent: x.percent })));
      }).catch(() => {});
    }, [sid, api]);
    const saveCommissions = async () => {
      setComBusy(true);
      const rows: ComRow[] = [];
      if (defPct !== '' && Number(defPct) >= 0) rows.push({ category: '', percent: Number(defPct) });
      for (const r of catRows) if (r.category.trim() && r.percent !== '') rows.push({ category: r.category.trim(), percent: Number(r.percent) });
      try { await api(`/api/admin/stores/${sid}/commissions`, { method: 'PUT', body: JSON.stringify(rows.map((r) => ({ Category: r.category, Percent: Number(r.percent) }))) }); toast('Komissiyalar saxlanıldı'); loadDetail(); }
      catch (e) { toast((e as Error).message, 'error'); }
      setComBusy(false);
    };
    // Kateqoriya seçimləri (artıq istifadə olunmuş olmayanlar)
    const usedCats = new Set(catRows.map((r) => r.category));
    const availCats = (cur: string) => cats.filter((c) => c === cur || !usedCats.has(c));

    // Ödənişlər
    const EMPTY_PF = { periodStart: '', periodEnd: '', amount: '' as number | string, status: 'Ödənildi', method: '', reference: '', note: '' };
    const [pf, setPf] = useState({ ...EMPTY_PF });
    const [poBusy, setPoBusy] = useState(false);
    const addPayout = async () => {
      if (pf.amount === '' || Number(pf.amount) <= 0) { toast('Məbləğ 0-dan böyük olmalıdır', 'error'); return; }
      setPoBusy(true);
      try {
        await api(`/api/admin/stores/${sid}/payouts`, { method: 'POST', body: JSON.stringify({
          PeriodStart: pf.periodStart || null, PeriodEnd: pf.periodEnd || null, Amount: Number(pf.amount),
          Status: pf.status, Method: pf.method, Reference: pf.reference, Note: pf.note }) });
        toast('Ödəniş əlavə edildi'); setPf({ ...EMPTY_PF }); loadDetail();
      } catch (e) { toast((e as Error).message, 'error'); }
      setPoBusy(false);
    };
    const delPayout = async (id: number) => {
      try { await api(`/api/admin/stores/${sid}/payouts/${id}`, { method: 'DELETE' }); toast('Silindi'); loadDetail(); }
      catch (e) { toast((e as Error).message, 'error'); }
    };
    const payouts: Payout[] = d?.payouts ?? [];
    const balancePos = (d?.balance ?? 0) > 0;

    return (
      <div className="space-y-5 max-w-5xl">
        {/* Başlıq */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 grid place-items-center rounded-btn border border-bdr hover:bg-bg2 text-t2"><Ic.chevDown className="w-4 h-4 rotate-90" /></button>
          <div className="w-12 h-12 rounded-full bg-bg2 border border-bdr overflow-hidden grid place-items-center font-bold text-t2 shrink-0">{store.logo ? <img src={store.logo} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : (store.name || '?')[0]}</div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-lg text-brand truncate">{store.name}</h2>
            <p className="text-xs text-t3 truncate">#{sid} · {store.city || '—'}{d?.ownerEmail ? ` · ${d.ownerEmail}` : ''}</p>
          </div>
          <Btn variant="ghost" onClick={onEdit}>Redaktə</Btn>
        </div>

        {/* Maliyyə KPI-lar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label="Ümumi satış (GMV)" value={money(d?.gmv ?? 0)} tone="blue" icon={<span className="font-bold">₼</span>} />
          <StatTile label="Platforma qazancı" value={money(d?.commission ?? 0)} sub="komissiya" tone="green" icon={<Ic.coupons className="w-[18px] h-[18px]" />} />
          <StatTile label="Mağazanın net qazancı" value={money(d?.netOwed ?? 0)} tone="brand" icon={<span className="font-bold">₼</span>} />
          <StatTile label="Ödənilmiş" value={money(d?.totalPaid ?? 0)} tone="gray" icon={<Ic.wallet className="w-[18px] h-[18px]" />} />
          <StatTile label="Satış (ədəd)" value={d?.salesUnits ?? 0} tone="gray" icon={<Ic.products className="w-[18px] h-[18px]" />} />
          <StatTile label="Sifariş sayı" value={d?.orderCount ?? 0} tone="gray" icon={<Ic.orders className="w-[18px] h-[18px]" />} />
          <div className="col-span-2">
            <div className={`h-full rounded-card p-4 flex flex-col justify-center ${balancePos ? 'bg-sale/5 border border-sale/30' : 'bg-bg2'}`}>
              <div className="text-[11px] uppercase tracking-wide text-t3">Mağazaya ödəniləcək (balans)</div>
              <div className={`text-2xl font-bold mt-0.5 ${balancePos ? 'text-sale' : 'text-t2'}`}>{money(d?.balance ?? 0)}</div>
              <div className="text-[11px] text-t3 mt-0.5">net qazanc − ödənilmiş</div>
            </div>
          </div>
        </div>

        {/* Komissiya */}
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-sm text-brand">Komissiya (platforma payı %)</h3>
              <button type="button" onClick={() => setCatRows([...catRows, { category: '', percent: '' }])} className="text-blue text-sm hover:underline">＋ Kateqoriya</button>
            </div>
            <p className="text-xs text-t3 mb-3">Mağaza net payını görür (100% − komissiya). Kateqoriya payı təyin edilməyibsə default tətbiq olunur.</p>
            <label className="block mb-2 max-w-xs"><span className="block text-xs font-semibold text-t2 mb-1">Default — bütün kateqoriyalar (%)</span>
              <input type="number" min="0" max="100" value={defPct} onChange={(e) => setDefPct(e.target.value === '' ? '' : Number(e.target.value))} placeholder="məs. 15" className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" />
            </label>
            <div className="space-y-2">
              {catRows.map((r, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={r.category} onChange={(e) => setCatRows(catRows.map((x, j) => j === i ? { ...x, category: e.target.value } : x))} className="flex-1 bg-white border border-bdr rounded-btn px-3 py-2 text-sm cursor-pointer">
                    <option value="">— Kateqoriya seç —</option>
                    {availCats(r.category).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="number" min="0" max="100" value={r.percent} onChange={(e) => setCatRows(catRows.map((x, j) => j === i ? { ...x, percent: e.target.value === '' ? '' : Number(e.target.value) } : x))} placeholder="%" className="w-20 bg-white border border-bdr rounded-btn px-3 py-2 text-sm" />
                  <button type="button" onClick={() => setCatRows(catRows.filter((_, j) => j !== i))} className="text-sale text-lg px-1 leading-none">×</button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3"><Btn onClick={saveCommissions} disabled={comBusy}>{comBusy ? 'Saxlanılır…' : 'Komissiyaları saxla'}</Btn></div>
          </div>
        </Card>

        {/* Ödənişlər */}
        <Card>
          <div className="p-4">
            <h3 className="font-bold text-sm text-brand mb-1">Ödənişlər (mağazaya köçürmə)</h3>
            <p className="text-xs text-t3 mb-3">Balans = net qazanc − ödənilmiş. "Ödənildi" statuslu ödənişlər balansı azaldır; satıcı bunu öz panelində görür.</p>

            {payouts.length > 0 && (
              <div className="overflow-x-auto mb-4">
                <table className="w-full min-w-[560px] text-sm">
                  <thead><tr className="text-left text-t3 border-b border-bdr">
                    <th className="py-1.5 font-medium">Dövr</th><th className="py-1.5 font-medium text-right">Məbləğ</th>
                    <th className="py-1.5 font-medium">Status</th><th className="py-1.5 font-medium">Üsul</th><th className="py-1.5 font-medium">Referans</th><th></th>
                  </tr></thead>
                  <tbody>
                    {payouts.map((p) => (
                      <tr key={p.id} className="border-b border-bdr last:border-0">
                        <td className="py-1.5 text-t2">{(p.periodStart || '').slice(0, 10)} – {(p.periodEnd || '').slice(0, 10)}</td>
                        <td className="py-1.5 text-right font-semibold">{money(p.amount)}</td>
                        <td className="py-1.5"><span className={p.status === 'Ödənildi' ? 'text-green' : 'text-t2'}>{p.status}</span></td>
                        <td className="py-1.5 text-t2">{p.method || '—'}</td>
                        <td className="py-1.5 text-t2 break-all">{p.reference || '—'}</td>
                        <td className="py-1.5 text-right"><button type="button" onClick={() => delPayout(p.id)} className="text-sale text-lg px-1 leading-none">×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <label className="block"><span className="block text-xs font-semibold text-t2 mb-1">Dövr başlanğıcı</span>
                <input type="date" value={pf.periodStart} onChange={(e) => setPf({ ...pf, periodStart: e.target.value })} className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" /></label>
              <label className="block"><span className="block text-xs font-semibold text-t2 mb-1">Dövr sonu</span>
                <input type="date" value={pf.periodEnd} onChange={(e) => setPf({ ...pf, periodEnd: e.target.value })} className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" /></label>
              <label className="block"><span className="block text-xs font-semibold text-t2 mb-1">Məbləğ (₼, net)</span>
                <input type="number" min="0" step="0.01" value={pf.amount} onChange={(e) => setPf({ ...pf, amount: e.target.value === '' ? '' : Number(e.target.value) })} placeholder={`məs. ${d?.balance ?? 0}`} className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" /></label>
              <label className="block"><span className="block text-xs font-semibold text-t2 mb-1">Status</span>
                <select value={pf.status} onChange={(e) => setPf({ ...pf, status: e.target.value })} className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm cursor-pointer">
                  <option value="Ödənildi">Ödənildi</option><option value="Gözləyir">Gözləyir</option></select></label>
              <label className="block"><span className="block text-xs font-semibold text-t2 mb-1">Üsul (bank/IBAN)</span>
                <input value={pf.method} onChange={(e) => setPf({ ...pf, method: e.target.value })} placeholder="məs. Kapital Bank" className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" /></label>
              <label className="block"><span className="block text-xs font-semibold text-t2 mb-1">Referans</span>
                <input value={pf.reference} onChange={(e) => setPf({ ...pf, reference: e.target.value })} placeholder="transfer №" className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" /></label>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input value={pf.note} onChange={(e) => setPf({ ...pf, note: e.target.value })} placeholder="Qeyd (istəyə bağlı)" className="flex-1 bg-white border border-bdr rounded-btn px-3 py-2 text-sm" />
              <Btn onClick={addPayout} disabled={poBusy}>{poBusy ? 'Əlavə edilir…' : '＋ Ödəniş qeyd et'}</Btn>
            </div>
          </div>
        </Card>
      </div>
    );
  }

// ─────────────────────── Mağaza redaktə (yalnız sahələr) ───────────────────────
export function StoreEdit({ store, onClose, onSave }: { store: Store; onClose: () => void; onSave: (s: Store) => void }) {
    const [f, setF] = useState<Store>({ ...store, ownerEmail: store.ownerEmail || '' });
    const [mapOpen, setMapOpen] = useState(false), [uploading, setUploading] = useState(false);
    const num = (k: keyof Store) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value === '' ? null : Number(e.target.value) });
    const str = (k: keyof Store) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
    const crop = useCropper(RATIOS.logo);
    const uploadLogo = async (files: FileList | null) => { if (!files || !files.length) return; const cropped = await crop.start(files); if (!cropped) return; setUploading(true); try { const urls = await uploadFilesAdmin(cropped); if (urls[0]) setF((s) => ({ ...s, logo: urls[0] })); } catch (e) {} setUploading(false); };
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
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { uploadLogo(e.target.files); e.target.value = ''; }} />{crop.ui}
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
        <p className="text-xs text-t3 mt-2">Reytinq, rəy və məhsul sayı avtomatik hesablanır — əl ilə dəyişdirilmir. Komissiya və ödənişlər mağaza <b>detal səhifəsindədir</b>.</p>

        <div className="flex gap-2 justify-end mt-5">
          <Btn variant="ghost" onClick={onClose}>İmtina</Btn>
          <Btn onClick={() => onSave(f)} disabled={!f.name}>Yadda saxla</Btn>
        </div>
      </Modal>
    );
  }

export default Stores;
