/* Admin İdarə paneli — Apple-tipli detallı dashboard. */
import React from "react";
const { useState, useEffect, useCallback } = React;
import { money, date, statusLabel, STATUS_COLORS, Pill, useLive, fmt } from "./shared";
import { Ic } from "../lib/panelIcons";
import { StatTile, SectionCard, BarChart, HBar, Segmented } from "../lib/iosUi";
import type { ApiFn, ToastFn, Stats, Analytics, ActivityItem } from "./types";

const PERIODS: [string, string][] = [['7', '7 gün'], ['14', '14 gün'], ['30', '30 gün']];

export function Dashboard({ api }: { api: ApiFn; toast: ToastFn }) {
    const [s, setS] = useState<Stats | null>(null);
    const [a, setA] = useState<Analytics | null>(null);
    const [days, setDays] = useState('14');
    const [err, setErr] = useState('');
    const [feed, setFeed] = useState<ActivityItem[]>([]);
    const refresh = useCallback(() => {
      api<Stats>('/api/admin/stats').then(setS).catch((e) => setErr((e as Error).message));
      api<Analytics>(`/api/admin/analytics?days=${days}`).then(setA).catch(() => {});
      api<ActivityItem[]>('/api/admin/activity?limit=20').then(setFeed).catch(() => {});
    }, [api, days]);
    useEffect(() => { refresh(); }, [refresh]);
    useLive(refresh);

    if (err) return <div className="text-sale">{err}</div>;
    if (!s) return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skel h-28 rounded-sheet" />)}</div>
        <div className="skel h-64 rounded-sheet" />
      </div>
    );
    const c = s.counts;
    const dist = s.ordersByStatus || {};
    const distTotal = Object.values(dist).reduce((x, n) => x + n, 0) || 1;
    const STATUS_HEX: Record<string, string> = { 'Hazırlanır': '#E8A317', 'Hazırlandı': '#16A34A', 'Yolda': '#2F6BFF', 'Çatdırıldı': '#0F9D58', 'İptal': '#E53E3E' };
    const maxProd = a ? Math.max(1, ...a.topProducts.map((p) => p.units)) : 1;
    const maxCat = a ? Math.max(1, ...a.byCategory.map((c2) => c2.revenue)) : 1;
    const bars = a ? a.revenueByDay.map((d) => ({ label: d.day.slice(8), value: d.revenue, title: `${d.day}: ${money(d.revenue)} · ${d.orders} sifariş` })) : [];

    return (
      <div className="space-y-5 max-w-6xl">
        {/* Əsas KPI-lar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label="Platform gəlir" value={money(s.platformRevenue)} sub={`komissiya ${money(s.commission)} + çatdırılma ${money(s.deliveryRevenue)}`} tone="green" icon={<span className="font-bold">₼</span>} />
          <StatTile label="Ümumi satış" value={money(s.clothingSales)} sub="ümumi geyim satışı (GMV)" tone="blue" icon={<span className="font-bold">₼</span>} />
          <StatTile label="Sifarişlər" value={fmt(c.orders)} tone="blue" icon={<Ic.orders className="w-[18px] h-[18px]" />} />
          <StatTile label="İstifadəçilər" value={fmt(c.users)} tone="brand" icon={<Ic.users className="w-[18px] h-[18px]" />} />
          <StatTile label="Məhsullar" value={fmt(c.products)} tone="gray" icon={<Ic.products className="w-[18px] h-[18px]" />} />
          <StatTile label="Mağazalar" value={fmt(c.stores)} tone="gray" icon={<Ic.stores className="w-[18px] h-[18px]" />} />
          <StatTile label="Kateqoriyalar" value={fmt(c.categories)} tone="gray" icon={<Ic.categories className="w-[18px] h-[18px]" />} />
          <StatTile label="Rəylər" value={fmt(c.reviews)} tone="amber" icon={<Ic.reviews className="w-[18px] h-[18px]" />} />
          <StatTile label="Adminlər" value={fmt(c.admins)} tone="blue" icon={<Ic.users className="w-[18px] h-[18px]" />} />
        </div>

        {/* Gəlir trendi */}
        {a && (
          <SectionCard title="Gəlir trendi" sub={`Son ${days} gün`} action={<Segmented value={days} onChange={setDays} options={PERIODS} size="sm" />}>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div><div className="text-[11px] text-t3 uppercase tracking-wide">Satış gəliri</div><div className="text-xl font-bold text-green mt-0.5">{money(a.totalRevenue)}</div></div>
              <div><div className="text-[11px] text-t3 uppercase tracking-wide">Satılan ədəd</div><div className="text-xl font-bold text-brand mt-0.5">{fmt(a.totalUnits)}</div></div>
              <div><div className="text-[11px] text-t3 uppercase tracking-wide">Orta sifariş</div><div className="text-xl font-bold text-blue mt-0.5">{money(a.avgOrder)}</div></div>
            </div>
            <BarChart data={bars} color="#0A0A0A" height={170} />
          </SectionCard>
        )}

        {/* Top məhsul + kateqoriya */}
        {a && (
          <div className="grid md:grid-cols-2 gap-5">
            <SectionCard title="Ən çox satılan məhsullar">
              {a.topProducts.length === 0 ? <p className="text-t3 text-sm">Hələ satış yoxdur</p> : (
                <div className="space-y-3.5">{a.topProducts.map((p, i) => <HBar key={p.id} rank={i + 1} label={p.name} sub={`${p.units} ədəd · ${money(p.revenue)}`} value={p.units} max={maxProd} color="#2F6BFF" />)}</div>
              )}
            </SectionCard>
            <SectionCard title="Kateqoriya üzrə satış">
              {a.byCategory.length === 0 ? <p className="text-t3 text-sm">Hələ satış yoxdur</p> : (
                <div className="space-y-3.5">{a.byCategory.map((ct) => <HBar key={ct.category} label={ct.category} sub={money(ct.revenue)} value={ct.revenue} max={maxCat} color="#16A34A" />)}</div>
              )}
            </SectionCard>
          </div>
        )}

        {/* Sifariş statusları + son sifarişlər */}
        <div className="grid md:grid-cols-2 gap-5">
          <SectionCard title="Sifariş statusları" sub={`${distTotal} sifariş`}>
            {Object.keys(dist).length === 0 ? <p className="text-t3 text-sm">Sifariş yoxdur</p> : (
              <div className="space-y-3">
                <div className="flex h-2.5 rounded-full overflow-hidden bg-bg3">
                  {Object.entries(dist).map(([k, v]) => <div key={k} title={`${statusLabel(k)}: ${v}`} style={{ width: `${(v / distTotal) * 100}%`, background: STATUS_HEX[k] || '#C2C2C2' }} />)}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(dist).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-sm"><Pill className={STATUS_COLORS[k] || 'bg-bg3 text-t2'}>{statusLabel(k)}</Pill><span className="font-semibold text-brand">{v}</span></div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
          <SectionCard title="Son sifarişlər" bodyClass="!px-0">
            {s.recentOrders.length === 0 ? <p className="text-t3 text-sm px-5">Sifariş yoxdur</p> : (
              <div className="divide-y divide-bdr">
                {s.recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-3 px-5 py-2.5 min-h-[44px]">
                    <span className="font-medium text-sm">{o.orderNo}</span>
                    <div className="flex items-center gap-3"><span className="text-t2 text-sm">{money(o.total)}</span><Pill className={STATUS_COLORS[o.status] || 'bg-bg3 text-t2'}>{statusLabel(o.status)}</Pill></div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Az stok + son rəylər */}
        <div className="grid md:grid-cols-2 gap-5">
          <SectionCard title="Stok azalır" sub="≤ 10 ədəd" bodyClass="!px-0">
            {s.lowStock.length === 0 ? <p className="text-t3 text-sm px-5">Hamısı kafidir 👍</p> : (
              <div className="divide-y divide-bdr max-h-80 overflow-y-auto">
                {s.lowStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 px-5 py-2.5 min-h-[44px]">
                    <div className="min-w-0"><div className="font-medium text-sm truncate">{p.name}</div><div className="text-t3 text-xs truncate">{p.store}</div></div>
                    <Pill className={p.stock === 0 ? 'bg-sale/10 text-sale' : p.stock <= 5 ? 'bg-amber/10 text-amber' : 'bg-bg3 text-t2'}>{p.stock} ədəd</Pill>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
          <SectionCard title="Son rəylər" bodyClass="!px-0">
            {(!s.recentReviews || s.recentReviews.length === 0) ? <p className="text-t3 text-sm px-5">Hələ rəy yoxdur</p> : (
              <div className="divide-y divide-bdr">
                {s.recentReviews.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 px-5 py-2.5">
                    <span className="text-amber text-sm shrink-0">{'★'.repeat(r.rating)}<span className="text-bdr">{'★'.repeat(5 - r.rating)}</span></span>
                    <div className="min-w-0 flex-1"><div className="font-medium text-sm truncate">{r.productName} <span className="text-t3 font-normal">· {r.userName}</span></div>{r.comment && <div className="text-t2 text-xs truncate">{r.comment}</div>}</div>
                    <span className="text-t3 text-xs shrink-0">{date(r.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Aktivlik jurnalı (kim/nə vaxt/nə dəyişdi) */}
        <SectionCard title="Son aktivlik" sub="Platforma dəyişiklikləri" bodyClass="!px-0">
          {feed.length === 0 ? <p className="text-t3 text-sm px-5">Hələ aktivlik yoxdur</p> : (
            <div className="divide-y divide-bdr max-h-96 overflow-y-auto">
              {feed.map((f) => (
                <div key={f.id} className="flex items-start gap-3 px-5 py-2.5">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-bg2 text-t2 shrink-0 mt-0.5">{f.action}</span>
                  <div className="min-w-0 flex-1"><div className="text-sm text-brand truncate">{f.detail}</div><div className="text-t3 text-xs">{f.actorName}</div></div>
                  <span className="text-t3 text-xs shrink-0">{date(f.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    );
  }

export default Dashboard;
