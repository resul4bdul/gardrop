/* Admin paneli ortaq qatı (fayllara bölmə): API helper, UI atomları, sabitlər, MapPicker.
   Tab faylları buradan import edir; api/toast komponentlərə props ilə ötürülür. */
import React from "react";
import type { ApiFn, ToastState, Product, Store, Coupon, LatLng } from "./types";

declare const L: any; // Leaflet (CDN qlobal)

const { useState, useEffect, useCallback, useRef } = React;

// Eyni origin-dən servis olunur (port 3001).
export const API = location.origin.startsWith('http') ? location.origin : 'http://localhost:3001';
export const TKEY = 'gd_admin_token';

// Realtime: səssiz yeniləmə — fokuslananda + hər 15 saniyədə.
export function useLive(refresh: () => void) {
  useEffect(() => {
    const tick = () => { if (!document.hidden) refresh(); };
    const t = setInterval(tick, 15000);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(t); window.removeEventListener('focus', tick); document.removeEventListener('visibilitychange', tick); };
  }, [refresh]);
}

export function useApi(token: string | null, onAuthFail?: () => void): ApiFn {
  return useCallback(async <T = unknown>(path: string, opts: RequestInit = {}): Promise<T> => {
    const res = await fetch(API + path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(opts.headers || {}) },
    });
    if (res.status === 401 || res.status === 403) { onAuthFail && onAuthFail(); throw new Error('Yetki yoxdur'); }
    const txt = await res.text();
    const data = txt ? JSON.parse(txt) : null;
    if (!res.ok) throw new Error((data && data.error) || 'Xəta baş verdi');
    return data as T;
  }, [token, onAuthFail]);
}

// Cihazdan şəkil yükləmə (multipart)
export async function uploadFilesAdmin(files: FileList | File[] | null): Promise<string[]> {
  if (!files || !files.length) return [];
  const token = localStorage.getItem(TKEY);
  const fd = new FormData();
  Array.from(files).slice(0, 8).forEach((f) => fd.append('files', f));
  const r = await fetch(API + '/api/upload', { method: 'POST', headers: token ? { Authorization: 'Bearer ' + token } : {}, body: fd });
  const d = await r.json();
  if (!r.ok) throw new Error((d && d.error) || 'Yükləmə xətası');
  return Array.isArray(d.urls) ? d.urls : [];
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
export const fmt = (n: number) => new Intl.NumberFormat('az-AZ').format(Math.round((n || 0) * 100) / 100);
export const money = (n: number) => fmt(n) + ' ₼';
export const date = (s?: string) => { if (!s) return '—'; try { return new Date(s).toLocaleString('az-AZ', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return s; } };

export const STATUS_COLORS: Record<string, string> = {
  'Hazırlanır': 'bg-amber/10 text-amber', 'Hazırlandı': 'bg-green/10 text-green',
  'Yolda': 'bg-blue/10 text-blue', 'Çatdırıldı': 'bg-green/10 text-green', 'İptal': 'bg-sale/10 text-sale',
};
export const STATUSES = ['Hazırlanır', 'Hazırlandı', 'Yolda', 'Çatdırıldı', 'İptal'];
const STATUS_LABEL: Record<string, string> = { 'İptal': 'Ləğv edildi' };
export const statusLabel = (s: string) => STATUS_LABEL[s] || s;

// ─────────────────────────  UI atoms  ─────────────────────────
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'subtle' };
export const Btn = ({ children, variant = 'primary', className = '', ...p }: BtnProps) => {
  const base = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-btn px-3.5 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed';
  const styles = { primary: 'bg-brand text-white hover:bg-brand-h', ghost: 'bg-white border border-bdr text-brand hover:bg-bg2', danger: 'bg-sale/10 text-sale hover:bg-sale/20', subtle: 'text-t2 hover:bg-bg3' };
  return <button className={`${base} ${styles[variant]} ${className}`} {...p}>{children}</button>;
};

export const Field = ({ label, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
  <label className="block">
    {label && <span className="block text-xs font-semibold text-t2 mb-1">{label}</span>}
    <input className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" {...p} />
  </label>
);

export const Pill = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>{children}</span>
);

export function Modal({ title, onClose, children, wide }: { title: React.ReactNode; onClose: () => void; children?: React.ReactNode; wide?: boolean }) {
  // Mobil: aşağıdan sheet + barmaqla aşağı sürüşdürüb bağlama. Desktop: mərkəzi kart.
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);
  const onTS = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const onTM = (e: React.TouchEvent) => { if (startY.current == null) return; const dy = e.touches[0].clientY - startY.current; if (dy > 0) setDragY(dy); };
  const onTE = () => { if (dragY > 90) onClose(); else setDragY(0); startY.current = null; };
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm anim-fade" onMouseDown={onClose} />
      <div className="absolute inset-0 overflow-y-auto flex items-end sm:items-start justify-center sm:p-8" onMouseDown={onClose}>
        <div className={`relative bg-white shadow-pop w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} rounded-t-sheet2 sm:rounded-sheet2 anim-sheet sm:anim-pop flex flex-col max-h-[92dvh] sm:max-h-[calc(100dvh-4rem)] sm:my-4`}
          style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
          onMouseDown={(e) => e.stopPropagation()}>
          <div className="shrink-0 touch-none" onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}>
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center"><div className="w-10 h-1.5 rounded-full bg-bdr-s" /></div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-bdr">
              <h3 className="font-bold text-lg text-brand">{title}</h3>
              <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-full bg-bg2 hover:bg-bg3 text-t2 text-xl leading-none">×</button>
            </div>
          </div>
          <div className="p-5 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  const c = toast.kind === 'error' ? 'bg-sale' : 'bg-brand';
  return <div className={`fixed bottom-5 right-5 z-[60] ${c} text-white px-4 py-3 rounded-btn shadow-pop text-sm font-medium anim-pop max-w-sm`}>{toast.msg}</div>;
}

export const Confirm = ({ text, onYes, onNo }: { text: string; onYes: () => void; onNo: () => void }) => (
  <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/40 anim-fade" onMouseDown={onNo}>
    <div className="bg-white rounded-sheet shadow-pop max-w-sm w-full p-5 anim-pop" onMouseDown={(e) => e.stopPropagation()}>
      <p className="text-[15px] mb-4">{text}</p>
      <div className="flex gap-2 justify-end"><Btn variant="ghost" onClick={onNo}>İmtina</Btn><Btn variant="danger" onClick={onYes}>Sil</Btn></div>
    </div>
  </div>
);

export const TableSkeleton = ({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) => (
  <tbody>
    {Array.from({ length: rows }).map((_, r) => (
      <tr key={r} className="border-t border-bdr">
        {Array.from({ length: cols }).map((__, c) => (
          <td key={c} className="px-4 py-3"><div className="skel h-4 rounded" style={{ width: `${40 + (c * 13) % 50}%` }} /></td>
        ))}
      </tr>
    ))}
  </tbody>
);

export const EmptyRow = ({ cols, text }: { cols: number; text: string }) => (
  <tbody><tr className="border-t border-bdr"><td colSpan={cols} className="px-4 py-10 text-center text-t3 text-sm">{text}</td></tr></tbody>
);

export function Toolbar({ search, setSearch, onAdd, addLabel, right }: { search?: string; setSearch?: (v: string) => void; onAdd?: () => void; addLabel?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {setSearch && (
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Axtar…" className="w-full bg-bg2 border border-transparent focus:bg-white focus:border-bdr rounded-full pl-9 pr-3 py-2 text-sm transition-colors" />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-t3">⌕</span>
        </div>
      )}
      {right}
      {onAdd && <Btn onClick={onAdd} className="ml-auto">＋ {addLabel}</Btn>}
    </div>
  );
}

export const Th = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => <th className={`px-4 py-2.5 text-left text-xs font-semibold text-t2 uppercase tracking-wide ${className}`}>{children}</th>;
export const Td = ({ children, className = '', title }: { children?: React.ReactNode; className?: string; title?: string }) => <td title={title} className={`px-4 py-3 text-sm ${className}`}>{children}</td>;
export const Card = ({ children }: { children?: React.ReactNode }) => <div className="bg-white border border-bdr rounded-sheet shadow-xs overflow-x-auto">{children}</div>;
export const SELECT_CLS = 'w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm';

// ─────────────────────────  Product/Size sabitləri  ─────────────────────────
export const EMPTY_PRODUCT: Product = {
  name: '', store: '', storeId: 0, price: 0, oldPrice: null, rating: 0, reviews: 0, size: '',
  discount: null, category: '', subcategory: '', subSubcategory: '', gender: 'Uniseks',
  sizeSystem: 'INT', fitType: 'Regular', stretch: 'medium', color: '', sizes: [], sizeStock: {}, material: '', imageUrls: [], images: 0, stock: 0, description: '',
};
const SIZE_SETS = {
  INT: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  TR_clothing: ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52'],
  TR_shoe: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
};
export const sizeOptionsFor = (sizeSystem?: string, category?: string) => {
  if (sizeSystem === 'TR') return category === 'Ayaqqabı' ? SIZE_SETS.TR_shoe : SIZE_SETS.TR_clothing;
  return SIZE_SETS.INT;
};

const CHART_INT: Record<string, string[][]> = {
  'Qadın': [['XS', '78–82', '60–64'], ['S', '82–86', '64–68'], ['M', '86–92', '68–74'], ['L', '92–98', '74–80'], ['XL', '98–104', '80–86'], ['XXL', '104–112', '86–94']],
  'Kişi': [['XS', '82–88', '70–76'], ['S', '88–94', '76–82'], ['M', '94–100', '82–88'], ['L', '100–106', '88–94'], ['XL', '106–112', '94–100'], ['XXL', '112–118', '100–108']],
};
const CHART_TR_CLOTHING = [['34', 'XS'], ['36', 'S'], ['38', 'M'], ['40', 'L'], ['42', 'XL'], ['44', 'XXL'], ['46', '3XL']];
const CHART_SHOE = [['35', '22.5'], ['36', '23'], ['37', '23.5'], ['38', '24.5'], ['39', '25'], ['40', '25.5'], ['41', '26.5'], ['42', '27'], ['43', '28'], ['44', '28.5'], ['45', '29.5'], ['46', '30']];

export function SizeChart({ sizeSystem, category, gender }: { sizeSystem?: string; category?: string; gender?: string }) {
  if (sizeSystem === 'TR' && category === 'Ayaqqabı') {
    return (
      <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-t3"><th className="text-left py-1">EU</th><th className="text-left py-1">Ayaq uzunluğu (sm)</th></tr></thead>
        <tbody>{CHART_SHOE.map(([eu, cm]) => <tr key={eu} className="border-t border-bdr"><td className="py-1 font-semibold">{eu}</td><td className="py-1 text-t2">{cm}</td></tr>)}</tbody></table></div>
    );
  }
  if (sizeSystem === 'TR') {
    return (
      <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-t3"><th className="text-left py-1">TR (rəqəm)</th><th className="text-left py-1">INT</th></tr></thead>
        <tbody>{CHART_TR_CLOTHING.map(([tr, int]) => <tr key={tr} className="border-t border-bdr"><td className="py-1 font-semibold">{tr}</td><td className="py-1 text-t2">{int}</td></tr>)}</tbody></table></div>
    );
  }
  const g = gender === 'Qadın' ? 'Qadın' : 'Kişi';
  return (
    <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-t3"><th className="text-left py-1">INT</th><th className="text-left py-1">Sinə (sm)</th><th className="text-left py-1">Bel (sm)</th></tr></thead>
      <tbody>{CHART_INT[g].map(([s, c, w]) => <tr key={s} className="border-t border-bdr"><td className="py-1 font-semibold">{s}</td><td className="py-1 text-t2">{c}</td><td className="py-1 text-t2">{w}</td></tr>)}</tbody></table>
      <p className="text-[11px] text-t3 mt-1">{g} INT cədvəli{gender === 'Uniseks' ? ' (uniseks — kişi cədvəli baza götürülür)' : ''}</p></div>
  );
}

export const Req = () => <span className="text-sale ml-0.5">*</span>;
export const FieldL = ({ label, req, children }: { label: string; req?: boolean; children?: React.ReactNode }) => (
  <label className="block"><span className="block text-xs font-semibold text-t2 mb-1">{label}{req && <Req />}</span>{children}</label>
);

export const APPROVAL: Record<string, { label: string; cls: string }> = { Pending: { label: 'Gözləyir', cls: 'bg-amber/10 text-amber' }, Approved: { label: 'Təsdiqli', cls: 'bg-green/10 text-green' }, Rejected: { label: 'Rədd edilib', cls: 'bg-sale/10 text-sale' } };

// ─────────────────────────  Xəritə + boş şablonlar  ─────────────────────────
const AZ_BOUNDS = [[38.3, 44.7], [41.95, 50.7]];
export const MAP_CENTER = { lat: 40.4093, lng: 49.8671 };
export function MapPicker({ onClose, onSelect, initial }: { onClose: () => void; onSelect: (v: LatLng & { addr: string }) => void; initial?: LatLng | null }) {
  const mapEl = useRef<HTMLDivElement>(null), mapRef = useRef<any>(null), markerRef = useRef<any>(null);
  const [coord, setCoord] = useState<LatLng>(initial && initial.lat ? { lat: initial.lat, lng: initial.lng } : MAP_CENTER);
  const [addr, setAddr] = useState(''), [loading, setLoading] = useState(false);
  const reverse = async (lat: number, lng: number) => {
    setLoading(true);
    try { const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&accept-language=az&lat=${lat}&lon=${lng}`); const d = await r.json(); setAddr(d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`); }
    catch { setAddr(`${lat.toFixed(5)}, ${lng.toFixed(5)}`); }
    setLoading(false);
  };
  useEffect(() => {
    if (!(window as any).L || !mapEl.current) return;
    const start = [coord.lat, coord.lng];
    const map = L.map(mapEl.current, { center: start, zoom: 12, maxBounds: AZ_BOUNDS, maxBoundsViscosity: 0.7, minZoom: 7 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
    const marker = L.marker(start, { draggable: true }).addTo(map);
    mapRef.current = map; markerRef.current = marker;
    const apply = (ll: LatLng) => { setCoord({ lat: ll.lat, lng: ll.lng }); reverse(ll.lat, ll.lng); };
    marker.on('dragend', () => apply(marker.getLatLng()));
    map.on('click', (e: any) => { marker.setLatLng(e.latlng); apply(e.latlng); });
    reverse(coord.lat, coord.lng);
    setTimeout(() => map.invalidateSize(), 120);
    return () => { map.remove(); mapRef.current = null; };
  }, []);
  const confirm = () => { onSelect({ ...coord, addr }); onClose(); };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-sheet shadow-pop w-full max-w-2xl overflow-hidden anim-pop">
        <div className="flex items-center justify-between px-5 py-4 border-b border-bdr"><h3 className="font-bold text-brand">📍 Mağaza məkanını xəritədən seç</h3><button className="text-t3 hover:text-brand text-xl leading-none" onClick={onClose}>✕</button></div>
        <div ref={mapEl} className="w-full h-72 sm:h-80 bg-bg2" style={{ zIndex: 0 }} />
        <div className="p-5 space-y-3">
          <div className="flex items-start gap-2 bg-bg2 rounded-card px-4 py-3"><span>📍</span><p className="text-sm text-brand flex-1 min-h-[20px]">{loading ? <span className="text-t3">Ünvan tapılır…</span> : (addr || 'Xəritəyə klikləyin və ya markeri sürüşdürün')}</p></div>
          <div className="text-xs text-t3 text-right">{coord.lat.toFixed(5)}, {coord.lng.toFixed(5)}</div>
          <div className="flex gap-2 justify-end"><Btn variant="ghost" onClick={onClose}>İmtina</Btn><Btn onClick={confirm}>Bu məkanı seç</Btn></div>
        </div>
      </div>
    </div>
  );
}

export const EMPTY_STORE: Store = { name: '', rating: 0, reviews: 0, products: 0, city: 'Bakı', established: 2020, address: '', logo: '', lat: null, lng: null };
export const EMPTY_COUPON: Coupon = { code: '', type: 'amount', value: 10, minOrder: 0, active: true, expiresAt: null, maxUses: null };
