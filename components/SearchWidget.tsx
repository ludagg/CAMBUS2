import React, { useState } from 'react';

const SearchWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trip' | 'map'>('trip');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [date, setDate] = useState('');

  const handleSwap = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  return (
    <div className="relative z-20 -mt-16 px-4 pb-12 w-full flex justify-center">
      <div className="w-full max-w-6xl bg-white dark:bg-surface-dark rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-800">
        
        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-gray-100 dark:border-gray-700 pb-2">
          <button 
            onClick={() => setActiveTab('trip')}
            className={`flex items-center gap-2 pb-2 font-semibold transition-colors ${
              activeTab === 'trip' 
                ? 'text-teal-accent dark:text-primary border-b-2 border-teal-accent dark:border-primary' 
                : 'text-text-muted dark:text-gray-400 hover:text-text-main dark:hover:text-gray-200'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">directions_bus</span>
            Bus Trip
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 pb-2 font-medium transition-colors ${
               activeTab === 'map'
                ? 'text-teal-accent dark:text-primary border-b-2 border-teal-accent dark:border-primary' 
                : 'text-text-muted dark:text-gray-400 hover:text-text-main dark:hover:text-gray-200'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">map</span>
            Explore Map
          </button>
        </div>

        {/* Search Form */}
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          
          {/* From / To Group */}
          <div className="flex flex-col md:flex-row flex-1 w-full gap-2 relative">
            <div className="flex-1 relative group">
              <label className="block text-xs font-semibold text-text-muted dark:text-gray-400 mb-1.5 ml-1">From</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-gray-400">trip_origin</span>
                <input 
                  type="text" 
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white font-medium transition-all" 
                  placeholder="City or station" 
                />
              </div>
            </div>

            {/* Swap Button */}
            <button 
              onClick={handleSwap}
              className="absolute top-[34px] left-1/2 -translate-x-1/2 z-10 hidden md:flex items-center justify-center size-8 rounded-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-600 shadow-sm text-primary hover:bg-gray-50 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">swap_horiz</span>
            </button>

            <div className="flex-1 relative group">
              <label className="block text-xs font-semibold text-text-muted dark:text-gray-400 mb-1.5 ml-1">To</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-gray-400">location_on</span>
                <input 
                  type="text" 
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white font-medium transition-all" 
                  placeholder="City or station" 
                />
              </div>
            </div>
          </div>

          {/* Date / Passenger Group */}
          <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
            <div className="w-full md:w-48 relative">
              <label className="block text-xs font-semibold text-text-muted dark:text-gray-400 mb-1.5 ml-1">Departure</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-gray-400">calendar_month</span>
                <input 
                  type="text" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white font-medium transition-all cursor-pointer" 
                  placeholder="Today" 
                />
              </div>
            </div>
            <div className="w-full md:w-40 relative">
              <label className="block text-xs font-semibold text-text-muted dark:text-gray-400 mb-1.5 ml-1">Passengers</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-gray-400">person</span>
                <select className="w-full h-12 pl-12 pr-8 bg-gray-50 dark:bg-[#102216] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main dark:text-white font-medium transition-all appearance-none cursor-pointer">
                  <option>1 Adult</option>
                  <option>2 Adults</option>
                  <option>1 Adult, 1 Child</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 text-gray-400 text-sm pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="w-full lg:w-auto">
            <button className="w-full h-12 px-8 bg-primary hover:bg-[#0fd651] text-text-main text-base font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">search</span>
              Find Tickets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchWidget;