'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isReady: boolean;
}

// -------------------------------------------------------------------------
// Dictionaries
// -------------------------------------------------------------------------

const fr: Record<string, string> = {
  // Navigation & chrome
  'nav.home': 'Accueil',
  'nav.routes': 'Trajets',
  'nav.service': 'Services',
  'nav.help': 'Aide',
  'nav.agencies': 'Agences',
  'nav.bookings': 'Mes réservations',
  'nav.account': 'Mon compte',
  'nav.login': 'Connexion',
  'nav.logout': 'Déconnexion',
  'nav.signup': "S'inscrire",
  'nav.book_now': 'Réserver',
  'nav.menu': 'Menu',
  'nav.close': 'Fermer',
  'nav.language': 'Langue',
  'nav.admin.super': 'Super admin',
  'nav.admin.company': 'Admin compagnie',
  'nav.admin.agency': 'Admin agence',
  'nav.admin.station': 'Chef de gare',
  'nav.version': 'Version',

  // Common
  'common.or': 'ou',
  'common.back': 'Retour',
  'common.continue': 'Continuer',
  'common.cancel': 'Annuler',
  'common.save': 'Enregistrer',
  'common.close': 'Fermer',
  'common.edit': 'Modifier',
  'common.delete': 'Supprimer',
  'common.confirm': 'Confirmer',
  'common.loading': 'Chargement...',
  'common.error': 'Une erreur est survenue',
  'common.retry': 'Réessayer',
  'common.search': 'Rechercher',
  'common.see_all': 'Tout voir',
  'common.required': 'Champ requis',

  // Hero
  'hero.eyebrow': 'Voyager au Cameroun',
  'hero.title': 'Votre prochain voyage,',
  'hero.title.accent': 'sans faire la file.',
  'hero.subtitle':
    "Toutes les compagnies de bus du Cameroun sur une seule application. Comparez, réservez, embarquez — en quelques minutes.",
  'hero.cta.primary': "Réserver maintenant",
  'hero.cta.secondary': 'Voir les agences',
  'hero.trust.realtime': 'Horaires temps réel',
  'hero.trust.mobile_money': 'Paiement Mobile Money',
  'hero.trust.qr': 'Billet QR instantané',

  // Search widget
  'search.tab.trip': 'Trajet bus',
  'search.tab.agencies': 'Explorer les agences',
  'search.trip_type.one_way': 'Aller simple',
  'search.trip_type.round_trip': 'Aller-retour',
  'search.label.from': 'De',
  'search.label.to': 'À',
  'search.label.departure': 'Départ',
  'search.label.return': 'Retour',
  'search.label.passengers': 'Passagers',
  'search.passenger.adults': 'Adultes',
  'search.passenger.children': 'Enfants',
  'search.passenger.done': 'Terminé',
  'search.placeholder.city': 'Ville ou gare',
  'search.placeholder.today': "Aujourd'hui",
  'search.button': 'Trouver un billet',
  'search.swap': 'Inverser',

  // Features section
  'features.eyebrow': 'Pourquoi EasyTravel',
  'features.title': 'Tout ce qui compte quand on voyage,',
  'features.title.accent': 'pensé pour vous.',
  'features.subtitle':
    'Le réseau le plus fiable du Cameroun, avec la simplicité des grandes applications.',
  'features.wifi.title': 'Wi-Fi 4G gratuit',
  'features.wifi.desc': 'Restez connecté durant tout le voyage. Naviguez, streamez, travaillez depuis votre siège.',
  'features.legroom.title': 'Confort premium',
  'features.legroom.desc': 'Flotte récente, sièges inclinables, espace pour les jambes — même en classique.',
  'features.eco.title': 'Voyage éco-responsable',
  'features.eco.desc': "Nos bus émettent une fraction du CO₂ d'une voiture ou d'un avion équivalent.",
  'features.title.b': 'Repensé de fond en comble,',
  'features.title.b.accent': 'pour vous faire gagner du temps.',
  'features.subtitle.b':
    "Chaque étape a été pensée pour être la plus courte possible, tout en restant fiable et sécurisée. Parce que le meilleur voyage commence avant l'embarquement.",
  'features.momo.title': 'Mobile Money natif',
  'features.momo.desc':
    'Paiement Orange Money et MTN MoMo sécurisé par confirmation USSD. Aucune carte bancaire requise.',
  'features.qr.title': 'Billet QR instantané',
  'features.qr.desc':
    "Plus besoin d'imprimer. Montrez votre QR au chef de gare et embarquez. Validation en temps réel à bord.",
  'features.roundtrip.title': 'Aller-retour en un clic',
  'features.roundtrip.desc':
    'Réservez les deux trajets en une transaction, avec la possibilité de revenir avec une autre compagnie.',
  'features.compare.title': 'Comparaison multi-compagnies',
  'features.compare.desc':
    'Tous les horaires, tous les prix et toutes les options de confort (VIP, Classique, AC) sur un seul écran.',
  'features.24_7.title': 'Réservation 24 / 7',
  'features.24_7.desc':
    "Plus de file à 5 h du matin. Réservez depuis chez vous, à toute heure et depuis n'importe quel appareil.",
  'features.support.title': 'Support WhatsApp',
  'features.support.desc': 'Notre équipe répond sur WhatsApp 7j/7 de 6 h à 22 h, en français et en anglais.',

  // How it works
  'how.eyebrow': 'Comment ça marche',
  'how.title': 'Réservez en 2 minutes,',
  'how.title.accent': 'de chez vous.',
  'how.subtitle': 'Une expérience pensée pour le mobile — simple, rapide, fiable, même en 3G.',
  'how.step1.title': 'Recherchez',
  'how.step1.desc': 'Saisissez votre ville de départ, votre destination et la date. Aller simple ou aller-retour.',
  'how.step2.title': 'Comparez',
  'how.step2.desc': 'Toutes les compagnies et tous les niveaux de confort — VIP, Classique, Climatisé — sur un écran.',
  'how.step3.title': 'Payez',
  'how.step3.desc': 'Orange Money ou MTN MoMo en un clic. Confirmation USSD directe sur votre téléphone.',
  'how.step4.title': 'Embarquez',
  'how.step4.desc': 'Votre billet QR est prêt. Montrez-le au chef de gare et montez à bord.',

  // Popular routes
  'routes.eyebrow': 'Destinations populaires',
  'routes.title': 'Les trajets',
  'routes.title.accent': 'les plus réservés.',
  'routes.subtitle':
    'Des données temps réel sur les liaisons préférées du pays — Douala, Yaoundé, Bafoussam et plus.',
  'routes.from': 'Dès',
  'routes.connections': 'liaisons / jour',
  'routes.view_all': 'Voir toutes les liaisons',
  'routes.empty': 'Aucun départ pour le moment. Revenez bientôt.',

  // Stats banner
  'stats.travelers': 'Voyageurs servis',
  'stats.routes': 'Liaisons actives',
  'stats.agencies': 'Compagnies partenaires',
  'stats.rating': 'Note moyenne clients',

  // Testimonials
  'testimonials.eyebrow': 'Ils nous font confiance',
  'testimonials.title': 'Plus de',
  'testimonials.title.highlight': '200 000 voyageurs',
  'testimonials.title.accent': 'ont déjà embarqué avec nous.',
  'testimonials.1.name': 'Marie Nguema',
  'testimonials.1.role': 'Commerçante, Douala',
  'testimonials.1.quote':
    "J'ai réservé Douala → Yaoundé en 2 minutes pendant que je cuisinais. Paiement MoMo, QR reçu immédiatement. Fini les longues files à l'agence.",
  'testimonials.2.name': 'Jean-Paul Kamga',
  'testimonials.2.role': 'Étudiant, Bafoussam',
  'testimonials.2.quote':
    "L'aller-retour Bafoussam → Yaoundé est parfait pour mes week-ends. Je compare tous les horaires des compagnies et je choisis le moins cher.",
  'testimonials.3.name': 'Aïcha Bello',
  'testimonials.3.role': 'Enseignante, Garoua',
  'testimonials.3.quote':
    "Au début j'étais sceptique avec le paiement Mobile Money en ligne. Mais la confirmation USSD sur le téléphone rend l'expérience vraiment sécurisée.",

  // FAQ
  'faq.eyebrow': 'Questions fréquentes',
  'faq.title': "Tout ce qu'il faut savoir,",
  'faq.title.accent': 'avant de partir.',
  'faq.contact_cta': 'Toujours une question ? Notre équipe est disponible 7j/7 de 6 h à 22 h.',
  'faq.whatsapp': 'Nous écrire sur WhatsApp',
  'faq.q1': 'Comment réserver un billet de bus sur EasyTravel ?',
  'faq.a1':
    'Entrez votre ville de départ, destination et date dans la barre de recherche en haut de la page. Comparez les compagnies, sélectionnez votre bus, renseignez vos informations passager, payez par Mobile Money et recevez votre billet QR instantanément.',
  'faq.q2': 'Quels modes de paiement acceptez-vous ?',
  'faq.a2':
    'Nous acceptons Orange Money, MTN Mobile Money et les cartes bancaires. Les paiements Mobile Money sont sécurisés par une confirmation USSD sur votre téléphone : aucun risque de débit non autorisé.',
  'faq.q3': 'Puis-je réserver un aller-retour ?',
  'faq.a3':
    'Bien sûr. Dans la barre de recherche, cochez « Aller-retour » et choisissez votre date de retour. Vous réservez les deux trajets en une seule transaction et recevez deux billets QR.',
  'faq.q4': 'Comment fonctionne le billet QR ? Dois-je l\u2019imprimer ?',
  'faq.a4':
    "Non, pas besoin d\u2019imprimer. Ouvrez l\u2019application ou votre email de confirmation, montrez le QR code au chef de gare qui le scanne à l\u2019embarquement. C\u2019est instantané.",
  'faq.q5': 'Puis-je annuler ou modifier ma réservation ?',
  'faq.a5':
    "Les conditions d\u2019annulation dépendent de chaque compagnie partenaire. Rendez-vous dans « Mes réservations » pour consulter les options disponibles pour votre trajet, ou contactez directement notre support WhatsApp.",
  'faq.q6': 'Mes informations de paiement sont-elles sécurisées ?',
  'faq.a6':
    "Oui. Nous n\u2019enregistrons jamais vos identifiants Mobile Money. Chaque paiement transite par les API officielles d\u2019Orange et de MTN, et nécessite votre confirmation USSD/PIN sur votre téléphone.",

  // Trusted companies
  'trusted.eyebrow': 'Compagnies partenaires',
  'trusted.title': '{count} compagnies de confiance,',
  'trusted.title.accent': 'un seul billet.',
  'trusted.subtitle': 'Toutes les grandes compagnies camerounaises réunies sur une plateforme unique.',
  'trusted.official': 'Officiel',
  'trusted.agencies': 'agences',
  'trusted.routes': 'routes',

  // CTA band
  'cta.eyebrow': "L'app EasyTravel",
  'cta.title': 'Votre prochain voyage',
  'cta.title.accent': 'commence maintenant.',
  'cta.desc':
    "Pas d'application à télécharger. Réservez en 2 minutes depuis votre navigateur, recevez votre billet QR par email et WhatsApp.",
  'cta.btn.search': 'Rechercher un trajet',
  'cta.btn.agencies': 'Nos agences',
  'cta.btn.support': 'Support WhatsApp',
  'cta.trust.ssl': 'SSL sécurisé',
  'cta.trust.mobile': 'Mobile-first',
  'cta.trust.langs': 'FR / EN',
  'cta.app_store': 'App Store',
  'cta.google_play': 'Google Play',

  // Footer
  'footer.slogan':
    'La plateforme camerounaise de réservation de bus. Toutes les compagnies, un seul billet, 100 % Mobile Money.',
  'footer.newsletter.title': 'Bons plans & nouveaux trajets,',
  'footer.newsletter.title.accent': 'droit dans votre boîte mail.',
  'footer.newsletter.subtitle':
    'Une lettre mensuelle, pas de spam. Nouvelles destinations, offres négociées et mises à jour produit.',
  'footer.newsletter.placeholder': 'votre@email.cm',
  'footer.newsletter.subscribe': "S'abonner",
  'footer.newsletter.thanks': 'Merci !',
  'footer.travel': 'Voyager',
  'footer.support': 'Support',
  'footer.company': 'EasyTravel',
  'footer.rights': 'Tous droits réservés.',
  'footer.payments': 'Paiements acceptés',
  'footer.link.search_bus': 'Rechercher un bus',
  'footer.link.agencies': 'Nos agences',
  'footer.link.partners': 'Compagnies partenaires',
  'footer.link.popular': 'Trajets populaires',
  'footer.link.manage_booking': 'Gérer ma réservation',
  'footer.link.help_center': "Centre d'aide",
  'footer.link.whatsapp': 'Chat WhatsApp',
  'footer.link.faqs': 'Foire aux questions',
  'footer.link.report': 'Signaler un problème',
  'footer.link.lost_found': 'Objets perdus',
  'footer.link.about': 'À propos',
  'footer.link.partner_with_us': 'Devenir partenaire',
  'footer.link.careers': 'Carrières',
  'footer.link.press': 'Presse & médias',
  'footer.link.pro_space': 'Espace pro / admin',
  'footer.link.terms': "Conditions d'utilisation",
  'footer.link.privacy': 'Politique de confidentialité',
  'footer.link.cookies': 'Cookies',

  // Agencies
  'agencies.eyebrow': 'Réseau EasyTravel',
  'agencies.title': 'Nos agences',
  'agencies.title.accent': 'partenaires.',
  'agencies.subtitle':
    "Nous collaborons avec les opérateurs les plus fiables du Cameroun pour garantir un voyage sûr et confortable.",
  'agencies.since': 'Depuis',
  'agencies.rating': 'Note',
  'agencies.view_profile': 'Voir le profil',
  'agencies.back': 'Retour aux agences',
  'agencies.stations': 'Gares & terminaux',
  'agencies.stations_subtitle': 'Trouvez le point de départ le plus proche pour cette compagnie.',
  'agencies.map_view': 'Vue carte',
  'agencies.address': 'Adresse',

  // Results
  'results.edit_search': 'Modifier la recherche',
  'results.sort_by': 'Trier par',
  'results.sort.price': 'Prix',
  'results.sort.departure': 'Départ',
  'results.sort.duration': 'Durée',
  'results.sort.arrival': 'Arrivée la plus tôt',
  'results.found': 'trajets trouvés',
  'results.found_one': 'trajet trouvé',
  'results.per_person': 'par personne',
  'results.select': 'Choisir',
  'results.duration': 'Durée',
  'results.amenities': 'Services',
  'results.step.outbound': "Sélectionner le trajet aller",
  'results.step.return': 'Sélectionner le trajet retour',
  'results.summary.title': 'Résumé du voyage',
  'results.summary.outbound': 'Aller',
  'results.summary.return': 'Retour',
  'results.summary.total': 'Prix total',
  'results.summary.checkout': 'Procéder au paiement',
  'results.filter.title': 'Filtres',
  'results.filter.open': 'Filtres',
  'results.filter.departure_time': 'Heure de départ',
  'results.filter.morning': 'Matin (06:00 - 12:00)',
  'results.filter.afternoon': 'Après-midi (12:00 - 18:00)',
  'results.filter.evening': 'Soir (18:00+)',
  'results.filter.agencies': 'Opérateurs',
  'results.filter.amenities': 'Services',
  'results.filter.clear': 'Tout effacer',
  'results.filter.apply': 'Appliquer les filtres',
  'results.filter.price_range': 'Fourchette de prix',
  'results.filter.max_duration': 'Durée max',
  'results.filter.hour_range': 'Heure de départ',
  'results.empty.title': 'Aucun trajet ce jour-là',
  'results.empty.desc_filters': "Essayez d'élargir vos filtres, ou regardez les dates proches ci-dessous.",
  'results.empty.desc_default': 'Voici les dates proches où des trajets sont disponibles.',
  'results.empty.nearby_label': 'Dates proches disponibles',
  'results.empty.none_found': 'Aucun trajet trouvé dans les 3 jours alentours.',
  'results.compare.label': 'Comparer',
  'results.compare.cta': 'Comparer',
  'results.compare.clear': 'Vider',
  'results.compare.max': 'Maximum 3 trajets à comparer',
  'results.compare.add': 'Ajouter à la comparaison',
  'results.compare.modal_title': 'trajets',
  'results.compare.modal_title_accent': 'côte à côte',
  'results.compare.cheapest': 'Le + bas',
  'results.compare.fastest': 'Le + rapide',
  'results.compare.earliest': 'Plus tôt',
  'results.compare.pick': 'Choisir ce trajet',
  'results.compare.no_services': 'Aucun service renseigné',
  'results.compare.seats': 'Places',
  'results.compare.available': 'disponibles',

  // Checkout
  'checkout.title': 'Paiement sécurisé',
  'checkout.contact': 'Informations de contact',
  'checkout.passenger': 'Détails passagers',
  'checkout.passenger_n': 'Passager adulte',
  'checkout.payment': 'Mode de paiement',
  'checkout.label.email': 'Adresse email',
  'checkout.label.phone': 'Numéro de téléphone',
  'checkout.label.fullname': 'Nom complet',
  'checkout.label.id': 'CNI / Passeport',
  'checkout.method.momo': 'Mobile Money',
  'checkout.method.card': 'Carte bancaire',
  'checkout.momo.provider': "Choisir l'opérateur",
  'checkout.momo.number': 'Numéro de portefeuille',
  'checkout.card.number': 'Numéro de carte',
  'checkout.card.expiry': "Date d'expiration",
  'checkout.card.cvv': 'CVV',
  'checkout.pay_btn': 'Payer',
  'checkout.success.title': 'Réservation confirmée !',
  'checkout.success.msg': 'Votre billet a été envoyé à votre adresse email.',
  'checkout.success.download': 'Télécharger le billet',
  'checkout.success.home': "Retour à l'accueil",
  'checkout.secure_badge': 'Paiement SSL sécurisé',
  'checkout.seats.title': 'Sélection des sièges',
  'checkout.seats.desc': 'Choisissez votre place préférée pour plus de confort.',
  'checkout.seats.price': 'Frais de siège',
  'checkout.seats.select_outbound': 'Sièges aller',
  'checkout.seats.select_return': 'Sièges retour',
  'checkout.seats.legend.available': 'Disponible',
  'checkout.seats.legend.taken': 'Occupé',
  'checkout.seats.legend.selected': 'Sélectionné',
  'checkout.seats.modal_title': 'Sélectionnez vos sièges',
  'checkout.seats.confirm': 'Confirmer la sélection',
  'checkout.seats.front': 'Avant du bus',
  'checkout.seats.driver': 'Chauffeur',
  'checkout.summary.base': 'Prix de base billet',
  'checkout.summary.extras': 'Services extra (sièges)',

  // Auth
  'auth.login.title': 'Bon retour',
  'auth.login.subtitle': 'Connectez-vous pour finaliser votre réservation',
  'auth.signup.title': 'Créer un compte',
  'auth.signup.subtitle': 'Inscrivez-vous pour réserver et gérer vos voyages',
  'auth.label.email': 'Adresse email',
  'auth.label.password': 'Mot de passe',
  'auth.label.name': 'Nom complet',
  'auth.btn.login': 'Se connecter',
  'auth.btn.signup': "S'inscrire",
  'auth.link.no_account': 'Pas de compte ? Inscrivez-vous',
  'auth.link.has_account': 'Déjà un compte ? Connectez-vous',

  // Amenities
  'amenity.wifi': 'Wi-Fi',
  'amenity.ac': 'Clim',
  'amenity.power': 'Prise',
  'amenity.snack': 'Snacks',
  'amenity.tv': 'TV',

  // Bookings page
  'bookings.title': 'Mes voyages',
  'bookings.title.accent': 'en un clic.',
  'bookings.subtitle': 'Gérez vos voyages à venir et passés.',
  'bookings.tab.upcoming': 'À venir',
  'bookings.tab.past': 'Passés',
  'bookings.empty.upcoming': 'Aucun voyage à venir.',
  'bookings.empty.past': 'Aucun voyage passé.',
  'bookings.ticket_id': 'N° Billet',
  'bookings.download': 'Télécharger billet',
  'bookings.view': 'Voir le billet',
  'bookings.status.confirmed': 'Confirmé',
  'bookings.status.completed': 'Terminé',
  'bookings.status.cancelled': 'Annulé',
  'bookings.status.pending': 'En attente',
  'bookings.status.boarded': 'Embarqué',

  // Ticket modal / PDF / resend
  'ticket.brand': 'Billet Easy Travel',
  'ticket.date': 'Date',
  'ticket.seats': 'Sièges',
  'ticket.passengers': 'Passager(s)',
  'ticket.scan_at_boarding': "Scan à l'embarquement",
  'ticket.download_pdf': 'Télécharger PDF',
  'ticket.pdf.error': "Impossible de générer le PDF. Réessayez.",
  'ticket.resend.email': 'Renvoyer par email',
  'ticket.resend.sms': 'Renvoyer par SMS',
  'ticket.resend.email.sent': 'Billet renvoyé par email ✓',
  'ticket.resend.sms.sent': 'Billet renvoyé par SMS ✓',
  'checkout.outbound': 'Aller',
  'checkout.return': 'Retour',

  // Admin (kept short; not touching admin UI in this pass)
  'admin.dashboard': 'Tableau de bord',
  'admin.logout': 'Déconnexion',
  'admin.welcome': 'Bienvenue',
  'admin.search': 'Rechercher...',
  'admin.super.role': 'Administrateur plateforme',
  'admin.super.agencies': 'Toutes les agences',
  'admin.super.users': 'Utilisateurs plateforme',
  'admin.super.revenue': 'Revenu plateforme',
  'admin.super.add_agency': 'Ajouter agence',
  'admin.agency.role': 'Administrateur agence',
  'admin.agency.my_agency': 'Mon agence',
  'admin.agency.stations': 'Mes gares',
  'admin.agency.fleet': 'Gestion de flotte',
  'admin.agency.routes': 'Trajets & horaires',
  'admin.agency.staff': 'Personnel',
  'admin.agency.revenue': "Chiffre d'affaires",
  'admin.fleet.add': 'Ajouter bus',
  'admin.fleet.plate': 'Immatriculation',
  'admin.fleet.capacity': 'Capacité',
  'admin.fleet.status': 'État',
  'admin.route.add': 'Créer trajet',
  'admin.route.origin': 'Départ',
  'admin.route.dest': 'Arrivée',
  'admin.route.time': 'Heure',
  'admin.route.price': 'Prix',
  'admin.station.role': 'Chef de gare',
  'admin.station.operations': 'Opérations',
  'admin.station.ticketing': 'Guichet',
  'admin.station.clients': 'Clients & passagers',
  'admin.station.daily_sales': 'Ventes du jour',
  'admin.station.checkin': 'Embarquement',
  'admin.station.validate': 'Valider billet',
  'admin.station.manifest': 'Manifeste',
  'admin.station.scan': 'Scanner QR',

  // Account
  'account.eyebrow': 'Mon compte',
  'account.title': 'Votre profil Easy Travel.',
  'account.subtitle':
    'Mettez à jour vos informations, changez votre mot de passe ou supprimez votre compte.',
  'account.role': 'Rôle',
  'account.profile.title': 'Informations personnelles',
  'account.profile.save': 'Enregistrer',
  'account.profile.saved': 'Profil mis à jour.',
  'account.field.name': 'Nom complet',
  'account.field.email': 'Email',
  'account.password.title': 'Mot de passe',
  'account.password.current': 'Mot de passe actuel',
  'account.password.new': 'Nouveau mot de passe',
  'account.password.confirm': 'Confirmer le nouveau mot de passe',
  'account.password.save': 'Changer le mot de passe',
  'account.password.saved': 'Mot de passe mis à jour.',
  'account.password.too_short': 'Le nouveau mot de passe doit faire au moins 8 caractères.',
  'account.password.mismatch': 'Les mots de passe ne correspondent pas.',
  'account.delete.title': 'Zone sensible',
  'account.delete.description':
    'La suppression est définitive. Vos réservations passées sont conservées pour la comptabilité mais anonymisées.',
  'account.delete.button': 'Supprimer mon compte',
  'account.delete.type_keyword': 'Tapez DELETE pour confirmer',
  'account.delete.confirm': 'Confirmer la suppression',
  'account.delete.confirm_keyword': 'Tapez exactement DELETE pour confirmer.',

  // Bookings — cancel
  'bookings.cancel.action': 'Annuler',
  'bookings.cancel.confirm.title': 'Annuler cette réservation ?',
  'bookings.cancel.confirm.body':
    "L'annulation libère vos sièges. Les remboursements Mobile Money sont traités sous 48 h par notre équipe.",
  'bookings.cancel.confirm.yes': 'Oui, annuler',
  'bookings.cancel.confirm.no': 'Garder la réservation',
  'bookings.cancel.success': 'Réservation annulée.',
};

const en: Record<string, string> = {
  // Navigation & chrome
  'nav.home': 'Home',
  'nav.routes': 'Routes',
  'nav.service': 'Services',
  'nav.help': 'Help',
  'nav.agencies': 'Agencies',
  'nav.bookings': 'My bookings',
  'nav.account': 'My account',
  'nav.login': 'Log in',
  'nav.logout': 'Log out',
  'nav.signup': 'Sign up',
  'nav.book_now': 'Book now',
  'nav.menu': 'Menu',
  'nav.close': 'Close',
  'nav.language': 'Language',
  'nav.admin.super': 'Super admin',
  'nav.admin.company': 'Company admin',
  'nav.admin.agency': 'Agency admin',
  'nav.admin.station': 'Station manager',
  'nav.version': 'Version',

  // Common
  'common.or': 'or',
  'common.back': 'Back',
  'common.continue': 'Continue',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.close': 'Close',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.confirm': 'Confirm',
  'common.loading': 'Loading...',
  'common.error': 'Something went wrong',
  'common.retry': 'Try again',
  'common.search': 'Search',
  'common.see_all': 'See all',
  'common.required': 'Required field',

  // Hero
  'hero.eyebrow': 'Travel in Cameroon',
  'hero.title': 'Your next trip,',
  'hero.title.accent': 'without the queue.',
  'hero.subtitle':
    "Every bus company in Cameroon in one app. Compare, book and board — in just a few minutes.",
  'hero.cta.primary': 'Book now',
  'hero.cta.secondary': 'Browse agencies',
  'hero.trust.realtime': 'Real-time schedules',
  'hero.trust.mobile_money': 'Mobile Money payment',
  'hero.trust.qr': 'Instant QR ticket',

  // Search widget
  'search.tab.trip': 'Bus trip',
  'search.tab.agencies': 'Explore agencies',
  'search.trip_type.one_way': 'One way',
  'search.trip_type.round_trip': 'Round trip',
  'search.label.from': 'From',
  'search.label.to': 'To',
  'search.label.departure': 'Departure',
  'search.label.return': 'Return',
  'search.label.passengers': 'Passengers',
  'search.passenger.adults': 'Adults',
  'search.passenger.children': 'Children',
  'search.passenger.done': 'Done',
  'search.placeholder.city': 'City or station',
  'search.placeholder.today': 'Today',
  'search.button': 'Find tickets',
  'search.swap': 'Swap',

  // Features
  'features.eyebrow': 'Why EasyTravel',
  'features.title': 'Everything that matters when you travel,',
  'features.title.accent': 'designed for you.',
  'features.subtitle': "Cameroon's most reliable network, with the polish of a great app.",
  'features.wifi.title': 'Free 4G Wi-Fi',
  'features.wifi.desc': 'Stay connected during the whole trip. Browse, stream or work from your seat.',
  'features.legroom.title': 'Premium comfort',
  'features.legroom.desc': 'Recent fleet, reclining seats, real legroom — even in standard class.',
  'features.eco.title': 'Eco-friendly travel',
  'features.eco.desc': 'Our buses emit a fraction of the CO₂ of an equivalent car or plane ride.',
  'features.title.b': 'Rebuilt from the ground up,',
  'features.title.b.accent': 'to save you time.',
  'features.subtitle.b':
    'Every step has been reworked to be as short as possible, while staying reliable and secure. Because a great trip starts before boarding.',
  'features.momo.title': 'Native Mobile Money',
  'features.momo.desc':
    'Orange Money and MTN MoMo payments, secured by USSD confirmation. No card required.',
  'features.qr.title': 'Instant QR ticket',
  'features.qr.desc':
    "No printing. Show your QR to the station agent and board. Real-time validation on board.",
  'features.roundtrip.title': 'One-click round trip',
  'features.roundtrip.desc':
    'Book both legs in one transaction, with the option to return with a different company.',
  'features.compare.title': 'Multi-company compare',
  'features.compare.desc':
    'All times, all prices, and every comfort class (VIP, Classic, AC) on a single screen.',
  'features.24_7.title': '24 / 7 booking',
  'features.24_7.desc':
    'No more queueing at 5 am. Book from home, any time, from any device.',
  'features.support.title': 'WhatsApp support',
  'features.support.desc': 'Our team answers on WhatsApp 7 days a week, 6 am – 10 pm, in French and English.',

  // How it works
  'how.eyebrow': 'How it works',
  'how.title': 'Book in 2 minutes,',
  'how.title.accent': 'from home.',
  'how.subtitle': 'A mobile-first experience — simple, fast, reliable, even on 3G.',
  'how.step1.title': 'Search',
  'how.step1.desc': 'Enter your departure city, destination and date. One way or round trip.',
  'how.step2.title': 'Compare',
  'how.step2.desc': 'Every company and every comfort level — VIP, Classic, AC — on a single screen.',
  'how.step3.title': 'Pay',
  'how.step3.desc': 'Orange Money or MTN MoMo in one click. USSD confirmation straight to your phone.',
  'how.step4.title': 'Board',
  'how.step4.desc': 'Your QR ticket is ready. Show it at the gate, hop on. No paper needed.',

  // Popular routes
  'routes.eyebrow': 'Popular destinations',
  'routes.title': 'The most',
  'routes.title.accent': 'booked trips.',
  'routes.subtitle':
    "Real-time data on the country's favourite connections — Douala, Yaoundé, Bafoussam and beyond.",
  'routes.from': 'From',
  'routes.connections': 'daily connections',
  'routes.view_all': 'View all routes',
  'routes.empty': 'No departures right now. Check back soon.',

  // Stats
  'stats.travelers': 'Travellers served',
  'stats.routes': 'Active routes',
  'stats.agencies': 'Partner companies',
  'stats.rating': 'Avg. customer rating',

  // Testimonials
  'testimonials.eyebrow': 'They trust us',
  'testimonials.title': 'More than',
  'testimonials.title.highlight': '200,000 travellers',
  'testimonials.title.accent': 'have already boarded with us.',
  'testimonials.1.name': 'Marie Nguema',
  'testimonials.1.role': 'Shop owner, Douala',
  'testimonials.1.quote':
    'I booked Douala → Yaoundé in 2 minutes while cooking. MoMo payment, QR received instantly. No more queueing at the agency.',
  'testimonials.2.name': 'Jean-Paul Kamga',
  'testimonials.2.role': 'Student, Bafoussam',
  'testimonials.2.quote':
    'The round trip Bafoussam → Yaoundé is perfect for my weekends. I compare every company and pick the cheapest.',
  'testimonials.3.name': 'Aïcha Bello',
  'testimonials.3.role': 'Teacher, Garoua',
  'testimonials.3.quote':
    'I was sceptical about online Mobile Money at first. But the USSD confirmation on my phone makes it genuinely secure.',

  // FAQ
  'faq.eyebrow': 'FAQ',
  'faq.title': 'Everything you need to know,',
  'faq.title.accent': 'before you go.',
  'faq.contact_cta': 'Still have questions? Our team is available 7 days a week from 6 am to 10 pm.',
  'faq.whatsapp': 'Message us on WhatsApp',
  'faq.q1': 'How do I book a bus ticket on EasyTravel?',
  'faq.a1':
    'Enter your origin, destination and date in the search bar at the top. Compare companies, pick your bus, fill in passenger details, pay with Mobile Money and receive your QR ticket instantly.',
  'faq.q2': 'Which payment methods do you accept?',
  'faq.a2':
    'We accept Orange Money, MTN Mobile Money and credit cards. Mobile Money payments are secured by a USSD confirmation on your phone — no unauthorised charges.',
  'faq.q3': 'Can I book a round trip?',
  'faq.a3':
    "Yes. In the search bar, tick \u201CRound trip\u201D and pick your return date. You book both legs in one transaction and receive two QR tickets.",
  'faq.q4': 'How does the QR ticket work? Do I need to print it?',
  'faq.a4':
    'No need to print. Open the app or your confirmation email and show the QR code to the station agent to scan at boarding. Instant.',
  'faq.q5': 'Can I cancel or change my booking?',
  'faq.a5':
    "Cancellation rules depend on each partner company. Head to \u201CMy bookings\u201D to view the options available for your trip, or contact our WhatsApp support directly.",
  'faq.q6': 'Is my payment information safe?',
  'faq.a6':
    'Yes. We never store your Mobile Money credentials. Each payment goes through the official Orange and MTN APIs and requires your USSD/PIN confirmation on your phone.',

  // Trusted
  'trusted.eyebrow': 'Partner companies',
  'trusted.title': '{count} trusted companies,',
  'trusted.title.accent': 'one single ticket.',
  'trusted.subtitle': 'Every major Cameroonian operator on a single platform.',
  'trusted.official': 'Official',
  'trusted.agencies': 'agencies',
  'trusted.routes': 'routes',

  // CTA
  'cta.eyebrow': 'The EasyTravel app',
  'cta.title': 'Your next journey',
  'cta.title.accent': 'starts now.',
  'cta.desc':
    "No app to download. Book in 2 minutes from your browser, receive your QR ticket by email and WhatsApp.",
  'cta.btn.search': 'Find a trip',
  'cta.btn.agencies': 'Our agencies',
  'cta.btn.support': 'WhatsApp support',
  'cta.trust.ssl': 'SSL secured',
  'cta.trust.mobile': 'Mobile-first',
  'cta.trust.langs': 'FR / EN',
  'cta.app_store': 'App Store',
  'cta.google_play': 'Google Play',

  // Footer
  'footer.slogan':
    "Cameroon's bus booking platform. Every company, one ticket, 100% Mobile Money.",
  'footer.newsletter.title': 'Deals & new routes,',
  'footer.newsletter.title.accent': 'straight to your inbox.',
  'footer.newsletter.subtitle':
    'A monthly letter, no spam. New destinations, negotiated offers and product updates.',
  'footer.newsletter.placeholder': 'your@email.cm',
  'footer.newsletter.subscribe': 'Subscribe',
  'footer.newsletter.thanks': 'Thanks!',
  'footer.travel': 'Travel',
  'footer.payments': 'Accepted payments',
  'footer.link.search_bus': 'Search for a bus',
  'footer.link.agencies': 'Our agencies',
  'footer.link.partners': 'Partner companies',
  'footer.link.popular': 'Popular routes',
  'footer.link.manage_booking': 'Manage my booking',
  'footer.link.help_center': 'Help center',
  'footer.link.whatsapp': 'WhatsApp chat',
  'footer.link.faqs': 'Frequently asked questions',
  'footer.link.report': 'Report a problem',
  'footer.link.lost_found': 'Lost & found',
  'footer.link.about': 'About',
  'footer.link.partner_with_us': 'Become a partner',
  'footer.link.careers': 'Careers',
  'footer.link.press': 'Press & media',
  'footer.link.pro_space': 'Pro / admin space',
  'footer.link.terms': 'Terms of use',
  'footer.link.privacy': 'Privacy policy',
  'footer.link.cookies': 'Cookies',
  'footer.plan': 'Plan',
  'footer.support': 'Support',
  'footer.company': 'Company',
  'footer.rights': 'All rights reserved.',

  // Agencies
  'agencies.eyebrow': 'EasyTravel network',
  'agencies.title': 'Our partner',
  'agencies.title.accent': 'agencies.',
  'agencies.subtitle':
    "We work with Cameroon's most reliable operators to ensure a safe and comfortable journey.",
  'agencies.since': 'Since',
  'agencies.rating': 'Rating',
  'agencies.view_profile': 'View profile',
  'agencies.back': 'Back to agencies',
  'agencies.stations': 'Stations & terminals',
  'agencies.stations_subtitle': 'Find the closest departure point for this company.',
  'agencies.map_view': 'Map view',
  'agencies.address': 'Address',

  // Results
  'results.edit_search': 'Edit search',
  'results.sort_by': 'Sort by',
  'results.sort.price': 'Price',
  'results.sort.departure': 'Departure',
  'results.sort.duration': 'Duration',
  'results.sort.arrival': 'Earliest arrival',
  'results.found': 'trips found',
  'results.found_one': 'trip found',
  'results.per_person': 'per person',
  'results.select': 'Select',
  'results.duration': 'Duration',
  'results.amenities': 'Services',
  'results.step.outbound': 'Select outbound trip',
  'results.step.return': 'Select return trip',
  'results.summary.title': 'Trip summary',
  'results.summary.outbound': 'Outbound',
  'results.summary.return': 'Return',
  'results.summary.total': 'Total price',
  'results.summary.checkout': 'Proceed to checkout',
  'results.filter.title': 'Filters',
  'results.filter.open': 'Filters',
  'results.filter.departure_time': 'Departure time',
  'results.filter.morning': 'Morning (06:00 - 12:00)',
  'results.filter.afternoon': 'Afternoon (12:00 - 18:00)',
  'results.filter.evening': 'Evening (18:00+)',
  'results.filter.agencies': 'Operators',
  'results.filter.amenities': 'Services',
  'results.filter.clear': 'Clear all',
  'results.filter.apply': 'Apply filters',
  'results.filter.price_range': 'Price range',
  'results.filter.max_duration': 'Max duration',
  'results.filter.hour_range': 'Departure hour',
  'results.empty.title': 'No trips that day',
  'results.empty.desc_filters': 'Try loosening your filters, or pick one of the nearby dates below.',
  'results.empty.desc_default': 'Here are the nearby dates with available trips.',
  'results.empty.nearby_label': 'Nearby available dates',
  'results.empty.none_found': 'No trips found within 3 days.',
  'results.compare.label': 'Compare',
  'results.compare.cta': 'Compare',
  'results.compare.clear': 'Clear',
  'results.compare.max': 'You can compare up to 3 trips',
  'results.compare.add': 'Add to comparison',
  'results.compare.modal_title': 'trips',
  'results.compare.modal_title_accent': 'side by side',
  'results.compare.cheapest': 'Lowest',
  'results.compare.fastest': 'Fastest',
  'results.compare.earliest': 'Earliest',
  'results.compare.pick': 'Pick this trip',
  'results.compare.no_services': 'No services listed',
  'results.compare.seats': 'Seats',
  'results.compare.available': 'available',

  // Checkout
  'checkout.title': 'Secure checkout',
  'checkout.contact': 'Contact information',
  'checkout.passenger': 'Passenger details',
  'checkout.passenger_n': 'Adult passenger',
  'checkout.payment': 'Payment method',
  'checkout.label.email': 'Email address',
  'checkout.label.phone': 'Phone number',
  'checkout.label.fullname': 'Full name',
  'checkout.label.id': 'ID / Passport',
  'checkout.method.momo': 'Mobile Money',
  'checkout.method.card': 'Credit card',
  'checkout.momo.provider': 'Choose provider',
  'checkout.momo.number': 'Mobile wallet number',
  'checkout.card.number': 'Card number',
  'checkout.card.expiry': 'Expiry date',
  'checkout.card.cvv': 'CVV',
  'checkout.pay_btn': 'Pay',
  'checkout.success.title': 'Booking confirmed!',
  'checkout.success.msg': 'Your ticket has been sent to your email.',
  'checkout.success.download': 'Download ticket',
  'checkout.success.home': 'Back home',
  'checkout.secure_badge': 'SSL secure payment',
  'checkout.seats.title': 'Seat selection',
  'checkout.seats.desc': 'Pick your favourite spot for extra comfort.',
  'checkout.seats.price': 'Seat fee',
  'checkout.seats.select_outbound': 'Outbound seats',
  'checkout.seats.select_return': 'Return seats',
  'checkout.seats.legend.available': 'Available',
  'checkout.seats.legend.taken': 'Taken',
  'checkout.seats.legend.selected': 'Selected',
  'checkout.seats.modal_title': 'Pick your seats',
  'checkout.seats.confirm': 'Confirm selection',
  'checkout.seats.front': 'Front of bus',
  'checkout.seats.driver': 'Driver',
  'checkout.summary.base': 'Base ticket price',
  'checkout.summary.extras': 'Extras (seats)',

  // Auth
  'auth.login.title': 'Welcome back',
  'auth.login.subtitle': 'Log in to complete your booking',
  'auth.signup.title': 'Create an account',
  'auth.signup.subtitle': 'Sign up to book and manage your trips',
  'auth.label.email': 'Email address',
  'auth.label.password': 'Password',
  'auth.label.name': 'Full name',
  'auth.btn.login': 'Log in',
  'auth.btn.signup': 'Sign up',
  'auth.link.no_account': "No account? Sign up",
  'auth.link.has_account': 'Already have an account? Log in',

  // Amenities
  'amenity.wifi': 'Wi-Fi',
  'amenity.ac': 'AC',
  'amenity.power': 'Power',
  'amenity.snack': 'Snacks',
  'amenity.tv': 'TV',

  // Bookings
  'bookings.title': 'My trips',
  'bookings.title.accent': 'in one tap.',
  'bookings.subtitle': 'Manage your upcoming and past trips.',
  'bookings.tab.upcoming': 'Upcoming',
  'bookings.tab.past': 'Past',
  'bookings.empty.upcoming': 'No upcoming trips.',
  'bookings.empty.past': 'No past trips.',
  'bookings.ticket_id': 'Ticket #',
  'bookings.download': 'Download ticket',
  'bookings.view': 'View ticket',
  'bookings.status.confirmed': 'Confirmed',
  'bookings.status.completed': 'Completed',
  'bookings.status.cancelled': 'Cancelled',
  'bookings.status.pending': 'Pending',
  'bookings.status.boarded': 'Boarded',

  // Ticket modal / PDF / resend
  'ticket.brand': 'Easy Travel ticket',
  'ticket.date': 'Date',
  'ticket.seats': 'Seats',
  'ticket.passengers': 'Passenger(s)',
  'ticket.scan_at_boarding': 'Scan at boarding',
  'ticket.download_pdf': 'Download PDF',
  'ticket.pdf.error': 'Unable to generate the PDF. Please try again.',
  'ticket.resend.email': 'Resend by email',
  'ticket.resend.sms': 'Resend by SMS',
  'ticket.resend.email.sent': 'Ticket resent by email ✓',
  'ticket.resend.sms.sent': 'Ticket resent by SMS ✓',
  'checkout.outbound': 'Outbound',
  'checkout.return': 'Return',

  // Admin
  'admin.dashboard': 'Dashboard',
  'admin.logout': 'Log out',
  'admin.welcome': 'Welcome',
  'admin.search': 'Search...',
  'admin.super.role': 'Platform admin',
  'admin.super.agencies': 'All agencies',
  'admin.super.users': 'Platform users',
  'admin.super.revenue': 'Platform revenue',
  'admin.super.add_agency': 'Add agency',
  'admin.agency.role': 'Agency admin',
  'admin.agency.my_agency': 'My agency',
  'admin.agency.stations': 'My stations',
  'admin.agency.fleet': 'Fleet management',
  'admin.agency.routes': 'Routes & schedules',
  'admin.agency.staff': 'Staff',
  'admin.agency.revenue': 'Revenue',
  'admin.fleet.add': 'Add bus',
  'admin.fleet.plate': 'Plate',
  'admin.fleet.capacity': 'Capacity',
  'admin.fleet.status': 'Status',
  'admin.route.add': 'Create route',
  'admin.route.origin': 'Origin',
  'admin.route.dest': 'Destination',
  'admin.route.time': 'Time',
  'admin.route.price': 'Price',
  'admin.station.role': 'Station manager',
  'admin.station.operations': 'Operations',
  'admin.station.ticketing': 'Counter',
  'admin.station.clients': 'Clients & passengers',
  'admin.station.daily_sales': 'Daily sales',
  'admin.station.checkin': 'Boarding',
  'admin.station.validate': 'Validate ticket',
  'admin.station.manifest': 'Manifest',
  'admin.station.scan': 'Scan QR',

  // Account
  'account.eyebrow': 'My account',
  'account.title': 'Your Easy Travel profile.',
  'account.subtitle':
    'Update your details, change your password, or delete your account.',
  'account.role': 'Role',
  'account.profile.title': 'Personal details',
  'account.profile.save': 'Save',
  'account.profile.saved': 'Profile updated.',
  'account.field.name': 'Full name',
  'account.field.email': 'Email',
  'account.password.title': 'Password',
  'account.password.current': 'Current password',
  'account.password.new': 'New password',
  'account.password.confirm': 'Confirm new password',
  'account.password.save': 'Change password',
  'account.password.saved': 'Password updated.',
  'account.password.too_short': 'New password must be at least 8 characters.',
  'account.password.mismatch': 'Passwords do not match.',
  'account.delete.title': 'Danger zone',
  'account.delete.description':
    'Deletion is permanent. Past bookings are kept for accounting but anonymised.',
  'account.delete.button': 'Delete my account',
  'account.delete.type_keyword': 'Type DELETE to confirm',
  'account.delete.confirm': 'Confirm deletion',
  'account.delete.confirm_keyword': 'Type DELETE exactly to confirm.',

  // Bookings — cancel
  'bookings.cancel.action': 'Cancel',
  'bookings.cancel.confirm.title': 'Cancel this booking?',
  'bookings.cancel.confirm.body':
    'Cancelling releases your seats. Mobile Money refunds are processed within 48 h by our team.',
  'bookings.cancel.confirm.yes': 'Yes, cancel',
  'bookings.cancel.confirm.no': 'Keep the booking',
  'bookings.cancel.success': 'Booking cancelled.',
};

const translations: Record<Language, Record<string, string>> = { fr, en };

// -------------------------------------------------------------------------
// Context
// -------------------------------------------------------------------------

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'easytravel_lang';
const COOKIE_NAME = 'easytravel_lang';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const isLanguage = (v: unknown): v is Language => v === 'fr' || v === 'en';

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

const writeCookie = (name: string, value: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
};

const detectInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'fr';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLanguage(stored)) return stored;
  const cookie = readCookie(COOKIE_NAME);
  if (isLanguage(cookie)) return cookie;
  const navLang = window.navigator.language?.toLowerCase() || '';
  if (navLang.startsWith('en')) return 'en';
  return 'fr';
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Start with FR to match server render; hydrate real preference on client.
  const [language, setLanguageState] = useState<Language>('fr');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const detected = detectInitialLanguage();
    setLanguageState(detected);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || typeof document === 'undefined') return;
    document.documentElement.lang = language;
  }, [language, isReady]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, lang);
      } catch {}
      writeCookie(COOKIE_NAME, lang);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  }, [language, setLanguage]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const langMap = translations[language] || translations.fr;
      let str = langMap[key] ?? translations.fr[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`{${k}}`, 'g'), String(v));
        }
      }
      return str;
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isReady }}>
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
