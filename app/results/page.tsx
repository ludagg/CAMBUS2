'use client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SearchResultsPage from '../../components/SearchResultsPage';

export default function ResultsRoute() {
  return (
    <div className="relative flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-1"><SearchResultsPage /></main>
      <Footer />
    </div>
  );
}
