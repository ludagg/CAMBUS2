'use client';
import StationManagerDashboard from '../../../components/StationManagerDashboard';
import AuthGuard from '../../../components/AuthGuard';

export default function StationManagerRoute() {
  return <AuthGuard requiredRole="station_manager"><StationManagerDashboard /></AuthGuard>;
}
