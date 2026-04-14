'use client';
import AgencyAdminDashboard from '../../../components/AgencyAdminDashboard';
import AuthGuard from '../../../components/AuthGuard';

export default function AgencyAdminRoute() {
  return <AuthGuard requiredRole="agency_admin"><AgencyAdminDashboard /></AuthGuard>;
}
