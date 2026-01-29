import React from 'react';

const CTA: React.FC = () => {
  return (
    <div className="bg-teal-accent text-white py-16 px-6">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Ready to explore?</h2>
          <p className="text-gray-300">Download our app for exclusive deals and real-time tracking.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-black text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-900 transition-colors">
            <span className="material-symbols-outlined">ios</span>
            App Store
          </button>
          <button className="bg-black text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-900 transition-colors">
            <span className="material-symbols-outlined">android</span>
            Google Play
          </button>
        </div>
      </div>
    </div>
  );
};

export default CTA;