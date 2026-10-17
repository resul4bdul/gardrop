// CSV ixrac köməkçisi (admin + mağaza panelləri). BOM ilə → Excel AZ hərflərini düz açır.
export interface CsvCol<T> { key: keyof T | string; label: string; map?: (row: T) => unknown }

// ── Ortaq formatlayıcılar (detallı ixrac üçün) ──
export const csvStamp = () => new Date().toISOString().slice(0, 10);                     // fayl adı suffiksi
export const csvDate = (s?: string) => { if (!s) return ''; try { return new Date(s).toLocaleString('az-AZ'); } catch { return s; } };
export const csvBool = (b?: boolean) => (b ? 'Bəli' : 'Xeyr');
export const totalStock = (ss?: Record<string, number>) => Object.values(ss || {}).reduce((a, n) => a + Number(n || 0), 0);
export const sizeStockStr = (ss?: Record<string, number>) => Object.entries(ss || {}).filter(([, n]) => Number(n) > 0).map(([s, n]) => `${s}:${n}`).join(' ');
// Sifariş məhsullarını tək xanaya yığ: "Köynək x2 (M); Şalvar x1 (40)"
export const itemsStr = (items?: { name?: string; qty?: number; selectedSize?: string; size?: string }[]) =>
  (items || []).map(it => `${it.name || ''} x${it.qty ?? 1}${(it.selectedSize || it.size) ? ` (${it.selectedSize || it.size})` : ''}`).join('; ');

export function downloadCsv<T>(filename: string, rows: T[], cols: CsvCol<T>[]): void {
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = cols.map(c => esc(c.label)).join(',');
  const body = rows.map(r => cols.map(c => esc(c.map ? c.map(r) : (r as Record<string, unknown>)[c.key as string])).join(',')).join('\n');
  const csv = '﻿' + head + '\n' + body;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
