'use client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { LoginPage } from '../../components/AuthPages';

export default function LoginRoute() {
  return (
    <div className="relative flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-1"><LoginPage /></main>
      <Footer />
    </div>
  );
}
