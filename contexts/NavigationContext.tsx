
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export type Page = 'home' | 'agencies' | 'results' | 'checkout' | 'login' | 'signup' | 'bookings' | 'super_admin' | 'agency_admin' | 'station_manager';

export interface SearchParams {
  from: string;
  to: string;
  date: string;
  returnDate?: string;
  passengers: { adults: number; children: number };
  tripType: 'one-way' | 'round-trip';
}

// Renamed from SelectedTrip to Trip to match usages in results page and fix import errors
export interface Trip {
  id: string | number;
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
  outbound: Trip;
  returnTrip: Trip | null;
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
  authLoading: boolean;
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
  const [authLoading, setAuthLoading] = useState(true);

  // Écouter les changements d'état Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUser({ 
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              ...docSnap.data() 
            } as User);
          } else {
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
          console.error("Firestore error fallback:", error);
          const email = firebaseUser.email || '';
          let fallbackRole: UserRole = 'user';
          if (email.includes('admin')) fallbackRole = 'super_admin';
          else if (email.includes('express')) fallbackRole = 'agency_admin';
          else if (email.includes('station')) fallbackRole = 'station_manager';

          setUser({
              uid: firebaseUser.uid,
              name: email.split('@')[0] || 'Utilisateur',
              email: email,
              role: fallbackRole,
              avatar: fallbackRole.charAt(0).toUpperCase()
          });
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Gestion des redirections automatiques de connexion
  useEffect(() => {
    if (!authLoading && user) {
        if (currentPage === 'login' || currentPage === 'signup') {
            if (user.role === 'super_admin') navigateTo('super_admin');
            else if (user.role === 'agency_admin') navigateTo('agency_admin');
            else if (user.role === 'station_manager') navigateTo('station_manager');
            else if (bookingDetails) navigateTo('checkout');
            else navigateTo('home');
        }
    }
  }, [user, authLoading, currentPage, bookingDetails]);

  const navigateTo = (page: Page) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (name: string, email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    let role: UserRole = 'user';
    let avatar = 'US';
    
    if (email.includes('admin')) { role = 'super_admin'; avatar = 'SA'; }
    else if (email.includes('express')) { role = 'agency_admin'; avatar = 'AG'; }
    else if (email.includes('station')) { role = 'station_manager'; avatar = 'SM'; }

    try {
      await setDoc(doc(db, 'users', uid), {
        name,
        email,
        role,
        avatar,
        createdAt: serverTimestamp()
      });
    } catch (e) {
       console.warn("Could not save to firestore, auth only.");
    }
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
      authLoading,
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
