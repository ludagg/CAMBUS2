'use client';
import AgencyAdminDashboard from '../../../components/AgencyAdminDashboard';
import AuthGuard from '../../../components/AuthGuard';

export default function AgencyAdminRoute() {
  return <AuthGuard requiredRole={["AGENCY_ADMIN", "COMPANY_ADMIN", "SUPER_ADMIN"]}><AgencyAdminDashboard /></AuthGuard>;
}
