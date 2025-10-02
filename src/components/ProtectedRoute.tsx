import React, { useMemo, useRef } from 'react';
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
  const lastRedirectPath = useRef<string>('');

  // Stabilize allowedRoles array to prevent infinite re-renders
  const stableAllowedRoles = useMemo(() => {
    if (!allowedRoles || allowedRoles.length === 0) return null;
    return [...allowedRoles].sort(); // Create a stable copy
  }, [allowedRoles?.length, allowedRoles?.join(',')]);

  // Handle authentication redirect
  React.useEffect(() => {
    if (!loading && !profile && location.pathname !== '/login' && location.pathname !== '/') {
      navigate('/login');
    }
  }, [loading, profile, navigate, location.pathname]);

  // Handle role-based redirect - only redirect if role is not allowed
  React.useEffect(() => {
    // Only proceed if we have a profile, role, and allowedRoles defined
    if (!loading && profile && role && stableAllowedRoles && stableAllowedRoles.length > 0) {
      const isRoleAllowed = stableAllowedRoles.includes(role);
      
      // Only redirect if the current role is NOT allowed for this route
      // and we haven't already redirected from this path
      if (!isRoleAllowed && lastRedirectPath.current !== location.pathname) {
        lastRedirectPath.current = location.pathname;
        
        console.log('Unauthorized access detected, redirecting:', { 
          role, 
          allowedRoles: stableAllowedRoles, 
          pathname: location.pathname 
        });
        
        // Redirect to appropriate dashboard based on user's role
        switch (role) {
          case 'Student':
            navigate('/dashboard', { replace: true });
            break;
          case 'Tutor':
            navigate('/tutor-dashboard', { replace: true });
            break;
          case 'Admin':
            navigate('/admin-dashboard', { replace: true });
            break;
          default:
            navigate('/login', { replace: true });
        }
      }
    }
  }, [loading, profile, role, stableAllowedRoles, location.pathname, navigate]);

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
  if (stableAllowedRoles && !stableAllowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
