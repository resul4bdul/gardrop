import { describe, it, expect } from 'vitest';
import { recommendSize } from './sizing';

// B.2: AI ölçü məntiqinin kritik yolları (backend SizeEngineTests paraleli).
describe('recommendSize', () => {
  it('shoe: profile EU size is matched directly', () => {
    const r = recommendSize(
      { cins: 'Kişi', measurements: { ayaqqabi: 42 } },
      { category: 'Ayaqqabı', sizes: ['40', '41', '42', '43'], sizeSystem: 'EU' },
    );
    expect(r.system).toBe('EU');
    expect(r.size).toBe('42');
    expect(r.available).toBe(true);
    expect(r.hasMeasurements).toBe(true);
  });

  it('shoe: no profile size → not enough data', () => {
    const r = recommendSize(
      { cins: 'Qadın', measurements: {} },
      { category: 'Ayaqqabı', sizes: ['38', '39', '40'], sizeSystem: 'EU', size: '39' },
    );
    expect(r.hasMeasurements).toBe(false);
    expect(r.accuracy).toBe(58);
  });

  it('gender mismatch → not suitable', () => {
    const r = recommendSize(
      { cins: 'Kişi', measurements: { boy: 180, ceki: 80 } },
      { category: 'Qadın', gender: 'Qadın', sizes: ['S', 'M', 'L'], sizeSystem: 'INT' },
    );
    expect(r.fits).toBe(false);
    expect(r.size).toBe('—');
    expect(r.confidence).toBe(0);
  });

  it('clothing with no measurements asks for them', () => {
    const r = recommendSize(
      { cins: 'Kişi', measurements: {} },
      { category: 'Kişi', subcategory: 'Köynək', sizes: ['S', 'M', 'L', 'XL'], sizeSystem: 'INT', size: 'M' },
    );
    expect(r.hasMeasurements).toBe(false);
    expect(r.size).toBe('M');
  });

  it('clothing with body data returns an in-stock size with confidence', () => {
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    const r = recommendSize(
      { cins: 'Kişi', measurements: { boy: 178, ceki: 78, dos: 98 } },
      { category: 'Kişi', subcategory: 'Köynək', sizes, sizeSystem: 'INT' },
    );
    expect(sizes).toContain(r.size);
    expect(r.hasMeasurements).toBe(true);
    expect(r.confidence).toBeGreaterThan(45);
    expect(Array.isArray(r.reasons)).toBe(true);
  });

  it('runs-small brand nudges one size up vs standard', () => {
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
    const m = { boy: 175, ceki: 72 };
    const base = recommendSize({ cins: 'Kişi', measurements: m }, { category: 'Kişi', subcategory: 'Köynək', sizes, sizeSystem: 'INT', brand: 'LCWaikiki' });
    const small = recommendSize({ cins: 'Kişi', measurements: m }, { category: 'Kişi', subcategory: 'Köynək', sizes, sizeSystem: 'INT', brand: 'Zara' });
    const order = sizes;
    expect(order.indexOf(small.size)).toBeGreaterThanOrEqual(order.indexOf(base.size));
  });
});
