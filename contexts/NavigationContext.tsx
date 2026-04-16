'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export type Page = 'home' | 'agencies' | 'results' | 'checkout' | 'login' | 'signup' | 'bookings' | 'super_admin' | 'agency_admin' | 'station_manager';

const pageToPath: Record<Page, string> = {
  home: '/',
  agencies: '/agencies',
  results: '/results',
  checkout: '/checkout',
  bookings: '/bookings',
  login: '/login',
  signup: '/signup',
  super_admin: '/admin/super',
  agency_admin: '/admin/agency',
  station_manager: '/admin/station',
};

const pathToPage: Record<string, Page> = {
  '/': 'home',
  '/agencies': 'agencies',
  '/results': 'results',
  '/checkout': 'checkout',
  '/bookings': 'bookings',
  '/login': 'login',
  '/signup': 'signup',
  '/admin/super': 'super_admin',
  '/admin/agency': 'agency_admin',
  '/admin/station': 'station_manager',
};

export interface SearchParams {
  from: string;
  to: string;
  date: string;
  returnDate?: string;
  passengers: { adults: number; children: number };
  tripType: 'one-way' | 'round-trip';
}

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
  const router = useRouter();
  const pathname = usePathname();
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const currentPage: Page = pathToPage[pathname] ?? 'home';

  const navigateTo = (page: Page) => {
    window.scrollTo(0, 0);
    router.push(pageToPath[page]);
  };

  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true);
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) {
          const u = data.user;
          setUser({
            uid: u.id,
            name: u.name,
            email: u.email,
            role: u.role.toLowerCase() as UserRole,
            agencyId: u.agencyId ?? undefined,
            stationId: u.stationId ?? undefined,
            avatar: u.avatar ?? undefined,
          });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, currentPage, bookingDetails]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err: any = new Error(data.error || 'Erreur de connexion');
      if (res.status === 401) err.code = 'auth/invalid-credential';
      throw err;
    }
    const u = data;
    setUser({
      uid: u.id,
      name: u.name,
      email: u.email,
      role: u.role.toLowerCase() as UserRole,
      agencyId: u.agencyId ?? undefined,
      stationId: u.stationId ?? undefined,
      avatar: u.avatar ?? undefined,
    });
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err: any = new Error(data.error || 'Erreur d\'inscription');
      if (res.status === 409) err.code = 'auth/email-already-in-use';
      throw err;
    }
    const u = data;
    setUser({
      uid: u.id,
      name: u.name,
      email: u.email,
      role: u.role.toLowerCase() as UserRole,
      agencyId: u.agencyId ?? undefined,
      stationId: u.stationId ?? undefined,
      avatar: u.avatar ?? undefined,
    });
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
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
