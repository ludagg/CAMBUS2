import React from 'react';
import SearchWidget from './SearchWidget';

const Hero: React.FC = () => {
  return (
    <div className="relative w-full bg-surface-light dark:bg-background-dark">
      {/* Hero Background Image */}
      <div className="relative h-[500px] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{
            backgroundImage: "linear-gradient(rgba(16, 34, 22, 0.4), rgba(16, 34, 22, 0.6)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuDUTEFOYMI8eyP5aL-0vjSJnpMBA7_gLVpQz5Dzwybkx9lteu5XHQCz42z0vbeE0o-vNAFt9Z-U340hujDxju8xQDuF79dH2IYVvrKP3H8Y7EbJi8vQDaii6eEjPdYdhY8kSP3N8nmP1SBkbFZmwodQpYdDAVImz80XqdIUSVd-SI7qSEVpHoryBo5QFzeRRdNaUK2y3V2TSntTSU6yiwQv5S9rc9b5ncYu1AkK-rdJmq4a714aHMVWpHcjGyic0soSSnxo8-VXAI6v')"
          }}
          role="img"
          aria-label="Scenic bus travel on a highway through mountains"
        />
        <div className="relative h-full flex flex-col items-center justify-center px-4 text-center z-10">
          <h1 className="text-white text-4xl md:text-6xl font-black leading-tight tracking-tight mb-4 max-w-4xl drop-shadow-lg">
            Travel comfortably across the country.
          </h1>
          <p className="text-gray-200 text-lg md:text-xl font-medium max-w-2xl drop-shadow-md">
            Book your bus tickets today with free Wi-Fi, extra legroom, and eco-friendly rides.
          </p>
        </div>
      </div>
      
      {/* Overlapping Search Widget */}
      <SearchWidget />
    </div>
  );
};

export default Hero;