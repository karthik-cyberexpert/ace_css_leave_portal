import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('Student' | 'Tutor' | 'Admin')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { profile, loading, role } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle authentication redirect
  React.useEffect(() => {
    if (!loading && !profile && location.pathname !== '/login' && location.pathname !== '/') {
      navigate('/login');
    }
  }, [loading, profile, navigate, location.pathname]);

  // Handle role-based redirect - moved outside conditional block
  React.useEffect(() => {
    if (!loading && profile && role && allowedRoles && !allowedRoles.includes(role)) {
      switch (role) {
        case 'Student':
          if (location.pathname !== '/dashboard') {
            navigate('/dashboard', { replace: true });
          }
          break;
        case 'Tutor':
          if (location.pathname !== '/tutor-dashboard') {
            navigate('/tutor-dashboard', { replace: true });
          }
          break;
        case 'Admin':
          if (location.pathname !== '/admin-dashboard') {
            navigate('/admin-dashboard', { replace: true });
          }
          break;
        default:
          navigate('/login');
      }
    }
  }, [loading, profile, role, allowedRoles, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // If not loading, but still no profile or role, don't render children
  if (!profile || !role) {
    return null; 
  }

  // If role is not allowed, don't render children while redirecting
  if (allowedRoles && !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
