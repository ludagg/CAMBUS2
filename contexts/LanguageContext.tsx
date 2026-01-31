import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    "nav.routes": "Routes",
    "nav.service": "Service",
    "nav.help": "Help",
    "nav.bookings": "My Bookings",
    "nav.login": "Login",
    "nav.logout": "Logout",
    "nav.account": "My Account",
    "hero.title": "Travel comfortably across the country.",
    "hero.subtitle": "Book your bus tickets today with free Wi-Fi, extra legroom, and eco-friendly rides.",
    "search.tab.trip": "Bus Trip",
    "search.tab.agencies": "Explore Agencies",
    "search.trip_type.one_way": "One Way",
    "search.trip_type.round_trip": "Round Trip",
    "search.label.from": "From",
    "search.label.to": "To",
    "search.label.departure": "Departure",
    "search.label.return": "Return",
    "search.label.passengers": "Passengers",
    "search.passenger.adults": "Adults",
    "search.passenger.children": "Children",
    "search.passenger.done": "Done",
    "search.placeholder.city": "City or station",
    "search.placeholder.today": "Today",
    "search.button": "Find Tickets",
    "features.title": "Why travel with CamBus?",
    "features.subtitle": "We're redefining bus travel with a focus on comfort, technology, and sustainability.",
    "features.wifi.title": "Free 4G Wi-Fi",
    "features.wifi.desc": "Stay connected throughout your journey. Browse, stream, or work comfortably from your seat.",
    "features.legroom.title": "Extra Legroom",
    "features.legroom.desc": "Our modern fleet features adjustable seats with plenty of space to stretch out and relax.",
    "features.eco.title": "Eco-Friendly Travel",
    "features.eco.desc": "Travel green. Our buses produce a fraction of the CO2 compared to cars or planes.",
    "dest.title": "Popular Destinations",
    "dest.view_all": "View all routes",
    "dest.from": "From",
    "dest.connections": "daily connections",
    "cta.title": "Ready to explore?",
    "cta.desc": "Download our app for exclusive deals and real-time tracking.",
    "cta.app_store": "App Store",
    "cta.google_play": "Google Play",
    "footer.slogan": "Connecting cities, people, and experiences with comfort and care.",
    "footer.plan": "Plan Your Trip",
    "footer.support": "Support",
    "footer.company": "Company",
    "footer.rights": "CamBus Inc. All rights reserved.",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    "footer.cookies": "Cookie Settings",
    "footer.link.route_map": "Route Map",
    "footer.link.bus_stops": "Bus Stops",
    "footer.link.manage_booking": "Manage Booking",
    "footer.link.real_time": "Real-time Info",
    "footer.link.help_center": "Help Center",
    "footer.link.lost_found": "Lost & Found",
    "footer.link.faqs": "FAQs",
    "footer.link.contact": "Contact Us",
    "footer.link.about": "About Us",
    "footer.link.careers": "Careers",
    "footer.link.press": "Press",
    "footer.link.sustainability": "Sustainability",
    "agencies.title": "Our Trusted Agencies",
    "agencies.subtitle": "We partner with the most reliable bus operators to ensure a safe and comfortable journey.",
    "agencies.since": "Since",
    "agencies.rating": "Rating",
    "agencies.view_profile": "View Profile",
    "agencies.back": "Back to Agencies",
    "agencies.stations": "Stations & Terminals",
    "agencies.stations_subtitle": "Find the nearest departure point for this agency.",
    "agencies.map_view": "Map View",
    "agencies.address": "Address",
    "results.edit_search": "Edit Search",
    "results.sort_by": "Sort by",
    "results.sort.price": "Price",
    "results.sort.departure": "Departure",
    "results.sort.duration": "Duration",
    "results.found": "trips found",
    "results.per_person": "per person",
    "results.select": "Select Seat",
    "results.duration": "Duration",
    "results.amenities": "Amenities",
    "results.step.outbound": "Select Departure Trip",
    "results.step.return": "Select Return Trip",
    "results.summary.title": "Trip Summary",
    "results.summary.outbound": "Outbound",
    "results.summary.return": "Return",
    "results.summary.total": "Total Price",
    "results.summary.checkout": "Proceed to Checkout",
    "results.filter.title": "Filters",
    "results.filter.open": "Filters",
    "results.filter.departure_time": "Departure Time",
    "results.filter.morning": "Morning (06:00 - 12:00)",
    "results.filter.afternoon": "Afternoon (12:00 - 18:00)",
    "results.filter.evening": "Evening (18:00+)",
    "results.filter.agencies": "Bus Operators",
    "results.filter.amenities": "Services",
    "results.filter.clear": "Clear All",
    "results.filter.apply": "Apply Filters",
    "checkout.title": "Secure Checkout",
    "checkout.contact": "Contact Information",
    "checkout.passenger": "Passenger Details",
    "checkout.passenger_n": "Adult Passenger",
    "checkout.payment": "Payment Method",
    "checkout.label.email": "Email Address",
    "checkout.label.phone": "Phone Number",
    "checkout.label.fullname": "Full Name",
    "checkout.label.id": "ID / Passport Number",
    "checkout.method.momo": "Mobile Money",
    "checkout.method.card": "Credit Card",
    "checkout.momo.provider": "Select Provider",
    "checkout.momo.number": "Mobile Wallet Number",
    "checkout.card.number": "Card Number",
    "checkout.card.expiry": "Expiry Date",
    "checkout.card.cvv": "CVV",
    "checkout.pay_btn": "Payer",
    "checkout.success.title": "Booking Confirmed!",
    "checkout.success.msg": "Votre billet a été envoyé à votre adresse email.",
    "checkout.success.download": "Download Ticket",
    "checkout.success.home": "Back to Home",
    "checkout.secure_badge": "SSL Secure Payment",
    "checkout.seats.title": "Seat Selection",
    "checkout.seats.desc": "Choose your preferred spot for extra comfort.",
    "checkout.seats.price": "Seat Fee",
    "checkout.seats.select_outbound": "Select Outbound Seats",
    "checkout.seats.select_return": "Select Return Seats",
    "checkout.seats.legend.available": "Available",
    "checkout.seats.legend.taken": "Taken",
    "checkout.seats.legend.selected": "Selected",
    "checkout.seats.modal_title": "Sélectionnez vos sièges",
    "checkout.seats.confirm": "Confirmer la sélection",
    "checkout.seats.front": "Avant du Bus",
    "checkout.seats.driver": "Chauffeur",
    "checkout.summary.base": "Prix de base billet",
    "checkout.summary.extras": "Services extra (Sièges)",
    "auth.login.title": "Bon retour",
    "auth.login.subtitle": "Connectez-vous pour finaliser votre réservation",
    "auth.signup.title": "Créer un compte",
    "auth.signup.subtitle": "Inscrivez-vous pour réserver et gérer vos voyages",
    "auth.label.email": "Adresse Email",
    "auth.label.password": "Mot de passe",
    "auth.label.name": "Nom Complet",
    "auth.btn.login": "Se connecter",
    "auth.btn.signup": "S'inscrire",
    "auth.link.no_account": "Pas de compte ? Inscrivez-vous",
    "auth.link.has_account": "Déjà un compte ? Connectez-vous",
    "amenity.wifi": "Wi-Fi",
    "amenity.ac": "Clim",
    "amenity.power": "Prise",
    "amenity.snack": "Snacks",
    "amenity.tv": "TV",
    "bookings.title": "Mes Voyages",
    "bookings.subtitle": "Gérez vos voyages à venir et passés.",
    "bookings.tab.upcoming": "À venir",
    "bookings.tab.past": "Passés",
    "bookings.empty": "Aucune réservation trouvée.",
    "bookings.ticket_id": "N° Billet",
    "bookings.download": "Télécharger Billet",
    "bookings.status.confirmed": "Confirmé",
    "bookings.status.completed": "Terminé",
    "bookings.status.cancelled": "Annulé",
    
    // Admin Generic
    "admin.dashboard": "Tableau de Bord",
    "admin.logout": "Déconnexion",
    "admin.welcome": "Bienvenue",

    // Super Admin
    "admin.super.role": "Administrateur Plateforme",
    "admin.super.agencies": "Toutes les Agences",
    "admin.super.users": "Utilisateurs Plateforme",
    "admin.super.revenue": "Revenu Plateforme",
    "admin.super.add_agency": "Ajouter Agence",

    // Agency Admin
    "admin.agency.role": "Administrateur Agence",
    "admin.agency.my_agency": "Mon Agence",
    "admin.agency.stations": "Mes Gares",
    "admin.agency.fleet": "Gestion de Flotte",
    "admin.agency.staff": "Personnel & Chefs",
    "admin.agency.revenue": "Chiffre d'Affaires",

    // Station Manager
    "admin.station.role": "Chef de Gare",
    "admin.station.operations": "Opérations",
    "admin.station.ticketing": "Guichet",
    "admin.station.clients": "Clients & Passagers",
    "admin.station.daily_sales": "Ventes du Jour",
    "admin.station.checkin": "Embarquement"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to French since the user asked in French, but easy to switch.
  const [language, setLanguage] = useState<Language>('fr');

  const t = (key: string) => {
    // @ts-ignore
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};