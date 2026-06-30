/* Statik hüquqi/info səhifələri: məxfilik, istifadə şərtləri, cookie, çatdırılma, geri qaytarma.
   Məzmun Gardrop hüquqi sənəd paketinə (komisyonçu/agent modeli) əsaslanır.
   QEYD: nümunə şablondur — istifadədən əvvəl lisenziyalı hüquqşünas yoxlamalıdır.
   DOCS və LegalModal həm bu səhifədə, həm də qeydiyyat formasında (popup) istifadə olunur. */
import React from "react";
import { Ic, API } from '../shared';
import type { NavFn } from '../types';

const { useEffect, useState } = React;

/* Admin paneldən redaktə olunan hüquqi mətnləri (legal_docs) gətirir; yoxdursa daxili DOCS. */
const useLegalDocs = (): Record<string, Doc> => {
  const [docs, setDocs] = useState<Record<string, Doc>>(DOCS);
  useEffect(() => {
    fetch(`${API}/api/content/legal_docs`).then(r => r.json()).then(d => {
      if (d && d.json) { try { const o = JSON.parse(d.json); if (o && typeof o === 'object') setDocs({ ...DOCS, ...o }); } catch { /* ignore */ } }
    }).catch(() => {});
  }, []);
  return docs;
};

interface Section { h: string; p: string[] }
interface Doc { title: string; updated: string; intro: string; sections: Section[]; note?: string }

export const DOCS: Record<string, Doc> = {
  privacy: {
    title: 'Məxfilik Siyasəti',
    updated: '26 iyun 2026',
    intro: 'Gardrop-da fərdi məlumatlarınızın təhlükəsizliyi prioritetdir. Bu Siyasət platformadan istifadə zamanı hansı məlumatları topladığımızı, onları hansı məqsədlərlə işlədiyimizi və necə qoruduğumuzu izah edir. Sənəd Azərbaycan Respublikasının "Fərdi məlumatlar haqqında" Qanununun tələblərinə uyğun hazırlanıb.',
    sections: [
      { h: '1. Topladığımız məlumatlar', p: [
        'Hesab və əlaqə məlumatları: ad, soyad, e-poçt ünvanı, telefon nömrəsi və çatdırılma ünvanı.',
        'Ölçü tövsiyəsi məlumatları (yalnız könüllü təqdim etdiyiniz halda): boy, çəki və digər bədən ölçüləri.',
        'Sifariş və davranış məlumatları: sifariş tarixçəsi, seçilmişlər, səbət fəaliyyəti və qiymətləndirmələriniz.',
        'Texniki məlumatlar: cihaz növü, brauzer, IP ünvanı və platformadan istifadə statistikası.',
      ] },
      { h: '2. Məlumatların işlənmə məqsədi', p: [
        'Sifarişlərin qəbulu, icrası, çatdırılması və ödənişlərin emalı.',
        'Sizə uyğun ölçü tövsiyəsinin və fərdiləşdirilmiş təkliflərin hazırlanması.',
        'Müştəri dəstəyinin göstərilməsi və mübahisələrin həlli.',
        'Platformanın təhlükəsizliyinin təmini, fırıldaqçılığın qarşısının alınması və xidmətin yaxşılaşdırılması.',
        'Yalnız ayrıca razılığınız əsasında — marketinq və kampaniya bildirişlərinin göndərilməsi.',
      ] },
      { h: '3. Hüquqi əsas və saxlanma müddəti', p: [
        'Məlumatlar sifarişin (müqavilənin) icrası, qanuni öhdəliklərimiz və ya açıq razılığınız əsasında işlənir.',
        'Boy, çəki və ölçü kimi həssas məlumatlar yalnız açıq razılıq əsasında işlənir və istənilən vaxt geri götürülə bilər.',
        'Məlumatlar yalnız müvafiq məqsəd üçün zəruri olan müddətdə saxlanılır; məqsəd aradan qalxdıqda və ya razılıq geri götürüldükdə silinir və ya anonimləşdirilir.',
      ] },
      { h: '4. Məlumatların paylaşılması', p: [
        'Sifarişin icrası üçün zəruri olan minimal məlumatlar yalnız müvafiq mağaza, kuryer xidməti və ödəniş provayderi ilə paylaşılır.',
        'Məlumatlarınızı üçüncü tərəflərə satmırıq və reklam məqsədi ilə ötürmürük.',
        'Məlumatlar yalnız qanunla tələb olunan hallarda və səlahiyyətli dövlət orqanlarının rəsmi sorğusu əsasında açıqlana bilər.',
      ] },
      { h: '5. Təhlükəsizlik', p: [
        'Məlumatların icazəsiz girişdən, itkidən və dəyişdirilmədən qorunması üçün təşkilati və texniki tədbirlər tətbiq edirik (şifrələmə, giriş nəzarəti, müntəzəm yoxlamalar).',
        'Ödəniş əməliyyatları sertifikatlı ödəniş provayderləri vasitəsilə aparılır; kart məlumatları serverlərimizdə saxlanılmır.',
      ] },
      { h: '6. Hüquqlarınız', p: [
        'Məlumatlarınıza giriş əldə etmək, onları düzəltmək, silmək, işlənməni məhdudlaşdırmaq və verdiyiniz razılığı geri götürmək hüququna maliksiniz.',
        'Hüquqlarınızı həyata keçirmək və ya suallarınız üçün support@gardrop.az ünvanına müraciət edə bilərsiniz. Sorğunuz qanunla müəyyən müddətdə cavablandırılır.',
      ] },
    ],
  },
  terms: {
    title: 'İstifadə Şərtləri',
    updated: '26 iyun 2026',
    intro: 'Bu İstifadə Şərtləri Gardrop platforması (bundan sonra "Platforma") ilə sizin aranızdakı münasibətləri tənzimləyir. Platformada qeydiyyatdan keçməklə, ondan istifadə etməklə və ya sifariş verməklə bu Şərtləri tam oxuduğunuzu, anladığınızı və qəbul etdiyinizi təsdiqləyirsiniz.',
    sections: [
      { h: '1. Platformanın rolu', p: [
        'Gardrop geyim mağazaları (satıcılar) ilə alıcılar arasında onlayn marketpleys xidməti göstərən vasitəçi platformadır.',
        'Mallar Platformada qeydiyyatdan keçmiş müstəqil mağazalara məxsusdur; Platforma onları mağazaların adından və hesabına komissiya əsasında satışa təqdim edir. Satıcının adı hər məhsulun səhifəsində göstərilir.',
      ] },
      { h: '2. Qeydiyyat və hesab təhlükəsizliyi', p: [
        'Qeydiyyat zamanı dəqiq, tam və aktual məlumat təqdim etməyə razılaşırsınız.',
        'Hesabınızın və giriş məlumatlarınızın məxfiliyinə görə məsuliyyət daşıyırsınız; hesabınız vasitəsilə həyata keçirilən bütün əməliyyatlar sizə aid sayılır.',
        'İcazəsiz girişdən şübhələndiyiniz halda dərhal bizə məlumat verməlisiniz.',
      ] },
      { h: '3. Sifariş, qiymət və ödəniş', p: [
        'Sifariş verməklə müvafiq malın satışına dair ofertanı qəbul etmiş olursunuz; sifarişin təsdiqi stokun mövcudluğundan asılıdır.',
        'Bütün qiymətlər Azərbaycan manatı (₼) ilə göstərilir və ƏDV daxildir.',
        'Ödəniş Platformanın təhlükəsiz ödəniş sistemi (bank kartı) və ya tətbiq olunan yerlərdə qapıda nağd üsulu ilə həyata keçirilir.',
        'Stok bitdikdə və ya qiymətdə açıq texniki səhv aşkar edildikdə sifarişi ləğv etmək və ödənilmiş məbləği tam qaytarmaq hüququnu saxlayırıq.',
      ] },
      { h: '4. İstifadəçinin öhdəlikləri', p: [
        'Platformadan yalnız qanuni məqsədlərlə istifadə etməyə razılaşırsınız.',
        'Saxta sifariş vermək, başqasının məlumatlarından istifadə etmək, Platformanın işinə müdaxilə etmək və ya məzmunu icazəsiz kopyalamaq qadağandır.',
      ] },
      { h: '5. Fikri mülkiyyət', p: [
        'Platformanın adı, loqosu, dizaynı, proqram təminatı və məzmunu Gardrop-a və ya müvafiq hüquq sahiblərinə məxsus qorunan fikri mülkiyyətdir.',
        'Yazılı icazə olmadan bu materialların surətinin çıxarılması və ya kommersiya məqsədilə istifadəsi qadağandır.',
      ] },
      { h: '6. Məsuliyyətin məhdudlaşdırılması', p: [
        'Platforma vasitəçi qismində malın keyfiyyətinə görə birbaşa məsuliyyət daşımır; malın keyfiyyət öhdəliyi müvafiq satıcı mağazaya aiddir. Bununla belə, mübahisələrin həllində alıcıya dəstək göstəririk.',
        'AI ölçü tövsiyəsi yalnız istiqamətləndirici xarakter daşıyır və dəqiq nəticəyə zəmanət vermir; son seçim istifadəçiyə aiddir.',
      ] },
      { h: '7. Dəyişikliklər və tətbiq olunan hüquq', p: [
        'Bu Şərtlərə vaxtaşırı dəyişiklik edə bilərik; dəyişikliklər Platformada dərc edildiyi andan qüvvəyə minir. Əhəmiyyətli dəyişikliklər barədə əvvəlcədən məlumatlandırılırsınız.',
        'Bu Şərtlərə Azərbaycan Respublikasının qanunvericiliyi tətbiq olunur; mübahisələr ilk növbədə danışıqlar yolu ilə, mümkün olmadıqda Azərbaycan Respublikasının məhkəmələrində həll edilir.',
      ] },
    ],
  },
  cookies: {
    title: 'Cookie Siyasəti',
    updated: '26 iyun 2026',
    intro: 'Gardrop saytın düzgün işləməsini təmin etmək, seçimlərinizi yadda saxlamaq və təcrübənizi yaxşılaşdırmaq üçün cookie və oxşar texnologiyalardan istifadə edir. Bu Siyasət hansı cookie-lərdən istifadə etdiyimizi və onları necə idarə edə biləcəyinizi izah edir.',
    sections: [
      { h: '1. Cookie nədir?', p: [
        'Cookie saytı ziyarət etdiyiniz zaman cihazınızda saxlanan kiçik mətn faylıdır. O, sizi təkrar girişlərdə tanımağa və saytın daha rahat işləməsinə imkan verir.',
      ] },
      { h: '2. İstifadə etdiyimiz cookie növləri', p: [
        'Zəruri cookie-lər: giriş sessiyası (token) və səbət kimi əsas funksiyalar üçündür — onlarsız sayt düzgün işləməz.',
        'Funksional cookie-lər: dil seçimi və fərdi tövsiyə tərcihləri kimi parametrləri yadda saxlayır.',
        'Analitik cookie-lər: saytın necə istifadə olunduğunu anonim şəkildə ölçərək xidməti yaxşılaşdırmağa kömək edir.',
      ] },
      { h: '3. Cookie-lərin idarə edilməsi', p: [
        'Brauzerinizin parametrlərindən cookie-ləri silə, bloklaya və ya onlar barədə xəbərdarlıq ala bilərsiniz.',
        'Zəruri cookie-ləri söndürdükdə hesaba giriş və səbət kimi funksiyalar işləməyə bilər.',
      ] },
    ],
  },
  delivery: {
    title: 'Çatdırılma Şərtləri',
    updated: '26 iyun 2026',
    intro: 'Çatdırılmanı Gardrop öz logistika resursları və ya tərəfdaş kuryer xidmətləri vasitəsilə təşkil edir. Çatdırılma müddəti və dəyəri ünvana, məsafəyə və sifariş məbləğinə görə hesablanır və ödənişdən əvvəl sizə göstərilir.',
    sections: [
      { h: '1. Çatdırılma müddəti', p: [
        'Bakı şəhəri daxili: standart çatdırılma 1–2 iş günü; ekspress çatdırılma sifariş günü ərzində.',
        'Regionlar: 3–5 iş günü (ünvana görə ayrıca dəqiqləşdirilir).',
        'Müddətlər sifarişin təsdiqlənməsindən sonra hesablanır; rəsmi bayram günlərində uzana bilər.',
      ] },
      { h: '2. Çatdırılma tarifləri (Bakı şəhəri)', p: [
        '5 km-ə qədər məsafə: 3,00 ₼.',
        '5 km-dən artıq məsafə: hər əlavə km üçün +0,50 ₼ (standart tarif adətən 7–10 ₼ aralığında).',
        'Ekspress (sifariş günü) çatdırılma: +5,00 ₼.',
        'Müəyyən məbləğdən yuxarı sifarişlərə standart çatdırılma pulsuzdur.',
        'Müxtəlif mağazalardan ibarət sifarişlərdə çatdırılma haqqı məsafələrin ortalaması əsasında hesablanır.',
      ] },
      { h: '3. Qəbul və məsuliyyət', p: [
        'Sifarişi təhvil alarkən qablaşdırmanın bütövlüyünü yoxlamağınızı tövsiyə edirik.',
        'Kuryer göndərişi qəbul etdiyi andan sizə təhvil verənədək itki və zədələnməyə görə (öz təqsiri olduqda) məsuliyyət daşıyır.',
        'Zədəsiz qablaşdırmada təhvil alınan və açılma izi olmayan malın sonradan keyfiyyətinə dair iddialar fərdi qaydada araşdırılır.',
      ] },
    ],
  },
  returns: {
    title: 'Geri Qaytarma və Dəyişdirmə',
    updated: '26 iyun 2026',
    intro: 'Aldığınız məhsuldan razı qalmasanız, Azərbaycan Respublikasının istehlakçıların hüquqlarının müdafiəsi haqqında qanunvericiliyinə uyğun olaraq onu geri qaytara və ya dəyişdirə bilərsiniz. Prosesi sizin üçün mümkün qədər sadə etməyə çalışırıq.',
    sections: [
      { h: '1. Geri qaytarma şərtləri', p: [
        'Çatdırılmadan sonra qanunla müəyyən müddət ərzində (adətən 14 təqvim günü) geri qaytarma sorğusu verə bilərsiniz.',
        'Məhsul istifadə edilməmiş, yuyulmamış, bütün etiketləri yerində və orijinal qablaşdırmasında olmalıdır.',
        'Geri qaytarma üçün satınalma sənədi və ya sifariş nömrəsi tələb oluna bilər.',
      ] },
      { h: '2. Geri qaytarma proseduru', p: [
        'Profil → "Sifarişlərim" bölməsindən geri qaytarma sorğusu yaradın və ya müştəri dəstəyi ilə əlaqə saxlayın.',
        'Sorğu təsdiqləndikdən sonra məhsul müvafiq mağazaya qaytarılır.',
        'Qaytarılan məhsul yoxlanıldıqdan sonra ödədiyiniz məbləğ eyni ödəniş üsulu ilə geri qaytarılır (adətən 3–10 iş günü ərzində).',
        'Sifariş hələ hazırlanma mərhələsindədirsə, onu birbaşa "Sifarişlərim" bölməsindən pulsuz ləğv edə bilərsiniz.',
      ] },
      { h: '3. İstisnalar', p: [
        'Gigiyenik səbəblərlə bəzi məhsul kateqoriyaları (alt geyim, corab və s.) qüsuru olmadıqda geri qaytarılmır.',
        'İstifadə nəticəsində zədələnmiş, etiketi və ya qablaşdırması olmayan məhsullar qəbul edilmir.',
        'Bu məhdudiyyətlər malın istehsal qüsuru və ya yanlış göndərilməsi hallarına şamil edilmir — belə hallarda tam geri qaytarma və ya dəyişdirmə təmin olunur.',
      ] },
    ],
  },
};

/* Sənədin gövdəsi — həm tam səhifədə, həm modalda eyni render. */
const DocBody = ({ doc }: { doc: Doc }): React.ReactElement => (
  <>
    <p className="text-t2 leading-relaxed mb-8">{doc.intro}</p>
    <div className="space-y-7">
      {doc.sections.map((s,i)=>(
        <section key={i}>
          <h2 className="text-lg font-bold text-brand mb-2">{s.h}</h2>
          <ul className="space-y-1.5">
            {s.p.map((line,j)=>(
              <li key={j} className="text-t2 text-sm leading-relaxed flex gap-2"><span className="text-accent-t shrink-0">•</span><span>{line}</span></li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  </>
);

/* Popup variant — qeydiyyat formasında "İstifadə Şərtləri" linkindən açılır. */
export const LegalModal = ({ topic, onClose }: { topic: string; onClose: ()=>void }): React.ReactElement => {
  const docs = useLegalDocs();
  const doc = docs[topic] || docs.terms;
  useEffect(()=>{
    const onKey = (e: KeyboardEvent)=>{ if(e.key==='Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return ()=>{ document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  },[onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4" role="dialog" aria-modal="true" aria-label={doc.title}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose}/>
      <div className="relative w-full md:max-w-2xl bg-white rounded-t-sheet2 md:rounded-sheet2 shadow-card max-h-[85vh] md:max-h-[80vh] flex flex-col anim-pop">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-bdr shrink-0">
          <div>
            <h1 className="text-xl font-black text-brand">{doc.title}</h1>
            <p className="text-xs text-t3 mt-0.5">Son yenilənmə: {doc.updated}</p>
          </div>
          <button onClick={onClose} aria-label="Bağla" className="w-9 h-9 -mr-1 rounded-full hover:bg-bg2 flex items-center justify-center text-t2 hover:text-brand transition-colors shrink-0"><Ic.X className="w-5 h-5"/></button>
        </div>
        <div className="overflow-y-auto px-6 py-6">
          <DocBody doc={doc}/>
        </div>
      </div>
    </div>
  );
};

const InfoPage = ({ topic, nav }: { topic: string; nav: NavFn }): React.ReactElement => {
  const docs = useLegalDocs();
  const doc = docs[topic] || docs.privacy;
  return (
    <div className="pb-24 md:pb-0">
      <div className="bg-bg2 border-b border-bdr hidden md:block">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-t2">
          <button className="hover:text-brand transition-colors" onClick={()=>nav('home')}>Ana səhifə</button>
          <Ic.ChevR className="w-3 h-3 shrink-0"/><span className="text-brand font-medium">{doc.title}</span>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black text-brand mb-1">{doc.title}</h1>
        <p className="text-xs text-t3 mb-6">Son yenilənmə: {doc.updated}</p>
        <DocBody doc={doc}/>
        <div className="mt-10 bg-bg2 rounded-card p-4 text-sm text-t2">
          Suallarınız var? <button className="text-brand font-semibold underline" onClick={()=>nav('home')}>Ana səhifə</button> · support@gardrop.az · +994 12 345 67 89
        </div>
      </div>
    </div>
  );
};

export default InfoPage;
