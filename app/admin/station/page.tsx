'use client';
import StationManagerDashboard from '../../../components/StationManagerDashboard';
import AuthGuard from '../../../components/AuthGuard';

export default function StationManagerRoute() {
  return <AuthGuard requiredRole={["STATION_MANAGER", "AGENCY_ADMIN", "COMPANY_ADMIN", "SUPER_ADMIN"]}><StationManagerDashboard /></AuthGuard>;
}
