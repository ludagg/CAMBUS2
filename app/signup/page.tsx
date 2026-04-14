'use client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { SignupPage } from '../../components/AuthPages';

export default function SignupRoute() {
  return (
    <div className="relative flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-1"><SignupPage /></main>
      <Footer />
    </div>
  );
}
