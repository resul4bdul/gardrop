// AI ölçü tövsiyə məntiqi (B.3: əvvəl GardropApp.tsx-də inline idi; B.1: tipli modul, @ts-nocheck YOX).
// Backend SizeEngine.cs ilə eyni bantlar/profillər. Saf funksiya — React/i18n asılılığı yoxdur → test olunur.

export interface Measurements {
  boy?: number | string | null;
  ceki?: number | string | null;
  dos?: number | string | null;
  bel?: number | string | null;
  omba?: number | string | null;
  ayaqqabi?: number | string | null;
  yas?: number | string | null;
  dosFit?: string | null;
  belFit?: string | null;
  qarinFit?: string | null;
  ombaFit?: string | null;
  ayaqFit?: string | null;
  fitPreference?: string | null;
}

export interface SizeUser {
  cins?: string;
  measurements?: Measurements;
}

export interface SizeChartRow {
  size: string;
  boyMin?: number | null;
  boyMax?: number | null;
  cekiMin?: number | null;
  cekiMax?: number | null;
}

export interface SizeProduct {
  size?: string;
  sizes?: string[];
  sizeSystem?: string;
  category?: string;
  subcategory?: string;
  gender?: string;
  brand?: string;
  fitType?: string;
  stretch?: string;
  material?: string;
  sizeBehavior?: string;
  washShrink?: boolean;
  sizeChart?: SizeChartRow[];
}

export interface SizeResult {
  size: string;
  alternative: string | null;
  accuracy: number;
  confidence: number;
  hasMeasurements: boolean;
  available: boolean;
  fit: string;
  reasons: string[];
  risks: string[];
  system: string;
  message: string;
  fits?: boolean;
  factors?: string[];
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
/* Marka əsaslı ölçü profilləri (backend SizeEngine.BrandProfiles ilə eyni). */
const BRAND_PROFILES: Record<string, string> = {
  zara: 'RunsSmall', bershka: 'RunsSmall', pullbear: 'RunsSmall', stradivarius: 'RunsSmall', massimodutti: 'RunsSmall', oysho: 'RunsSmall',
  mango: 'RunsSmall', hm: 'RunsSmall', asos: 'RunsSmall', levis: 'RunsSmall', pingo: 'RunsSmall',
  lcwaikiki: 'Standard', lcw: 'Standard', defacto: 'Standard', mavi: 'Standard', colins: 'Standard', kigili: 'Standard',
  koton: 'RunsLarge', gap: 'RunsLarge', uspoloassn: 'RunsLarge',
  nike: 'Standard', adidas: 'Standard', puma: 'Standard',
};
const _brandBehavior = (brand: string | undefined): string => {
  if (!brand) return 'Standard';
  const key = String(brand).toLowerCase().replace(/[^a-z0-9]/g, '');
  return BRAND_PROFILES[key] || 'Standard';
};
/* INT — cinsiyyətə görə bədən ölçü bantları [min,max] sm (backend SizeEngine.cs ilə eyni). */
const SIZE_CHARTS: Record<string, { chest: number[][]; waist: number[][]; hip: number[][] }> = {
  'Qadın': {
    chest: [[78, 82], [82, 86], [86, 92], [92, 98], [98, 104], [104, 112], [112, 122]],
    waist: [[60, 64], [64, 68], [68, 74], [74, 80], [80, 86], [86, 94], [94, 104]],
    hip: [[86, 90], [90, 94], [94, 100], [100, 106], [106, 114], [114, 124], [124, 136]],
  },
  'Kişi': {
    chest: [[82, 88], [88, 94], [94, 100], [100, 106], [106, 112], [112, 118], [118, 128]],
    waist: [[70, 76], [76, 82], [82, 88], [88, 94], [94, 100], [100, 108], [108, 118]],
    hip: [[88, 92], [92, 98], [98, 104], [104, 110], [110, 118], [118, 128], [128, 140]],
  },
};
const BOTTOM_SUBCATS = ['Şalvar', 'Şort', 'Ətək', 'Cins', 'Tayt', 'Leqqins', 'Leggings'];
const JACKET_SUBCATS = ['Pencək', 'Blazer', 'Jaket', 'Gödəkçə', 'Kostyum'];
const COAT_SUBCATS = ['Palto', 'Trenç', 'Plaş', 'Kürk'];
const _num = (v: number | string | null | undefined): number => { const n = parseFloat(v as string); return isNaN(n) ? 0 : n; };
const _clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const _fitVal = (f: string | null | undefined): number => { f = (f || '').toLowerCase(); return f === 'dar' ? -1 : f === 'geniş' ? 1 : 0; };
const _fitLabel = (dos?: string | null, bel?: string | null, qarin?: string | null, omba?: string | null): string => { const p: string[] = []; if (dos) p.push(`çiyin ${dos.toLowerCase()}`); if (bel) p.push(`bel ${bel.toLowerCase()}`); if (omba) p.push(`omba ${omba.toLowerCase()}`); if (qarin) p.push(`qarın ${qarin.toLowerCase()}`); return p.join(', '); };
const _bandFloat = (v: number, bands: number[][]): number => {
  if (v < bands[0][0]) return 0;
  for (let i = 0; i < bands.length; i++) { const [mn, mx] = bands[i]; if (v < mx) { const f = mx > mn ? (v - mn) / (mx - mn) : 0; return i + _clamp(f, 0, 0.999); } }
  return bands.length - 1;
};
const _weightToIndex = (w: number, heightCm: number, qadin: boolean): number => {
  let idx = qadin ? (w < 55 ? 1 : w < 65 ? 2 : w < 77 ? 3 : w < 90 ? 4 : 5) : (w < 60 ? 1 : w < 72 ? 2 : w < 85 ? 3 : w < 100 ? 4 : 5);
  if (heightCm > 0) { const refH = qadin ? 165 : 175; idx += _clamp((refH - heightCm) / 14, -1, 1); }
  return idx;
};
const _fitToAvailable = (desired: string, sizes: string[]): string => {
  if (sizes.includes(desired)) return desired;
  const di = SIZE_ORDER.indexOf(desired);
  if (di < 0) return sizes[0] || desired;
  let best: string | null = null, bd = Infinity;
  sizes.forEach(s => { const idx = SIZE_ORDER.indexOf(s); if (idx >= 0) { const d = Math.abs(idx - di); if (d < bd) { bd = d; best = s; } } });
  return best || sizes[0] || desired;
};
// Rəqəm sistemində ideal dəyərə ən yaxın mövcud ölçü (bərabər məsafədə böyüyə üstünlük)
const _snapNumeric = (ideal: number, sizes: string[]): string | null => {
  const nums = sizes.map(s => ({ s, n: parseFloat(s) })).filter(x => !isNaN(x.n));
  if (!nums.length) return null;
  nums.sort((a, b) => Math.abs(a.n - ideal) - Math.abs(b.n - ideal) || b.n - a.n);
  return nums[0].s;
};
const _altNumeric = (ideal: number, sizes: string[], current: string): string | null => {
  const nums = sizes.map(s => ({ s, n: parseFloat(s) })).filter(x => !isNaN(x.n) && x.s !== current);
  if (!nums.length) return null;
  const up = nums.filter(x => x.n > ideal).sort((a, b) => a.n - b.n)[0];
  return up ? up.s : nums.sort((a, b) => b.n - a.n)[0].s;
};
// idx (0..6) → həmin sistemdə ideal etiket, sonra mövcud ölçülərə yapışdır
const _projectToSystem = (idx: number, sizes: string[], isTr: boolean): string => {
  idx = _clamp(idx, 0, SIZE_ORDER.length - 1);
  if (isTr) { const snap = _snapNumeric(34 + 2 * idx, sizes); if (snap != null) return snap; }
  return _fitToAvailable(SIZE_ORDER[idx], sizes);
};
const _altSize = (idx: number, clamped: number, sizes: string[], isTr: boolean, rec: string): string | null => {
  const dir = (clamped - idx) >= 0 ? 1 : -1;
  for (const d of [dir, -dir]) { const a = _projectToSystem(idx + d, sizes, isTr); if (a !== rec) return a; }
  return null;
};
// Kəsim + parça + sevdiyi oturuş → fraksional ölçü düzəlişi + səbəblər
const _fitAdjustment = (product: SizeProduct, mp: Measurements): { adj: number; reasons: string[] } => {
  let adj = 0; const reasons: string[] = [];
  const cut = (product.fitType || 'Regular').toLowerCase();
  const stretch = (product.stretch || 'medium').toLowerCase();
  const pref = (mp.fitPreference || '').toLowerCase();
  if (cut === 'slim') { adj += 0.5; reasons.push('Məhsul slim kəsimdir — rahatlıq üçün bir az böyük meyl edildi.'); }
  else if (cut === 'relaxed') { adj -= 0.2; reasons.push('Relaxed kəsim onsuz da rahatdır.'); }
  else if (cut === 'oversize') { adj -= 0.5; reasons.push('Oversize kəsim — lazımsız böyütmə edilmədi.'); }
  if (stretch === 'none') { adj += 0.3; reasons.push('Parça elastik deyil — əlavə ehtiyat payı saxlanıldı.'); }
  else if (stretch === 'low') { adj += 0.15; }
  else if (stretch === 'high') { adj -= 0.2; reasons.push('Parça yüksək elastikdir — daha sıx oturuşa imkan var.'); }
  if (pref === 'slim') { adj -= 0.3; reasons.push('Dar (slim) geyinməyi sevdiyiniz nəzərə alındı.'); }
  else if (pref === 'relaxed') { adj += 0.4; reasons.push('Rahat geyinməyi sevdiyiniz nəzərə alındı.'); }
  else if (pref === 'oversize') { adj += 0.8; reasons.push('Oversize geyinməyi sevdiyiniz nəzərə alındı.'); }
  return { adj, reasons };
};
const _expectedFit = (product: SizeProduct, mp: Measurements): string => {
  const cut = (product.fitType || 'Regular').toLowerCase();
  const pref = (mp.fitPreference || '').toLowerCase();
  let txt = cut === 'slim' ? 'Dar (slim) oturuş' : cut === 'relaxed' ? 'Sərbəst, rahat oturuş' : cut === 'oversize' ? 'Geniş, oversize görünüş' : 'Normal, balanslı oturuş';
  if (pref === 'slim' && cut !== 'slim') txt += ' — seçiminizə görə bir az daha sıx';
  else if ((pref === 'relaxed' || pref === 'oversize') && (cut === 'regular' || cut === 'slim')) txt += ' — seçiminizə görə bir az daha rahat';
  return txt;
};
const _risksFor = (product: SizeProduct, mp: Measurements, isBottom: boolean, borderline: boolean, available: boolean): string[] => {
  const risks: string[] = []; const cut = (product.fitType || 'Regular').toLowerCase(); const pref = (mp.fitPreference || '').toLowerCase();
  const stretch = (product.stretch || 'medium').toLowerCase();
  const eq = (a: string | null | undefined, b: string) => (a || '').toLowerCase() === b;
  if (!isBottom && eq(mp.dosFit, 'geniş') && cut === 'slim') risks.push('Çiyinləriniz geniş olduğundan slim kəsimdə çiyin dar gələ bilər.');
  if (eq(mp.qarinFit, 'geniş') && cut !== 'oversize') risks.push('Qarın hissəsi bir az sıxa bilər.');
  if (isBottom && eq(mp.ayaqFit, 'uzun')) risks.push('Ayaqlarınız uzun olduğundan şalvar boyu qısa qala bilər — uzun (Long) model seçin.');
  if (isBottom && eq(mp.ayaqFit, 'qısa')) risks.push('Ayaqlarınız qısa olduğundan şalvar boyu uzun ola bilər.');
  if (cut === 'oversize' || pref === 'oversize') risks.push('Məhsul gözlədiyinizdən bol görünə bilər.');
  if (stretch === 'none' && borderline) risks.push('Parça elastik olmadığından iki ölçü arasında qalsanız böyüyü seçin.');
  if (product.washShrink) risks.push('Mağaza qeyd edib: ilk yuyulmadan sonra cüzi yığılma mümkündür.');
  const _boy = _num(mp.boy);
  if (_boy > 0) {
    const qb = product.gender === 'Qadın'; const refH = qb ? 166 : 178;
    if (_boy >= refH + 8) risks.push(isBottom ? 'Boyunuz uzundur — şalvar boyu qısa qala bilər (mümkünsə Uzun/Long).' : 'Boyunuz uzundur — geyimin boyu və qol uzunluğu qısa gələ bilər.');
    else if (_boy <= refH - 8) risks.push(isBottom ? 'Boyunuz qısadır — şalvar uzun gələ bilər.' : 'Boyunuz qısadır — geyimin boyu/qolu uzun gələ bilər.');
  }
  if (!available) risks.push('İdeal ölçü stokda yoxdur — ən yaxın mövcud ölçü seçildi.');
  return risks;
};
const _sizeIndexOf = (label: string, isTr: boolean): number => {
  if (isTr) { const n = parseInt(label, 10); return isNaN(n) ? -1 : _clamp(Math.round((n - 34) / 2), 0, SIZE_ORDER.length - 1); }
  return SIZE_ORDER.indexOf(label);
};
export function recommendSize(user: SizeUser, product: SizeProduct): SizeResult {
  const m: Measurements = (user && user.measurements) || {};
  const sizes = (product.sizes && product.sizes.length) ? product.sizes : ['S', 'M', 'L', 'XL', 'XXL'];
  const _ss = (product.sizeSystem || 'INT').toUpperCase();
  const isTr = _ss === 'TR';
  const isCustom = _ss !== 'TR' && _ss !== 'INT';
  const system = isCustom ? (product.sizeSystem || 'Custom') : (isTr ? 'TR' : 'INT');

  // Ayaqqabı — istifadəçi EU ölçüsünü birbaşa bilir
  if (product.category === 'Ayaqqabı') {
    const eu = _num(m.ayaqqabi);
    if (eu <= 0) return { size: product.size ?? '', alternative: null, accuracy: 58, confidence: 58, hasMeasurements: false, available: true, fit: 'Standart oturuş', reasons: [], risks: [], system: 'EU', message: 'Ayaqqabı ölçünüzü profilinizdə qeyd edin.' };
    const snap = _snapNumeric(eu, sizes);
    if (snap == null) return { size: String(eu), alternative: null, accuracy: 90, confidence: 90, hasMeasurements: true, available: true, fit: 'Standart oturuş', reasons: [`Profil ayaqqabı ölçünüz EU ${eu}.`], risks: [], system: 'EU', message: `Sizin ölçünüz: ${eu}.` };
    const n = parseFloat(snap); const diff = Math.abs(n - eu);
    const conf = Math.round(_clamp(99 - diff * 7, 75, 99));
    const available = sizes.includes(String(eu));
    const risks: string[] = []; if (!available) risks.push(`Dəqiq ölçünüz (${eu}) stokda yoxdur — ən yaxını ${snap} seçildi.`);
    if ((product.material || '').toLowerCase().includes('dəri')) risks.push('Təbii dəri vaxtla bir az genişlənir — ölçüsündə qalsanız ideal olar.');
    return {
      size: snap, alternative: _altNumeric(eu, sizes, snap), accuracy: conf, confidence: conf, hasMeasurements: true, available, fit: 'Standart oturuş',
      reasons: [diff === 0 ? `Profil ölçünüz EU ${eu} bu məhsulda mövcuddur.` : `Profil ölçünüz EU ${eu}, ən yaxın mövcud ölçü ${snap}.`], risks, system: 'EU',
      message: diff === 0 ? `Sizin ölçünüz ${eu} — mövcuddur.` : `Ölçünüz ${eu}, ən yaxın mövcud ${snap}.`
    };
  }

  // Mağazanın öz ölçü cədvəli (Custom) — boy/çəkini cədvələ uyğunlaşdırırıq
  if (isCustom) {
    const chartRows = product.sizeChart || [];
    const cBoy = _num(m.boy), cCeki = _num(m.ceki);
    if (!chartRows.length || (cBoy <= 0 && cCeki <= 0))
      return {
        size: sizes[0] || product.size || '', alternative: null, accuracy: 50, confidence: 50, hasMeasurements: false, available: true, fit: '', reasons: [], risks: [], system,
        message: chartRows.length ? 'Mağazanın ölçü cədvəlinə görə tövsiyə üçün boy/çəkinizi qeyd edin.' : 'Bu mağaza öz ölçü sistemindən istifadə edir — ölçü cədvəlinə baxın.', fits: true
      };
    const inR = (v: number, mn?: number | null, mx?: number | null) => v > 0 && (mn == null || v >= mn) && (mx == null || v <= mx);
    const row = chartRows.find(r => inR(cCeki, r.cekiMin, r.cekiMax) && inR(cBoy, r.boyMin, r.boyMax)) || chartRows.find(r => inR(cCeki, r.cekiMin, r.cekiMax)) || chartRows.find(r => inR(cBoy, r.boyMin, r.boyMax));
    const cFactors: string[] = []; if (cBoy > 0) cFactors.push('Boy'); if (cCeki > 0) cFactors.push('Çəki');
    if (!row) return { size: '—', alternative: null, accuracy: 60, confidence: 60, hasMeasurements: true, available: false, fit: '', reasons: [], risks: ['Boy/çəkiniz mağazanın cədvəl aralıqlarından kənardır.'], system, message: 'Mağazanın ölçü cədvəlində sizə uyğun ölçü tapılmadı — uyğun olmaya bilər.', fits: false, factors: cFactors };
    const cAvail = !sizes.length || sizes.includes(row.size);
    const both = inR(cCeki, row.cekiMin, row.cekiMax) && inR(cBoy, row.boyMin, row.boyMax);
    let cConf = both ? 90 : 80; if (!cAvail) cConf -= 8;
    const cReasons = ['Mağazanın ölçü cədvəlinə görə hesablandı.'];
    if (inR(cCeki, row.cekiMin, row.cekiMax)) cReasons.push(`Çəkiniz (${Math.round(cCeki)} kg) → ${row.size}.`);
    if (inR(cBoy, row.boyMin, row.boyMax)) cReasons.push(`Boyunuz (${Math.round(cBoy)} sm) bu aralıqdadır.`);
    if (cFactors.length) cReasons.push(`Hesablamaya təsir edən ölçülər: ${cFactors.join(', ')}.`);
    const cRisks: string[] = []; if (!cAvail) cRisks.push('Bu ölçü hazırda stokda yoxdur.');
    return { size: row.size, alternative: null, accuracy: cConf, confidence: cConf, hasMeasurements: true, available: cAvail, fit: 'Mağaza cədvəlinə görə', reasons: cReasons, risks: cRisks, system, message: `Mağazanın ölçü cədvəlinə görə sizə ${row.size} uyğun gəlir.`, fits: true, factors: cFactors };
  }

  // Geyim — cədvəl cinsiyyəti məhsulun CİNSİYYƏTİNƏ görədir, yalnız Uniseksdə istifadəçinin cinsi.
  const pg = product.gender || (product.category === 'Qadın' ? 'Qadın' : product.category === 'Kişi' ? 'Kişi' : 'Uniseks');
  const qadin = pg === 'Qadın' || (pg !== 'Kişi' && user.cins === 'Qadın');
  const chart = qadin ? SIZE_CHARTS['Qadın'] : SIZE_CHARTS['Kişi'];
  const sub = product.subcategory || '';
  const isBottom = BOTTOM_SUBCATS.includes(sub);
  const isJacket = JACKET_SUBCATS.includes(sub);
  const isCoat = COAT_SUBCATS.includes(sub);
  const isJeans = sub === 'Cins';

  // Cinsiyyət uyğunsuzluğu — qadın geyimi kişiyə (və ya əksinə) uyğun gəlmir
  const _gm = (pg === 'Qadın' && user.cins === 'Kişi') || (pg === 'Kişi' && user.cins === 'Qadın');
  if (_gm) return {
    size: '—', alternative: null, accuracy: 0, confidence: 0, hasMeasurements: true, available: false,
    fit: '', reasons: [], risks: [], system, message: `Bu geyim ${pg} üçün nəzərdə tutulub — sizə uyğun deyil.`, fits: false
  };

  // 1) İndeks: dəqiq sm üstündür, sonra çəki + boy + quruluş
  const height = _num(m.boy), weight = _num(m.ceki), chest = _num(m.dos), waist = _num(m.bel), hip = _num(m.omba);
  let idx: number, basis: string, raised = false;
  if (chest > 0 || waist > 0 || hip > 0) {
    const ci = chest > 0 ? _bandFloat(chest, chart.chest) : null, wi = waist > 0 ? _bandFloat(waist, chart.waist) : null, hi = hip > 0 ? _bandFloat(hip, chart.hip) : null;
    if (isBottom) {
      idx = wi != null ? wi : hi != null ? hi : (ci as number);
      const sec = hi != null ? hi : wi;
      if (sec != null && sec > idx + 0.5) { idx = Math.max(idx, sec); raised = true; }
      basis = (waist > 0 && hip > 0) ? `bel (${Math.round(waist)}) və omba (${Math.round(hip)}) sm` : waist > 0 ? `bel ölçünüz (${Math.round(waist)} sm)` : hip > 0 ? `omba ölçünüz (${Math.round(hip)} sm)` : `sinə ölçünüz (${Math.round(chest)} sm)`;
    } else {
      idx = ci != null ? ci : wi != null ? wi : (hi as number);
      if (wi != null && wi > idx + 0.5) { idx += 1; raised = true; }
      basis = chest > 0 ? `sinə ölçünüz (${Math.round(chest)} sm)` : waist > 0 ? `bel ölçünüz (${Math.round(waist)} sm)` : `omba ölçünüz (${Math.round(hip)} sm)`;
    }
  } else {
    const fits: number[] = []; const add = (f?: string | null) => { if (f) fits.push(_fitVal(f)); };
    if (isBottom) { add(m.belFit); add(m.ombaFit); add(m.qarinFit); } else if (isJacket || isCoat) { add(m.dosFit); } else { add(m.dosFit); add(m.belFit); }
    const hasFit = fits.length > 0; const ageBias = _num(m.yas) >= 45 ? 0.25 : 0; const fitAdj = hasFit ? (fits.reduce((a, b) => a + b, 0) / fits.length + ageBias) : 0;
    const structureText = _fitLabel(m.dosFit, m.belFit, m.qarinFit, m.ombaFit);
    if (weight > 0) {
      idx = _weightToIndex(weight, height, qadin) + fitAdj;
      basis = height > 0 ? (hasFit ? `boy (${Math.round(height)} sm), çəki (${Math.round(weight)} kg) və quruluş` : `boy (${Math.round(height)} sm) və çəki (${Math.round(weight)} kg)`) : (hasFit ? `çəki (${Math.round(weight)} kg) və quruluş` : `çəki (${Math.round(weight)} kg)`);
    } else if (hasFit) {
      idx = 2 + fitAdj; basis = `bədən quruluşu (${structureText})`;
    } else {
      return {
        size: product.size ?? '', alternative: null, accuracy: 58, confidence: 58, hasMeasurements: false, available: true,
        fit: _expectedFit(product, m), reasons: [], risks: [], system, message: 'Ölçü tövsiyəsi üçün boy, çəki və ya quruluşunuzu qeyd edin.', fits: true
      };
    }
  }
  if (isCoat) idx += 0.3;
  if (isJacket && (m.dosFit || '').toLowerCase() === 'geniş') idx += 0.25;
  // Ölçü davranışı: məhsul səviyyəsi üstündür; yoxdursa marka profili tətbiq olunur.
  const prodBeh = (product.sizeBehavior || 'Standard').toLowerCase();
  const brandBeh = _brandBehavior(product.brand).toLowerCase();
  const fromBrand = prodBeh === 'standard' && brandBeh !== 'standard';
  const beh = fromBrand ? brandBeh : prodBeh;
  if (beh === 'runssmall') idx += 0.5; else if (beh === 'runslarge') idx -= 0.5; else if (beh === 'oversize') idx -= 0.6;

  // 2) Kəsim + parça + sevdiyi oturuş düzəlişləri
  const { adj, reasons: fitReasons } = _fitAdjustment(product, m);
  const clamped = _clamp(idx + adj, 0, SIZE_ORDER.length - 1);
  const idxRounded = _clamp(Math.round(clamped), 0, SIZE_ORDER.length - 1);
  const borderline = Math.abs(clamped - idxRounded) > 0.33;
  const recommended = _projectToSystem(idxRounded, sizes, isTr);
  const idealLabel = isTr ? String(34 + 2 * idxRounded) : SIZE_ORDER[idxRounded];
  const available = sizes.includes(idealLabel);
  const alternative = _altSize(idxRounded, clamped, sizes, isTr, recommended);

  // 3) Confidence — mövcud məlumat miqdarına görə
  const structureCount = [m.dosFit, m.belFit, m.qarinFit, m.ombaFit].filter(Boolean).length;
  let conf = 42;
  if (height > 0) conf += 8; if (weight > 0) conf += 16; if (chest > 0) conf += 12; if (waist > 0) conf += 12; if (hip > 0) conf += 8;
  if (structureCount > 0) conf += 6 + 2 * Math.min(structureCount, 3); if (_num(m.yas) > 0) conf += 3; conf += 4;
  if (raised) conf -= 4; if (borderline) conf -= 6; if ((product.stretch || 'medium').toLowerCase() === 'none' && borderline) conf -= 3; if (!available) conf -= 5;
  conf = Math.round(_clamp(conf, 45, 98));

  // 4) Səbəblər + risklər + mesaj
  const reasons = [`${isTr ? 'Rəqəm' : 'INT hərf'} ölçü sistemi üzrə ${basis} əsasında hesablandı.`];
  if (raised) reasons.push('İkinci ölçünüz bir bant böyük olduğundan rahatlıq üçün bir ölçü qaldırıldı.');
  if (isCoat) reasons.push('Palto alt geyim üstündən geyildiyinə görə əlavə rahatlıq payı saxlanıldı.');
  if (isJeans) reasons.push('Cins şalvar: bel + omba və parça elastikliyi nəzərə alındı.');
  const bSrc = fromBrand ? `${String(product.brand).trim()} markası` : 'Bu məhsul';
  if (beh === 'runssmall') reasons.push(`${bSrc} kiçik kəsilir (runs small) — bir ölçü böyük tövsiyə olundu.`);
  else if (beh === 'runslarge') reasons.push(`${bSrc} böyük kəsilir (runs large) — bir ölçü kiçik tövsiyə olundu.`);
  else if (beh === 'oversize') reasons.push(`${bSrc} oversize dizaynıdır — lazımsız böyütmə edilmədi.`);
  fitReasons.forEach(r => reasons.push(r));
  reasons.push(`${recommended} ən balanslı nəticəni verir.`);
  const factors: string[] = []; if (_num(m.boy) > 0) factors.push('Boy'); if (_num(m.ceki) > 0) factors.push('Çəki'); if (chest > 0) factors.push('Sinə'); if (waist > 0) factors.push('Bel'); if (hip > 0) factors.push('Omba'); if (structureCount > 0) factors.push('Bədən quruluşu'); if (_num(m.yas) > 0) factors.push('Yaş');
  if (factors.length) reasons.push(`Hesablamaya təsir edən ölçülər: ${factors.join(', ')}.`);
  const risks = _risksFor(product, m, isBottom, borderline, available);

  // İdeal ölçü məhsulun stok diapazonundan kənardırsa → uyğun forma yoxdur
  const sizeIdxs = sizes.map(s => _sizeIndexOf(s, isTr)).filter(i => i >= 0);
  const outOfRange = sizeIdxs.length > 0 && (idxRounded < Math.min(...sizeIdxs) || idxRounded > Math.max(...sizeIdxs));
  const fits = !outOfRange;
  const message = outOfRange
    ? `Bu məhsulun sizin ölçünüzə uyğun forması yoxdur — bədəninizə ${idealLabel} uyğun gəlir, amma satışda yoxdur.`
    : (conf < 60 ? `${basis} əsasında ilkin tövsiyə ${recommended}. Dəqiqlik üçün əlavə ölçü daxil edin.` : `${basis} əsasında ${recommended} tövsiyə olunur.`);

  return { size: recommended, alternative: fits ? alternative : null, accuracy: conf, confidence: conf, hasMeasurements: true, available, fit: _expectedFit(product, m), reasons, risks, system, message, fits, factors };
}
