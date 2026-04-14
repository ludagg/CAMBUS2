'use client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import CheckoutPage from '../../components/CheckoutPage';
import AuthGuard from '../../components/AuthGuard';

export default function CheckoutRoute() {
  return (
    <div className="relative flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-1">
        <AuthGuard><CheckoutPage /></AuthGuard>
      </main>
      <Footer />
    </div>
  );
}
