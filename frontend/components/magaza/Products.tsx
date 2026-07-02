/* Mağaza tab (fayllara bölmə): ./shared-dən import, api/toast props. */
import React from "react";
const { useState, useEffect, useCallback } = React;
import { brandBehavior, money, round2, APPROVAL, sizeOptionsFor, SELECT_CLS, Spin, Btn, Card, Th, Td, Field, TableSkeleton, EmptyRow, Toolbar, Modal, Confirm, useLive, uploadFilesStore, resolveImg } from "./shared";
import type { ApiFn, ToastFn, Category, Product, SizeChartRow, Store } from "./types";
import { downloadCsv, csvStamp, totalStock, sizeStockStr } from "../lib/csv";
import { useCropper, RATIOS } from "../lib/cropper";

export function Products({ api, toast, store, cats }: { api: ApiFn; toast: ToastFn; store: Store; cats: Category[] }) {
    const [rows, setRows] = useState<Product[] | null>(null), [edit, setEdit] = useState<Product | null>(null), [del, setDel] = useState<Product | null>(null), [q, setQ] = useState('');
    const [fCat, setFCat] = useState(''), [fStatus, setFStatus] = useState(''), [fStock, setFStock] = useState('');
    const load = useCallback((silent?: boolean) => { if (!silent) setRows(null); api<Product[]>(`/api/store/${store.id}/products`).then(setRows).catch((e) => { if (!silent) toast((e as Error).message, 'error'); }); }, [api, store.id, toast]);
    useEffect(() => { load(); }, [load]);
    useLive(useCallback(() => load(true), [load]));
    const save = async (p: Product) => {
      try {
        if (p.id) await api(`/api/store/${store.id}/products/${p.id}`, { method: 'PUT', body: JSON.stringify(p) });
        else await api(`/api/store/${store.id}/products`, { method: 'POST', body: JSON.stringify(p) });
        toast('Yadda saxlanıldı'); setEdit(null); load();
      } catch (e) { toast((e as Error).message, 'error'); }
    };
    const remove = async (p: Product) => { try { await api(`/api/store/${store.id}/products/${p.id}`, { method: 'DELETE' }); toast('Silindi'); setDel(null); load(); } catch (e) { toast((e as Error).message, 'error'); setDel(null); } };
    const stockState = (p: Product) => { const s = p.stock ?? 0; return s <= 0 ? 'out' : s <= 5 ? 'low' : 'ok'; };
    const statusKey = (p: Product) => p.isDraft ? 'Draft' : (p.approvalStatus ?? 'Approved');
    const DRAFT_BADGE = { label: 'Qaralama', bg: '#E2E8F0', fg: '#475569' };
    const badgeFor = (p: Product) => p.isDraft ? DRAFT_BADGE : (APPROVAL[p.approvalStatus ?? 'Approved'] || APPROVAL.Approved);
    const shown = !rows ? rows : rows.filter(p =>
      (!q || p.name.toLowerCase().includes(q.toLowerCase())) &&
      (!fCat || p.category === fCat) &&
      (!fStatus || statusKey(p) === fStatus) &&
      (!fStock || stockState(p) === fStock));
    const resetFilters = () => { setQ(''); setFCat(''); setFStatus(''); setFStock(''); };
    const filtered = !!(q || fCat || fStatus || fStock);
    const addNew = () => setEdit({ name: '', brand: '', price: 0, oldPrice: null, buyPrice: null, discount: null, category: '', subcategory: '', subSubcategory: '', gender: 'Uniseks', sizeSystem: 'INT', fitType: 'Regular', stretch: 'medium', sizeBehavior: 'Standard', washShrink: false, sizeChart: [], sizeStock: {}, imageUrls: [], color: '', material: '', season: '', tags: [], seoTitle: '', seoDescription: '', isDraft: false, description: '' });
    const noProducts = !!rows && rows.length === 0;   // heç məhsul yoxdur (filtr deyil)
    return (
      <div>
        <Toolbar onAdd={addNew} addLabel="Məhsul əlavə et">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Axtar…" className="bg-white border border-bdr rounded-btn px-3 py-2 text-sm w-48" />
          <select value={fCat} onChange={(e) => setFCat(e.target.value)} className={SELECT_CLS + ' w-auto'}><option value="">Kateqoriya: hamısı</option>{cats.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}</select>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={SELECT_CLS + ' w-auto'}><option value="">Status: hamısı</option><option value="Approved">Təsdiqli</option><option value="Pending">Gözləyir</option><option value="Rejected">Rədd edilib</option><option value="Draft">Qaralama</option></select>
          <select value={fStock} onChange={(e) => setFStock(e.target.value)} className={SELECT_CLS + ' w-auto'}><option value="">Stok: hamısı</option><option value="ok">Kifayət (&gt;5)</option><option value="low">Azalır (1–5)</option><option value="out">Bitib (0)</option></select>
          {filtered && <button onClick={resetFilters} className="bg-white border border-bdr rounded-btn px-3 py-2 text-sm text-t2 hover:border-brand">Sıfırla</button>}
          <button onClick={() => rows && downloadCsv(`mehsullar_${store.name}_${csvStamp()}`, rows, [
            { key: 'id', label: 'ID' }, { key: 'name', label: 'Ad' }, { key: 'brand', label: 'Brend' },
            { key: 'category', label: 'Kateqoriya' }, { key: 'subcategory', label: 'Alt-kateqoriya' }, { key: 'subSubcategory', label: 'Alt-alt' },
            { key: 'gender', label: 'Cins' }, { key: 'color', label: 'Rəng' }, { key: 'material', label: 'Material' },
            { key: 'sizeSystem', label: 'Ölçü sistemi' }, { key: 'fitType', label: 'Kəsim' }, { key: 'sizeBehavior', label: 'Ölçü davranışı' },
            { key: 'price', label: 'Qiymət (₼)' }, { key: 'oldPrice', label: 'Köhnə qiymət' }, { key: 'buyPrice', label: 'Alış qiyməti' }, { key: 'discount', label: 'Endirim %' },
            { key: 'stock', label: 'Ümumi stok', map: (p) => totalStock(p.sizeStock) },
            { key: 'sizeStock', label: 'Ölçü:stok', map: (p) => sizeStockStr(p.sizeStock) },
            { key: 'images', label: 'Şəkil sayı', map: (p) => (p.imageUrls || []).length },
            { key: 'season', label: 'Mövsüm' }, { key: 'tags', label: 'Etiketlər', map: (p) => (p.tags || []).join('|') },
            { key: 'salesCount', label: 'Satış sayı', map: (p) => p.salesCount ?? 0 }, { key: 'views', label: 'Baxış sayı', map: (p) => p.views ?? 0 },
            { key: 'isDraft', label: 'Qaralama', map: (p) => p.isDraft ? 'Bəli' : 'Xeyr' },
            { key: 'approvalStatus', label: 'Təsdiq', map: (p) => p.approvalStatus || 'Approved' },
            { key: 'rejectReason', label: 'Rədd səbəbi' }, { key: 'description', label: 'Təsvir' },
          ])} disabled={!rows || !rows.length} className="bg-white border border-bdr rounded-btn px-3 py-2 text-sm text-t2 hover:border-brand disabled:opacity-40" title="CSV ixrac">⬇ CSV</button>
        </Toolbar>
        {/* Desktop cədvəl */}
        <Card className="hidden md:block">
          <table className="w-full min-w-[640px]">
            <thead><tr className="bg-bg2"><Th>Şəkil</Th><Th>Ad</Th><Th>Kateqoriya</Th><Th>Qiymət</Th><Th>Endirim</Th><Th>Stok</Th><Th>Satış</Th><Th>Baxış</Th><Th>Status</Th><Th className="text-right">Əməliyyat</Th></tr></thead>
            {!shown ? <TableSkeleton cols={10} /> : shown.length === 0 ? (
              noProducts
                ? <tbody><tr><td colSpan={10}><div className="flex flex-col items-center text-center py-16 px-6">
                    <div className="w-16 h-16 rounded-2xl bg-blue/10 text-blue grid place-items-center text-3xl mb-4">🛍️</div>
                    <h3 className="font-bold text-brand text-lg">İlk məhsulunu yüklə, satışa başla!</h3>
                    <p className="text-sm text-t2 mt-1 max-w-sm">Şəkil, qiymət və ölçüləri əlavə et — məhsulun admin təsdiqindən sonra saytda görünəcək.</p>
                    <button onClick={addNew} className="mt-5 bg-blue text-white px-5 py-2.5 rounded-btn text-sm font-semibold hover:bg-blue-700">＋ Məhsul əlavə et</button>
                  </div></td></tr></tbody>
                : <EmptyRow cols={10} text="Bu filtrə uyğun məhsul tapılmadı" />
            ) : (
              <tbody>
                {shown.map((p) => {
                  const ap = badgeFor(p);
                  return (
                  <tr key={p.id} className="border-t border-bdr row-h">
                    <Td>{p.imageUrls && p.imageUrls[0] ? <img src={resolveImg(p.imageUrls[0])} className="w-10 h-10 rounded object-cover bg-bg2" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} /> : <div className="w-10 h-10 rounded bg-bg3" />}</Td>
                    <Td className="font-medium">{p.name}</Td>
                    <Td className="text-t2">{p.category}{p.subcategory ? ' · ' + p.subcategory : ''}</Td>
                    <Td>{money(p.price ?? 0)}{p.oldPrice ? <span className="text-t3 line-through ml-1 text-xs">{money(p.oldPrice)}</span> : null}</Td>
                    <Td>{p.discount ? <span className="text-sale font-semibold">−{p.discount}%</span> : <span className="text-t3">—</span>}</Td>
                    <Td><span className={(p.stock ?? 0) <= 5 ? 'text-sale font-semibold' : 'text-t2'}>{p.stock}</span></Td>
                    <Td className="text-t2">{p.salesCount ?? 0}</Td>
                    <Td className="text-t3">{p.views ?? 0}</Td>
                    <Td><span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: ap.bg, color: ap.fg }}>{ap.label}</span>{p.approvalStatus === 'Rejected' && p.rejectReason ? <div className="text-t3 text-[11px] mt-0.5 max-w-[160px] truncate" title={p.rejectReason}>{p.rejectReason}</div> : null}</Td>
                    <Td className="text-right whitespace-nowrap">
                      <button onClick={() => setEdit(p)} className="text-blue hover:underline text-sm mr-3">Redaktə</button>
                      <button onClick={() => setDel(p)} className="text-sale hover:underline text-sm">Sil</button>
                    </Td>
                  </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </Card>

        {/* Mobil kartlar */}
        <div className="md:hidden space-y-2.5">
          {!shown ? [0,1,2].map(i => <div key={i} className="skel h-24 rounded-card" />)
            : shown.length === 0 ? <Card><div className="flex flex-col items-center text-center py-12 px-6">
                <div className="w-14 h-14 rounded-2xl bg-blue/10 text-blue grid place-items-center text-2xl mb-3">🛍️</div>
                <h3 className="font-bold text-brand">{noProducts ? 'İlk məhsulunu yüklə!' : 'Nəticə tapılmadı'}</h3>
                {noProducts && <><p className="text-sm text-t2 mt-1">Satışa başlamaq üçün məhsul əlavə et.</p><button onClick={addNew} className="mt-4 bg-blue text-white px-4 py-2 rounded-btn text-sm font-semibold">＋ Məhsul əlavə et</button></>}
              </div></Card>
            : shown.map((p) => {
              const ap = badgeFor(p);
              return (
                <div key={p.id} className="bg-white border border-bdr rounded-card p-3 shadow-xs flex gap-3">
                  {p.imageUrls && p.imageUrls[0] ? <img src={resolveImg(p.imageUrls[0])} className="w-16 h-16 rounded-card object-cover bg-bg2 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} /> : <div className="w-16 h-16 rounded-card bg-bg3 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-brand text-sm leading-tight truncate">{p.name}</p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0" style={{ background: ap.bg, color: ap.fg }}>{ap.label}</span>
                    </div>
                    <p className="text-xs text-t3 mt-0.5 truncate">{p.category}{p.subcategory ? ' · ' + p.subcategory : ''}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-brand text-sm">{money(p.price ?? 0)}</span>
                      {p.oldPrice ? <span className="text-t3 line-through text-xs">{money(p.oldPrice)}</span> : null}
                      <span className={`text-xs ml-auto ${(p.stock ?? 0) <= 5 ? 'text-sale font-semibold' : 'text-t3'}`}>Stok: {p.stock}</span>
                    </div>
                    <p className="text-[11px] text-t3 mt-0.5">Satış: {p.salesCount ?? 0} · Baxış: {p.views ?? 0}{p.discount ? <span className="text-sale font-semibold"> · −{p.discount}%</span> : null}</p>
                    <div className="flex gap-3 mt-2">
                      <button onClick={() => setEdit(p)} className="text-blue text-sm font-medium">Redaktə</button>
                      <button onClick={() => setDel(p)} className="text-sale text-sm font-medium">Sil</button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        {edit && <ProductEdit product={edit} cats={cats} onClose={() => setEdit(null)} onSave={save} />}
        {del && <Confirm text={`"${del.name}" məhsulunu silmək istəyirsiniz?`} onYes={() => remove(del)} onNo={() => setDel(null)} />}
      </div>
    );
  }

export function ProductEdit({ product, cats, onClose, onSave }: { product: Product; cats: Category[]; onClose: () => void; onSave: (p: Product) => void }) {
    // Autosave: qaralama localStorage-da saxlanılır (internet gedərsə/səhifə yenilənərsə itməsin).
    const draftKey = `gardrop_pdraft_${product.id ?? 'new'}`;
    const baseProduct = { ...product, sizeStock: product.sizeStock || {}, variants: product.variants || [], imageUrls: (product.imageUrls && product.imageUrls.length) ? product.imageUrls : [], gender: product.gender || 'Uniseks', sizeSystem: product.sizeSystem || 'INT', fitType: product.fitType || 'Regular', stretch: product.stretch || 'medium', tags: product.tags || [], season: product.season || '', seoTitle: product.seoTitle || '', seoDescription: product.seoDescription || '', isDraft: !!product.isDraft };
    const [f, setF] = useState<Product>(() => {
      try { const saved = localStorage.getItem(draftKey); if (saved) return { ...baseProduct, ...JSON.parse(saved) }; } catch { /* ignore */ }
      return baseProduct;
    });
    const [restored, setRestored] = useState(() => { try { return !!localStorage.getItem(draftKey); } catch { return false; } });
    // f dəyişdikcə throttled saxla.
    useEffect(() => { const t = setTimeout(() => { try { localStorage.setItem(draftKey, JSON.stringify(f)); } catch { /* ignore */ } }, 600); return () => clearTimeout(t); }, [f, draftKey]);
    const clearDraft = () => { try { localStorage.removeItem(draftKey); } catch { /* ignore */ } };
    const discardDraft = () => { clearDraft(); setF(baseProduct); setRestored(false); };
    // Variant matrisi (ölçü × rəng → SKU + stok). Aktivdirsə sadə ölçü/stok əvəzinə matris istifadə olunur.
    const [useVariants, setUseVariants] = useState(!!(product.variants && product.variants.length));
    const vlist = f.variants || [];
    const addVariant = () => setF({ ...f, variants: [...vlist, { size: '', color: '', sku: '', stock: 0 }] });
    const setVariant = (i: number, k: keyof import('./types').ProductVariant, val: string) =>
      setF({ ...f, variants: vlist.map((v, j) => j === i ? { ...v, [k]: k === 'stock' ? Math.max(0, Number(val) || 0) : val } : v) });
    const delVariant = (i: number) => setF({ ...f, variants: vlist.filter((_, j) => j !== i) });
    const variantTotal = vlist.reduce((a, v) => a + (Number(v.stock) || 0), 0);
    const variantSizes = Array.from(new Set(vlist.map((v) => v.size).filter(Boolean)));
    const [tagInput, setTagInput] = useState('');
    const addTag = () => { const v = tagInput.trim(); if (v && !(f.tags || []).includes(v)) setF({ ...f, tags: [...(f.tags || []), v] }); setTagInput(''); };
    const delTag = (t: string) => setF({ ...f, tags: (f.tags || []).filter((x) => x !== t) });
    const makePrimary = (i: number) => { if (i === 0) return; const a = [...f.imageUrls]; const [m] = a.splice(i, 1); setF({ ...f, imageUrls: [m, ...a] }); };
    const moveImg = (from: number, to: number) => { if (from === to || from < 0 || to < 0 || to >= f.imageUrls.length) return; const a = [...f.imageUrls]; const [m] = a.splice(from, 1); a.splice(to, 0, m); setF({ ...f, imageUrls: a }); };
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false), [upErr, setUpErr] = useState('');
    const [csz, setCsz] = useState('');
    // Marka seçiləndə "Ölçü davranışı"nı avtomatik doldur — mağaza əli ilə dəyişməyibsə.
    const [behaviorTouched, setBehaviorTouched] = useState(!!product.id && (product.sizeBehavior || 'Standard') !== 'Standard' && brandBehavior(product.brand) !== (product.sizeBehavior || 'Standard'));
    const setBrand = (e: React.ChangeEvent<HTMLInputElement>) => {
      const brand = e.target.value;
      setF((p) => behaviorTouched ? { ...p, brand } : { ...p, brand, sizeBehavior: brandBehavior(brand) });
    };
    const setBehavior = (e: React.ChangeEvent<HTMLSelectElement>) => { setBehaviorTouched(true); setF((p) => ({ ...p, sizeBehavior: e.target.value })); };
    const autoBeh = !behaviorTouched && brandBehavior(f.brand) !== 'Standard';
    const addCustom = () => { const v = csz.trim(); if (v && !(v in f.sizeStock)) setF({ ...f, sizeStock: { ...f.sizeStock, [v]: 0 } }); setCsz(''); };
    // Mağaza öz ölçü cədvəli (Custom) sətir redaktoru
    const chartRows: SizeChartRow[] = f.sizeChart || [];
    const setRow = (i: number, key: keyof SizeChartRow, val: string | number | null) => setF({ ...f, sizeChart: chartRows.map((r, j) => j === i ? { ...r, [key]: val } : r) });
    const setRowSize = (i: number, val: string) => { const old = chartRows[i].size; const ss = { ...f.sizeStock }; if (old && old in ss) { ss[val] = ss[old]; delete ss[old]; } if (!(val in ss)) ss[val] = 0; setF({ ...f, sizeChart: chartRows.map((r, j) => j === i ? { ...r, size: val } : r), sizeStock: ss }); };
    const setRowStock = (size: string, v: string) => setF({ ...f, sizeStock: { ...f.sizeStock, [size]: Math.max(0, Number(v) || 0) } });
    const addRow = () => setF({ ...f, sizeChart: [...chartRows, { size: '', boyMin: null, boyMax: null, cekiMin: null, cekiMax: null }] });
    const delRow = (i: number) => { const old = chartRows[i].size; const ss = { ...f.sizeStock }; if (old) delete ss[old]; setF({ ...f, sizeChart: chartRows.filter((_, j) => j !== i), sizeStock: ss }); };
    const numOr = (v: string): number | null => v === '' ? null : Number(v);
    // Absurd boy/çəki qarşısı — real insan aralıqları
    const BOY_MIN = 50, BOY_MAX = 250, CEKI_MIN = 20, CEKI_MAX = 350;
    const chartError = (() => {
      if (f.sizeSystem !== 'Custom') return '';
      if (!chartRows.length) return 'Ən azı bir ölçü sətri əlavə edin.';
      const seen = new Set();
      for (const r of chartRows) {
        const sz = (r.size || '').trim();
        if (!sz) return 'Hər sətirdə ölçü adı olmalıdır.';
        if (seen.has(sz)) return `Ölçü adı təkrarlanır: ${sz}.`;
        seen.add(sz);
        const chk = (mn: number | null, mx: number | null, lo: number, hi: number, lbl: string, unit: string) => {
          if (mn != null && (mn < lo || mn > hi)) return `${lbl} ${mn}${unit} real deyil (${lo}–${hi} aralığında olmalıdır).`;
          if (mx != null && (mx < lo || mx > hi)) return `${lbl} ${mx}${unit} real deyil (${lo}–${hi} aralığında olmalıdır).`;
          if (mn != null && mx != null && mn > mx) return `${lbl}: min (${mn}) maksimumdan (${mx}) böyük ola bilməz.`;
          return '';
        };
        const e1 = chk(r.boyMin, r.boyMax, BOY_MIN, BOY_MAX, 'Boy', ' sm'); if (e1) return e1;
        const e2 = chk(r.cekiMin, r.cekiMax, CEKI_MIN, CEKI_MAX, 'Çəki', ' kg'); if (e2) return e2;
        if (r.boyMin == null && r.boyMax == null && r.cekiMin == null && r.cekiMax == null)
          return `"${sz}" sətrində ən azı boy və ya çəki aralığı olmalıdır.`;
      }
      return '';
    })();
    const str = (k: keyof Product) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
    const cat = cats.find((c) => c.name === f.category);
    const subSubOpts = (cat?.tree || []).find((t) => t.name === f.subcategory)?.children || [];
    const sizeOpts = sizeOptionsFor(f.sizeSystem, f.category);
    const totalStock = Object.values(f.sizeStock || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    const sizesChosen = Object.keys(f.sizeStock || {});

    const setDiscount = (e: React.ChangeEvent<HTMLInputElement>) => {
      const d = e.target.value === '' ? null : Number(e.target.value);
      if (d == null || d <= 0) { setF({ ...f, discount: null, price: f.oldPrice ?? f.price, oldPrice: null }); return; }
      const dd = Math.min(99, Math.max(1, Math.round(d)));
      const base = f.oldPrice ?? f.price ?? 0;
      if (!base) { setF({ ...f, discount: dd }); return; }
      setF({ ...f, discount: dd, oldPrice: base, price: round2(base * (1 - dd / 100)) });
    };
    const setPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
      const price = e.target.value === '' ? null : Number(e.target.value);
      const nf = { ...f, price };
      nf.discount = (f.oldPrice && price != null && f.oldPrice > price) ? Math.round((1 - price / f.oldPrice) * 100) : null;
      setF(nf);
    };
    const setOldPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
      const oldPrice = e.target.value === '' ? null : Number(e.target.value);
      const nf = { ...f, oldPrice };
      nf.discount = (oldPrice && f.price != null && oldPrice > f.price) ? Math.round((1 - f.price / oldPrice) * 100) : null;
      setF(nf);
    };
    const toggleSize = (s: string) => { const ss = { ...(f.sizeStock || {}) }; if (s in ss) delete ss[s]; else ss[s] = 0; setF({ ...f, sizeStock: ss }); };
    const setSizeQty = (s: string, v: string) => setF({ ...f, sizeStock: { ...f.sizeStock, [s]: Math.max(0, Number(v) || 0) } });
    const setImg = (i: number, v: string) => { const a = [...f.imageUrls]; a[i] = v; setF({ ...f, imageUrls: a }); };
    const delImg = (i: number) => setF({ ...f, imageUrls: f.imageUrls.filter((_, j) => j !== i) });
    const crop = useCropper(RATIOS.product);
    const uploadImgs = async (files: FileList | null) => { if (!files || !files.length) return; const cropped = await crop.start(files); if (!cropped) return; setUploading(true); setUpErr(''); try { const urls = await uploadFilesStore(cropped); setF((p) => ({ ...p, imageUrls: [...p.imageUrls.filter((u) => u && u.trim()), ...urls] })); } catch (e) { setUpErr((e as Error).message); } setUploading(false); };

    // Qaralama yarımçıq saxlana bilər — yalnız ad tələb olunur.
    const stockOk = useVariants ? (vlist.length > 0 && variantTotal > 0) : (sizesChosen.length > 0 && totalStock > 0);
    const valid = f.isDraft ? !!f.name : (f.name && f.category && f.price != null && stockOk && (useVariants || !chartError));
    const submit = () => {
      const imgs = (f.imageUrls || []).map((u) => (u || '').trim()).filter(Boolean);
      clearDraft();   // uğurla göndərildikdə qaralama silinir
      // Variant rejimi: matris göndərilir (backend SizeStock/Sizes/Stock/Color törədir). Söndürülübsə boş matris → təmizlə.
      onSave({ ...f, imageUrls: imgs, images: imgs.length, price: f.price,
        variants: useVariants ? vlist : [],
        sizes: useVariants ? variantSizes : sizesChosen,
        stock: useVariants ? variantTotal : totalStock,
        size: (useVariants ? variantSizes[0] : sizesChosen[0]) || f.size || '' });
    };
    return (
      <Modal title={product.id ? 'Məhsulu redaktə et' : 'Yeni məhsul'} onClose={onClose} wide>
        {restored && (
          <div className="mb-3 flex items-center justify-between gap-3 bg-bg2 border border-bdr rounded-btn px-3 py-2 text-sm">
            <span className="text-t2">Saxlanmış qaralama bərpa olundu.</span>
            <button type="button" onClick={discardDraft} className="text-blue font-semibold hover:underline shrink-0">Təmizlə</button>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><Field label="Ad *" value={f.name || ''} onChange={str('name')} /></div>
          <div className="sm:col-span-2">
            <label className="block"><span className="block text-xs font-semibold text-t2 mb-1">Marka <span className="text-t3 font-normal">— AI marka əsaslı kəsim korreksiyası tətbiq edir (məs. Zara → kiçik kəsilir)</span></span>
              <input list="brand-list" className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" value={f.brand || ''} onChange={setBrand} placeholder="məs. Zara, LC Waikiki, Koton, Defacto…" />
            </label>
            <datalist id="brand-list"><option value="Zara"/><option value="Bershka"/><option value="Pull&Bear"/><option value="Stradivarius"/><option value="Mango"/><option value="H&M"/><option value="LC Waikiki"/><option value="DeFacto"/><option value="Koton"/><option value="Mavi"/><option value="Colins"/><option value="US Polo Assn"/><option value="Nike"/><option value="Adidas"/><option value="Puma"/></datalist>
          </div>
          <label className="block"><span className="block text-xs font-semibold text-t2 mb-1">Kateqoriya *</span>
            <select className={SELECT_CLS} value={f.category || ''} onChange={(e) => setF({ ...f, category: e.target.value, subcategory: '', subSubcategory: '' })}>
              <option value="">— seçin —</option>{cats.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select></label>
          <label className="block"><span className="block text-xs font-semibold text-t2 mb-1">Alt-kateqoriya</span>
            <select className={SELECT_CLS} value={f.subcategory || ''} onChange={(e) => setF({ ...f, subcategory: e.target.value, subSubcategory: '' })} disabled={!cat}>
              <option value="">— seçin —</option>{cat && (cat.subcategories || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select></label>
          <label className="block"><span className="block text-xs font-semibold text-t2 mb-1">Alt-alt-kateqoriya</span>
            <select className={SELECT_CLS} value={f.subSubcategory || ''} onChange={str('subSubcategory')} disabled={!subSubOpts.length}>
              <option value="">{subSubOpts.length ? '— seçin —' : '—'}</option>{subSubOpts.map((s) => <option key={s} value={s}>{s}</option>)}
            </select></label>
          <label className="block"><span className="block text-xs font-semibold text-t2 mb-1">Cinsiyyət</span>
            <select className={SELECT_CLS} value={f.gender || 'Uniseks'} onChange={str('gender')}><option>Kişi</option><option>Qadın</option><option>Uniseks</option></select></label>
          <label className="block"><span className="block text-xs font-semibold text-t2 mb-1">Ölçü sistemi</span>
            <select className={SELECT_CLS} value={f.sizeSystem || 'INT'} onChange={(e) => setF({ ...f, sizeSystem: e.target.value, sizeStock: {} })}><option value="INT">INT (S/M/L…)</option><option value="TR">TR (rəqəmlərlə)</option><option value="Custom">Mağazanın öz sistemi</option></select></label>
          <label className="block"><span className="block text-xs font-semibold text-t2 mb-1">Kəsim növü</span>
            <select className={SELECT_CLS} value={f.fitType || 'Regular'} onChange={str('fitType')}><option value="Slim">Slim Fit (dar)</option><option value="Regular">Regular Fit (normal)</option><option value="Relaxed">Relaxed Fit (rahat)</option><option value="Oversize">Oversize (bol)</option></select></label>
          <label className="block"><span className="block text-xs font-semibold text-t2 mb-1">Parça elastikliyi</span>
            <select className={SELECT_CLS} value={f.stretch || 'medium'} onChange={str('stretch')}><option value="none">Elastik deyil</option><option value="low">Az elastik</option><option value="medium">Orta elastik</option><option value="high">Yüksək elastik</option></select></label>
          <label className="block"><span className="block text-xs font-semibold text-t2 mb-1">Ölçü davranışı {autoBeh && <span className="text-t3 font-normal">— {f.brand} markasına görə avtomatik</span>}</span>
            <select className={SELECT_CLS} value={f.sizeBehavior || 'Standard'} onChange={setBehavior}><option value="Standard">Standart</option><option value="RunsSmall">Kiçik kəsilir (runs small)</option><option value="RunsLarge">Böyük kəsilir (runs large)</option><option value="Oversize">Oversize dizayn</option></select></label>
          <label className="flex items-center gap-2 sm:col-span-2 cursor-pointer py-1">
            <input type="checkbox" className="rounded accent-[#0A0A0A]" checked={!!f.washShrink} onChange={(e) => setF({ ...f, washShrink: e.target.checked })} />
            <span className="text-sm text-t2">İlk yuyulmadan sonra cüzi yığıla bilər (müştəriyə xəbərdarlıq göstərilir)</span>
          </label>
          <Field label="Rəng" value={f.color || ''} onChange={str('color')} />
          <Field label="Material" value={f.material || ''} onChange={str('material')} />
          <label className="block"><span className="block text-xs font-semibold text-t2 mb-1">Mövsüm</span>
            <select className={SELECT_CLS} value={f.season || ''} onChange={str('season')}><option value="">— seçin —</option><option value="Yaz">Yaz</option><option value="Yay">Yay</option><option value="Payız">Payız</option><option value="Qış">Qış</option><option value="Bütün il">Bütün il</option></select></label>
          <div className="block">
            <span className="block text-xs font-semibold text-t2 mb-1">Etiketlər <span className="text-t3 font-normal">— axtarış üçün</span></span>
            <div className="flex gap-2"><input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="məs. yeni, trend, pambıq" className="flex-1 bg-white border border-bdr rounded-btn px-3 py-2 text-sm" /><button type="button" onClick={addTag} className="px-3 py-1.5 rounded-btn border border-bdr text-brand text-sm font-semibold shrink-0">+ Əlavə</button></div>
            {(f.tags || []).length > 0 && <div className="flex flex-wrap gap-1.5 mt-1.5">{(f.tags || []).map((t) => <span key={t} className="inline-flex items-center gap-1 bg-bg2 text-t2 rounded-full px-2.5 py-0.5 text-xs font-medium">{t}<button type="button" onClick={() => delTag(t)} className="text-t3 hover:text-sale leading-none">✕</button></span>)}</div>}
          </div>

          <Field label="Qiymət / yeni qiymət (₼) *" type="number" step="0.01" value={f.price ?? ''} onChange={setPrice} />
          <Field label="Köhnə qiymət (₼)" type="number" step="0.01" value={f.oldPrice ?? ''} onChange={setOldPrice} placeholder="endirim yoxdursa boş" />
          <Field label="Endirim (%)" type="number" value={f.discount ?? ''} onChange={setDiscount} placeholder="% yaz → qiymət azalır" />
          <div className="flex items-end text-xs text-t3 pb-2">{f.oldPrice && f.discount ? <span><b className="text-sale">−{f.discount}%</b> · {money(f.oldPrice)} → <b className="text-brand">{money(f.price ?? 0)}</b></span> : <span>Endirim yoxdur</span>}</div>
          <div className="sm:col-span-2">
            <Field label="Alış qiyməti (₼) — yalnız siz görürsünüz" type="number" step="0.01" value={f.buyPrice ?? ''} onChange={(e) => setF({ ...f, buyPrice: e.target.value === '' ? null : Number(e.target.value) })} placeholder="mənfəət hesabı üçün (məcburi deyil)" />
            {f.buyPrice != null && f.price != null && f.price > 0 && <p className="text-[11px] text-t3 mt-1">Mənfəət: <b className={f.price - f.buyPrice >= 0 ? 'text-brand' : 'text-sale'}>{money(round2((f.price ?? 0) - (f.buyPrice ?? 0)))}</b> / ədəd ({Math.round(((f.price - f.buyPrice) / f.price) * 100)}% marja)</p>}
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="block text-xs font-semibold text-t2">{useVariants ? 'Variantlar (ölçü × rəng)' : 'Ölçülər və stok'} * <span className="text-t3 font-normal">— {useVariants ? 'hər variant üçün SKU + stok' : 'ölçünü seç, sonra ədəd yaz'}</span></span>
              <button type="button" onClick={() => setUseVariants((v) => !v)} className="text-xs font-semibold text-blue hover:underline shrink-0">{useVariants ? 'Sadə ölçü/stoka keç' : '+ Variant matrisi (rəng+ölçü+SKU)'}</button>
            </div>
            {useVariants && (
              <div className="space-y-1.5 mb-1">
                {vlist.length === 0 && <p className="text-xs text-t3">Hələ variant yoxdur. Hər ölçü/rəng kombinasiyası üçün sətir əlavə et.</p>}
                {vlist.map((v, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-1.5 bg-bg2 rounded-btn p-1.5">
                    <input value={v.size} onChange={(e) => setVariant(i, 'size', e.target.value)} placeholder="Ölçü" className="w-16 bg-white border border-bdr rounded px-2 py-1 text-sm font-semibold" />
                    <input value={v.color} onChange={(e) => setVariant(i, 'color', e.target.value)} placeholder="Rəng" className="w-24 bg-white border border-bdr rounded px-2 py-1 text-sm" />
                    <input value={v.sku} onChange={(e) => setVariant(i, 'sku', e.target.value)} placeholder="SKU" className="flex-1 min-w-24 bg-white border border-bdr rounded px-2 py-1 text-sm" />
                    <span className="text-[11px] text-t3 ml-1">stok</span>
                    <input type="number" min="0" value={v.stock} onChange={(e) => setVariant(i, 'stock', e.target.value)} className="w-16 bg-white border border-bdr rounded px-1.5 py-1 text-sm" />
                    <button type="button" onClick={() => delVariant(i)} className="text-t3 hover:text-sale px-1.5 text-base leading-none">✕</button>
                  </div>
                ))}
                <button type="button" onClick={addVariant} className="text-sm font-semibold text-brand">+ Variant əlavə et</button>
                {vlist.length > 0 && variantTotal === 0 && <p className="text-xs text-sale font-medium">⚠ Ən azı bir variantda stok olmalıdır.</p>}
              </div>
            )}
            {!useVariants && (f.sizeSystem === 'Custom' ? (
              <div className="space-y-1.5 mb-1">
                <p className="text-xs text-t3">Ölçü cədvəli — hər ölçü üçün boy və çəki aralığını yazın (AI tövsiyə bunu işlədir).</p>
                {chartRows.map((r, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-1 bg-bg2 rounded-btn p-1.5">
                    <input value={r.size || ''} onChange={(e) => setRowSize(i, e.target.value)} placeholder="Ölçü" className="w-14 bg-white border border-bdr rounded px-2 py-1 text-sm font-semibold" />
                    <span className="text-[11px] text-t3">boy</span>
                    <input type="number" value={r.boyMin ?? ''} onChange={(e) => setRow(i, 'boyMin', numOr(e.target.value))} placeholder="min" className="w-14 bg-white border border-bdr rounded px-1.5 py-1 text-sm" />
                    <span className="text-t3">–</span>
                    <input type="number" value={r.boyMax ?? ''} onChange={(e) => setRow(i, 'boyMax', numOr(e.target.value))} placeholder="max" className="w-14 bg-white border border-bdr rounded px-1.5 py-1 text-sm" />
                    <span className="text-[11px] text-t3 ml-1">çəki</span>
                    <input type="number" value={r.cekiMin ?? ''} onChange={(e) => setRow(i, 'cekiMin', numOr(e.target.value))} placeholder="min" className="w-14 bg-white border border-bdr rounded px-1.5 py-1 text-sm" />
                    <span className="text-t3">–</span>
                    <input type="number" value={r.cekiMax ?? ''} onChange={(e) => setRow(i, 'cekiMax', numOr(e.target.value))} placeholder="max" className="w-14 bg-white border border-bdr rounded px-1.5 py-1 text-sm" />
                    <span className="text-[11px] text-t3 ml-1">stok</span>
                    <input type="number" min="0" value={f.sizeStock[r.size] ?? 0} onChange={(e) => setRowStock(r.size, e.target.value)} className="w-14 bg-white border border-bdr rounded px-1.5 py-1 text-sm" />
                    <button type="button" onClick={() => delRow(i)} className="text-t3 hover:text-sale px-1.5 text-base leading-none">✕</button>
                  </div>
                ))}
                <button type="button" onClick={addRow} className="text-sm font-semibold text-brand">+ Sətir əlavə et</button>
                <p className="text-[11px] text-t3">Boy {BOY_MIN}–{BOY_MAX} sm, çəki {CEKI_MIN}–{CEKI_MAX} kg aralığında olmalıdır.</p>
                {chartError && <p className="text-xs text-sale font-medium">⚠ {chartError}</p>}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {sizeOpts.map((s) => <button key={s} type="button" onClick={() => toggleSize(s)} className={`min-w-10 px-2.5 py-1.5 rounded-btn border-2 text-sm font-semibold ${s in f.sizeStock ? 'border-brand bg-brand text-white' : 'border-bdr text-t2 hover:border-bdr-s'}`}>{s}</button>)}
                </div>
                <div className="flex gap-2 mb-2">
                  <input value={csz} onChange={(e) => setCsz(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} placeholder="Əlavə kiçik/böyük ölçü (məs. XXS, 4XL, 50)" className="flex-1 bg-white border border-bdr rounded-btn px-3 py-1.5 text-sm" />
                  <button type="button" onClick={addCustom} className="px-3 py-1.5 rounded-btn border border-bdr text-brand text-sm font-semibold shrink-0">+ Əlavə</button>
                </div>
                {sizesChosen.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{sizesChosen.map((s) => (
                    <div key={s} className="flex items-center gap-2 bg-bg2 rounded-btn px-2 py-1.5"><span className="text-sm font-semibold w-9">{s}</span><input type="number" min="0" value={f.sizeStock[s]} onChange={(e) => setSizeQty(s, e.target.value)} className="w-full bg-white border border-bdr rounded px-2 py-1 text-sm" /></div>))}</div>
                )}
              </>
            ))}
            <p className="text-xs text-t3 mt-1.5">Ümumi stok: <b className={(useVariants ? variantTotal : totalStock) > 0 ? 'text-brand' : 'text-sale'}>{useVariants ? variantTotal : totalStock}</b> ədəd{useVariants && variantSizes.length > 0 ? ` · ${variantSizes.length} ölçü` : ''}</p>
          </div>

          <div className="sm:col-span-2">
            <span className="block text-xs font-semibold text-t2 mb-1.5">Şəkillər <span className="text-t3 font-normal">— cihazdan yüklə və ya link</span></span>
            <label className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-btn py-3 mb-2 cursor-pointer text-sm ${uploading ? 'border-bdr text-t3' : 'border-bdr-s text-brand hover:border-brand'}`}>
              {uploading ? <><Spin /> Yüklənir…</> : <>📷 Cihazdan şəkil yüklə</>}
              <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={(e) => { uploadImgs(e.target.files); e.target.value = ''; }} />{crop.ui}
            </label>
            {upErr && <p className="text-xs text-sale mb-2">{upErr}</p>}
            <p className="text-[11px] text-t3 mb-1.5">İlk şəkil əsas (örtük) şəkildir — sürüşdürüb sırala (⠿) və ya “Əsas et”ə bas.</p>
            <div className="space-y-2">{f.imageUrls.map((u, i) => (
              <div key={i} draggable onDragStart={() => setDragIdx(i)} onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (dragIdx !== null) moveImg(dragIdx, i); setDragIdx(null); }}
                onDragEnd={() => setDragIdx(null)}
                className={`flex items-center gap-2 rounded-btn transition-opacity ${dragIdx === i ? 'opacity-40' : ''}`}>
                <span className="cursor-grab active:cursor-grabbing text-t3 select-none px-0.5" title="Sürüşdür">⠿</span>
                {u ? <img src={resolveImg(u)} className="w-9 h-9 rounded object-cover bg-bg2 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} /> : <div className="w-9 h-9 rounded bg-bg3 shrink-0" />}<input value={u} onChange={(e) => setImg(i, e.target.value)} placeholder="https://…" className="flex-1 bg-white border border-bdr rounded-btn px-3 py-2 text-sm" />{i === 0 ? <span className="text-[11px] font-semibold text-brand bg-brand/10 rounded-full px-2 py-0.5 shrink-0">Əsas</span> : <button type="button" onClick={() => makePrimary(i)} className="text-[11px] font-medium text-blue hover:underline shrink-0 whitespace-nowrap">Əsas et</button>}<button type="button" onClick={() => delImg(i)} className="text-sale text-lg px-2 leading-none">×</button></div>))}</div>
            <button type="button" onClick={() => setF({ ...f, imageUrls: [...f.imageUrls, ''] })} className="text-blue text-sm mt-2 hover:underline">＋ Link əlavə et</button>
          </div>

          <label className="block sm:col-span-2"><span className="block text-xs font-semibold text-t2 mb-1">Təsvir</span><textarea className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm h-24 resize-none" value={f.description || ''} onChange={str('description')} /></label>

          <div className="sm:col-span-2 border-t border-bdr pt-3 mt-1">
            <span className="block text-xs font-semibold text-t2 mb-1.5">SEO <span className="text-t3 font-normal">— axtarış nəticələrində görünür; boşdursa ad/təsvir işlədilir</span></span>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="SEO başlıq" value={f.seoTitle || ''} onChange={str('seoTitle')} placeholder={f.name || 'məhsul adı'} />
              <Field label="SEO təsvir" value={f.seoDescription || ''} onChange={str('seoDescription')} placeholder="qısa təsvir" />
            </div>
          </div>
          <label className="flex items-center gap-2 sm:col-span-2 cursor-pointer py-1">
            <input type="checkbox" className="rounded accent-[#0A0A0A]" checked={!!f.isDraft} onChange={(e) => setF({ ...f, isDraft: e.target.checked })} />
            <span className="text-sm text-t2">Qaralama kimi saxla <span className="text-t3">— admin təsdiqinə göndərilmir, saytda görünmür</span></span>
          </label>
        </div>
        <div className="flex gap-2 justify-end mt-5"><Btn variant="ghost" onClick={onClose}>İmtina</Btn><Btn onClick={submit} disabled={!valid}>{f.isDraft ? 'Qaralama saxla' : 'Yadda saxla'}</Btn></div>
      </Modal>
    );
  }


export default Products;
