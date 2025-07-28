import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { useAppContext } from '@/context/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('Student' | 'Tutor' | 'Admin')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { profile, loading, role } = useAppContext(); // `loading` now refers to `loadingInitial`
  const navigate = useNavigate();
  const location = useLocation(); // Get current location

  React.useEffect(() => {
    // Only redirect if not already on login page and not loading, and no profile
    if (!loading && !profile && location.pathname !== '/login' && location.pathname !== '/') {
      navigate('/login');
    }
  }, [loading, profile, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // If not loading, but still no profile or role, it means authentication failed or user is not logged in.
  // The useEffect above should handle redirecting to login.
  // This block ensures that if for some reason we are here without a profile after loading, we don't render children.
  if (!profile || !role) {
    return null; 
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to the appropriate dashboard if the role is mismatched
    switch (role) {
      case 'Student':
        navigate('/dashboard');
        break;
      case 'Tutor':
        navigate('/tutor-dashboard');
        break;
      case 'Admin':
        navigate('/admin-dashboard');
        break;
      default:
        navigate('/login');
    }
    return null; // Return null while redirecting
  }

  return <>{children}</>;
};

export default ProtectedRoute;