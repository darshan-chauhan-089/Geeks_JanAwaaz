import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { adminService } from '@services/adminService';

export default function ProtectedAdminRoute() {
  const location = useLocation();
  const isAuthenticated = adminService.isAdminAuthenticated();
  const adminUser = adminService.getAdminUser();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (adminUser?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}