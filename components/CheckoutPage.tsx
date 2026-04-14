'use client';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SEAT_FEE = 1000; // Extra cost per seat selection

const CheckoutPage: React.FC = () => {
  const { t } = useLanguage();
  const { bookingDetails, navigateTo, user } = useNavigation();
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card'>('momo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [seatSelectionContext, setSeatSelectionContext] = useState<'outbound' | 'return'>('outbound');
  
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

  // Seat Modal Logic
  const openSeatModal = (context: 'outbound' | 'return') => {
    setSeatSelectionContext(context);
    setIsSeatModalOpen(true);
  };

  const toggleSeat = (seatId: string) => {
    const currentSeats = seatSelectionContext === 'outbound' ? outboundSeats : returnSeats;
    const setSeats = seatSelectionContext === 'outbound' ? setOutboundSeats : setReturnSeats;

    if (currentSeats.includes(seatId)) {
      setSeats(currentSeats.filter(id => id !== seatId));
    } else {
      if (currentSeats.length < totalSeatsNeeded) {
        setSeats([...currentSeats, seatId]);
      } else {
        // Optional: Replace last selection or show warning.
        // For UX, let's just not add more than limit.
      }
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bookingDetails) return;
    setIsProcessing(true);
    
    try {
      const bookingData = {
        userId: user.uid,
        tripId: bookingDetails.outbound.id,
        tripDate: bookingDetails.outbound.date,
        tripRoute: `${bookingDetails.outbound.departureLocation} - ${bookingDetails.outbound.arrivalLocation}`,
        agencyName: bookingDetails.outbound.agencyName,
        agencyLogo: bookingDetails.outbound.agencyLogo,
        color: bookingDetails.outbound.color,
        from: bookingDetails.outbound.departureLocation,
        to: bookingDetails.outbound.arrivalLocation,
        departureTime: bookingDetails.outbound.departureTime,
        date: bookingDetails.outbound.date,
        price: calculateTotal(),
        currency: 'FCFA',
        passengers: totalSeatsNeeded,
        seats: outboundSeats,
        status: 'confirmed',
        paymentMethod: paymentMethod,
        contactEmail: email,
        contactPhone: phone,
        passengersInfo: passengersInfo,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'bookings'), bookingData);

      if (bookingDetails.returnTrip) {
        const returnBookingData = {
          ...bookingData,
          tripId: bookingDetails.returnTrip.id,
          tripDate: bookingDetails.returnTrip.date,
          tripRoute: `${bookingDetails.returnTrip.departureLocation} - ${bookingDetails.returnTrip.arrivalLocation}`,
          agencyName: bookingDetails.returnTrip.agencyName,
          agencyLogo: bookingDetails.returnTrip.agencyLogo,
          color: bookingDetails.returnTrip.color,
          from: bookingDetails.returnTrip.departureLocation,
          to: bookingDetails.returnTrip.arrivalLocation,
          departureTime: bookingDetails.returnTrip.departureTime,
          date: bookingDetails.returnTrip.date,
          seats: returnSeats,
        };
        await addDoc(collection(db, 'bookings'), returnBookingData);
      }

      setIsSuccess(true);
    } catch (error) {
      console.error("Error saving booking:", error);
      alert("Une erreur est survenue lors de la réservation.");
    } finally {
      setIsProcessing(false);
    }
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
    const seatFees = (outboundSeats.length + returnSeats.length) * SEAT_FEE;
    return bookingDetails.totalPrice + seatFees;
  };

  // Mock Seat Layout Generator
  const renderSeatMap = () => {
    // Generate 10 rows, 4 cols (2-2 layout)
    // Some seats randomly occupied
    const rows = 10;
    const currentSelection = seatSelectionContext === 'outbound' ? outboundSeats : returnSeats;
    
    // We use a deterministic random based on context so occupied seats stay same
    const isTaken = (r: number, c: number) => {
       const seed = (r * 10 + c) * (seatSelectionContext === 'outbound' ? 2 : 3);
       return (seed % 7) === 0; // Approx 15% occupancy
    };

    let grid = [];
    for (let r = 1; r <= rows; r++) {
      let rowCells = [];
      // Left side (A, B)
      ['A', 'B'].forEach(col => {
        const seatId = `${r}${col}`;
        const taken = isTaken(r, col.charCodeAt(0));
        const selected = currentSelection.includes(seatId);
        
        rowCells.push(
          <button
            key={seatId}
            disabled={taken}
            onClick={() => toggleSeat(seatId)}
            className={`size-10 rounded-lg flex items-center justify-center font-bold text-xs transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
               taken 
               ? 'bg-red-100 text-red-400 border-red-200 cursor-not-allowed'
               : selected
                 ? 'bg-primary text-text-main border-green-600 shadow-lg scale-105'
                 : 'bg-gray-100 dark:bg-gray-700 text-gray-500 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
             {taken ? <span className="material-symbols-outlined text-lg">close</span> : seatId}
          </button>
        );
      });

      // Aisle
      rowCells.push(<div key={`aisle-${r}`} className="w-8 text-center text-gray-300 text-xs flex items-center justify-center">{r}</div>);

      // Right side (C, D)
      ['C', 'D'].forEach(col => {
        const seatId = `${r}${col}`;
        const taken = isTaken(r, col.charCodeAt(0));
        const selected = currentSelection.includes(seatId);

        rowCells.push(
          <button
            key={seatId}
            disabled={taken}
            onClick={() => toggleSeat(seatId)}
            className={`size-10 rounded-lg flex items-center justify-center font-bold text-xs transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
               taken 
               ? 'bg-red-100 text-red-400 border-red-200 cursor-not-allowed'
               : selected
                 ? 'bg-primary text-text-main border-green-600 shadow-lg scale-105'
                 : 'bg-gray-100 dark:bg-gray-700 text-gray-500 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
             {taken ? <span className="material-symbols-outlined text-lg">close</span> : seatId}
          </button>
        );
      });

      grid.push(<div key={r} className="flex gap-2 mb-2 justify-center">{rowCells}</div>);
    }
    return grid;
  };

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

            {/* Seat Selection */}
            <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-text-main dark:text-white font-bold text-lg">
                        <span className="material-symbols-outlined text-primary">event_seat</span>
                        {t('checkout.seats.title')}
                    </div>
                    <p className="text-sm text-text-muted">{t('checkout.seats.desc')}</p>
                  </div>
                  <div className="text-right">
                     <span className="block text-xs text-text-muted uppercase font-bold">{t('checkout.seats.price')}</span>
                     <span className="text-primary font-black text-lg">+{SEAT_FEE} FCFA</span>
                  </div>
               </div>

               <div className="flex gap-4">
                   <button 
                     type="button"
                     onClick={() => openSeatModal('outbound')}
                     className="flex-1 py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between group"
                   >
                      <div className="text-left">
                          <div className="text-xs text-text-muted font-bold uppercase mb-1">{t('checkout.seats.select_outbound')}</div>
                          <div className="font-bold text-text-main dark:text-white">
                              {outboundSeats.length > 0 ? outboundSeats.join(', ') : `${outboundSeats.length}/${totalSeatsNeeded} selected`}
                          </div>
                      </div>
                      <span className="material-symbols-outlined text-gray-400 group-hover:text-primary">arrow_forward_ios</span>
                   </button>
                   
                   {bookingDetails.returnTrip && (
                       <button 
                        type="button"
                        onClick={() => openSeatModal('return')}
                        className="flex-1 py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between group"
                        >
                        <div className="text-left">
                            <div className="text-xs text-text-muted font-bold uppercase mb-1">{t('checkout.seats.select_return')}</div>
                            <div className="font-bold text-text-main dark:text-white">
                                {returnSeats.length > 0 ? returnSeats.join(', ') : `${returnSeats.length}/${totalSeatsNeeded} selected`}
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 group-hover:text-primary">arrow_forward_ios</span>
                        </button>
                   )}
               </div>
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
                            <input type="radio" name="momo_provider" className="text-primary focus:ring-primary" defaultChecked />
                            <span className="font-bold text-text-main dark:text-white">MTN Mobile Money</span>
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer border border-gray-200 dark:border-gray-700 p-3 rounded-lg flex-1 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                            <input type="radio" name="momo_provider" className="text-primary focus:ring-primary" />
                            <span className="font-bold text-text-main dark:text-white">Orange Money</span>
                         </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1">{t('checkout.momo.number')}</label>
                      <input type="tel" placeholder="6XX XXX XXX" className="w-full h-12 px-3 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white transition-all font-mono" />
                    </div>
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
                          <span>{t('checkout.summary.extras')}</span>
                          <span className="font-medium">+{(outboundSeats.length + returnSeats.length) * SEAT_FEE} FCFA</span>
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

      {/* Seat Selection Modal */}
      {isSeatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto flex flex-col">
             <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                <h3 className="text-xl font-bold text-text-main dark:text-white">{t('checkout.seats.modal_title')}</h3>
                <button onClick={() => setIsSeatModalOpen(false)} className="size-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center">
                   <span className="material-symbols-outlined">close</span>
                </button>
             </div>
             
             {/* Legend */}
             <div className="flex justify-center gap-6 mb-6 text-xs text-text-muted">
                <div className="flex items-center gap-1">
                   <div className="size-4 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"></div>
                   {t('checkout.seats.legend.available')}
                </div>
                <div className="flex items-center gap-1">
                   <div className="size-4 rounded bg-red-100 border border-red-200 flex items-center justify-center"><span className="material-symbols-outlined text-[10px] text-red-400">close</span></div>
                   {t('checkout.seats.legend.taken')}
                </div>
                <div className="flex items-center gap-1">
                   <div className="size-4 rounded bg-primary border border-green-600"></div>
                   {t('checkout.seats.legend.selected')}
                </div>
             </div>

             {/* Bus Front */}
             <div className="mb-4 bg-gray-50 dark:bg-[#102216] rounded-lg p-2 flex justify-between items-center text-xs text-text-muted uppercase font-bold tracking-wider">
                 <span>{t('checkout.seats.front')}</span>
                 <div className="flex flex-col items-center">
                    <span className="material-symbols-outlined text-xl">steering_wheel</span>
                    {t('checkout.seats.driver')}
                 </div>
             </div>

             {/* Grid */}
             <div className="bg-white dark:bg-surface-dark border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
                {renderSeatMap()}
             </div>

             <div className="flex items-center justify-between gap-4 mt-auto">
                 <div className="text-sm">
                    <div className="text-text-muted">Selected: <span className="font-bold text-text-main dark:text-white">{(seatSelectionContext === 'outbound' ? outboundSeats : returnSeats).length}</span> / {totalSeatsNeeded}</div>
                 </div>
                 <button 
                   onClick={() => setIsSeatModalOpen(false)}
                   className="px-6 py-2 bg-primary text-text-main font-bold rounded-lg hover:bg-[#0fd651]"
                 >
                    {t('checkout.seats.confirm')}
                 </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CheckoutPage;