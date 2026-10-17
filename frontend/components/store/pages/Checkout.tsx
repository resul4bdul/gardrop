/* CheckoutPage + OrderSuccessPage (B.3: GardropApp.tsx-dən çıxarıldı). */
import React from "react";
import { Ic, Img, Spinner, Field, formatPhone, API, bearer, t } from '../shared';
import { MapPicker } from './MapPicker';
import { DeliveryWhyPopup } from './Cart';
import type { Address, CartItem, CouponMsg, DeliveryInfo, NavFn, User } from '../types';

const { useState, useEffect } = React;

const CheckoutPage = ({ cart, nav, clearCart, token, user, setOrderNo, refreshUser }: { cart: CartItem[]; nav: NavFn; clearCart: () => void; token: string | null; user: User | null; setOrderNo: (s: string) => void; refreshUser: () => void | Promise<unknown> }) => {
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({ad:user?.ad||'',soyad:user?.soyad||'',email:user?.email||'',telefon:user?.telefon||''});
  const [submitting,setSubmit]=useState(false);
  const [payMethod,setPayMethod]=useState('Nağd');
  const total=cart.reduce((s,i)=>s+i.price*(i.qty||1),0);
  const upd=(k: 'ad'|'soyad'|'email'|'telefon',v: string)=>setForm(f=>({...f,[k]:v}));
  const steps=['Çatdırılma','Ödəniş','Təsdiq'];

  // ── Ödəniş şlüzü konfiqi (A.1): online=true → Kart aktiv, Stripe-a redirect ──
  const [payOnline,setPayOnline]=useState(false);
  useEffect(()=>{
    let cancel=false;
    fetch(`${API}/api/payments/config`).then(r=>r.json()).then(d=>{ if(!cancel) setPayOnline(!!d.online); }).catch(()=>{});
    return ()=>{cancel=true;};
  },[]);

  // ── Çatdırılma xərci (mağaza↔müştəri məsafəsinə görə) + növ + kupon ──
  const [deliveryInfo,setDeliveryInfo]=useState<DeliveryInfo | null>(null);
  const [delType,setDelType]=useState('Standart');   // 'Standart' | 'Ekspress'
  const [whyOpen,setWhyOpen]=useState(false);
  const delivery = deliveryInfo
    ? (delType==='Ekspress' ? (deliveryInfo.expressFee??8) : (deliveryInfo.standardFee??3))
    : (delType==='Ekspress' ? 8 : 3);
  const [coupon,setCoupon]=useState(''); const [discount,setDiscount]=useState(0);
  const [appliedCoupon,setAppliedCoupon]=useState<string | null>(null); const [couponMsg,setCouponMsg]=useState<CouponMsg | null>(null);

  // ── Çatdırılma ünvanı: profildə varsa avtomatik, yoxsa əl ilə / xəritədən (yalnız Bakı) ──
  const savedAddrs: Address[] = user?.addresses||[];
  const [addrMode,setAddrMode]=useState(savedAddrs.length?'select':'new');
  const [selAddrId,setSelAddrId]=useState<number | null>(savedAddrs[0]?.id||null);
  const [newAddr,setNewAddr]=useState<{ unvan: string; lat: number | null; lng: number | null }>({unvan:'',lat:null,lng:null});
  const [mapOpen,setMapOpen]=useState(false);
  const selectedAddr = savedAddrs.find(a=>a.id===selAddrId);
  const effUnvan = (addrMode==='select' ? (selectedAddr?.unvan||'') : newAddr.unvan).trim();
  const effLat = addrMode==='select' ? (selectedAddr?.lat ?? null) : (newAddr.lat ?? null);
  const effLng = addrMode==='select' ? (selectedAddr?.lng ?? null) : (newAddr.lng ?? null);

  // Ünvan koordinatı / cəm dəyişəndə çatdırılma xərcini yenidən hesabla (standart+ekspress)
  useEffect(()=>{
    let cancel=false;
    fetch(`${API}/api/delivery/quote`,{method:'POST',headers:bearer(token),body:JSON.stringify({lat:effLat,lng:effLng,subtotal:total})})
      .then(r=>r.json()).then(d=>{ if(!cancel && typeof d.standardFee==='number'){ setDeliveryInfo(d); } }).catch(()=>{});
    return ()=>{cancel=true;};
  },[effLat,effLng,token,total]);

  const applyCoupon=async()=>{
    const code=coupon.trim(); if(!code){ return; }
    try{
      const r=await fetch(`${API}/api/coupons/validate`,{method:'POST',headers:bearer(token),body:JSON.stringify({code,subtotal:total})});
      const d=await r.json();
      if(d.valid){ setDiscount(d.discount); setAppliedCoupon(d.code); setCouponMsg({ok:true,text:`✓ ${d.code} tətbiq edildi — ${d.discount.toFixed(2)} ₼ endirim`}); }
      else { setDiscount(0); setAppliedCoupon(null); setCouponMsg({ok:false,text:d.error||'Kupon etibarsızdır'}); }
    }catch{ setCouponMsg({ok:false,text:'Xəta baş verdi'}); }
  };
  const removeCoupon=()=>{ setCoupon(''); setDiscount(0); setAppliedCoupon(null); setCouponMsg(null); };
  const grandTotal=Math.max(0,total-discount)+delivery;

  const confirmOrder = async () => {
    setSubmit(true);
    try{
      const r = await fetch(`${API}/api/orders`,{method:'POST',headers:bearer(token),body:JSON.stringify({
        items: cart.map(i=>({id:i.id,name:i.name,store:i.store,price:i.price,qty:i.qty||1,selectedSize:i.selectedSize||i.size})),
        total: grandTotal,
        deliveryAddress:{ad:form.ad,soyad:form.soyad,telefon:form.telefon,sehir:'Bakı',unvan:effUnvan,lat:effLat,lng:effLng},
        payment:{method:payMethod, last4:''},
        couponCode: appliedCoupon,
        deliveryType: delType
      })});
      const data = await r.json();
      if(data.orderNo) setOrderNo(data.orderNo);
      // yeni daxil edilən ünvanı profilə də yaz (növbəti alış-veriş üçün)
      if(addrMode==='new' && effUnvan && !savedAddrs.some(a=>a.unvan===effUnvan)){
        try{ await fetch(`${API}/api/addresses`,{method:'POST',headers:bearer(token),body:JSON.stringify({unvan:effUnvan,lat:newAddr.lat,lng:newAddr.lng})}); refreshUser&&refreshUser(); }catch{}
      }
      // Onlayn şlüz: sifariş yaranıb (Gözləyir) → Stripe hosted səhifəsinə yönləndir.
      // success_url uğurlu ödənişdən sonra #/order-success-ə qaytarır; webhook PaymentStatus→Paid.
      if(data.checkoutUrl){ clearCart(); window.location.href=data.checkoutUrl; return; }
    }catch{}
    setSubmit(false); clearCart(); nav('order-success');
  };

  return (
    <div className="pb-24 md:pb-0 min-h-screen bg-bg2">
      <div className="bg-white border-b border-bdr">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button className="text-xl font-black tracking-widest text-brand mb-4" onClick={()=>nav('home')}>GARDROP</button>
          <div className="flex items-center gap-2">
            {steps.map((s,i)=>(
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 text-sm font-medium ${step>i+1?'text-accent-t':step===i+1?'text-brand':'text-t3'}`}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{backgroundColor: step>i+1?'#69EA9B':step===i+1?'#0A0A0A':'#EFEFEF', color: step>i+1?'#0A4020':step===i+1?'#fff':'#9E9E9E'}}>{step>i+1?'✓':i+1}</div>
                  <span className="hidden sm:block">{t(s)}</span>
                </div>
                {i<2 && <div className="flex-1 h-0.5" style={{backgroundColor: step>i+1?'#69EA9B':'#E0E0E0'}}/>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            {step===1 && (
              <div className="bg-white rounded-sheet p-6 shadow-xs border border-bdr anim-fade">
                <h2 className="text-lg font-bold text-brand mb-5">📍 Çatdırılma ünvanı</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field sm label="Ad" placeholder="Adınız" value={form.ad} onChange={e=>upd('ad',e.target.value)}/>
                    <Field sm label="Soyad" placeholder="Soyadınız" value={form.soyad} onChange={e=>upd('soyad',e.target.value)}/>
                  </div>
                  <Field sm type="email" label="Email" placeholder="email@numune.com" value={form.email} onChange={e=>upd('email',e.target.value)}/>
                  <Field sm type="tel" label="Telefon" placeholder="+994 50 123 45 67" value={formatPhone(form.telefon)} onChange={e=>upd('telefon',formatPhone(e.target.value))}/>

                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-brand mb-2">Çatdırılma ünvanı</label>
                    {addrMode==='select' && savedAddrs.length>0 ? (
                      <div className="space-y-2">
                        {savedAddrs.map(a=>(
                          <button key={a.id} type="button" onClick={()=>setSelAddrId(a.id)} className={`w-full text-left border-2 rounded-card p-3 flex items-start gap-3 transition-colors ${selAddrId===a.id?'border-brand bg-bg2':'border-bdr hover:border-bdr-s'}`}>
                            <span className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${selAddrId===a.id?'border-brand':'border-bdr-s'}`}>{selAddrId===a.id&&<span className="w-2 h-2 rounded-full bg-brand"/>}</span>
                            <span className="flex items-start gap-2 flex-1 min-w-0"><Ic.MapPin className="w-4 h-4 text-t3 shrink-0 mt-0.5"/><span className="text-sm text-brand">{a.unvan}</span></span>
                          </button>
                        ))}
                        <div className="flex items-center gap-3 pt-1 text-sm">
                          <button type="button" className="font-medium text-brand underline" onClick={()=>{ const a=selectedAddr; setNewAddr({unvan:a?.unvan||'',lat:a?.lat??null,lng:a?.lng??null}); setAddrMode('new'); }}>✏️ Redaktə et</button>
                          <span className="text-t3">·</span>
                          <button type="button" className="font-medium text-brand underline" onClick={()=>{ setNewAddr({unvan:'',lat:null,lng:null}); setAddrMode('new'); }}>+ Yeni ünvan</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Field sm label="Ünvan (Bakı daxili)" placeholder="Küçə, bina, mənzil..." value={newAddr.unvan} onChange={e=>setNewAddr(s=>({...s,unvan:e.target.value}))}/>
                        <button type="button" className="w-full flex items-center justify-center gap-2 border border-bdr text-brand py-2.5 rounded-btn text-sm font-semibold hover:border-brand transition-colors" onClick={()=>setMapOpen(true)}><Ic.MapPin className="w-4 h-4"/> {newAddr.lat?'Xəritədə dəyiş':'Xəritədən seç'}</button>
                        {savedAddrs.length>0 && <button type="button" className="text-sm font-medium text-brand underline" onClick={()=>setAddrMode('select')}>← Saxlanmış ünvanlardan seç</button>}
                        <p className="text-xs text-t3">Bu ünvan profilinizə də əlavə olunacaq.</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-bdr">
                  <label className="block text-xs font-semibold text-brand mb-2">🚚 Çatdırılma növü</label>
                  <div className="space-y-2">
                    {[
                      {k:'Standart', tt:'Standart çatdırılma', d:'2–5 iş günü', fee: deliveryInfo?(deliveryInfo.standardFee??3):3},
                      {k:'Ekspress', tt:'Ekspress çatdırılma', d:'Gün içində (+5 ₼)', fee: deliveryInfo?(deliveryInfo.expressFee??8):8},
                    ].map(o=>(
                      <button key={o.k} type="button" onClick={()=>setDelType(o.k)} className={`w-full text-left border-2 rounded-card p-3 flex items-center gap-3 transition-colors ${delType===o.k?'border-brand bg-bg2':'border-bdr hover:border-bdr-s'}`}>
                        <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${delType===o.k?'border-brand':'border-bdr-s'}`}>{delType===o.k&&<span className="w-2 h-2 rounded-full bg-brand"/>}</span>
                        <span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-brand">{o.tt}</span><span className="block text-xs text-t2">{o.d}</span></span>
                        <span className="text-sm font-bold text-brand shrink-0">{deliveryInfo&&deliveryInfo.free&&o.k==='Standart' ? 'Pulsuz' : `${o.fee.toFixed(2)} ₼`}</span>
                      </button>
                    ))}
                  </div>
                  {deliveryInfo&&deliveryInfo.free
                    ? <p className="text-[11px] text-accent-t mt-1.5">✓ 200 ₼-dan yuxarı sifariş — standart çatdırılma pulsuz</p>
                    : <p className="text-[11px] text-t3 mt-1.5">200 ₼-dan yuxarı sifarişlərə standart çatdırılma pulsuzdur{total<200?` (${(200-total).toFixed(2)} ₼ qaldı)`:''}.</p>}
                </div>
                <button disabled={!effUnvan} className="w-full bg-brand text-white py-[11px] rounded-btn font-semibold mt-6 hover:bg-brand-h transition-all active:scale-[0.99] text-[15px] disabled:opacity-50 disabled:cursor-not-allowed" onClick={()=>setStep(2)}>Davam et →</button>
                {mapOpen && <MapPicker initial={(newAddr.lat!=null&&newAddr.lng!=null)?{lat:newAddr.lat,lng:newAddr.lng}:null} onClose={()=>setMapOpen(false)} onSelect={({lat,lng,addr})=>setNewAddr(s=>({...s,lat,lng,unvan:addr||s.unvan}))}/>}
              </div>
            )}
            {step===2 && (
              <div className="bg-white rounded-sheet p-6 shadow-xs border border-bdr anim-fade">
                <h2 className="text-lg font-bold text-brand mb-5">💳 Ödəniş üsulu</h2>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[{l:'Nağd',e:'💵'},{l:'Kart',e:'💳'}].map(m=>(
                    <button key={m.l} onClick={()=>setPayMethod(m.l)} className={`border-2 rounded-btn py-3 text-sm font-semibold flex flex-col items-center gap-1 transition-colors ${payMethod===m.l?'border-brand bg-bg2 text-brand':'border-bdr text-t2 hover:border-bdr-s'}`}><span className="text-xl">{m.e}</span>{m.l}</button>
                  ))}
                </div>
                {payMethod==='Nağd' && (
                  <div className="rounded-card p-4 text-sm anim-fade flex items-start gap-3" style={{backgroundColor:'#F7F7F7'}}>
                    <span className="text-xl">💵</span><p className="text-t2 leading-relaxed">Çatdırılma zamanı kuryerə nağd ödəniş edəcəksiniz. Zəhmət olmasa dəqiq məbləği hazırlayın.</p>
                  </div>
                )}
                {payMethod==='Kart' && payOnline && (
                  <div className="rounded-card p-4 text-sm anim-fade flex items-start gap-3" style={{backgroundColor:'#F0F7FF',border:'1px solid #BFDBFE'}}>
                    <span className="text-xl">🔒</span>
                    <div><p className="font-semibold text-brand mb-0.5">Kartla təhlükəsiz ödəniş</p><p className="text-t2 leading-relaxed">Sifarişi təsdiqləyəndə təhlükəsiz <b>Stripe</b> ödəniş səhifəsinə yönləndiriləcəksiniz. Ödənişdən sonra avtomatik geri qayıdacaqsınız.</p></div>
                  </div>
                )}
                {payMethod==='Kart' && !payOnline && (
                  <div className="rounded-card p-4 text-sm anim-fade flex items-start gap-3" style={{backgroundColor:'#FFF8E1',border:'1px solid #FDE68A'}}>
                    <span className="text-xl">🔜</span>
                    <div><p className="font-semibold text-brand mb-0.5">Kartla ödəniş hələ aktiv deyil</p><p className="text-t2 leading-relaxed">Onlayn ödəniş şlüzü bu mühitdə konfiqurasiya olunmayıb. Zəhmət olmasa <b>Nağd</b> ödənişlə davam edin.</p></div>
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <button className="flex-1 border-2 border-bdr text-brand py-[11px] rounded-btn font-semibold hover:border-bdr-s transition-colors" onClick={()=>setStep(1)}>← Geri</button>
                  <button disabled={payMethod==='Kart' && !payOnline} className="flex-1 bg-brand text-white py-[11px] rounded-btn font-semibold hover:bg-brand-h transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed" onClick={()=>setStep(3)}>Davam et →</button>
                </div>
              </div>
            )}
            {step===3 && (
              <div className="bg-white rounded-sheet p-6 shadow-xs border border-bdr anim-fade">
                <h2 className="text-lg font-bold text-brand mb-5">✅ Sifarişi təsdiqləyin</h2>
                <div className="space-y-3 mb-6">
                  <div className="bg-bg2 rounded-card p-4"><p className="text-xs font-bold text-t2 uppercase tracking-wide mb-1">📍 Çatdırılma</p><p className="text-sm text-brand">{form.ad} {form.soyad} • {form.telefon||'—'}</p><p className="text-sm text-t2">Bakı, {effUnvan||'Ünvan göstərilməyib'}</p></div>
                  <div className="bg-bg2 rounded-card p-4"><p className="text-xs font-bold text-t2 uppercase tracking-wide mb-1">💳 Ödəniş</p><p className="text-sm text-brand">{payMethod==='Nağd'?'Nağd ödəniş (çatdırılmada)':'Kartla ödəniş'}</p></div>
                  <div className="border border-bdr rounded-card divide-y divide-bdr">
                    {cart.map(i=>(
                      <div key={i.id} className="flex items-center gap-3 p-3">
                        <Img className="w-12 h-12 rounded-[8px] shrink-0" src={i.imageUrls && i.imageUrls[0]} alt={i.name}/>
                        <div className="flex-1 min-w-0"><p className="text-sm font-medium text-brand truncate">{i.name}</p><p className="text-xs text-t2">{i.store} • {i.selectedSize||i.size} • x{i.qty||1}</p></div>
                        <span className="text-sm font-bold shrink-0 text-brand">{(i.price*(i.qty||1)).toFixed(2)} ₼</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 border-2 border-bdr text-brand py-[11px] rounded-btn font-semibold hover:border-bdr-s transition-colors" onClick={()=>setStep(2)}>← Geri</button>
                  <button className="flex-1 bg-brand text-white py-[11px] rounded-btn font-semibold hover:bg-brand-h transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2" disabled={submitting} onClick={confirmOrder}>{submitting&&<Spinner className="w-4 h-4" light/>}{submitting?'Göndərilir…':(payMethod==='Kart'&&payOnline?'Ödənişə keç 🔒':'Sifarişi ver 🎉')}</button>
                </div>
              </div>
            )}
          </div>
          <div className="lg:w-72 shrink-0">
            <div className="bg-white border border-bdr rounded-sheet p-5 shadow-xs lg:sticky lg:top-28">
              <h3 className="font-bold text-brand mb-4 text-sm">{t('Sifariş xülasəsi')}</h3>
              <div className="space-y-1.5 text-sm mb-4 max-h-40 overflow-y-auto">
                {cart.map(i=>(<div key={i.id} className="flex justify-between text-t2"><span className="truncate mr-2">{i.name} ×{i.qty||1}</span><span className="shrink-0 font-medium text-brand">{(i.price*(i.qty||1)).toFixed(2)}₼</span></div>))}
              </div>
              {/* Kupon kodu */}
              <div className="border-t border-bdr pt-3 mb-3">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-bg2 rounded-card px-3 py-2 text-sm">
                    <span className="font-semibold text-brand">🏷️ {appliedCoupon}</span>
                    <button type="button" className="text-xs text-t2 hover:text-sale underline" onClick={removeCoupon}>Sil</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={coupon} onChange={e=>setCoupon(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&applyCoupon()} placeholder={t('Kupon kodu')} className="flex-1 min-w-0 bg-bg2 border border-bdr rounded-btn px-3 py-2 text-sm focus:border-brand focus:bg-white transition-colors uppercase placeholder:normal-case"/>
                    <button type="button" className="px-3 py-2 rounded-btn text-sm font-semibold bg-brand text-white hover:bg-brand-h transition-colors disabled:opacity-40" disabled={!coupon.trim()} onClick={applyCoupon}>{t('Tətbiq')}</button>
                  </div>
                )}
                {couponMsg && <p className={`text-xs mt-1.5 ${couponMsg.ok?'text-accent-t':'text-sale'}`}>{couponMsg.text}</p>}
              </div>
              <div className="border-t border-bdr pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-t2"><span>{t('Məbləğ')}</span><span>{total.toFixed(2)} ₼</span></div>
                {discount>0 && <div className="flex justify-between text-accent-t"><span>{t('Endirim')} ({appliedCoupon})</span><span>−{discount.toFixed(2)} ₼</span></div>}
                <div className="flex items-center justify-between text-t2">
                  <span className="flex items-center gap-1.5">{t('Çatdırılma')} <span className="text-t3">({delType==='Ekspress'?t('Ekspress'):t('Standart')})</span>{delivery>5 && <button type="button" onClick={()=>setWhyOpen(true)} className="text-[11px] text-blue underline underline-offset-2 hover:opacity-80 leading-none">{t('Niyə bahadır?')}</button>}</span>
                  <span>{deliveryInfo&&deliveryInfo.free&&delType==='Standart' ? <span className="text-accent-t font-medium">{t('Pulsuz')}</span> : `${delivery.toFixed(2)} ₼`}</span>
                </div>
                {deliveryInfo&&deliveryInfo.free&&delType==='Standart' && <p className="text-[11px] text-accent-t -mt-1">✓ {t('200 ₼-dan yuxarı — çatdırılma pulsuz')}</p>}
                {deliveryInfo&&Array.isArray(deliveryInfo.perStore)&&deliveryInfo.perStore.length>1 && (
                  <p className="text-[11px] text-t3 -mt-1">{deliveryInfo.perStore.length} {t('mağazadan — ortalama məsafə üzrə')}</p>
                )}
                <div className="flex justify-between font-bold text-brand text-base pt-1 border-t border-bdr"><span>{t('Cəmi')}</span><span>{grandTotal.toFixed(2)} ₼</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {whyOpen && <DeliveryWhyPopup info={deliveryInfo&&{...deliveryInfo, multiStore: Array.isArray(deliveryInfo.perStore)&&deliveryInfo.perStore.length>1}} fee={delivery} onClose={()=>setWhyOpen(false)}/>}
    </div>
  );
};

export const OrderSuccessPage = ({ nav, orderNo }: { nav: NavFn; orderNo: string }) => {
  const [no] = useState(orderNo || '#GD-'+Math.floor(100000+Math.random()*900000));
  return (
    <div className="min-h-screen bg-bg2 flex items-center justify-center px-4 py-10 pb-20 md:pb-10">
      <div className="max-w-md w-full bg-white rounded-sheet2 shadow-card border border-bdr p-10 text-center anim-pop">
        <button className="text-2xl font-black tracking-widest text-brand mb-8 block mx-auto" onClick={()=>nav('home')}>GARDROP</button>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{backgroundColor:'#69EA9B'}}><Ic.CheckCircle className="w-14 h-14" style={{color:'#0A4020'}}/></div>
        <h1 className="text-2xl font-bold text-brand mb-1">Sifariş qəbul edildi!</h1>
        <p className="text-t3 text-sm mb-4">Sifariş nömrəniz:</p>
        <div className="inline-block bg-bg2 rounded-card px-6 py-2 mb-5"><span className="font-black text-brand text-xl tracking-wider">{no}</span></div>
        <p className="text-t2 text-sm mb-6 leading-relaxed">Sifarişiniz 1–2 iş günü ərzində çatdırılacaq. Email ünvanınıza təsdiq məktubu göndərildi.</p>
        <div className="rounded-card p-4 mb-6 text-left text-sm" style={{backgroundColor:'#69EA9B'}}><p className="font-semibold mb-0.5" style={{color:'#0A3020'}}>🚚 Çatdırılma məlumatı</p><p style={{color:'#0A4020'}}>Təxmini çatdırılma: 2–3 iş günü ərzində</p></div>
        <div className="flex gap-3">
          <button className="flex-1 border-2 border-bdr text-brand py-3 rounded-btn font-semibold text-sm hover:border-bdr-s transition-colors" onClick={()=>nav('home')}>Ana səhifə</button>
          <button className="flex-1 bg-brand text-white py-3 rounded-btn font-semibold text-sm hover:bg-brand-h transition-all active:scale-[0.98]" onClick={()=>nav('profile',{tab:'sifarisler'})}>Sifarişlərim</button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
