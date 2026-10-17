/* iOS-tipli ortaq UI atomları (admin + mağaza panelləri).
   Segmented control + Switch — iPhoneUIKit görünüşü. Hər iki bundle paylaşır. */
import React from "react";

// iOS segmented control (filtrlər üçün). Çox seçim olduqda yatay scroll.
export function Segmented<T extends string>({ value, onChange, options, size = 'md', className = '' }:
  { value: T; onChange: (v: T) => void; options: [T, string][]; size?: 'sm' | 'md'; className?: string }) {
  return (
    <div className={`inline-flex max-w-full overflow-x-auto scrollbar-hide bg-bg3 rounded-[11px] p-[3px] gap-[3px] ${className}`}>
      {options.map(([v, l]) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={`shrink-0 whitespace-nowrap rounded-[9px] font-medium transition-all ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'} ${value === v ? 'bg-white text-brand shadow-xs' : 'text-t2 hover:text-brand'}`}>
          {l}
        </button>
      ))}
    </div>
  );
}

// iOS toggle açarı.
export function Switch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[26px] w-[44px] shrink-0 items-center rounded-full transition-colors duration-200 ${checked ? 'bg-green' : 'bg-bdr-s'} ${disabled ? 'opacity-50' : ''}`}>
      <span className={`inline-block h-[22px] w-[22px] rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
    </button>
  );
}

type Tone = 'gray' | 'blue' | 'green' | 'amber' | 'brand' | 'sale';
const TONE_BG: Record<Tone, string> = {
  gray: 'bg-bg3 text-t2', blue: 'bg-blue/10 text-blue', green: 'bg-green/10 text-green',
  amber: 'bg-amber/10 text-amber', brand: 'bg-brand/[0.06] text-brand', sale: 'bg-sale/10 text-sale',
};

// Apple-tipli KPI kartı (ikon çipi + böyük rəqəm + alt-etiket/trend).
export const StatTile = ({ label, value, icon, tone = 'gray', sub, subTone }:
  { label: string; value: React.ReactNode; icon?: React.ReactNode; tone?: Tone; sub?: React.ReactNode; subTone?: string }) => (
  <div className="bg-white rounded-sheet border border-bdr shadow-xs p-4">
    <div className="flex items-center justify-between mb-3 min-h-[36px]">
      {icon ? <div className={`w-9 h-9 rounded-[10px] grid place-items-center ${TONE_BG[tone]}`}>{icon}</div> : <span />}
      {sub != null && <span className={`text-xs font-semibold ${subTone || 'text-t3'}`}>{sub}</span>}
    </div>
    <div className="text-[26px] font-bold text-brand leading-none tracking-tight">{value}</div>
    <div className="text-xs text-t3 mt-1.5">{label}</div>
  </div>
);

// Başlıqlı qruplaşdırılmış kart (iOS section).
export const SectionCard = ({ title, sub, action, children, className = '', bodyClass = '' }:
  { title?: React.ReactNode; sub?: React.ReactNode; action?: React.ReactNode; children?: React.ReactNode; className?: string; bodyClass?: string }) => (
  <div className={`bg-white rounded-sheet border border-bdr shadow-xs ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <div className="min-w-0">{title && <h3 className="font-bold text-brand leading-tight">{title}</h3>}{sub && <p className="text-xs text-t3 mt-0.5">{sub}</p>}</div>
        {action}
      </div>
    )}
    <div className={`px-5 pb-5 ${bodyClass}`}>{children}</div>
  </div>
);

// Şaquli sütun qrafiki (gəlir trendi).
export const BarChart = ({ data, color = '#0A0A0A', height = 160 }:
  { data: { label: string; value: number; title?: string }[]; color?: string; height?: number }) => {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end group min-w-0" title={d.title || ''}>
          <div className="w-full max-w-[26px] rounded-t-[5px] transition-all group-hover:opacity-75" style={{ height: Math.max(3, Math.round((d.value / max) * (height - 18))) + 'px', background: color }} />
          <span className="text-[9px] text-t3 mt-1 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

// Üfüqi sıralı bar (top məhsul / kateqoriya).
export const HBar = ({ label, sub, value, max, color = '#0A0A0A', rank }:
  { label: string; sub: React.ReactNode; value: number; max: number; color?: string; rank?: number }) => {
  const pct = max > 0 ? Math.max(3, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1 text-sm gap-2">
        <span className="text-t2 truncate min-w-0">{rank != null && <span className="text-t3 font-semibold mr-1.5">{rank}</span>}{label}</span>
        <span className="font-semibold text-brand shrink-0">{sub}</span>
      </div>
      <div className="h-2 bg-bg3 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: pct + '%', background: color }} /></div>
    </div>
  );
};

// Mobil siyahı kartı (cədvəl sətrinin telefon variantı). Apple-tipli.
export const MCard = ({ lead, title, subtitle, badge, rows = [], actions, className = '' }:
  { lead?: React.ReactNode; title: React.ReactNode; subtitle?: React.ReactNode; badge?: React.ReactNode; rows?: [React.ReactNode, React.ReactNode][]; actions?: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-bdr rounded-sheet shadow-xs p-3.5 ${className}`}>
    <div className="flex items-start gap-3">
      {lead}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-brand text-sm leading-tight truncate">{title}</div>
            {subtitle != null && <div className="text-xs text-t3 truncate mt-0.5">{subtitle}</div>}
          </div>
          {badge != null && <div className="shrink-0">{badge}</div>}
        </div>
        {rows.length > 0 && (
          <div className="mt-2 grid gap-1">
            {rows.map(([k, v], i) => v == null ? null : (
              <div key={i} className="flex items-center justify-between gap-2 text-xs"><span className="text-t3 shrink-0">{k}</span><span className="text-t2 font-medium text-right truncate min-w-0">{v}</span></div>
            ))}
          </div>
        )}
      </div>
    </div>
    {actions && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-bdr pt-2.5 text-sm">{actions}</div>}
  </div>
);

// Skeleton + boş hal (mobil siyahı üçün).
export const MobileListState = ({ loading, empty, emptyText }: { loading: boolean; empty: boolean; emptyText: string }) =>
  loading ? <div className="space-y-2.5">{[0, 1, 2].map(i => <div key={i} className="skel h-24 rounded-sheet" />)}</div>
    : empty ? <div className="bg-white border border-bdr rounded-sheet shadow-xs px-4 py-10 text-center text-t3 text-sm">{emptyText}</div>
      : null;

// iOS qruplaşdırılmış inset siyahı + sətir (key-value detal göstərmək üçün).
export const IosList = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-sheet border border-bdr overflow-hidden divide-y divide-bdr ${className}`}>{children}</div>
);
export const IosRow = ({ label, children }: { label: React.ReactNode; children?: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 px-4 py-3 min-h-[44px]">
    <span className="text-sm text-t2 shrink-0">{label}</span>
    <span className="text-sm text-brand font-medium text-right min-w-0 truncate">{children}</span>
  </div>
);
