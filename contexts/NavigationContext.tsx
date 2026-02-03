
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Page = 'home' | 'agencies' | 'results' | 'checkout' | 'login' | 'signup' | 'bookings' | 'super_admin' | 'agency_admin' | 'station_manager';

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
  agencyId?: string;
  stationId?: string;
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
  
  // Auth State (Simulé avec localStorage pour Convex Demo)
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('cambus_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setAuthLoading(false);
  }, []);

  const navigateTo = (page: Page) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  };

  const login = async (email: string, password: string) => {
    // Dans une version réelle, on appellerait une query Convex pour vérifier les credentials
    // Ici on simule pour la structure
    setAuthLoading(true);
    let role: UserRole = 'user';
    if (email.includes('admin')) role = 'super_admin';
    else if (email.includes('express')) role = 'agency_admin';

    const newUser = {
      uid: 'convex_user_' + Date.now(),
      name: email.split('@')[0],
      email: email,
      role: role,
      avatar: role === 'super_admin' ? 'SA' : 'US'
    };
    setUser(newUser);
    localStorage.setItem('cambus_user', JSON.stringify(newUser));
    setAuthLoading(false);
  };

  const signup = async (name: string, email: string, password: string) => {
    setAuthLoading(true);
    const newUser = {
      uid: 'convex_user_' + Date.now(),
      name: name,
      email: email,
      role: 'user' as UserRole,
      avatar: 'US'
    };
    setUser(newUser);
    localStorage.setItem('cambus_user', JSON.stringify(newUser));
    setAuthLoading(false);
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('cambus_user');
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
