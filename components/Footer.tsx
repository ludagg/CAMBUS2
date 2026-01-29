import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 pt-16 pb-8 px-6 md:px-10">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-6 flex items-center justify-center rounded bg-primary text-text-main">
              <span className="material-symbols-outlined text-lg">directions_bus</span>
            </div>
            <span className="font-bold text-lg dark:text-white">CamBus</span>
          </div>
          <p className="text-sm text-text-muted dark:text-gray-500 mb-6">
            Connecting cities, people, and experiences with comfort and care.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">public</span></a>
            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">alternate_email</span></a>
            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">share</span></a>
          </div>
        </div>
        
        <div>
          <h4 className="font-bold text-text-main dark:text-white mb-4">Plan Your Trip</h4>
          <ul className="space-y-2 text-sm text-text-muted dark:text-gray-400">
            <li><a href="#" className="hover:text-primary">Route Map</a></li>
            <li><a href="#" className="hover:text-primary">Bus Stops</a></li>
            <li><a href="#" className="hover:text-primary">Manage Booking</a></li>
            <li><a href="#" className="hover:text-primary">Real-time Info</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-text-main dark:text-white mb-4">Support</h4>
          <ul className="space-y-2 text-sm text-text-muted dark:text-gray-400">
            <li><a href="#" className="hover:text-primary">Help Center</a></li>
            <li><a href="#" className="hover:text-primary">Lost & Found</a></li>
            <li><a href="#" className="hover:text-primary">FAQs</a></li>
            <li><a href="#" className="hover:text-primary">Contact Us</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-text-main dark:text-white mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-text-muted dark:text-gray-400">
            <li><a href="#" className="hover:text-primary">About Us</a></li>
            <li><a href="#" className="hover:text-primary">Careers</a></li>
            <li><a href="#" className="hover:text-primary">Press</a></li>
            <li><a href="#" className="hover:text-primary">Sustainability</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted dark:text-gray-500">
        <p>&copy; 2024 CamBus Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-text-main dark:hover:text-white">Privacy Policy</a>
          <a href="#" className="hover:text-text-main dark:hover:text-white">Terms of Service</a>
          <a href="#" className="hover:text-text-main dark:hover:text-white">Cookie Settings</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;