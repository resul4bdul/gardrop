/* Analitika — Merchant dashboard (blue). KPI + satış qrafiki + top məhsul + son sifariş/rəy + az stok. */
import React from "react";
const { useState, useEffect, useCallback } = React;
import { money, date, useLive, resolveImg } from "./shared";
import { Ic } from "../lib/panelIcons";
import { BarChart } from "../lib/iosUi";
import { StatCard, SectionCard, Th, Td, Badge, Avatar, Segmented, EmptyState, STATUS_COLOR, Skeleton } from "./ui";
import type { ApiFn, Store, Analytics, Dashboard as DashboardData } from "./types";

const PERIODS: [string, string][] = [['today', 'Bugün'], ['7', 'Son 7 gün'], ['30', 'Son 30 gün'], ['12m', 'Son 12 ay']];
const openProduct = (id?: number) => { if (id != null) window.open(`/product/${id}`, '_blank'); };

export function Dashboard({ api, store }: { api: ApiFn; store: Store }) {
  const [d, setD] = useState<DashboardData | null>(null);
  const [a, setA] = useState<Analytics | null>(null);
  const [period, setPeriod] = useState('30');
  const refresh = useCallback((silent?: boolean) => {
    if (!silent) { setD(null); setA(null); }
    api<DashboardData>(`/api/store/${store.id}/dashboard`).then(setD).catch(() => {});
    api<Analytics>(`/api/store/${store.id}/analytics?days=30`).then(setA).catch(() => {});
  }, [api, store.id]);
  useEffect(() => { refresh(); }, [refresh]);
  useLive(useCallback(() => refresh(true), [refresh]));

  if (!d) return (
    <div className="space-y-5 max-w-6xl">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[0, 1, 2, 3, 4, 5, 6, 7].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
  const k = d.kpis || { todaySales: 0, monthSales: 0, totalSales: d.revenue || 0, todayOrders: 0, activeProducts: d.counts?.products || 0, soldUnits: 0, pendingOrders: 0, avgOrder: 0 };
  const recentOrders = d.recentOrders || [];
  const recentReviews = d.recentReviews || [];
  const src = period === '12m' ? (a?.revenueByMonth || []) : (a?.revenueByDay || []).slice(period === 'today' ? -1 : period === '7' ? -7 : -30);
  const bars = src.map(x => ({ label: period === '12m' ? x.day.slice(5) : x.day.slice(8), value: x.revenue, title: `${x.day}: ${money(x.revenue)} · ${x.orders} sifariş` }));
  const periodRevenue = src.reduce((s, x) => s + x.revenue, 0);
  const periodOrders = src.reduce((s, x) => s + x.orders, 0);
  const maxTop = a ? Math.max(1, ...a.topProducts.map(p => p.units)) : 1;

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Bugünkü satış — hero (panelə girən kimi ilk görünən; komissiya çıxılmış xalis) */}
      <div className="rounded-2xl bg-emerald-600 text-white p-5 sm:p-6 shadow-sm flex items-end justify-between gap-4">
        <div>
          <div className="text-emerald-50/90 text-sm font-medium">Bugünkü satış</div>
          <div className="text-3xl sm:text-4xl font-bold tracking-tight mt-1">{money(k.todaySales)}</div>
          <div className="text-emerald-50/80 text-xs mt-1.5">Komissiya çıxılmış xalis məbləğ · bu gün {k.todayOrders} sifariş</div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-emerald-50/80 text-xs">Bu ay</div>
          <div className="text-xl font-semibold">{money(k.monthSales)}</div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Bugünkü satış" value={money(k.todaySales)} />
        <StatCard label="Bu ay satış" value={money(k.monthSales)} />
        <StatCard label="Ümumi satış" value={money(k.totalSales)} />
        <StatCard label="Bugünkü sifariş" value={k.todayOrders} />
        <StatCard label="Aktiv məhsullar" value={k.activeProducts} />
        <StatCard label="Satılmış məhsullar" value={k.soldUnits} />
        <StatCard label="Gözləyən sifarişlər" value={k.pendingOrders} />
        <StatCard label="Orta sifariş məbləği" value={money(k.avgOrder)} />
      </div>

      {/* Satış qrafiki */}
      <SectionCard title="Satış qrafiki" action={<Segmented value={period} onChange={setPeriod} options={PERIODS} />}>
        <div className="flex gap-6 mb-5">
          <div><div className="text-[11px] text-slate-400 uppercase tracking-wide">Satış məbləği</div><div className="text-xl font-bold text-slate-900 mt-0.5">{money(periodRevenue)}</div></div>
          <div><div className="text-[11px] text-slate-400 uppercase tracking-wide">Sifariş sayı</div><div className="text-xl font-bold text-emerald-600 mt-0.5">{periodOrders}</div></div>
        </div>
        {bars.length ? <BarChart data={bars} color="#0B8457" height={180} /> : <p className="text-slate-400 text-sm py-8 text-center">Bu dövrdə satış yoxdur</p>}
      </SectionCard>

      {/* Ən çox satılan */}
      <SectionCard title="Ən çox satılan məhsullar" bodyClass="!p-0">
        {!a || a.topProducts.length === 0 ? <div className="p-5"><EmptyState icon={<Ic.products className="w-6 h-6" />} title="Hələ satış yoxdur" /></div> : (
          <table className="w-full">
            <thead><tr className="border-b border-slate-100"><Th>Məhsul</Th><Th className="text-right">Satış</Th><Th className="text-right">Gəlir</Th></tr></thead>
            <tbody>
              {a.topProducts.map(p => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => openProduct(p.id)}>
                  <Td><div className="flex items-center gap-3"><Avatar name={p.name} src={resolveImg(p.image)} className="w-10 h-10 rounded-xl" /><span className="font-medium text-slate-900 truncate">{p.name}</span></div></Td>
                  <Td className="text-right">
                    <div className="inline-flex flex-col items-end"><span className="font-semibold">{p.units}</span>
                      <span className="block w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1"><span className="block h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(6, (p.units / maxTop) * 100)}%` }} /></span></div>
                  </Td>
                  <Td className="text-right font-semibold text-slate-900">{money(p.revenue)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Son sifarişlər */}
        <SectionCard title="Son sifarişlər" bodyClass="!p-0">
          {recentOrders.length === 0 ? <div className="p-5"><EmptyState icon={<Ic.orders className="w-6 h-6" />} title="Sifariş yoxdur" /></div> : (
            <table className="w-full">
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id} className="border-b border-slate-50 last:border-0">
                    <Td><div className="font-semibold text-slate-900">{o.orderNo}</div><div className="text-xs text-slate-400">{o.customer || '—'} · {date(o.createdAt)}</div></Td>
                    <Td className="text-right"><Badge color={STATUS_COLOR[o.status] || 'slate'}>{o.status}</Badge></Td>
                    <Td className="text-right font-semibold">{money(o.amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>

        {/* Bitmək üzrə olan məhsullar */}
        <SectionCard title="Bitmək üzrə məhsullar" sub="Stok 5-dən az" bodyClass="!p-0">
          {(!d.lowStock || d.lowStock.length === 0) ? <div className="p-5"><EmptyState icon={<Ic.products className="w-6 h-6" />} title="Stok kifayətdir 👍" /></div> : (
            <table className="w-full">
              <tbody>
                {d.lowStock.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => openProduct(p.id)}>
                    <Td className="font-medium text-slate-900 truncate">{p.name}</Td>
                    <Td className="text-right"><Badge color={p.stock <= 2 ? 'red' : 'amber'}>{p.stock} ədəd</Badge></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      </div>

      {/* Son rəylər */}
      <SectionCard title="Son rəylər" bodyClass="!p-0">
        {recentReviews.length === 0 ? <div className="p-5"><EmptyState icon={<Ic.reviews className="w-6 h-6" />} title="Hələ rəy yoxdur" /></div> : (
          <div className="divide-y divide-slate-50">
            {recentReviews.map((r, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3">
                <Avatar name={r.userName} className="w-9 h-9" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="font-semibold text-slate-900 text-sm">{r.userName}</span><span className="text-amber-500 text-sm">{'★'.repeat(r.rating)}<span className="text-slate-200">{'★'.repeat(5 - r.rating)}</span></span></div>
                  <div className="text-xs text-slate-400">{r.productName} · {date(r.createdAt)}</div>
                  {r.comment && <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default Dashboard;
