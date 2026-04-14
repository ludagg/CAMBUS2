'use client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BookingsPage from '../../components/BookingsPage';
import AuthGuard from '../../components/AuthGuard';

export default function BookingsRoute() {
  return (
    <div className="relative flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-1">
        <AuthGuard><BookingsPage /></AuthGuard>
      </main>
      <Footer />
    </div>
  );
}
