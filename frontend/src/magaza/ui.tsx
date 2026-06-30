/* Satıcı paneli dizayn sistemi — Inter, green #0B8457 (emerald-600), slate fon, radius 16px (rounded-2xl),
   minimal kölgə (Shopify/Stripe/Linear üslubu). Yalnız mağaza bundle. */
import React from "react";
import { Ic } from "../lib/panelIcons";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// ───────────── Button ─────────────
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
  icon?: React.ReactNode;
};
export const Button = ({ variant = "primary", size = "md", loading, icon, children, className = "", disabled, ...p }: BtnProps) => {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm" };
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };
  return (
    <button className={cx(base, sizes[size], variants[variant], className)} disabled={disabled || loading} {...p}>
      {loading ? <Spinner /> : icon}{children}
    </button>
  );
};

export const Spinner = ({ className = "w-4 h-4" }: { className?: string }) =>
  <span className={cx("inline-block border-2 border-current border-t-transparent rounded-full animate-spin", className)} />;

// ───────────── Card / Section ─────────────
export const Card = ({ children, className = "", ...p }: React.HTMLAttributes<HTMLDivElement>) =>
  <div className={cx("bg-white border border-slate-200 rounded-2xl shadow-sm", className)} {...p}>{children}</div>;

export const SectionCard = ({ title, sub, action, children, className = "", bodyClass = "" }:
  { title?: React.ReactNode; sub?: React.ReactNode; action?: React.ReactNode; children?: React.ReactNode; className?: string; bodyClass?: string }) => (
  <Card className={className}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
        <div className="min-w-0">{title && <h3 className="font-semibold text-slate-900">{title}</h3>}{sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}</div>
        {action}
      </div>
    )}
    <div className={cx("p-5", bodyClass)}>{children}</div>
  </Card>
);

// ───────────── Badge ─────────────
const BADGE: Record<string, string> = {
  blue: "bg-emerald-50 text-emerald-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-600", violet: "bg-violet-50 text-violet-700", slate: "bg-slate-100 text-slate-600",
};
export const Badge = ({ color = "slate", children, dot }: { color?: keyof typeof BADGE | string; children?: React.ReactNode; dot?: boolean }) => (
  <span className={cx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", BADGE[color] || BADGE.slate)}>
    {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}{children}
  </span>
);

// Sifariş statusu → badge rəngi
export const STATUS_COLOR: Record<string, string> = {
  "Hazırlanır": "amber", "Hazırlandı": "blue", "Yolda": "violet",
  "Çatdırıldı": "green", "İptal": "red", "Qaytarıldı": "slate",
};

// ───────────── Inputs ─────────────
export const Label = ({ children }: { children?: React.ReactNode }) =>
  <span className="block text-xs font-semibold text-slate-600 mb-1.5">{children}</span>;

export const inputCls = "w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600";
export const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(inputCls, p.className)} />;
export const Textarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cx(inputCls, "resize-none", p.className)} />;
export const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(inputCls, "cursor-pointer", p.className)} />;
export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block"><Label>{label}</Label>{children}</label>
);

// ───────────── StatCard (KPI) ─────────────
export const StatCard = ({ label, value, icon, delta, deltaUp, hint }:
  { label: string; value: React.ReactNode; icon?: React.ReactNode; delta?: string; deltaUp?: boolean; hint?: string }) => (
  <Card className="p-5">
    {(icon || delta) && (
      <div className="flex items-center justify-between mb-3 min-h-[36px]">
        {icon ? <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center">{icon}</div> : <span />}
        {delta && <span className={cx("text-xs font-semibold", deltaUp ? "text-emerald-600" : "text-red-500")}>{delta}</span>}
      </div>
    )}
    <div className="text-[26px] font-bold text-slate-900 tracking-tight leading-none">{value}</div>
    <div className="text-[13px] text-slate-500 mt-2">{label}</div>
    {hint && <div className="text-[11px] text-slate-400 mt-0.5">{hint}</div>}
  </Card>
);

// ───────────── EmptyState ─────────────
export const EmptyState = ({ icon, title, desc, cta }:
  { icon?: React.ReactNode; title: string; desc?: string; cta?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 grid place-items-center mb-4">{icon}</div>
    <h3 className="font-semibold text-slate-900">{title}</h3>
    {desc && <p className="text-sm text-slate-500 mt-1 max-w-sm">{desc}</p>}
    {cta && <div className="mt-5">{cta}</div>}
  </div>
);

// ───────────── Table ─────────────
export const Th = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) =>
  <th className={cx("text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3", className)}>{children}</th>;
export const Td = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) =>
  <td className={cx("px-4 py-3 text-sm text-slate-700", className)}>{children}</td>;

// ───────────── Skeleton ─────────────
export const Skeleton = ({ className = "" }: { className?: string }) => <div className={cx("skel", className)} />;

// ───────────── Avatar ─────────────
export const Avatar = ({ name, src, className = "w-9 h-9" }: { name?: string; src?: string; className?: string }) => (
  <div className={cx(className, "rounded-full bg-slate-100 text-slate-500 grid place-items-center overflow-hidden font-semibold shrink-0")}>
    {src ? <img src={src} alt={name || ""} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <span>{(name || "?")[0]?.toUpperCase()}</span>}
  </div>
);

// ───────────── Tabs / Segmented ─────────────
export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1">
      {options.map(([v, l]) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={cx("px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
            value === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800")}>{l}</button>
      ))}
    </div>
  );
}

// ───────────── Pagination ─────────────
export const Pagination = ({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
      <span className="text-xs text-slate-500">Səhifə {page} / {pages}</span>
      <div className="flex gap-1.5">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} icon={<Ic.chevDown className="w-4 h-4 rotate-90" />}>Geri</Button>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>İrəli<Ic.chevDown className="w-4 h-4 -rotate-90" /></Button>
      </div>
    </div>
  );
};

// ───────────── Switch ─────────────
export const Switch = ({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
    className={cx("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors", checked ? "bg-emerald-600" : "bg-slate-300", disabled && "opacity-50")}>
    <span className={cx("inline-block h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
  </button>
);
