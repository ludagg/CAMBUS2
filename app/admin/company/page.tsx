'use client';
import CompanyAdminDashboard from '../../../components/CompanyAdminDashboard';
import AuthGuard from '../../../components/AuthGuard';

export default function CompanyAdminRoute() {
  return <AuthGuard requiredRole={["COMPANY_ADMIN", "SUPER_ADMIN"]}><CompanyAdminDashboard /></AuthGuard>;
}
