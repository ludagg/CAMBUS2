import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  name: string;
  email: string;
  role?: UserRole;
  agencyId?: number; // Pour Agency Admin & Station Manager
  stationId?: number; // Pour Station Manager uniquement
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
  login: (userData: User) => void;
  logout: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const navigateTo = (page: Page) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  };

  const login = (userData: User) => {
    setUser(userData);
    
    // Redirection automatique basée sur le rôle
    if (userData.role === 'super_admin') {
      navigateTo('super_admin');
    } else if (userData.role === 'agency_admin') {
      navigateTo('agency_admin');
    } else if (userData.role === 'station_manager') {
      navigateTo('station_manager');
    } else {
      navigateTo('home');
    }
  };

  const logout = () => {
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
      login,
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