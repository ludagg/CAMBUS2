'use client';
import SuperAdminDashboard from '../../../components/SuperAdminDashboard';
import AuthGuard from '../../../components/AuthGuard';

export default function SuperAdminRoute() {
  return <AuthGuard requiredRole="SUPER_ADMIN"><SuperAdminDashboard /></AuthGuard>;
}
