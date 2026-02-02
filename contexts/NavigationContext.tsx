import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

type Page = 'home' | 'agencies' | 'results' | 'checkout' | 'login' | 'signup' | 'bookings' | 'super_admin' | 'agency_admin' | 'station_manager';

export interface SearchParams {
  from: string;
  to: string;
  date: string;
  returnDate?: string;
  passengers: { adults: number; children: number };
  tripType: 'one-way' | 'round-trip';
}

export interface SelectedTrip {
  id: number;
  agencyName: string;
  agencyLogo: string;
  departureTime: string;
  departureLocation: string;
  arrivalTime: string;
  arrivalLocation: string;
  duration: string;
  price: number;
  currency: string;
  color: string;
  date: string;
}

export interface BookingDetails {
  outbound: SelectedTrip;
  returnTrip: SelectedTrip | null;
  totalPrice: number;
  passengers: { adults: number; children: number };
}

export type UserRole = 'user' | 'super_admin' | 'agency_admin' | 'station_manager';

export interface User {
  uid: string;
  name: string;
  email: string;
  role?: UserRole;
  agencyId?: number;
  stationId?: number;
  avatar?: string;
}

interface NavigationContextType {
  currentPage: Page;
  navigateTo: (page: Page) => void;
  searchParams: SearchParams | null;
  setSearchParams: (params: SearchParams) => void;
  bookingDetails: BookingDetails | null;
  setBookingDetails: (details: BookingDetails) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Écouter les changements d'état Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // L'utilisateur est connecté, on récupère son profil complet dans Firestore
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            // Fusionner les données Auth et Firestore
            setUser({ 
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              ...docSnap.data() 
            } as User);
          } else {
            // Document n'existe pas encore
            // On tente de déduire le rôle via l'email pour maintenir la logique de démo
            const email = firebaseUser.email || '';
            let fallbackRole: UserRole = 'user';
            let avatar = 'US';
            
            if (email.includes('admin')) { fallbackRole = 'super_admin'; avatar = 'SA'; }
            else if (email.includes('express')) { fallbackRole = 'agency_admin'; avatar = 'AG'; }
            else if (email.includes('station')) { fallbackRole = 'station_manager'; avatar = 'SM'; }

            setUser({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || email.split('@')[0] || 'Utilisateur',
              email: email,
              role: fallbackRole,
              avatar: avatar
            });
          }
        } catch (error) {
          console.error("Erreur récupération profil (Firestore bloqué ?):", error);
          
          // FALLBACK ROBUSTE : Si Firestore échoue (règles, réseau...), on connecte quand même l'utilisateur
          // Cela empêche le chargement infini "spinner"
          const email = firebaseUser.email || '';
          let fallbackRole: UserRole = 'user';
          let avatar = 'US';
          
          if (email.includes('admin')) { fallbackRole = 'super_admin'; avatar = 'SA'; }
          else if (email.includes('express')) { fallbackRole = 'agency_admin'; avatar = 'AG'; }
          else if (email.includes('station')) { fallbackRole = 'station_manager'; avatar = 'SM'; }

          setUser({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || email.split('@')[0] || 'Utilisateur',
              email: email,
              role: fallbackRole,
              avatar: avatar
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Redirection automatique basée sur le rôle après mise à jour du user
  useEffect(() => {
    if (!loading && user) {
        // Ne rediriger que si on est sur la page de login/signup pour éviter de perturber la navigation
        if (currentPage === 'login' || currentPage === 'signup') {
            if (user.role === 'super_admin') navigateTo('super_admin');
            else if (user.role === 'agency_admin') navigateTo('agency_admin');
            else if (user.role === 'station_manager') navigateTo('station_manager');
            else if (bookingDetails) navigateTo('checkout'); // Si réservation en cours
            else navigateTo('home');
        }
    }
  }, [user, loading, currentPage, bookingDetails]);

  const navigateTo = (page: Page) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // L'état 'user' sera mis à jour par le listener onAuthStateChanged
  };

  const signup = async (name: string, email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    let role: UserRole = 'user';
    let avatar = 'US';
    
    if (email.includes('admin')) {
        role = 'super_admin';
        avatar = 'SA';
    } else if (email.includes('express')) {
        role = 'agency_admin';
        avatar = 'AG';
    } else if (email.includes('station')) {
        role = 'station_manager';
        avatar = 'SM';
    }

    // Création du document utilisateur dans Firestore
    // Enveloppé dans un try/catch pour ne pas bloquer l'inscription si Firestore échoue (règles de sécurité)
    try {
      await setDoc(doc(db, 'users', uid), {
        name,
        email,
        role,
        avatar,
        createdAt: serverTimestamp()
      });
    } catch (error) {
       console.error("Attention: Impossible d'écrire dans Firestore. L'utilisateur est créé dans Auth uniquement.", error);
       // On continue sans erreur bloquante, le listener auth s'occupera du fallback
    }
    
    // L'état 'user' sera mis à jour par le listener
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    navigateTo('home');
  };

  return (
    <NavigationContext.Provider value={{ 
      currentPage, 
      navigateTo, 
      searchParams, 
      setSearchParams, 
      bookingDetails, 
      setBookingDetails,
      user,
      setUser,
      loading,
      login,
      signup,
      logout
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};