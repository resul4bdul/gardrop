/* Admin tab (fayllara bölmə): ./shared-dən import, api/toast props. */
import React from "react";
const { useState, useEffect, useCallback } = React;
import { round2, money, Btn, Pill, Modal, Confirm, TableSkeleton, EmptyRow, Toolbar, Th, Td, Card, SELECT_CLS, EMPTY_PRODUCT, sizeOptionsFor, SizeChart, Req, FieldL, APPROVAL, uploadFilesAdmin, useLive } from "./shared";
import type { ApiFn, ToastFn, Product, Store, Category } from "./types";
import { downloadCsv, csvStamp, totalStock, sizeStockStr } from "../lib/csv";
import { Segmented, MCard, MobileListState } from "../lib/iosUi";

export function Products({ api, toast }: { api: ApiFn; toast: ToastFn }) {
    const [rows, setRows] = useState<Product[] | null>(null);
    const [search, setSearch] = useState('');
    const [statusF, setStatusF] = useState('');
    const [edit, setEdit] = useState<Product | null>(null);
    const [del, setDel] = useState<Product | null>(null);
    const [reject, setReject] = useState<Product | 'bulk' | null>(null);   // rədd ediləcək məhsul (tək) və ya 'bulk'
    const [reason, setReason] = useState('');
    const [sel, setSel] = useState<number[]>([]);           // toplu seçim üçün id-lər
    const [bulkDel, setBulkDel] = useState(false);
    const [stores, setStores] = useState<Store[]>([]);
    const [cats, setCats] = useState<Category[]>([]);

    const load = useCallback((silent?: boolean) => {
      if (!silent) { setRows(null); setSel([]); }
      const qs = [search ? 'search=' + encodeURIComponent(search) : '', statusF ? 'status=' + statusF : ''].filter(Boolean).join('&');
      api<Product[]>('/api/admin/products' + (qs ? '?' + qs : '')).then(setRows).catch((e) => { if (!silent) toast((e as Error).message, 'error'); });
    }, [api, search, statusF, toast]);
    useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
    useLive(useCallback(() => load(true), [load]));
    useEffect(() => {
      api<Store[]>('/api/admin/stores').then(setStores).catch(() => {});
      api<Category[]>('/api/admin/categories').then(setCats).catch(() => {});
    }, [api]);

    const save = async (p: Product) => {
      try {
        if (p.id) await api('/api/admin/products/' + p.id, { method: 'PUT', body: JSON.stringify(p) });
        else await api('/api/admin/products', { method: 'POST', body: JSON.stringify(p) });
        toast('Yadda saxlanıldı'); setEdit(null); load();
      } catch (e) { toast((e as Error).message, 'error'); }
    };
    const remove = async (p: Product) => {
      try { await api('/api/admin/products/' + p.id, { method: 'DELETE' }); toast('Silindi'); setDel(null); load(); }
      catch (e) { toast((e as Error).message, 'error'); setDel(null); }
    };
    const setApproval = async (p: Product, status: string, rsn?: string) => {
      try {
        await api('/api/admin/products/' + p.id + '/approval', { method: 'PUT', body: JSON.stringify({ status, reason: rsn || '' }) });
        toast(status === 'Approved' ? 'Təsdiqləndi' : 'Rədd edildi'); setReject(null); setReason(''); load();
      } catch (e) { toast((e as Error).message, 'error'); }
    };
    const bulk = async (action: string, rsn?: string) => {
      try {
        const r = await api<{ affected: number }>('/api/admin/products/bulk', { method: 'POST', body: JSON.stringify({ ids: sel, action, reason: rsn || '' }) });
        toast(`${r.affected} məhsula tətbiq olundu`); setReject(null); setReason(''); setBulkDel(false); load();
      } catch (e) { toast((e as Error).message, 'error'); }
    };
    const toggle = (id: number) => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
    const allShown: number[] = rows ? rows.map((p) => p.id!).filter((id): id is number => id != null) : [];
    const allSel = allShown.length > 0 && allShown.every((id) => sel.includes(id));

    const filters: [string, string][] = [['', 'Hamısı'], ['Pending', 'Gözləyir'], ['Approved', 'Təsdiqli'], ['Rejected', 'Rədd edilib']];
    return (
      <div>
        <Toolbar search={search} setSearch={setSearch} onAdd={() => setEdit({ ...EMPTY_PRODUCT })} addLabel="Məhsul əlavə et"
          right={<div className="flex gap-1 items-center">
            <Segmented value={statusF} onChange={setStatusF} options={filters} />
            <button onClick={() => rows && downloadCsv(`mehsullar_${csvStamp()}`, rows, [
              { key: 'id', label: 'ID' }, { key: 'name', label: 'Ad' }, { key: 'store', label: 'Mağaza' },
              { key: 'category', label: 'Kateqoriya' }, { key: 'subcategory', label: 'Alt-kateqoriya' }, { key: 'subSubcategory', label: 'Alt-alt' },
              { key: 'gender', label: 'Cins' }, { key: 'color', label: 'Rəng' }, { key: 'material', label: 'Material' },
              { key: 'price', label: 'Qiymət (₼)' }, { key: 'oldPrice', label: 'Köhnə qiymət' }, { key: 'discount', label: 'Endirim %' },
              { key: 'stock', label: 'Ümumi stok', map: (p) => p.stock ?? totalStock(p.sizeStock) },
              { key: 'sizeStock', label: 'Ölçü:stok', map: (p) => sizeStockStr(p.sizeStock) },
              { key: 'rating', label: 'Reytinq' }, { key: 'reviews', label: 'Rəy sayı' },
              { key: 'images', label: 'Şəkil sayı', map: (p) => (p.imageUrls || []).length },
              { key: 'approvalStatus', label: 'Təsdiq', map: (p) => p.approvalStatus || 'Approved' },
              { key: 'rejectReason', label: 'Rədd səbəbi' },
            ])} disabled={!rows || !rows.length} className="px-3 py-1.5 rounded-btn text-sm font-medium bg-white border border-bdr text-t2 hover:border-brand disabled:opacity-40" title="CSV ixrac">⬇ CSV</button>
          </div>} />
        {sel.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-3 bg-brand text-white rounded-btn px-4 py-2.5 anim-pop">
            <span className="text-sm font-semibold">{sel.length} seçildi</span>
            <div className="ml-auto flex gap-2">
              <button onClick={() => bulk('approve')} className="text-sm font-medium bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-btn">✓ Təsdiqlə</button>
              <button onClick={() => { setReject('bulk'); setReason(''); }} className="text-sm font-medium bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-btn">⊘ Rədd et</button>
              <button onClick={() => setBulkDel(true)} className="text-sm font-medium bg-sale hover:opacity-90 px-3 py-1.5 rounded-btn">🗑 Sil</button>
              <button onClick={() => setSel([])} className="text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-btn">Ləğv</button>
            </div>
          </div>
        )}
        <div className="hidden md:block"><Card>
          <table className="w-full min-w-[940px]">
            <thead><tr className="bg-bg2">
              <Th><input type="checkbox" checked={allSel} onChange={(e) => setSel(e.target.checked ? allShown : [])} className="accent-[#0A0A0A] align-middle" /></Th>
              <Th>ID</Th><Th>Məhsul</Th><Th>Mağaza</Th><Th>Kateqoriya</Th><Th>Qiymət</Th><Th>Stok</Th><Th>Təsdiq</Th><Th className="text-right">Əməliyyat</Th>
            </tr></thead>
            {!rows ? <TableSkeleton cols={9} /> : rows.length === 0 ? <EmptyRow cols={9} text="Məhsul tapılmadı" /> : (
              <tbody>
                {rows.map((p) => {
                  const ap = APPROVAL[p.approvalStatus ?? 'Approved'] || APPROVAL.Approved;
                  return (
                  <tr key={p.id} className={`border-t border-bdr row-h ${sel.includes(p.id!) ? 'bg-blue/5' : ''}`}>
                    <Td><input type="checkbox" checked={sel.includes(p.id!)} onChange={() => toggle(p.id!)} className="accent-[#0A0A0A] align-middle" /></Td>
                    <Td className="text-t3">#{p.id}</Td>
                    <Td>
                      <div className="flex items-center gap-2 max-w-[240px]">
                        {p.imageUrls && p.imageUrls[0]
                          ? <img src={p.imageUrls[0]} alt="" className="w-9 h-9 rounded object-cover bg-bg2 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          : <div className="w-9 h-9 rounded bg-bg3 shrink-0" />}
                        <span className="font-medium truncate">{p.name}</span>
                      </div>
                    </Td>
                    <Td className="text-t2">{p.store}</Td>
                    <Td className="text-t2">{p.category || '—'}</Td>
                    <Td>
                      <span className="font-semibold">{money(p.price ?? 0)}</span>
                      {p.oldPrice ? <span className="text-t3 line-through ml-1 text-xs">{money(p.oldPrice)}</span> : null}
                    </Td>
                    <Td>{(p.stock ?? 0) <= 5 ? <Pill className={p.stock === 0 ? 'bg-sale/10 text-sale' : 'bg-amber/10 text-amber'}>{p.stock}</Pill> : p.stock}</Td>
                    <Td><Pill className={ap.cls}>{ap.label}</Pill>{p.approvalStatus === 'Rejected' && p.rejectReason ? <div className="text-t3 text-[11px] mt-0.5 max-w-[140px] truncate" title={p.rejectReason}>{p.rejectReason}</div> : null}</Td>
                    <Td className="text-right whitespace-nowrap">
                      {p.approvalStatus !== 'Approved' && <button onClick={() => setApproval(p, 'Approved')} className="text-green hover:underline text-sm mr-3">Təsdiqlə</button>}
                      {p.approvalStatus !== 'Rejected' && <button onClick={() => { setReject(p); setReason(''); }} className="text-amber hover:underline text-sm mr-3">Rədd et</button>}
                      <button onClick={() => setEdit(p)} className="text-blue hover:underline text-sm mr-3">Redaktə</button>
                      <button onClick={() => setDel(p)} className="text-sale hover:underline text-sm">Sil</button>
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
          <MobileListState loading={!rows} empty={!!rows && rows.length === 0} emptyText="Məhsul tapılmadı" />
          {rows && rows.map((p) => {
            const ap = APPROVAL[p.approvalStatus ?? 'Approved'] || APPROVAL.Approved;
            return (
              <MCard key={p.id}
                className={sel.includes(p.id!) ? 'ring-2 ring-blue/40' : ''}
                lead={<>
                  <input type="checkbox" checked={sel.includes(p.id!)} onChange={() => toggle(p.id!)} className="accent-[#0A0A0A] mt-1" />
                  {p.imageUrls && p.imageUrls[0] ? <img src={p.imageUrls[0]} alt="" className="w-12 h-12 rounded-card object-cover bg-bg2 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div className="w-12 h-12 rounded-card bg-bg3 shrink-0" />}
                </>}
                title={p.name}
                subtitle={`#${p.id} · ${p.store}`}
                badge={<Pill className={ap.cls}>{ap.label}</Pill>}
                rows={[
                  ['Kateqoriya', p.category || '—'],
                  ['Qiymət', <span key="p">{money(p.price ?? 0)}{p.oldPrice ? <span className="text-t3 line-through ml-1">{money(p.oldPrice)}</span> : null}</span>],
                  ['Stok', <span key="s" className={(p.stock ?? 0) <= 5 ? (p.stock === 0 ? 'text-sale font-bold' : 'text-amber font-bold') : ''}>{p.stock}</span>],
                ]}
                actions={<>
                  {p.approvalStatus !== 'Approved' && <button onClick={() => setApproval(p, 'Approved')} className="text-green font-medium">Təsdiqlə</button>}
                  {p.approvalStatus !== 'Rejected' && <button onClick={() => { setReject(p); setReason(''); }} className="text-amber font-medium">Rədd et</button>}
                  <button onClick={() => setEdit(p)} className="text-blue font-medium">Redaktə</button>
                  <button onClick={() => setDel(p)} className="text-sale font-medium ml-auto">Sil</button>
                </>}
              />
            );
          })}
        </div>

        {edit && <ProductEdit product={edit} stores={stores} cats={cats} onClose={() => setEdit(null)} onSave={save} />}
        {del && <Confirm text={`"${del.name}" məhsulunu silmək istəyirsiniz?`} onYes={() => remove(del)} onNo={() => setDel(null)} />}
        {reject && (
          <Modal title={reject === 'bulk' ? `${sel.length} məhsulu rədd et` : `"${reject.name}" rədd et`} onClose={() => setReject(null)}>
            <label className="block text-sm font-medium text-brand mb-1">Rədd səbəbi <span className="text-sale">*</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Məs: şəkil keyfiyyətsizdir, qiymət uyğun deyil, qadağan olunmuş məhsul..." className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm resize-none" />
            <p className="text-xs text-t3 mt-1">Bu səbəb mağaza sahibinə bildiriş kimi göndəriləcək.</p>
            <div className="flex gap-2 justify-end mt-4"><Btn variant="ghost" onClick={() => setReject(null)}>İmtina</Btn><Btn variant="danger" disabled={reason.trim().length < 3} onClick={() => reject === 'bulk' ? bulk('reject', reason.trim()) : setApproval(reject, 'Rejected', reason.trim())}>Rədd et</Btn></div>
          </Modal>
        )}
        {bulkDel && <Confirm text={`${sel.length} məhsulu silmək istəyirsiniz? Bu geri qaytarıla bilməz.`} onYes={() => bulk('delete')} onNo={() => setBulkDel(false)} />}
      </div>
    );
  }


export function ProductEdit({ product, stores, cats, onClose, onSave }: { product: Product; stores: Store[]; cats: Category[]; onClose: () => void; onSave: (p: Product) => void }) {
    const [f, setF] = useState<Product>({
      ...product,
      sizes: product.sizes || [],
      sizeStock: product.sizeStock || {},
      imageUrls: (product.imageUrls && product.imageUrls.length) ? product.imageUrls : [''],
      gender: product.gender || 'Uniseks',
      sizeSystem: product.sizeSystem || 'INT',
      fitType: product.fitType || 'Regular',
      stretch: product.stretch || 'medium',
    });
    const str = (k: keyof Product) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
    const [uploading, setUploading] = useState(false);
    const [upErr, setUpErr] = useState('');
    const uploadImgs = async (files: FileList | null) => {
      if (!files || !files.length) return;
      setUploading(true); setUpErr('');
      try {
        const urls = await uploadFilesAdmin(files);
        setF((prev) => ({ ...prev, imageUrls: [...prev.imageUrls.filter((u) => u && u.trim()), ...urls] }));
      } catch (e) { setUpErr((e as Error).message || 'Yükləmə xətası'); }
      setUploading(false);
    };
    const isNew = !product.id;
    const cat = cats.find((c) => c.name === f.category);
    const subNode = (cat && cat.tree) ? cat.tree.find((t) => t.name === f.subcategory) : null;

    const sizeOpts = sizeOptionsFor(f.sizeSystem, f.category);
    const totalStock = Object.values(f.sizeStock || {}).reduce((a, b) => a + (Number(b) || 0), 0);

    // ── Endirim ↔ qiymət iki istiqamətli ──
    // Endirim %-i dəyişəndə: köhnə qiymət yoxdursa cari qiyməti köhnə et, yeni qiyməti %-ə görə azalt.
    const setDiscount = (e: React.ChangeEvent<HTMLInputElement>) => {
      const d = e.target.value === '' ? null : Number(e.target.value);
      // Endirim sıfır/boşdursa: cari qiyməti köhnə qiymətə qaytar, köhnə qiyməti təmizlə.
      if (d == null || d <= 0) { setF({ ...f, discount: null, price: f.oldPrice ?? f.price, oldPrice: null }); return; }
      const dd = Math.min(99, Math.max(1, Math.round(d)));
      const base = f.oldPrice ?? f.price ?? 0;
      if (!base) { setF({ ...f, discount: dd }); return; } // qiymət hələ yoxdursa yalnız %-i saxla
      setF({ ...f, discount: dd, oldPrice: base, price: round2(base * (1 - dd / 100)) });
    };
    // Yeni (cari) qiyməti dəyişəndə: köhnə qiymət ondan böyükdürsə endirim %-ini hesabla, əks halda endirimi sil.
    const setPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
      const price = e.target.value === '' ? null : Number(e.target.value);
      const nf = { ...f, price };
      if (f.oldPrice && price != null && f.oldPrice > price)
        nf.discount = Math.round((1 - price / f.oldPrice) * 100);
      else
        nf.discount = null;
      setF(nf);
    };
    // Köhnə qiyməti dəyişəndə: cari qiymət varsa endirim %-ini hesabla, əks halda endirimi sil.
    const setOldPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
      const oldPrice = e.target.value === '' ? null : Number(e.target.value);
      const nf = { ...f, oldPrice };
      if (oldPrice && f.price != null && oldPrice > f.price)
        nf.discount = Math.round((1 - f.price / oldPrice) * 100);
      else nf.discount = null;
      setF(nf);
    };

    const toggleSize = (s: string) => {
      const ss = { ...(f.sizeStock || {}) };
      if (s in ss) delete ss[s]; else ss[s] = 0;
      setF({ ...f, sizeStock: ss });
    };
    const setSizeQty = (s: string, v: string) => setF({ ...f, sizeStock: { ...f.sizeStock, [s]: Math.max(0, Number(v) || 0) } });

    const setImg = (i: number, v: string) => { const a = [...f.imageUrls]; a[i] = v; setF({ ...f, imageUrls: a }); };
    const addImg = () => setF({ ...f, imageUrls: [...f.imageUrls, ''] });
    const delImg = (i: number) => setF({ ...f, imageUrls: f.imageUrls.filter((_, j) => j !== i) });

    // Vacib sahələr: ad, təsvir, kateqoriya, qiymət, ölçü(lər), stok
    const sizesChosen = Object.keys(f.sizeStock || {});
    const valid = f.name && f.description && f.category && f.price != null && sizesChosen.length > 0 && totalStock > 0;

    const submit = () => {
      const cleanImgs = (f.imageUrls || []).map((u) => (u || '').trim()).filter(Boolean);
      const payload: Product = {
        ...f,
        imageUrls: cleanImgs,
        images: cleanImgs.length,
        sizes: sizesChosen,
        stock: totalStock,
        size: f.size || sizesChosen[0] || '',
      };
      onSave(payload);
    };

    return (
      <Modal title={isNew ? 'Yeni məhsul' : 'Məhsulu redaktə et'} onClose={onClose} wide>
        <p className="text-xs text-t3 mb-4"><Req /> ilə işarələnmiş xanalar mütləqdir.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><FieldL label="Ad" req><input className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" value={f.name || ''} onChange={str('name')} /></FieldL></div>

          <FieldL label="Mağaza">
            <select className={SELECT_CLS} value={f.store || ''}
              onChange={(e) => { const s = stores.find((x) => x.name === e.target.value); setF({ ...f, store: e.target.value, storeId: s ? s.id : f.storeId }); }}>
              <option value="">— seçin —</option>
              {stores.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </FieldL>
          <FieldL label="Cinsiyyət" req>
            <select className={SELECT_CLS} value={f.gender || 'Uniseks'} onChange={str('gender')}>
              <option>Kişi</option><option>Qadın</option><option>Uniseks</option>
            </select>
          </FieldL>

          <FieldL label="Kateqoriya" req>
            <select className={SELECT_CLS} value={f.category || ''} onChange={(e) => setF({ ...f, category: e.target.value, subcategory: '', subSubcategory: '' })}>
              <option value="">— seçin —</option>
              {cats.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </FieldL>
          <FieldL label="Alt-kateqoriya">
            <select className={SELECT_CLS} value={f.subcategory || ''} onChange={(e) => setF({ ...f, subcategory: e.target.value, subSubcategory: '' })} disabled={!cat}>
              <option value="">— seçin —</option>
              {cat && (cat.subcategories || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FieldL>
          {subNode && subNode.children && subNode.children.length > 0 && (
            <FieldL label="Alt-alt-kateqoriya">
              <select className={SELECT_CLS} value={f.subSubcategory || ''} onChange={str('subSubcategory')}>
                <option value="">— seçin —</option>
                {subNode.children.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FieldL>
          )}
          <FieldL label="Rəng"><input className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" value={f.color || ''} onChange={str('color')} /></FieldL>
          <FieldL label="Material"><input className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" value={f.material || ''} onChange={str('material')} /></FieldL>

          {/* Qiymət + endirim (iki istiqamətli) */}
          <FieldL label="Qiymət / yeni qiymət (₼)" req><input className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" type="number" step="0.01" value={f.price ?? ''} onChange={setPrice} /></FieldL>
          <FieldL label="Köhnə qiymət (₼)"><input className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" type="number" step="0.01" value={f.oldPrice ?? ''} onChange={setOldPrice} placeholder="endirim yoxdursa boş" /></FieldL>
          <FieldL label="Endirim (%)"><input className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" type="number" value={f.discount ?? ''} onChange={setDiscount} placeholder="% yaz → qiymət azalır" /></FieldL>
          <div className="flex items-end text-xs text-t3 pb-2">
            {f.oldPrice && f.discount ? <span><b className="text-sale">−{f.discount}%</b> · köhnə {money(f.oldPrice)} → <b className="text-brand">{money(f.price ?? 0)}</b></span> : <span>Endirim yoxdur</span>}
          </div>

          {/* Ölçü sistemi + cədvəl */}
          <FieldL label="Ölçü sistemi" req>
            <select className={SELECT_CLS} value={f.sizeSystem || 'INT'} onChange={(e) => setF({ ...f, sizeSystem: e.target.value, sizeStock: {} })}>
              <option value="INT">INT (S / M / L …)</option>
              <option value="TR">TR / rəqəmlərlə</option>
            </select>
          </FieldL>
          <FieldL label="Kəsim növü">
            <select className={SELECT_CLS} value={f.fitType || 'Regular'} onChange={str('fitType')}>
              <option value="Slim">Slim Fit (dar)</option>
              <option value="Regular">Regular Fit (normal)</option>
              <option value="Relaxed">Relaxed Fit (rahat)</option>
              <option value="Oversize">Oversize (bol)</option>
            </select>
          </FieldL>
          <FieldL label="Parça elastikliyi">
            <select className={SELECT_CLS} value={f.stretch || 'medium'} onChange={str('stretch')}>
              <option value="none">Elastik deyil</option>
              <option value="low">Az elastik</option>
              <option value="medium">Orta elastik</option>
              <option value="high">Yüksək elastik</option>
            </select>
          </FieldL>
          <div className="bg-bg2 rounded-card p-3 sm:row-span-2">
            <div className="text-xs font-semibold text-t2 mb-1.5">Ölçü cədvəli</div>
            <SizeChart sizeSystem={f.sizeSystem} category={f.category} gender={f.gender} />
          </div>

          {/* Ölçü seçimi + per-ölçü stok */}
          <div className="sm:col-span-2">
            <span className="block text-xs font-semibold text-t2 mb-1.5">Ölçülər və stok<Req /> <span className="text-t3 font-normal">— ölçünü seç, sonra hər ölçü üçün stok yaz</span></span>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {sizeOpts.map((s) => (
                <button key={s} type="button" onClick={() => toggleSize(s)}
                  className={`min-w-10 px-2.5 py-1.5 rounded-btn border-2 text-sm font-semibold ${s in f.sizeStock ? 'border-brand bg-brand text-white' : 'border-bdr text-t2 hover:border-bdr-s'}`}>{s}</button>
              ))}
            </div>
            {sizesChosen.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sizesChosen.map((s) => (
                  <div key={s} className="flex items-center gap-2 bg-bg2 rounded-btn px-2 py-1.5">
                    <span className="text-sm font-semibold w-9">{s}</span>
                    <input type="number" min="0" value={f.sizeStock[s]} onChange={(e) => setSizeQty(s, e.target.value)}
                      className="w-full bg-white border border-bdr rounded px-2 py-1 text-sm" placeholder="ədəd" />
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-t3 mt-1.5">Ümumi stok: <b className={totalStock > 0 ? 'text-brand' : 'text-sale'}>{totalStock}</b> ədəd</p>
          </div>

          {/* Şəkillər — cihazdan yüklə və ya link yapışdır */}
          <div className="sm:col-span-2">
            <span className="block text-xs font-semibold text-t2 mb-1.5">Şəkillər <span className="text-t3 font-normal">— cihazdan yüklə və ya link yapışdır</span></span>
            <label className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-btn py-3 mb-2 cursor-pointer text-sm transition-colors ${uploading ? 'border-bdr text-t3' : 'border-bdr-s text-brand hover:border-brand'}`}>
              {uploading ? <><span className="inline-block w-4 h-4 border-2 border-t-transparent border-brand rounded-full animate-spin" /> Yüklənir…</> : <>📷 Cihazdan şəkil yüklə</>}
              <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={(e) => { uploadImgs(e.target.files); e.target.value = ''; }} />
            </label>
            {upErr && <p className="text-xs text-sale mb-2">{upErr}</p>}
            <div className="space-y-2">
              {f.imageUrls.map((u, i) => (
                <div key={i} className="flex items-center gap-2">
                  {u ? <img src={u} alt="" className="w-9 h-9 rounded object-cover bg-bg2 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} /> : <div className="w-9 h-9 rounded bg-bg3 shrink-0" />}
                  <input value={u} onChange={(e) => setImg(i, e.target.value)} placeholder="https://… və ya yüklənmiş link" className="flex-1 bg-white border border-bdr rounded-btn px-3 py-2 text-sm" />
                  <button type="button" onClick={() => delImg(i)} className="text-sale text-lg px-2 leading-none">×</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addImg} className="text-blue text-sm mt-2 hover:underline">＋ Link əlavə et</button>
          </div>

          <label className="block sm:col-span-2">
            <span className="block text-xs font-semibold text-t2 mb-1">Təsvir<Req /></span>
            <textarea className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm h-24 resize-none" value={f.description || ''} onChange={str('description')} />
          </label>

          <div className="sm:col-span-2 text-xs text-t3 bg-bg2 rounded-btn px-3 py-2">
            Reytinq və rəy sayı avtomatikdir (real rəylərdən hesablanır) — əl ilə təyin olunmur.
            {!isNew && <> Cari: ★ {f.rating ?? 0} ({f.reviews ?? 0} rəy)</>}
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <Btn variant="ghost" onClick={onClose}>İmtina</Btn>
          <Btn onClick={submit} disabled={!valid}>Yadda saxla</Btn>
        </div>
      </Modal>
    );
  }

  // ─────────────────────────  Stores  ─────────────────────────


export default Products;
