/* Admin tab: Sayt məzmunu (CMS) — əsas səhifə hero slaydları, kateqoriya şəkilləri,
   hüquqi sənəd mətnləri. Hamısı /api/content key-value anbarında saxlanılır.
   Boş saxlanan blok → sayt daxili (default) məzmunu göstərir. */
import React from "react";
const { useState, useEffect, useCallback } = React;
import { Btn, Card, FieldL, SELECT_CLS, uploadFilesAdmin } from "./shared";
import type { ApiFn, ToastFn } from "./types";
import { useCropper, RATIOS } from "../lib/cropper";

interface HeroSlide { image?: string; badge?: string; title?: string; subtitle?: string; ctaText?: string; ctaLink?: string; ctaCategory?: string }
interface LegalSection { h: string; p: string[] }
interface LegalDoc { title: string; updated: string; intro: string; sections: LegalSection[] }

const API = typeof location==='undefined' ? '' : location.origin.startsWith('http') ? location.origin : 'http://localhost:3001';
const LEGAL_KEYS: [string, string][] = [
  ['privacy', 'Məxfilik Siyasəti'], ['terms', 'İstifadə Şərtləri'], ['cookies', 'Cookie Siyasəti'],
  ['delivery', 'Çatdırılma'], ['returns', 'Geri Qaytarma'],
];
const LINK_OPTS: [string, string][] = [['catalog', 'Kataloq'], ['stores', 'Mağazalar'], ['register', 'Qeydiyyat / Profil'], ['profile', 'Profil']];
const emptyDoc = (): LegalDoc => ({ title: '', updated: '', intro: '', sections: [] });

const resolveImg = (s?: string) => s ? s.replace(/^https?:\/\/[^/]+(\/uploads\/)/i, '$1') : s;
const TabBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-btn text-sm font-medium ${active ? 'bg-brand text-white' : 'bg-white border border-bdr text-t2 hover:bg-bg2'}`}>{children}</button>
);
const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm ${p.className || ''}`} />;
const Area = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={`w-full bg-white border border-bdr rounded-btn px-3 py-2 text-sm ${p.className || ''}`} />;

export function Content({ api, toast }: { api: ApiFn; toast: ToastFn }) {
  const [tab, setTab] = useState<'hero' | 'images' | 'legal'>('hero');
  const [hero, setHero] = useState<HeroSlide[]>([]);
  const [catImages, setCatImages] = useState<Record<string, string>>({});
  const [legal, setLegal] = useState<Record<string, LegalDoc>>({});
  const [cats, setCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/content`).then(r => r.json()).catch(() => ({})),
      fetch(`${API}/api/categories`).then(r => r.json()).catch(() => []),
    ]).then(([c, cl]) => {
      const parse = <T,>(k: string, fb: T): T => { try { return c?.[k] ? JSON.parse(c[k]) : fb; } catch { return fb; } };
      setHero(parse<HeroSlide[]>('home_hero', []));
      setCatImages(parse<Record<string, string>>('category_images', {}));
      setLegal(parse<Record<string, LegalDoc>>('legal_docs', {}));
      setCats(Array.isArray(cl) ? cl.map((x: { name: string }) => x.name) : []);
    }).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const put = async (key: string, value: unknown) => {
    setSaving(key);
    try { await api(`/api/admin/content/${key}`, { method: 'PUT', body: JSON.stringify({ json: JSON.stringify(value) }) }); toast('Yadda saxlanıldı'); }
    catch (e) { toast((e as Error).message, 'error'); }
    finally { setSaving(''); }
  };

  if (loading) return <div className="text-t3 py-10 text-center">Yüklənir…</div>;

  return (
    <div>
      <div className="flex gap-2 mb-5">
        <TabBtn active={tab === 'hero'} onClick={() => setTab('hero')}>Əsas səhifə slayd</TabBtn>
        <TabBtn active={tab === 'images'} onClick={() => setTab('images')}>Kateqoriya şəkilləri</TabBtn>
        <TabBtn active={tab === 'legal'} onClick={() => setTab('legal')}>Hüquqi mətnlər</TabBtn>
      </div>

      {tab === 'hero' && <HeroEditor hero={hero} setHero={setHero} onSave={() => put('home_hero', hero.filter(s => s.badge || s.title || s.image))} saving={saving === 'home_hero'} />}
      {tab === 'images' && <ImagesEditor cats={cats} catImages={catImages} setCatImages={setCatImages} onSave={() => put('category_images', catImages)} saving={saving === 'category_images'} />}
      {tab === 'legal' && <LegalEditor legal={legal} setLegal={setLegal} onSave={() => put('legal_docs', Object.fromEntries(Object.entries(legal).filter(([, d]) => d.title?.trim())))} saving={saving === 'legal_docs'} />}
    </div>
  );
}

// ───────────── Hero slaydları ─────────────
function HeroEditor({ hero, setHero, onSave, saving }: { hero: HeroSlide[]; setHero: (h: HeroSlide[]) => void; onSave: () => void; saving: boolean }) {
  const [busy, setBusy] = useState(-1);
  const upd = (i: number, patch: Partial<HeroSlide>) => setHero(hero.map((s, j) => j === i ? { ...s, ...patch } : s));
  const move = (i: number, d: number) => { const n = [...hero]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; setHero(n); };
  const crop = useCropper(RATIOS.banner);
  const upload = async (i: number, files: FileList | null) => {
    if (!files?.length) return;
    const cropped = await crop.start(files); if (!cropped) return; setBusy(i);
    try { const urls = await uploadFilesAdmin(cropped); if (urls[0]) upd(i, { image: urls[0] }); } catch { /* */ } finally { setBusy(-1); }
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-t2">Əsas səhifədəki dönər banner slaydları. Boş saxlasanız sayt daxili slaydları göstərir.</p>
      {hero.map((s, i) => (
        <Card key={i}><div className="p-4 grid md:grid-cols-[180px_1fr] gap-4">
          <div>
            <div className="aspect-[4/3] rounded-card bg-bg2 overflow-hidden mb-2 grid place-items-center">
              {s.image ? <img src={resolveImg(s.image)} alt="" className="w-full h-full object-cover" /> : <span className="text-t3 text-xs">Şəkil yox</span>}
            </div>
            <label className="block">
              <span className="sr-only">Şəkil</span>
              <input type="file" accept="image/*" onChange={e => upload(i, e.target.files)} className="block w-full text-xs" />{crop.ui}
            </label>
            {busy === i && <p className="text-xs text-t3 mt-1">Yüklənir…</p>}
          </div>
          <div className="space-y-2">
            <FieldL label="Üst etiket (badge)"><Input value={s.badge || ''} onChange={e => upd(i, { badge: e.target.value })} placeholder="YENİ KOLLEKSİYA" /></FieldL>
            <FieldL label="Başlıq (hər sətir ayrı yazılır)"><Area rows={3} value={s.title || ''} onChange={e => upd(i, { title: e.target.value })} placeholder={'Stiliniz,\nqaydalarınızı\nyazır.'} /></FieldL>
            <FieldL label="Alt mətn"><Area rows={2} value={s.subtitle || ''} onChange={e => upd(i, { subtitle: e.target.value })} /></FieldL>
            <div className="grid grid-cols-2 gap-2">
              <FieldL label="Düymə mətni"><Input value={s.ctaText || ''} onChange={e => upd(i, { ctaText: e.target.value })} placeholder="Alış-verişə başla" /></FieldL>
              <FieldL label="Düymə hədəfi"><select className={SELECT_CLS} value={s.ctaLink || 'catalog'} onChange={e => upd(i, { ctaLink: e.target.value })}>{LINK_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></FieldL>
            </div>
            {(s.ctaLink || 'catalog') === 'catalog' && <FieldL label="Kateqoriya (kataloq hədəfi üçün)"><Input value={s.ctaCategory || ''} onChange={e => upd(i, { ctaCategory: e.target.value })} placeholder="Hamısı / Endirimlər / Kişi …" /></FieldL>}
            <div className="flex gap-2 pt-1">
              <Btn variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>↑</Btn>
              <Btn variant="ghost" onClick={() => move(i, 1)} disabled={i === hero.length - 1}>↓</Btn>
              <Btn variant="danger" className="ml-auto" onClick={() => setHero(hero.filter((_, j) => j !== i))}>Sil</Btn>
            </div>
          </div>
        </div></Card>
      ))}
      <div className="flex gap-2">
        <Btn variant="ghost" onClick={() => setHero([...hero, { ctaLink: 'catalog', ctaText: 'Bax' }])}>＋ Slayd əlavə et</Btn>
        <Btn className="ml-auto" onClick={onSave} disabled={saving}>{saving ? 'Saxlanılır…' : 'Yadda saxla'}</Btn>
      </div>
    </div>
  );
}

// ───────────── Kateqoriya şəkilləri ─────────────
function ImagesEditor({ cats, catImages, setCatImages, onSave, saving }: { cats: string[]; catImages: Record<string, string>; setCatImages: (m: Record<string, string>) => void; onSave: () => void; saving: boolean }) {
  const [busy, setBusy] = useState('');
  const crop = useCropper(RATIOS.logo);
  const upload = async (name: string, files: FileList | null) => {
    if (!files?.length) return;
    const cropped = await crop.start(files); if (!cropped) return; setBusy(name);
    try { const urls = await uploadFilesAdmin(cropped); if (urls[0]) setCatImages({ ...catImages, [name]: urls[0] }); } catch { /* */ } finally { setBusy(''); }
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-t2">Əsas səhifə kataloq kartlarında görünən kateqoriya şəkilləri.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cats.length === 0 && <p className="text-t3 text-sm">Kateqoriya yoxdur.</p>}
        {cats.map(name => (
          <Card key={name}><div className="p-3">
            <div className="aspect-square rounded-card bg-bg2 overflow-hidden mb-2 grid place-items-center">
              {catImages[name] ? <img src={resolveImg(catImages[name])} alt={name} className="w-full h-full object-cover" /> : <span className="text-t3 text-xs">Şəkil yox</span>}
            </div>
            <p className="font-semibold text-sm mb-2">{name}</p>
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" onChange={e => upload(name, e.target.files)} className="block w-full text-xs" />{crop.ui}
              {catImages[name] && <button onClick={() => { const m = { ...catImages }; delete m[name]; setCatImages(m); }} className="text-sale text-sm shrink-0">Sil</button>}
            </div>
            {busy === name && <p className="text-xs text-t3 mt-1">Yüklənir…</p>}
          </div></Card>
        ))}
      </div>
      <div className="flex"><Btn className="ml-auto" onClick={onSave} disabled={saving}>{saving ? 'Saxlanılır…' : 'Yadda saxla'}</Btn></div>
    </div>
  );
}

// ───────────── Hüquqi mətnlər ─────────────
function LegalEditor({ legal, setLegal, onSave, saving }: { legal: Record<string, LegalDoc>; setLegal: (m: Record<string, LegalDoc>) => void; onSave: () => void; saving: boolean }) {
  const [key, setKey] = useState('privacy');
  const doc = legal[key] || emptyDoc();
  const setDoc = (patch: Partial<LegalDoc>) => setLegal({ ...legal, [key]: { ...doc, ...patch } });
  const setSection = (i: number, patch: Partial<LegalSection>) => setDoc({ sections: doc.sections.map((s, j) => j === i ? { ...s, ...patch } : s) });
  return (
    <div className="space-y-4">
      <p className="text-sm text-t2">Boş saxlanan sənəd üçün sayt daxili hazır mətni göstərir. Burada doldurduğunuz mətn onu əvəz edir.</p>
      <div className="flex flex-wrap gap-2">{LEGAL_KEYS.map(([k, l]) => <TabBtn key={k} active={key === k} onClick={() => setKey(k)}>{l}{legal[k]?.title?.trim() ? ' ✓' : ''}</TabBtn>)}</div>
      <Card><div className="p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <FieldL label="Başlıq"><Input value={doc.title} onChange={e => setDoc({ title: e.target.value })} placeholder="Məxfilik Siyasəti" /></FieldL>
          <FieldL label="Son yenilənmə"><Input value={doc.updated} onChange={e => setDoc({ updated: e.target.value })} placeholder="26 iyun 2026" /></FieldL>
        </div>
        <FieldL label="Giriş mətni"><Area rows={3} value={doc.intro} onChange={e => setDoc({ intro: e.target.value })} /></FieldL>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-t2">Bölmələr</span>
            <button type="button" onClick={() => setDoc({ sections: [...doc.sections, { h: '', p: [] }] })} className="text-blue text-sm hover:underline">＋ Bölmə</button>
          </div>
          <div className="space-y-3">
            {doc.sections.length === 0 && <p className="text-t3 text-sm">Bölmə yoxdur.</p>}
            {doc.sections.map((s, i) => (
              <div key={i} className="bg-bg2 rounded-card p-3 space-y-2">
                <div className="flex gap-2">
                  <Input value={s.h} onChange={e => setSection(i, { h: e.target.value })} placeholder="Bölmə başlığı" className="font-medium" />
                  <button onClick={() => setDoc({ sections: doc.sections.filter((_, j) => j !== i) })} className="text-sale text-lg px-2 leading-none shrink-0">×</button>
                </div>
                <Area rows={4} value={s.p.join('\n')} onChange={e => setSection(i, { p: e.target.value.split('\n') })} placeholder="Hər sətir ayrı bənd kimi göstərilir" />
              </div>
            ))}
          </div>
        </div>
      </div></Card>
      <div className="flex"><Btn className="ml-auto" onClick={onSave} disabled={saving}>{saving ? 'Saxlanılır…' : 'Yadda saxla'}</Btn></div>
    </div>
  );
}

export default Content;
