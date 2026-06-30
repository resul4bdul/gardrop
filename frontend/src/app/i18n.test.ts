import { describe, it, expect } from 'vitest';
import { I18N, LANGS } from './i18n';

// B.2/C.2: lüğətlərin tamlığını qoruyur — açar fərqi = tərcümə boşluğu (audit "yarımçıq örtük" riski).
describe('i18n dictionaries', () => {
  it('ru and en cover the same source keys', () => {
    const ru = Object.keys(I18N.ru).sort();
    const en = Object.keys(I18N.en).sort();
    const missingInEn = ru.filter((k) => !(k in I18N.en));
    const missingInRu = en.filter((k) => !(k in I18N.ru));
    expect(missingInEn, `en-də çatışmayan açarlar: ${missingInEn.join(' | ')}`).toEqual([]);
    expect(missingInRu, `ru-da çatışmayan açarlar: ${missingInRu.join(' | ')}`).toEqual([]);
  });

  it('has no empty translations', () => {
    for (const lang of ['ru', 'en'] as const) {
      for (const [key, val] of Object.entries(I18N[lang])) {
        expect(val.trim().length, `boş tərcümə: ${lang} → "${key}"`).toBeGreaterThan(0);
      }
    }
  });

  it('exposes az/ru/en language options', () => {
    expect(LANGS.map((l) => l.code)).toEqual(['az', 'ru', 'en']);
  });
});
