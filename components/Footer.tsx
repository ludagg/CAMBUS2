'use client';
import React, { useState } from 'react';
import { useNavigation } from '../contexts/NavigationContext';

const Footer: React.FC = () => {
  const { navigateTo } = useNavigation();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 4000);
    setEmail('');
  };

  return (
    <footer className="bg-gray-950 dark:bg-[#050a07] text-gray-400 border-t border-gray-800">
      {/* Newsletter band */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h3 className="text-white font-black text-xl md:text-2xl mb-1">
              Bons plans & nouveaux trajets
            </h3>
            <p className="text-gray-400 text-sm">
              Recevez les meilleures offres et les nouvelles destinations directement par email. Pas de spam, juste l&apos;essentiel.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.cm"
              className="flex-1 h-12 px-4 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            />
            <button
              type="submit"
              className="h-12 px-5 rounded-xl bg-primary hover:bg-[#0fd651] text-text-main font-black text-sm whitespace-nowrap transition-all"
            >
              {subscribed ? 'Merci ✓' : 'S\'abonner'}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="size-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-400 text-text-main shadow-lg shadow-primary/30">
                <span className="material-symbols-outlined text-xl">directions_bus</span>
              </div>
              <div>
                <span className="font-black text-xl text-white leading-none">EasyTravel</span>
                <div className="text-[10px] font-bold text-primary/70 uppercase tracking-[0.25em] mt-0.5">Cameroun</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed max-w-sm">
              La première plateforme camerounaise de réservation de bus. Toutes les compagnies, un seul billet, 100 % Mobile Money.
            </p>
            <div className="space-y-2 text-sm mb-6">
              <a href="tel:+237670000000" className="flex items-center gap-2 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-primary text-lg">call</span>
                +237 670 000 000
              </a>
              <a href="mailto:contact@easytravel.cm" className="flex items-center gap-2 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-primary text-lg">mail</span>
                contact@easytravel.cm
              </a>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                Bonanjo, Douala, Cameroun
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { icon: 'public', label: 'Facebook' },
                { icon: 'alternate_email', label: 'X' },
                { icon: 'photo_camera', label: 'Instagram' },
                { icon: 'play_circle', label: 'YouTube' },
                { icon: 'chat', label: 'WhatsApp' },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="size-9 bg-gray-900 hover:bg-primary hover:text-text-main rounded-xl flex items-center justify-center text-gray-400 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">{s.icon}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-black text-white mb-5 text-sm uppercase tracking-wider">Voyager</h4>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => navigateTo('home')} className="hover:text-primary transition-colors">Rechercher un bus</button></li>
              <li><button onClick={() => navigateTo('agencies')} className="hover:text-primary transition-colors">Nos agences</button></li>
              <li><a href="#" className="hover:text-primary transition-colors">Compagnies partenaires</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Trajets populaires</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Gérer ma réservation</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-white mb-5 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Centre d&apos;aide</a></li>
              <li><a href="https://wa.me/237670000000" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Chat WhatsApp</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Foire aux questions</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Signaler un problème</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Objets perdus</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-white mb-5 text-sm uppercase tracking-wider">EasyTravel</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">À propos</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Devenir partenaire</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Carrières</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Presse & médias</a></li>
              <li><button onClick={() => navigateTo('login')} className="hover:text-primary transition-colors">Espace pro / admin</button></li>
            </ul>
          </div>
        </div>

        {/* Payment + compliance row */}
        <div className="flex flex-wrap justify-between items-center gap-6 py-6 border-y border-gray-800">
          <div className="flex items-center gap-3 text-xs text-gray-500 font-bold uppercase tracking-widest">
            Paiements acceptés
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {[
              { name: 'Orange Money', color: 'bg-orange-500' },
              { name: 'MTN MoMo', color: 'bg-yellow-400 text-black' },
              { name: 'Visa', color: 'bg-blue-700' },
              { name: 'Mastercard', color: 'bg-red-600' },
            ].map((p) => (
              <span
                key={p.name}
                className={`${p.color} text-white text-[10px] font-black px-3 py-1.5 rounded-md uppercase tracking-wider`}
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© 2026 EasyTravel Cameroun. Tous droits réservés.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-300 transition-colors">Conditions d&apos;utilisation</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Politique de confidentialité</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
