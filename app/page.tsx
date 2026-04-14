'use client';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Destinations from '../components/Destinations';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <div className="relative flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <Destinations />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
