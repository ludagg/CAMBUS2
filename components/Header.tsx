import React, { useState } from 'react';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#f0f4f2] dark:border-[#1e3a29] bg-surface-light dark:bg-background-dark px-6 py-4 lg:px-10 transition-colors duration-200">
      <div className="flex items-center gap-4">
        <div className="size-8 flex items-center justify-center rounded-lg bg-primary text-text-main">
          <span className="material-symbols-outlined text-2xl">directions_bus</span>
        </div>
        <h2 className="text-text-main dark:text-white text-xl font-bold tracking-tight">CamBus</h2>
      </div>
      
      <nav className="hidden md:flex items-center gap-8">
        <a href="#" className="text-text-main dark:text-gray-200 text-sm font-medium hover:text-primary transition-colors">Routes</a>
        <a href="#" className="text-text-main dark:text-gray-200 text-sm font-medium hover:text-primary transition-colors">Service</a>
        <a href="#" className="text-text-main dark:text-gray-200 text-sm font-medium hover:text-primary transition-colors">Help</a>
      </nav>
      
      <div className="flex items-center gap-4">
        <button className="hidden md:flex items-center justify-center rounded-lg h-10 px-6 bg-primary text-text-main text-sm font-bold hover:bg-primary/90 transition-colors">
          Login
        </button>
        <button 
          className="md:hidden p-2 text-text-main dark:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-surface-light dark:bg-background-dark border-b border-gray-200 dark:border-gray-800 md:hidden flex flex-col p-4 shadow-lg">
           <a href="#" className="py-3 px-4 text-text-main dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded">Routes</a>
           <a href="#" className="py-3 px-4 text-text-main dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded">Service</a>
           <a href="#" className="py-3 px-4 text-text-main dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded">Help</a>
           <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
             <button className="w-full flex items-center justify-center rounded-lg h-10 px-6 bg-primary text-text-main text-sm font-bold hover:bg-primary/90 transition-colors">
                Login
             </button>
           </div>
        </div>
      )}
    </header>
  );
};

export default Header;