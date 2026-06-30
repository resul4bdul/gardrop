/* Mağaza Ayarları (FAZA 6) — blue UI, sectioned: ümumi/əlaqə/sosial/çatdırılma/bank/hüquqi/bildiriş. */
import React from "react";
const { useState, useEffect } = React;
import { MapPicker, uploadFilesStore, resolveImg } from "./shared";
import { SectionCard, Field, Input, Textarea, Button, Spinner, Switch, Avatar } from "./ui";
import type { ApiFn, ToastFn, Store, StoreSettings } from "./types";

const EMPTY_SETTINGS: StoreSettings = {
  bankName: "", iban: "", beneficiary: "", voen: "", legalName: "",
  notifyNewOrder: true, notifyNewReview: true, notifyEmail: true,
};

export function StoreProfile({ api, toast, store, onUpdated }: { api: ApiFn; toast: ToastFn; store: Store; onUpdated?: (s: Store) => void }) {
  const [f, setF] = useState<Store>({ ...store });
  const [se, setSe] = useState<StoreSettings>(EMPTY_SETTINGS);
  const [mapOpen, setMapOpen] = useState(false), [busy, setBusy] = useState(false);
  const [upLogo, setUpLogo] = useState(false), [upBanner, setUpBanner] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" }), [pwBusy, setPwBusy] = useState(false);

  // Həssas ayarları ayrıca endpoint-dən çək (StoreView-ə daxil deyil).
  useEffect(() => {
    let live = true;
    api<StoreSettings>(`/api/store/${store.id}/settings`)
      .then((s) => { if (live) setSe({ ...EMPTY_SETTINGS, ...s }); })
      .catch(() => {});
    return () => { live = false; };
  }, [store.id]);

  const str = (k: keyof Store) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const num = (k: keyof Store) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value === "" ? null : Number(e.target.value) });
  const sstr = (k: keyof StoreSettings) => (e: React.ChangeEvent<HTMLInputElement>) => setSe({ ...se, [k]: e.target.value });
  const sbool = (k: keyof StoreSettings) => (v: boolean) => setSe({ ...se, [k]: v });

  const upload = async (files: FileList | null, key: "logo" | "banner", setUp: (b: boolean) => void) => {
    if (!files || !files.length) return;
    setUp(true);
    try { const urls = await uploadFilesStore(files); if (urls[0]) setF((s) => ({ ...s, [key]: urls[0] })); }
    catch (e) { toast((e as Error).message, "error"); }
    setUp(false);
  };

  const save = async () => {
    setBusy(true);
    try {
      const body = {
        name: f.name, city: f.city, established: f.established == null ? null : Number(f.established),
        address: f.address, logo: f.logo || "", lat: f.lat, lng: f.lng,
        banner: f.banner || "", url: f.url || "", about: f.about || "",
        instagram: f.instagram || "", facebook: f.facebook || "", tiktok: f.tiktok || "", whatsapp: f.whatsapp || "",
        phone: f.phone || "", email: f.email || "",
        prepDays: f.prepDays == null ? null : Number(f.prepDays), returnDays: f.returnDays == null ? null : Number(f.returnDays),
        bankName: se.bankName, iban: se.iban, beneficiary: se.beneficiary, voen: se.voen, legalName: se.legalName,
        notifyNewOrder: se.notifyNewOrder, notifyNewReview: se.notifyNewReview, notifyEmail: se.notifyEmail,
      };
      const upd = await api<Store>(`/api/store/me/${store.id}`, { method: "PUT", body: JSON.stringify(body) });
      toast("Mağaza ayarları yeniləndi", "success"); onUpdated && onUpdated(upd);
    } catch (e) { toast((e as Error).message, "error"); }
    setBusy(false);
  };

  const changePw = async () => {
    if (pw.next.length < 6) { toast("Yeni şifrə min 6 simvol olmalıdır", "error"); return; }
    if (pw.next !== pw.confirm) { toast("Şifrələr uyğun gəlmir", "error"); return; }
    setPwBusy(true);
    try {
      await api(`/api/profile/password`, { method: "POST", body: JSON.stringify({ current: pw.current, password: pw.next }) });
      toast("Şifrə dəyişdirildi", "success"); setPw({ current: "", next: "", confirm: "" });
    } catch (e) { toast((e as Error).message, "error"); }
    setPwBusy(false);
  };

  const ToggleRow = ({ label, hint, k }: { label: string; hint: string; k: keyof StoreSettings }) => (
    <div className="flex items-center justify-between gap-4 py-2">
      <div><div className="text-sm font-medium text-slate-800">{label}</div><div className="text-xs text-slate-400">{hint}</div></div>
      <Switch checked={se[k] as boolean} onChange={sbool(k)} />
    </div>
  );

  return (
    <div className="max-w-3xl space-y-5">
      {/* ── Ümumi ── */}
      <SectionCard title="Ümumi" sub="Logo, banner, ad, URL və haqqımızda mətni">
        {/* Banner */}
        <div className="mb-4">
          <span className="block text-xs font-semibold text-slate-600 mb-1.5">Banner</span>
          <div className="relative h-32 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
            {f.banner ? <img src={resolveImg(f.banner)} alt="banner" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <span className="text-sm text-slate-400">Banner şəkli yoxdur</span>}
            <div className="absolute bottom-2 right-2 flex gap-2">
              <label className="inline-flex items-center gap-1.5 bg-white/90 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer text-emerald-600 hover:border-emerald-600">
                {upBanner ? <><Spinner className="w-3.5 h-3.5" /> Yüklənir…</> : <>Şəkil yüklə</>}
                <input type="file" accept="image/*" className="hidden" disabled={upBanner} onChange={(e) => { upload(e.target.files, "banner", setUpBanner); e.target.value = ""; }} />
              </label>
              {f.banner && <button type="button" onClick={() => setF({ ...f, banner: "" })} className="bg-white/90 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-rose-600">Sil</button>}
            </div>
          </div>
        </div>
        {/* Logo */}
        <div className="flex items-center gap-4 mb-4">
          <Avatar name={f.name} src={f.logo ? resolveImg(f.logo) : undefined} className="w-20 h-20 text-2xl" />
          <div className="flex-1">
            <span className="block text-xs font-semibold text-slate-600 mb-1.5">Profil şəkli (logo)</span>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 text-sm cursor-pointer text-emerald-600 hover:border-emerald-600">
                {upLogo ? <><Spinner /> Yüklənir…</> : <>Şəkil yüklə</>}
                <input type="file" accept="image/*" className="hidden" disabled={upLogo} onChange={(e) => { upload(e.target.files, "logo", setUpLogo); e.target.value = ""; }} />
              </label>
              {f.logo && <button type="button" onClick={() => setF({ ...f, logo: "" })} className="text-sm text-rose-600 hover:underline">Sil</button>}
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><Field label="Mağaza adı"><Input value={f.name || ""} onChange={str("name")} /></Field></div>
          <Field label="Mağaza URL / slug"><Input value={f.url || ""} onChange={str("url")} placeholder="menim-magazam" /></Field>
          <Field label="Təsis ili"><Input type="number" value={f.established ?? ""} onChange={num("established")} /></Field>
          <div className="sm:col-span-2"><Field label="Haqqımızda"><Textarea rows={3} value={f.about || ""} onChange={str("about")} placeholder="Mağaza haqqında qısa məlumat" /></Field></div>
        </div>
      </SectionCard>

      {/* ── Əlaqə ── */}
      <SectionCard title="Əlaqə" sub="Telefon, email, şəhər və ünvan">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Telefon"><Input value={f.phone || ""} onChange={str("phone")} placeholder="+994 .." /></Field>
          <Field label="Email"><Input type="email" value={f.email || ""} onChange={str("email")} placeholder="info@magaza.az" /></Field>
          <Field label="Şəhər"><Input value={f.city || ""} onChange={str("city")} /></Field>
          <Field label="Ünvan"><Input value={f.address || ""} onChange={str("address")} placeholder="Küçə, bina, şəhər" /></Field>
        </div>
        <div className="mt-3 bg-slate-50 rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-emerald-600">Mağaza məkanı</div>
            <p className="text-xs text-slate-500 mt-0.5">{f.lat ? `${Number(f.lat).toFixed(5)}, ${Number(f.lng).toFixed(5)}` : "Məkan seçilməyib — çatdırılma xərci üçün vacibdir"}</p>
          </div>
          <Button variant="secondary" onClick={() => setMapOpen(true)}>{f.lat ? "Dəyiş" : "Xəritədən seç"}</Button>
        </div>
      </SectionCard>

      {/* ── Sosial ── */}
      <SectionCard title="Sosial şəbəkələr" sub="Storefront-da göstərilir">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Instagram"><Input value={f.instagram || ""} onChange={str("instagram")} placeholder="@hesab və ya link" /></Field>
          <Field label="Facebook"><Input value={f.facebook || ""} onChange={str("facebook")} /></Field>
          <Field label="TikTok"><Input value={f.tiktok || ""} onChange={str("tiktok")} /></Field>
          <Field label="WhatsApp"><Input value={f.whatsapp || ""} onChange={str("whatsapp")} placeholder="+994 .." /></Field>
        </div>
      </SectionCard>

      {/* ── Çatdırılma ── */}
      <SectionCard title="Çatdırılma" sub="Alıcıya göstərilən müddətlər (gün)">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Hazırlanma müddəti (gün)"><Input type="number" min={0} value={f.prepDays ?? ""} onChange={num("prepDays")} placeholder="1" /></Field>
          <Field label="Geri qaytarma müddəti (gün)"><Input type="number" min={0} value={f.returnDays ?? ""} onChange={num("returnDays")} placeholder="14" /></Field>
        </div>
      </SectionCard>

      {/* ── Bank (həssas) ── */}
      <SectionCard title="Bank məlumatları" sub="Ödənişlər üçün — yalnız siz görürsünüz">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Bank adı"><Input value={se.bankName} onChange={sstr("bankName")} /></Field>
          <Field label="IBAN"><Input value={se.iban} onChange={sstr("iban")} placeholder="AZ.." /></Field>
          <div className="sm:col-span-2"><Field label="Benefisiar (hesab sahibi)"><Input value={se.beneficiary} onChange={sstr("beneficiary")} /></Field></div>
        </div>
      </SectionCard>

      {/* ── Hüquqi (həssas) ── */}
      <SectionCard title="Hüquqi məlumatlar" sub="Yalnız siz görürsünüz">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="VÖEN"><Input value={se.voen} onChange={sstr("voen")} /></Field>
          <Field label="Hüquqi şəxs / fərdi sahibkar adı"><Input value={se.legalName} onChange={sstr("legalName")} /></Field>
        </div>
      </SectionCard>

      {/* ── Bildirişlər ── */}
      <SectionCard title="Bildirişlər" sub="Hansı hadisələrdə bildiriş alasınız">
        <div className="divide-y divide-slate-100">
          <ToggleRow label="Yeni sifariş" hint="Yeni sifariş daxil olanda" k="notifyNewOrder" />
          <ToggleRow label="Yeni rəy" hint="Məhsula yeni rəy yazılanda" k="notifyNewReview" />
          <ToggleRow label="Email bildiriş" hint="Bildirişlər email-ə də göndərilsin" k="notifyEmail" />
        </div>
      </SectionCard>

      {/* ── Təhlükəsizlik (şifrə) ── */}
      <SectionCard title="Təhlükəsizlik" sub="Hesab şifrəsini dəyiş">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Cari şifrə"><Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" /></Field>
          <Field label="Yeni şifrə"><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" placeholder="min 6 simvol" /></Field>
          <Field label="Yeni şifrə (təkrar)"><Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" /></Field>
        </div>
        <div className="flex justify-end mt-3">
          <Button variant="secondary" onClick={changePw} loading={pwBusy} disabled={pwBusy || !pw.next}>Şifrəni dəyiş</Button>
        </div>
      </SectionCard>

      {/* ── Stats (read-only) ── */}
      <div className="grid grid-cols-3 gap-3">
        {[["Reytinq", "★ " + (store.rating || 0).toFixed(1)], ["Rəylər", store.reviews ?? 0], ["Məhsullar", store.products ?? 0]].map(([k, v]) => (
          <div key={k} className="bg-white border border-slate-200 rounded-2xl p-3 text-center"><div className="text-xs text-slate-400">{k}</div><div className="font-bold mt-0.5 text-slate-800">{v}</div></div>))}
      </div>

      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white pt-3 pb-1 flex justify-end">
        <Button onClick={save} loading={busy} disabled={busy || !f.name}>Yadda saxla</Button>
      </div>

      {mapOpen && <MapPicker initial={f.lat ? { lat: f.lat, lng: f.lng ?? 0 } : null} onClose={() => setMapOpen(false)} onSelect={({ lat, lng, addr }) => setF((s) => ({ ...s, lat, lng, address: addr || s.address }))} />}
    </div>
  );
}

export default StoreProfile;
