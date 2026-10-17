/* Ödənişlər — maliyyə icmalı (FAZA 5). Real net/komissiya aqreqatı (/finance) + payout settlement.
   Balans = ümumi net − ödənilmiş cəm. Çıxarış (bank) ayarlardan; ödəniş tarixçəsi admin qeydlərindən. */
import React from "react";
const { useState, useEffect, useCallback } = React;
import { money, useLive } from "./shared";
import { Ic } from "../lib/panelIcons";
import { StatCard, SectionCard, EmptyState, Badge } from "./ui";
import type { ApiFn, Store, StoreFinance, StoreSettings } from "./types";

const monthLabel = (m: string) => { const [y, mo] = m.split('-'); return `${mo}/${y.slice(2)}`; };
const dateLabel = (s?: string | null) => s ? new Date(s).toLocaleDateString('az') : '—';

export function Payments({ api, store }: { api: ApiFn; store: Store }) {
  const [fin, setFin] = useState<StoreFinance | null>(null);
  const [bank, setBank] = useState<StoreSettings | null>(null);
  const refresh = useCallback(() => {
    api<StoreFinance>(`/api/store/${store.id}/finance`).then(setFin).catch(() => {});
  }, [api, store.id]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { api<StoreSettings>(`/api/store/${store.id}/settings`).then(setBank).catch(() => {}); }, [api, store.id]);
  useLive(refresh);

  const monthly = fin?.monthly ?? [];
  const maxGross = Math.max(1, ...monthly.map(m => m.gross));
  const hasData = monthly.some(m => m.gross > 0);
  const report = fin?.commissionReport ?? [];

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Cari balans" value={money(fin?.currentBalance ?? 0)} icon={<Ic.wallet className="w-[18px] h-[18px]" />} />
        <StatCard label="Bu ay qazanc" value={money(fin?.monthEarnings ?? 0)} icon={<span className="font-bold">₼</span>} />
        <StatCard label="Ümumi qazanc" value={money(fin?.totalEarnings ?? 0)} icon={<Ic.analytics className="w-[18px] h-[18px]" />} />
        <StatCard label="Platforma komissiyası" value={money(fin?.platformCommission ?? 0)} hint={fin ? `brut ${money(fin.grossTotal)}` : undefined} icon={<Ic.coupons className="w-[18px] h-[18px]" />} />
        <StatCard label="Gözləyən ödəniş" value={money(fin?.pendingPayout ?? 0)} icon={<Ic.orders className="w-[18px] h-[18px]" />} />
      </div>

      <SectionCard title="Maliyyə qrafiki" sub="Son 12 ay: brut satış → komissiya + xalis qazanc">
        {!fin ? <div className="h-44 skel rounded-card" /> : !hasData ? (
          <EmptyState icon={<Ic.analytics className="w-6 h-6" />} title="Hələ satış yoxdur"
            desc="İlk satışdan sonra aylıq brut/komissiya/xalis qrafiki burada görünəcək." />
        ) : (
          <>
            <div className="flex items-end gap-1.5 h-44 pt-2">
              {monthly.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${monthLabel(m.month)} — brut ${money(m.gross)}, komissiya ${money(m.commission)}, xalis ${money(m.net)}`}>
                  <div className="w-full flex flex-col justify-end" style={{ height: '150px' }}>
                    <div className="w-full rounded-t bg-sale/70" style={{ height: `${(m.commission / maxGross) * 100}%` }} />
                    <div className="w-full bg-blue" style={{ height: `${(m.net / maxGross) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-t3 truncate w-full text-center">{monthLabel(m.month)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-t2">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue inline-block" /> Xalis qazanc</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-sale/70 inline-block" /> Platforma komissiyası</span>
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard title="Komissiya hesabatı" sub="Kateqoriya üzrə platforma payı (brut satışdan)">
        {!fin ? <div className="h-32 skel rounded-card" /> : report.length === 0 ? (
          <EmptyState icon={<Ic.coupons className="w-6 h-6" />} title="Hələ məlumat yoxdur"
            desc="Satış başladıqca kateqoriya üzrə komissiya bölgüsü burada görünəcək." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="text-left text-t3 border-b border-bdr">
                <th className="py-2 font-medium">Kateqoriya</th><th className="py-2 font-medium text-right">Komissiya %</th>
                <th className="py-2 font-medium text-right">Satış sayı</th><th className="py-2 font-medium text-right">Brut</th>
                <th className="py-2 font-medium text-right">Komissiya</th><th className="py-2 font-medium text-right">Xalis</th>
              </tr></thead>
              <tbody>
                {report.map((r) => (
                  <tr key={r.category} className="border-b border-bdr last:border-0">
                    <td className="py-2 font-medium text-brand">{r.category}</td>
                    <td className="py-2 text-right text-t2">{r.percent}%</td>
                    <td className="py-2 text-right text-t2">{r.units}</td>
                    <td className="py-2 text-right text-t2">{money(r.gross)}</td>
                    <td className="py-2 text-right text-sale font-medium">{money(r.commission)}</td>
                    <td className="py-2 text-right text-brand font-semibold">{money(r.net)}</td>
                  </tr>
                ))}
                <tr className="bg-bg2 font-semibold">
                  <td className="py-2 px-1 text-brand">Cəmi</td><td></td>
                  <td className="py-2 text-right">{report.reduce((a, r) => a + r.units, 0)}</td>
                  <td className="py-2 text-right">{money(fin.grossTotal)}</td>
                  <td className="py-2 text-right text-sale">{money(fin.platformCommission)}</td>
                  <td className="py-2 text-right text-brand">{money(fin.totalEarnings)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Çıxarış (bank) məlumatları — ayarlardan oxunur. */}
      <SectionCard title="Çıxarış məlumatları" sub="Ödənişlər bu hesaba köçürülür">
        {bank && (bank.bankName || bank.iban || bank.beneficiary) ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[['Bank', bank.bankName], ['IBAN', bank.iban], ['Benefisiar', bank.beneficiary],
              ['Ödənilmiş cəm', money(fin?.totalPaid ?? 0)]].map(([k, v]) => (
              <div key={k} className="bg-bg2 rounded-card p-3"><div className="text-xs text-t3">{k}</div><div className="font-semibold mt-0.5 text-brand break-all">{v || '—'}</div></div>))}
          </div>
        ) : (
          <EmptyState icon={<Ic.wallet className="w-6 h-6" />} title="Bank məlumatı yoxdur"
            desc="Ödənişlərin köçürülməsi üçün Mağaza Ayarları → Bank bölməsində IBAN və benefisiar əlavə edin." />
        )}
      </SectionCard>

      {/* Ödəniş tarixçəsi — admin tərəfindən qeyd olunan settlement-lər. */}
      <SectionCard title="Ödəniş tarixçəsi" sub="Platformanın sizə köçürdüyü ödənişlər">
        {!fin ? <div className="h-24 skel rounded-card" /> : (fin.payouts?.length ?? 0) === 0 ? (
          <EmptyState icon={<Ic.wallet className="w-6 h-6" />} title="Hələ ödəniş edilməyib"
            desc="Bütün xalis qazancınız gözləyən ödənişdədir. Platforma ödəniş etdikcə burada görünəcək." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="text-left text-t3 border-b border-bdr">
                <th className="py-2 font-medium">Dövr</th><th className="py-2 font-medium text-right">Məbləğ</th>
                <th className="py-2 font-medium">Status</th><th className="py-2 font-medium">Ödənmə tarixi</th>
                <th className="py-2 font-medium">Üsul</th><th className="py-2 font-medium">Referans</th>
              </tr></thead>
              <tbody>
                {fin.payouts.map((p) => (
                  <tr key={p.id} className="border-b border-bdr last:border-0">
                    <td className="py-2 text-t2">{dateLabel(p.periodStart)} – {dateLabel(p.periodEnd)}</td>
                    <td className="py-2 text-right font-semibold text-brand">{money(p.amount)}</td>
                    <td className="py-2"><Badge color={p.status === 'Ödənildi' ? 'green' : 'amber'}>{p.status}</Badge></td>
                    <td className="py-2 text-t2">{dateLabel(p.paidAt)}</td>
                    <td className="py-2 text-t2">{p.method || '—'}</td>
                    <td className="py-2 text-t2 break-all">{p.reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default Payments;
