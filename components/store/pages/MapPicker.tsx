/* MapPicker (Leaflet — Bakı daxili məkan seçimi). Checkout + Profile istifadə edir. */
import React from "react";
import { Ic } from '../shared';
import type { LatLng } from '../types';

const { useState, useEffect, useRef, useCallback } = React;

export const BAKU_CENTER = { lat: 40.4093, lng: 49.8671 };
const BAKU_BOUNDS = [[40.20, 49.60], [40.60, 50.20]]; // cənub-qərb / şimal-şərq künclər

export const MapPicker = ({ onClose, onSelect, initial }: { onClose: () => void; onSelect: (v: LatLng & { addr: string }) => void; initial: LatLng | null }) => {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const reverseCacheRef = useRef<Map<string, string>>(new Map());
  const reverseTimerRef = useRef<number | null>(null);
  const [coord,setCoord] = useState<LatLng>(initial?.lat ? { lat:initial.lat, lng:initial.lng } : BAKU_CENTER);
  const [addr,setAddr] = useState('');
  const [loading,setLoading] = useState(false);

  const reverse = useCallback((lat: number,lng: number) => {
    const key = `${lat.toFixed(5)}:${lng.toFixed(5)}`;
    const cached = reverseCacheRef.current.get(key);
    if (cached) {
      setAddr(cached);
      setLoading(false);
      return;
    }

    if (reverseTimerRef.current !== null) {
      window.clearTimeout(reverseTimerRef.current);
      reverseTimerRef.current = null;
    }

    setLoading(true);
    reverseTimerRef.current = window.setTimeout(async () => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&accept-language=az&lat=${lat}&lon=${lng}`);
        const d = await r.json();
        const address = d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        reverseCacheRef.current.set(key, address);
        if (reverseCacheRef.current.size > 200) {
          const firstKey = reverseCacheRef.current.keys().next().value;
          if (firstKey) reverseCacheRef.current.delete(firstKey);
        }
        setAddr(address);
      } catch {
        const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        reverseCacheRef.current.set(key, fallback);
        setAddr(fallback);
      } finally {
        setLoading(false);
      }
    }, 500);
  }, []);

  const [leafletReady, setLeafletReady] = useState(typeof window !== "undefined" && !!(window as any).L);

  useEffect(() => {
    if (leafletReady) return;
    const interval = setInterval(() => {
      if ((window as any).L) {
        setLeafletReady(true);
        clearInterval(interval);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [leafletReady]);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapEl.current) return;
    const start = [coord.lat, coord.lng];
    const map = L.map(mapEl.current, { center: start, zoom: 13, maxBounds: BAKU_BOUNDS, maxBoundsViscosity: 0.9, minZoom: 11 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
    const marker = L.marker(start, { draggable: true }).addTo(map);
    mapRef.current = map; markerRef.current = marker;

    const apply = (latlng: { lat: number; lng: number }) => { setCoord({ lat: latlng.lat, lng: latlng.lng }); reverse(latlng.lat, latlng.lng); };
    marker.on('dragend', () => apply(marker.getLatLng()));
    map.on('click', (e: any) => { marker.setLatLng(e.latlng); apply(e.latlng); });

    reverse(coord.lat, coord.lng);
    setTimeout(() => map.invalidateSize(), 120);
    return () => {
      if (reverseTimerRef.current !== null) {
        window.clearTimeout(reverseTimerRef.current);
        reverseTimerRef.current = null;
      }
      map.remove(); mapRef.current = null;
    };
  // eslint-disable-next-line
  }, [leafletReady]);

  const useMyLocation = () => {
    if(!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos=>{
      const { latitude:lat, longitude:lng } = pos.coords;
      // yalnız Bakı sərhədləri daxilindədirsə tətbiq et
      if(lat<BAKU_BOUNDS[0][0]||lat>BAKU_BOUNDS[1][0]||lng<BAKU_BOUNDS[0][1]||lng>BAKU_BOUNDS[1][1]) return;
      mapRef.current?.setView([lat,lng],16); markerRef.current?.setLatLng([lat,lng]);
      setCoord({lat,lng}); reverse(lat,lng);
    });
  };

  const confirm = () => { onSelect({ ...coord, addr }); onClose(); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-sheet2 shadow-pop w-full max-w-2xl overflow-hidden anim-pop">
        <div className="flex items-center justify-between px-5 py-4 border-b border-bdr">
          <div className="flex items-center gap-2"><Ic.MapPin className="w-5 h-5 text-brand"/><h3 className="font-bold text-brand">Xəritədən məkan seç</h3></div>
          <button className="text-t3 hover:text-brand transition-colors" onClick={onClose}><Ic.X className="w-5 h-5"/></button>
        </div>
        <div ref={mapEl} className="w-full h-72 sm:h-80 bg-bg2" style={{ zIndex:0 }}/>
        <div className="p-5 space-y-3">
          <div className="flex items-start gap-2 bg-bg2 rounded-card px-4 py-3">
            <Ic.MapPin className="w-4 h-4 text-t2 shrink-0 mt-0.5"/>
            <p className="text-sm text-brand flex-1 min-h-[20px]">{loading ? <span className="text-t3">Ünvan tapılır…</span> : (addr || 'Xəritəyə klikləyin və ya markeri sürüşdürün')}</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center justify-center gap-1.5 border border-bdr text-brand px-4 py-2.5 rounded-btn text-sm font-semibold hover:border-bdr-s transition-colors" onClick={useMyLocation}><Ic.GPS className="w-4 h-4"/>Mənim yerləşdiyim</button>
            <button className="flex-1 bg-brand text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-brand-h transition-all active:scale-[0.98] disabled:opacity-60" disabled={loading} onClick={confirm}>Seç</button>
          </div>
        </div>
      </div>
    </div>
  );
};
