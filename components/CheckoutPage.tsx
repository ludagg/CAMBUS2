'use client';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import SeatMap from './SeatMap';

type PaymentStatusResponse = {
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  provider?: string | null;
  phoneNumber?: string | null;
  failureReason?: string | null;
  providerRef?: string | null;
};

const CheckoutPage: React.FC = () => {
  const { t } = useLanguage();
  const { bookingDetails, navigateTo, user } = useNavigation();
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card'>('momo');
  const [momoProvider, setMomoProvider] = useState<'MOMO' | 'OM'>('MOMO');
  const [momoPhone, setMomoPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentGroupId, setPaymentGroupId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigateTo('login');
    }
  }, [user, navigateTo]);

  // Initialize passenger info based on adult count
  const adultCount = bookingDetails ? bookingDetails.passengers.adults : 1;
  const [passengersInfo, setPassengersInfo] = useState<{name: string, id: string}[]>(
    Array(adultCount).fill({ name: '', id: '' })
  );

  // Contact Info - Pre-fill with user data if available
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');

  // Seat Selection State
  const [outboundSeats, setOutboundSeats] = useState<string[]>([]);
  const [returnSeats, setReturnSeats] = useState<string[]>([]);

  // Total passengers (assuming children also need seats)
  const totalSeatsNeeded = bookingDetails ? bookingDetails.passengers.adults + bookingDetails.passengers.children : 1;

  if (!bookingDetails || !user) {
    // Component will unmount or redirect shortly
    return null; 
  }

  // Update specific passenger info
  const handlePassengerChange = (index: number, field: 'name' | 'id', value: string) => {
    const newInfo = [...passengersInfo];
    newInfo[index] = { ...newInfo[index], [field]: value };
    setPassengersInfo(newInfo);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bookingDetails) return;
    setPaymentError(null);

    const methodCode = paymentMethod === 'momo' ? momoProvider : 'CARD';
    if (paymentMethod === 'momo') {
      const digits = momoPhone.replace(/\D/g, '');
      const trimmed = digits.startsWith('237') ? digits.slice(3) : digits;
      if (trimmed.length !== 9 || !trimmed.startsWith('6')) {
        setPaymentError('Numéro invalide. Format attendu: 6XX XXX XXX.');
        return;
      }
    }

    setIsProcessing(true);

    try {
      const passengers = passengersInfo
        .map((p, i) => ({
          fullName: p.name || `Passager ${i + 1}`,
          idNumber: p.id || undefined,
          seat: outboundSeats[i],
        }))
        .slice(0, totalSeatsNeeded);
      while (passengers.length < totalSeatsNeeded) {
        passengers.push({ fullName: `Passager ${passengers.length + 1}`, idNumber: undefined, seat: outboundSeats[passengers.length] });
      }

      const payload = {
        outboundDepartureId: String(bookingDetails.outbound.id),
        returnDepartureId: bookingDetails.returnTrip ? String(bookingDetails.returnTrip.id) : undefined,
        passengers,
        outboundSeats,
        returnSeats,
        contactEmail: email,
        contactPhone: phone,
        paymentMethod: methodCode,
        paymentPhone: paymentMethod === 'momo' ? momoPhone : undefined,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Impossible de finaliser la réservation.');

      if (json.data?.requiresConfirmation) {
        setPaymentId(json.data.paymentId);
        setPaymentGroupId(json.data.groupId);
        setPaymentStatus({ status: 'PENDING', provider: momoProvider === 'MOMO' ? 'MTN Mobile Money' : 'Orange Money', phoneNumber: momoPhone });
      } else {
        setIsSuccess(true);
      }
    } catch (error: unknown) {
      console.error('Error saving booking:', error);
      const msg = error instanceof Error ? error.message : 'Une erreur est survenue lors de la réservation.';
      setPaymentError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!paymentId || paymentStatus?.status !== 'PENDING') return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/payments/${paymentId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Impossible de vérifier le paiement.');
        setPaymentStatus(json.data);
        if (json.data.status === 'SUCCEEDED') {
          setIsSuccess(true);
        }
      } catch (err) {
        console.error('Payment poll error:', err);
      }
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [paymentId, paymentStatus?.status]);

  const retryPayment = () => {
    setPaymentId(null);
    setPaymentGroupId(null);
    setPaymentStatus(null);
    setPaymentError(null);
    setIsProcessing(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    } catch (e) {
      return dateString;
    }
  };

  const calculateTotal = () => {
    return bookingDetails.totalPrice;
  };


  // FAILED PAYMENT VIEW
  if (paymentStatus?.status === 'FAILED') {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
        <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl p-8 shadow-xl text-center border border-red-200 dark:border-red-900 animate-fadeIn">
          <div className="size-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-5xl text-red-600">error</span>
          </div>
          <h2 className="text-2xl font-black text-text-main dark:text-white mb-2">Paiement échoué</h2>
          <p className="text-text-muted dark:text-gray-400 mb-6">{paymentStatus.failureReason || 'La transaction Mobile Money a été refusée par l\'opérateur.'}</p>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-6 text-left text-xs">
            <div className="flex justify-between"><span className="text-text-muted">Fournisseur:</span><span className="font-bold text-text-main dark:text-white">{paymentStatus.provider}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Numéro:</span><span className="font-mono font-bold text-text-main dark:text-white">{paymentStatus.phoneNumber}</span></div>
            {paymentStatus.providerRef && <div className="flex justify-between"><span className="text-text-muted">Réf:</span><span className="font-mono text-text-main dark:text-white">{paymentStatus.providerRef}</span></div>}
          </div>
          <button onClick={retryPayment} className="w-full py-3 bg-primary text-text-main font-black rounded-xl shadow hover:bg-[#0fd651] transition-all">Réessayer le paiement</button>
        </div>
      </div>
    );
  }

  // PENDING PAYMENT VIEW (Mobile Money confirmation)
  if (paymentStatus?.status === 'PENDING' && paymentId) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
        <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl p-8 shadow-xl text-center border border-gray-100 dark:border-gray-800 animate-fadeIn">
          <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <span className="material-symbols-outlined text-5xl text-primary animate-pulse">smartphone</span>
            <span className="absolute -top-1 -right-1 size-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>
          </div>
          <h2 className="text-2xl font-black text-text-main dark:text-white mb-2">Confirmez sur votre téléphone</h2>
          <p className="text-text-muted dark:text-gray-400 mb-6 text-sm">
            Une demande de paiement de <strong className="text-text-main dark:text-white">{calculateTotal().toLocaleString()} XAF</strong> a été envoyée à votre numéro. Tapez votre code PIN pour valider.
          </p>
          <div className="bg-gray-50 dark:bg-[#102216] rounded-xl p-4 mb-6 text-left text-xs space-y-2">
            <div className="flex justify-between"><span className="text-text-muted">Fournisseur:</span><span className="font-bold text-text-main dark:text-white">{paymentStatus.provider}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Numéro:</span><span className="font-mono font-bold text-text-main dark:text-white">{paymentStatus.phoneNumber}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Réservation:</span><span className="font-mono text-text-main dark:text-white text-[10px]">{paymentGroupId?.slice(0, 12)}…</span></div>
          </div>
          <p className="text-[11px] text-text-muted">Astuce test: un numéro finissant par <code>000</code> simule un échec.</p>
        </div>
      </div>
    );
  }

  // SUCCESS VIEW
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
        <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl p-8 shadow-xl text-center border border-gray-100 dark:border-gray-800 animate-fadeIn">
          <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-5xl text-primary">check_circle</span>
          </div>
          <h2 className="text-2xl font-black text-text-main dark:text-white mb-2">{t('checkout.success.title')}</h2>
          <p className="text-text-muted dark:text-gray-400 mb-8">{t('checkout.success.msg')}</p>
          
          <div className="bg-gray-50 dark:bg-[#102216] rounded-xl p-4 mb-8 text-left border border-gray-100 dark:border-gray-800">
             <div className="flex justify-between mb-2">
                <span className="text-sm text-text-muted">Ref:</span>
                <span className="font-mono font-bold text-text-main dark:text-white">CB-{Math.floor(Math.random() * 100000)}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-sm text-text-muted">Amount:</span>
                <span className="font-bold text-text-main dark:text-white">{calculateTotal().toLocaleString()} FCFA</span>
             </div>
          </div>

          <div className="space-y-3">
            <button className="w-full py-3 bg-primary text-text-main font-bold rounded-xl shadow hover:bg-[#0fd651] transition-all flex items-center justify-center gap-2">
               <span className="material-symbols-outlined">download</span>
               {t('checkout.success.download')}
            </button>
            <button 
              onClick={() => navigateTo('home')}
              className="w-full py-3 bg-transparent text-text-muted hover:text-text-main font-bold transition-all"
            >
              {t('checkout.success.home')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PAYMENT FORM VIEW
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-text-main dark:text-white mb-8">{t('checkout.title')}</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT: Forms */}
          <div className="flex-1 space-y-6">
            
            {/* Contact Info */}
            <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
               <div className="flex items-center gap-2 mb-4 text-text-main dark:text-white font-bold text-lg">
                  <span className="material-symbols-outlined text-primary">contact_mail</span>
                  {t('checkout.contact')}
               </div>
               <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">{t('checkout.label.email')}</label>
                    <input 
                      type="email" 
                      value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full h-10 px-3 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">{t('checkout.label.phone')}</label>
                    <input 
                      type="tel" 
                      value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full h-10 px-3 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all"
                    />
                  </div>
               </div>
            </div>

            {/* Passenger Info (Dynamic) */}
            <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
               <div className="flex items-center gap-2 mb-4 text-text-main dark:text-white font-bold text-lg">
                  <span className="material-symbols-outlined text-primary">groups</span>
                  {t('checkout.passenger')}
               </div>
               
               <div className="space-y-6">
                  {passengersInfo.map((passenger, idx) => (
                    <div key={idx} className="pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                        <div className="text-sm font-bold text-text-main dark:text-white mb-3 flex items-center gap-2">
                             <span className="size-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs">{idx + 1}</span>
                             {t('checkout.passenger_n')}
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-1">{t('checkout.label.fullname')}</label>
                                <input 
                                type="text" 
                                value={passenger.name} 
                                onChange={e => handlePassengerChange(idx, 'name', e.target.value)}
                                className="w-full h-10 px-3 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-1">{t('checkout.label.id')}</label>
                                <input 
                                type="text" 
                                value={passenger.id} 
                                onChange={e => handlePassengerChange(idx, 'id', e.target.value)}
                                className="w-full h-10 px-3 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all"
                                />
                            </div>
                        </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Visual Seat Selection */}
            <div className="space-y-4">
              <SeatMap
                departureId={String(bookingDetails.outbound.id)}
                totalSeatsNeeded={totalSeatsNeeded}
                selectedSeats={outboundSeats}
                onChange={setOutboundSeats}
                label="Sièges — Aller"
              />
              {bookingDetails.returnTrip && (
                <SeatMap
                  departureId={String(bookingDetails.returnTrip.id)}
                  totalSeatsNeeded={totalSeatsNeeded}
                  selectedSeats={returnSeats}
                  onChange={setReturnSeats}
                  label="Sièges — Retour"
                />
              )}
            </div>

            {/* Payment Method */}
            <form onSubmit={handlePayment} className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
               <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-2 text-text-main dark:text-white font-bold text-lg">
                      <span className="material-symbols-outlined text-primary">payments</span>
                      {t('checkout.payment')}
                   </div>
                   <div className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                      <span className="material-symbols-outlined text-sm">lock</span>
                      {t('checkout.secure_badge')}
                   </div>
               </div>

               {/* Tabs */}
               <div className="flex gap-4 mb-6">
                 <button
                    type="button"
                    onClick={() => setPaymentMethod('momo')}
                    className={`flex-1 py-3 rounded-lg border-2 font-bold flex flex-col items-center gap-1 transition-all ${paymentMethod === 'momo' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 dark:border-gray-700 text-text-muted hover:border-gray-300'}`}
                 >
                    <span className="material-symbols-outlined">smartphone</span>
                    {t('checkout.method.momo')}
                 </button>
                 <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 py-3 rounded-lg border-2 font-bold flex flex-col items-center gap-1 transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 dark:border-gray-700 text-text-muted hover:border-gray-300'}`}
                 >
                    <span className="material-symbols-outlined">credit_card</span>
                    {t('checkout.method.card')}
                 </button>
               </div>

              {/* Momo Form */}
              {paymentMethod === 'momo' && (
                <div className="space-y-4 animate-fadeIn">
                   <div>
                     <label className="block text-xs font-semibold text-text-muted mb-1">{t('checkout.momo.provider')}</label>
                     <div className="flex gap-3">
                        <label className="flex items-center gap-2 cursor-pointer border border-gray-200 dark:border-gray-700 p-3 rounded-lg flex-1 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                           <input type="radio" name="momo_provider" className="text-primary focus:ring-primary" checked={momoProvider === 'MOMO'} onChange={() => setMomoProvider('MOMO')} />
                           <span className="font-bold text-text-main dark:text-white">MTN Mobile Money</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer border border-gray-200 dark:border-gray-700 p-3 rounded-lg flex-1 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                           <input type="radio" name="momo_provider" className="text-primary focus:ring-primary" checked={momoProvider === 'OM'} onChange={() => setMomoProvider('OM')} />
                           <span className="font-bold text-text-main dark:text-white">Orange Money</span>
                        </label>
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-text-muted mb-1">{t('checkout.momo.number')}</label>
                     <input type="tel" placeholder="6XX XXX XXX" value={momoPhone} onChange={(e) => setMomoPhone(e.target.value)} className="w-full h-12 px-3 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all font-mono" />
                     <p className="mt-2 text-[11px] text-text-muted">Vous recevrez une demande de confirmation USSD sur ce numéro.</p>
                   </div>
                   {paymentError && (
                     <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-bold px-3 py-2 rounded-lg">
                       {paymentError}
                     </div>
                   )}
                </div>
              )}

               {/* Card Form */}
               {paymentMethod === 'card' && (
                 <div className="space-y-4 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1">{t('checkout.card.number')}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">credit_card</span>
                        <input type="text" placeholder="0000 0000 0000 0000" className="w-full h-12 pl-10 pr-3 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all font-mono" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-muted mb-1">{t('checkout.card.expiry')}</label>
                        <input type="text" placeholder="MM/YY" className="w-full h-12 px-3 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-muted mb-1">{t('checkout.card.cvv')}</label>
                        <input type="text" placeholder="123" className="w-full h-12 px-3 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all font-mono" />
                      </div>
                    </div>
                 </div>
               )}
               
               <button 
                 type="submit" 
                 disabled={isProcessing}
                 className="w-full mt-8 py-4 bg-primary text-text-main font-bold text-lg rounded-xl hover:bg-[#0fd651] shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
               >
                 {isProcessing && <span className="material-symbols-outlined animate-spin">progress_activity</span>}
                 {t('checkout.pay_btn')} • {calculateTotal().toLocaleString()} FCFA
               </button>
            </form>

          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:w-1/3">
             <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 sticky top-24">
                <h3 className="text-xl font-bold text-text-main dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Booking Summary</h3>
                
                {/* Outbound Item */}
                <div className="mb-4">
                   <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase mb-1">
                      <span className="material-symbols-outlined text-sm">flight_takeoff</span>
                      Outbound
                   </div>
                   <div className="flex justify-between items-start">
                      <div>
                         <div className="font-bold text-text-main dark:text-white text-sm">{bookingDetails.outbound.agencyName}</div>
                         <div className="text-xs text-text-muted">{formatDate(bookingDetails.outbound.date)} • {bookingDetails.outbound.departureTime}</div>
                         <div className="text-xs text-text-main dark:text-gray-300 mt-1">{bookingDetails.outbound.departureLocation} <br/>➜ {bookingDetails.outbound.arrivalLocation}</div>
                      </div>
                   </div>
                </div>

                {/* Return Item */}
                {bookingDetails.returnTrip && (
                  <div className="mb-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                     <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase mb-1">
                        <span className="material-symbols-outlined text-sm">flight_land</span>
                        Return
                     </div>
                     <div className="flex justify-between items-start">
                        <div>
                           <div className="font-bold text-text-main dark:text-white text-sm">{bookingDetails.returnTrip.agencyName}</div>
                           <div className="text-xs text-text-muted">{formatDate(bookingDetails.returnTrip.date)} • {bookingDetails.returnTrip.departureTime}</div>
                           <div className="text-xs text-text-main dark:text-gray-300 mt-1">{bookingDetails.returnTrip.departureLocation} <br/>➜ {bookingDetails.returnTrip.arrivalLocation}</div>
                        </div>
                     </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-2 space-y-2">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-text-muted">{t('checkout.summary.base')}</span>
                      <span className="font-medium text-text-main dark:text-white">{bookingDetails.totalPrice.toLocaleString()} FCFA</span>
                   </div>
                   {(outboundSeats.length > 0 || returnSeats.length > 0) && (
                      <div className="flex justify-between items-center text-sm text-primary">
                          <span>Sièges</span>
                          <span className="font-medium">{[...outboundSeats, ...returnSeats].join(" · ")}</span>
                      </div>
                   )}
                   
                   <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-lg font-bold text-text-main dark:text-white">Total</span>
                      <span className="text-2xl font-black text-primary">{calculateTotal().toLocaleString()} <span className="text-sm font-normal text-text-muted">FCFA</span></span>
                   </div>
                </div>

             </div>
          </div>

        </div>
      </div>


    </div>
  );
};

export default CheckoutPage;