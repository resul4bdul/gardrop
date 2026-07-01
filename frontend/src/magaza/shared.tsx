/* Mağaza paneli ortaq qatı (fayllara bölmə): API, atoms, sabitlər, MapPicker, NotificationBell. */
import React from "react";
import type { ApiFn, ToastState, StoreNotification, LatLng } from "./types";
declare const L: any;

const { useState, useEffect, useCallback, useRef } = React;

export const API = location.origin.startsWith('http') ? location.origin : 'http://localhost:3001';
export const TKEY = 'gd_store_token';

  // Marka əsaslı ölçü davranışı (backend SizeEngine.BrandProfiles ilə eyni).
export const BRAND_PROFILES: Record<string, string> = {
    zara: 'RunsSmall', bershka: 'RunsSmall', pullbear: 'RunsSmall', stradivarius: 'RunsSmall', massimodutti: 'RunsSmall', oysho: 'RunsSmall',
    mango: 'RunsSmall', hm: 'RunsSmall', asos: 'RunsSmall', levis: 'RunsSmall', pingo: 'RunsSmall',
    lcwaikiki: 'Standard', lcw: 'Standard', defacto: 'Standard', mavi: 'Standard', colins: 'Standard', kigili: 'Standard',
    koton: 'RunsLarge', gap: 'RunsLarge', uspoloassn: 'RunsLarge',
    nike: 'Standard', adidas: 'Standard', puma: 'Standard',
  };
export const brandBehavior = (brand?: string): string => {
    if (!brand) return 'Standard';
    return BRAND_PROFILES[String(brand).toLowerCase().replace(/[^a-z0-9]/g, '')] || 'Standard';
  };

  // Realtime: səssiz yeniləmə — pəncərə fokuslananda + hər 15 saniyədə (loader göstərmədən).
export function useLive(refresh: () => void) {
    useEffect(() => {
      const tick = () => { if (!document.hidden) refresh(); };
      const t = setInterval(tick, 15000);
      window.addEventListener('focus', tick);
      document.addEventListener('visibilitychange', tick);
      return () => { clearInterval(t); window.removeEventListener('focus', tick); document.removeEventListener('visibilitychange', tick); };
    }, [refresh]);
  }

  // Azərbaycan sərhədləri (xəritə üçün) — mağazalar bütün ölkədə ola bilər
export const AZ_BOUNDS = [[38.3, 44.7], [41.95, 50.7]];
export const DEFAULT_CENTER = { lat: 40.4093, lng: 49.8671 }; // Bakı

export function useApi(token: string | null, onAuthFail?: () => void): ApiFn {
    return useCallback(async <T = unknown>(path: string, opts: RequestInit = {}): Promise<T> => {
      const res = await fetch(API + path, {
        ...opts,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(opts.headers || {}) },
      });
      if (res.status === 401) { onAuthFail && onAuthFail(); throw new Error('Yetki yoxdur'); }
      const txt = await res.text();
      const data = txt ? JSON.parse(txt) : null;
      if (!res.ok) throw new Error((data && data.error) || 'Xəta baş verdi');
      return data as T;
    }, [token, onAuthFail]);
  }

export async function uploadFilesStore(files: FileList | File[] | null): Promise<string[]> {
    if (!files || !files.length) return [];
    const token = localStorage.getItem(TKEY);
    const fd = new FormData();
    Array.from(files).slice(0, 8).forEach((f) => fd.append('files', f));
    const r = await fetch(API + '/api/upload', { method: 'POST', headers: token ? { Authorization: 'Bearer ' + token } : {}, body: fd });
    const d = await r.json();
    if (!r.ok) throw new Error((d && d.error) || 'Yükləmə xətası');
    return Array.isArray(d.urls) ? d.urls : [];
  }

// Köhnə məlumatda şəkil URL-i mütləq host ilə saxlanıb ("http://localhost:3001/uploads/..").
// /uploads/ qarşısındakı origin-i atıb nisbi yola çeviririk → tunel/telefonda da işləyir.
export const resolveImg = (s?: string | null): string | undefined =>
  s ? s.replace(/^https?:\/\/[^/]+(\/uploads\/)/i, '$1') : (s || undefined);

// Mağaza logosu / placeholder — hər yerdə eyni görünüş.
export const StoreAvatar = ({ name, logo, className = 'w-9 h-9' }: { name?: string; logo?: string; className?: string }) => (
  <div className={`${className} rounded-full bg-bg2 border border-bdr overflow-hidden grid place-items-center shrink-0 font-bold text-t2`}>
    {logo ? <img src={resolveImg(logo)} alt={name || ''} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <span>{(name || '?')[0]}</span>}
  </div>
);

// Rəngli statistika kartı (Dashboard).
export const StatCard = ({ label, value, icon, tone = 'brand' }: { label: string; value: React.ReactNode; icon?: React.ReactNode; tone?: 'brand' | 'green' | 'blue' | 'amber' }) => {
  const tones: Record<string, string> = { brand: 'bg-brand/5 text-brand', green: 'bg-green/10 text-green', blue: 'bg-blue/10 text-blue', amber: 'bg-amber/10 text-amber' };
  return (
    <div className="bg-white border border-bdr rounded-card p-4 shadow-xs">
      {icon && <div className={`w-9 h-9 rounded-btn grid place-items-center text-lg mb-2.5 ${tones[tone]}`}>{icon}</div>}
      <div className="text-xs text-t3">{label}</div>
      <div className="text-xl font-bold text-brand mt-0.5 leading-tight">{value}</div>
    </div>
  );
};

export const fmt = (n: number) => new Intl.NumberFormat('az-AZ').format(Math.round((n || 0) * 100) / 100);
export const money = (n: number) => fmt(n) + ' ₼';
export const date = (s: string) => { try { return new Date(s).toLocaleString('az-AZ', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return s; } };
export const round2 = (n: number) => Math.round(n * 100) / 100;

export const STATUSES = ['Hazırlanır', 'Hazırlandı', 'Yolda', 'Çatdırıldı', 'İptal'];
export const STATUS_BG: Record<string, string> = { 'Hazırlanır': '#FEF3C7', 'Hazırlandı': '#CCFBF1', 'Yolda': '#DBEAFE', 'Çatdırıldı': '#DCFCE7', 'İptal': '#FEE2E2' };
export const STATUS_FG: Record<string, string> = { 'Hazırlanır': '#92400E', 'Hazırlandı': '#0F766E', 'Yolda': '#1E40AF', 'Çatdırıldı': '#166534', 'İptal': '#B91C1C' };
  // İptal müştəriyə/satıcıya "Ləğv edildi" kimi göstərilir (daxili dəyər "İptal" qalır).
export const STATUS_LABEL: Record<string, string> = { 'İptal': 'Ləğv edildi' };
export const statusLabel = (s: string) => STATUS_LABEL[s] || s;
  // Mağaza yalnız "Hazırlandı" işarələyə və ya sifarişi ləğv edə bilər.
export const STORE_CAN_EDIT = ['Hazırlanır', 'Hazırlandı'];

  // Məhsul təsdiq statusu (admin nəzarəti)
export const APPROVAL: Record<string, { label: string; bg: string; fg: string }> = {
    Pending: { label: 'Gözləyir', bg: '#FEF3C7', fg: '#92400E' },
    Approved: { label: 'Təsdiqli', bg: '#DCFCE7', fg: '#166534' },
    Rejected: { label: 'Rədd edilib', bg: '#FEE2E2', fg: '#B91C1C' },
  };

  // Ekspress sifariş üçün 30 dəqiqəlik geri sayım (mağazanın hazırlamaq vaxtı)
export function ExpressTimer({ since }: { since: string }) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
    const deadline = new Date(since).getTime() + 30 * 60 * 1000;
    const left = Math.max(0, deadline - now);
    const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
    const over = left === 0;
    return (
      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: over ? '#FEE2E2' : '#FEF3C7', color: over ? '#B91C1C' : '#92400E' }}>
        {over ? '⏰ Vaxt bitdi' : `⏱ ${m}:${String(s).padStart(2, '0')}`}
      </span>
    );
  }

export const SIZE_SETS = { INT: ['XS','S','M','L','XL','XXL'], TR_CLOTHING: ['36','38','40','42','44','46','48'], TR_SHOE: ['39','40','41','42','43','44','45'] };
export const sizeOptionsFor = (system?: string, category?: string) => system === 'TR' ? (category === 'Ayaqqabı' ? SIZE_SETS.TR_SHOE : SIZE_SETS.TR_CLOTHING) : SIZE_SETS.INT;

  // ───────────────────────── UI atoms ─────────────────────────
export const SELECT_CLS = 'w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm';
export const Spin = ({ cls = 'w-4 h-4' }: { cls?: string }) => <span className={`inline-block ${cls} border-2 border-t-transparent border-current rounded-full animate-spin`} />;

  type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' };
export const Btn = ({ children, variant = 'primary', className = '', ...p }: BtnProps) => {
    const base = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-btn px-3.5 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed';
    const styles = { primary: 'bg-blue text-white hover:bg-blue-700', ghost: 'bg-white border border-bdr text-brand hover:bg-bg2', danger: 'bg-sale/10 text-sale hover:bg-sale/20' };
    return <button className={`${base} ${styles[variant]} ${className}`} {...p}>{children}</button>;
  };
export const Card = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => <div className={`bg-white border border-bdr rounded-sheet shadow-xs overflow-x-auto ${className}`}>{children}</div>;
export const Th = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => <th className={`text-left text-xs font-semibold text-t2 uppercase tracking-wide px-4 py-3 ${className}`}>{children}</th>;
export const Td = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>;
export const Field = ({ label, className = '', ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold text-t2 mb-1">{label}</span>
      <input className="w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm" {...p} />
    </label>
  );
export const TableSkeleton = ({ cols }: { cols: number }) => (
    <tbody>{[0,1,2,3].map(r => <tr key={r} className="border-t border-bdr">{Array.from({length:cols}).map((_,c)=><td key={c} className="px-4 py-3"><div className="skel h-4 w-full" /></td>)}</tr>)}</tbody>
  );
export const EmptyRow = ({ cols, text }: { cols: number; text: string }) => <tbody><tr><td colSpan={cols} className="px-4 py-10 text-center text-t3 text-sm">{text}</td></tr></tbody>;
export const Toolbar = ({ onAdd, addLabel, children }: { onAdd?: () => void; addLabel?: string; children?: React.ReactNode }) => (
    <div className="flex flex-wrap items-center gap-2 mb-4">{children}<div className="ml-auto" />{onAdd && <Btn onClick={onAdd}>＋ {addLabel}</Btn>}</div>
  );
export function Modal({ title, onClose, children, wide }: { title: React.ReactNode; onClose: () => void; children?: React.ReactNode; wide?: boolean }) {
    const [dragY, setDragY] = useState(0);
    const startY = useRef<number | null>(null);
    const onTS = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
    const onTM = (e: React.TouchEvent) => { if (startY.current == null) return; const dy = e.touches[0].clientY - startY.current; if (dy > 0) setDragY(dy); };
    const onTE = () => { if (dragY > 90) onClose(); else setDragY(0); startY.current = null; };
    return (
      <div className="fixed inset-0 z-[80]">
        <div className="absolute inset-0 bg-brand/40 backdrop-blur-sm anim-fade" onMouseDown={onClose} />
        <div className="absolute inset-0 overflow-y-auto flex items-end sm:items-start justify-center sm:p-8" onMouseDown={onClose}>
          <div className={`relative bg-white shadow-pop w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} rounded-t-sheet2 sm:rounded-sheet2 anim-sheet sm:anim-pop flex flex-col max-h-[92dvh] sm:max-h-[calc(100dvh-4rem)] sm:my-4`}
            style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
            onMouseDown={(e) => e.stopPropagation()}>
            <div className="shrink-0 touch-none" onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}>
              <div className="sm:hidden pt-2.5 pb-1 flex justify-center"><div className="w-10 h-1.5 rounded-full bg-bdr-s" /></div>
              <div className="flex items-center justify-between px-5 py-4 border-b border-bdr">
                <h3 className="font-bold text-brand">{title}</h3>
                <button className="w-8 h-8 grid place-items-center rounded-full bg-bg2 hover:bg-bg3 text-t2 text-lg leading-none" onClick={onClose}>✕</button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto">{children}</div>
          </div>
        </div>
      </div>
    );
  }
export function Confirm({ text, onYes, onNo }: { text: string; onYes: () => void; onNo: () => void }) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-brand/40 backdrop-blur-sm" onClick={onNo} />
        <div className="relative bg-white rounded-sheet shadow-pop w-full max-w-sm p-6 anim-pop text-center">
          <p className="text-brand font-medium mb-5">{text}</p>
          <div className="flex gap-2 justify-center"><Btn variant="ghost" onClick={onNo}>İmtina</Btn><Btn variant="danger" onClick={onYes}>Bəli, sil</Btn></div>
        </div>
      </div>
    );
  }
export function Toast({ toast }: { toast: ToastState | null }) {
    if (!toast) return null;
    const bg = toast.kind === 'error' ? '#E53E3E' : '#0A0A0A';
    return <div className="fixed bottom-5 right-5 z-[200] anim-pop"><div className="text-white text-sm font-medium px-4 py-2.5 rounded-btn shadow-pop" style={{ background: bg }}>{toast.msg}</div></div>;
  }

  // ───────────────────────── Map picker ─────────────────────────
export function MapPicker({ onClose, onSelect, initial }: { onClose: () => void; onSelect: (v: LatLng & { addr: string }) => void; initial?: LatLng | null }) {
    const mapEl = useRef<HTMLDivElement>(null), mapRef = useRef<any>(null), markerRef = useRef<any>(null);
    const [coord, setCoord] = useState<LatLng>(initial && initial.lat ? { lat: initial.lat, lng: initial.lng } : DEFAULT_CENTER);
    const [addr, setAddr] = useState(''); const [loading, setLoading] = useState(false);
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
    const useMyLocation = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        mapRef.current && mapRef.current.setView([lat, lng], 15);
        markerRef.current && markerRef.current.setLatLng([lat, lng]);
        setCoord({ lat, lng }); reverse(lat, lng);
      });
    };
    const confirm = () => { onSelect({ ...coord, addr }); onClose(); };
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-brand/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-sheet shadow-pop w-full max-w-2xl overflow-hidden anim-pop">
          <div className="flex items-center justify-between px-5 py-4 border-b border-bdr">
            <h3 className="font-bold text-brand">📍 Mağaza məkanını xəritədən seç</h3>
            <button className="text-t3 hover:text-brand text-xl leading-none" onClick={onClose}>✕</button>
          </div>
          <div ref={mapEl} className="w-full h-72 sm:h-80 bg-bg2" style={{ zIndex: 0 }} />
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-2 bg-bg2 rounded-card px-4 py-3">
              <span>📍</span>
              <p className="text-sm text-brand flex-1 min-h-[20px]">{loading ? <span className="text-t3">Ünvan tapılır…</span> : (addr || 'Xəritəyə klikləyin və ya markeri sürüşdürün')}</p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <button className="text-sm text-blue hover:underline" onClick={useMyLocation}>📡 Cari yerimi tap</button>
              <div className="text-xs text-t3">{coord.lat.toFixed(5)}, {coord.lng.toFixed(5)}</div>
            </div>
            <div className="flex gap-2 justify-end">
              <Btn variant="ghost" onClick={onClose}>İmtina</Btn>
              <Btn onClick={confirm}>Bu məkanı seç</Btn>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────── Notifications ─────────────────────────
export function NotificationBell({ api }: { api: ApiFn }) {
    const [data, setData] = useState<{ unread: number; items: StoreNotification[] }>({ unread: 0, items: [] });
    const [open, setOpen] = useState(false);
    const load = useCallback(() => { api<{ unread: number; items: StoreNotification[] }>('/api/notifications').then(setData).catch(() => {}); }, [api]);
    useEffect(() => { load(); const i = setInterval(() => { if (!document.hidden) load(); }, 20000); return () => clearInterval(i); }, [load]);
    const markAll = async () => { try { await api('/api/notifications/read', { method: 'POST' }); load(); } catch {} };
    const NIC: Record<string, string> = { success: '✅', error: '⛔', order: '📦', info: 'ℹ️' };
    return (
      <div className="relative">
        <button onClick={() => { setOpen(o => !o); if (!open && data.unread) markAll(); }} className="relative w-10 h-10 rounded-btn hover:bg-bg2 flex items-center justify-center text-xl">
          🔔
          {data.unread > 0 && <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-sale text-white text-[10px] font-bold rounded-full flex items-center justify-center">{data.unread}</span>}
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 mt-1 w-80 max-h-96 overflow-y-auto bg-white border border-bdr rounded-card shadow-pop z-50 anim-pop">
              <div className="px-4 py-2.5 border-b border-bdr flex items-center justify-between sticky top-0 bg-white"><span className="font-bold text-sm">Bildirişlər</span>{data.items.length > 0 && <button onClick={markAll} className="text-xs text-blue hover:underline">Hamısını oxu</button>}</div>
              {data.items.length === 0 ? <div className="px-4 py-8 text-center text-t3 text-sm">Bildiriş yoxdur</div> : (
                <div>{data.items.map(n => (
                  <div key={n.id} className={`px-4 py-3 border-b border-bdr last:border-0 ${n.read ? '' : 'bg-bg2/60'}`}>
                    <div className="flex items-start gap-2">
                      <span className="shrink-0">{NIC[n.type] || 'ℹ️'}</span>
                      <div className="min-w-0"><p className="text-sm font-semibold text-brand">{n.title}</p><p className="text-xs text-t2 leading-snug">{n.body}</p><p className="text-[10px] text-t3 mt-0.5">{date(n.createdAt)}</p></div>
                    </div>
                  </div>
                ))}</div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }
