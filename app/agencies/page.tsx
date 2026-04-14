'use client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AgenciesPage from '../../components/AgenciesPage';

export default function AgenciesRoute() {
  return (
    <div className="relative flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-1"><AgenciesPage /></main>
      <Footer />
    </div>
  );
}
