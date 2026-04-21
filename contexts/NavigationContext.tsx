'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export type Page =
  | 'home'
  | 'agencies'
  | 'results'
  | 'checkout'
  | 'login'
  | 'signup'
  | 'bookings'
  | 'super_admin'
  | 'company_admin'
  | 'agency_admin'
  | 'station_manager';

const pageToPath: Record<Page, string> = {
  home: '/',
  agencies: '/agencies',
  results: '/results',
  checkout: '/checkout',
  bookings: '/bookings',
  login: '/login',
  signup: '/signup',
  super_admin: '/admin/super',
  company_admin: '/admin/company',
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
  '/admin/company': 'company_admin',
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
  id: string;
  agencyName: string;
  agencyLogo: string;
  companySlug?: string;
  departureTime: string;
  departureLocation: string;
  departureAddress?: string | null;
  departureLat?: number | null;
  departureLng?: number | null;
  arrivalTime: string;
  arrivalLocation: string;
  arrivalAddress?: string | null;
  arrivalLat?: number | null;
  arrivalLng?: number | null;
  duration: string;
  price: number;
  currency: string;
  color: string;
  date: string;
  amenities?: string[];
  seatsAvailable?: number;
  seatsTotal?: number;
}

export interface BookingDetails {
  outbound: Trip;
  returnTrip: Trip | null;
  totalPrice: number;
  passengers: { adults: number; children: number };
}

export type UserRole =
  | 'USER'
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'AGENCY_ADMIN'
  | 'STATION_MANAGER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  companyId?: string | null;
  agencyId?: string | null;
  stationId?: string | null;
}

interface NavigationContextType {
  currentPage: Page;
  navigateTo: (page: Page) => void;
  searchParams: SearchParams | null;
  setSearchParams: (params: SearchParams) => void;
  bookingDetails: BookingDetails | null;
  setBookingDetails: (details: BookingDetails | null) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

function roleToPage(role: UserRole): Page | null {
  if (role === 'SUPER_ADMIN') return 'super_admin';
  if (role === 'COMPANY_ADMIN') return 'company_admin';
  if (role === 'AGENCY_ADMIN') return 'agency_admin';
  if (role === 'STATION_MANAGER') return 'station_manager';
  return null;
}

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const currentPage: Page = pathToPage[pathname] ?? 'home';

  const navigateTo = useCallback(
    (page: Page) => {
      if (typeof window !== 'undefined') window.scrollTo(0, 0);
      router.push(pageToPath[page]);
    },
    [router],
  );

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const json = await res.json();
        setUser(json.data);
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    fetchMe();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Connexion impossible.');
    setUser(json.data);

    const redirect = roleToPage(json.data.role);
    if (redirect) navigateTo(redirect);
    else if (bookingDetails) navigateTo('checkout');
    else navigateTo('home');
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Impossible de créer le compte.");
    setUser(json.data);

    if (bookingDetails) navigateTo('checkout');
    else navigateTo('home');
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    navigateTo('home');
  };

  return (
    <NavigationContext.Provider
      value={{
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
        logout,
      }}
    >
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
