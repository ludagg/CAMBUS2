'use client';
import Header from '../components/Header';
import Hero from '../components/Hero';
import StatsBanner from '../components/landing/StatsBanner';
import HowItWorks from '../components/landing/HowItWorks';
import PopularRoutes from '../components/landing/PopularRoutes';
import Features from '../components/Features';
import TrustedCompanies from '../components/landing/TrustedCompanies';
import Testimonials from '../components/landing/Testimonials';
import FAQ from '../components/landing/FAQ';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <div className="relative flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-1">
        <Hero />
        <StatsBanner />
        <PopularRoutes />
        <HowItWorks />
        <Features />
        <TrustedCompanies />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
