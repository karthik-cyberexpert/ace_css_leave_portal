import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import LandingPageComponent from '@/components/LandingPage';

const LandingPage = () => {
  const navigate = useNavigate();
  const { profile, loading, role } = useAppContext();

  useEffect(() => {
    if (!loading && profile && role) {
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
          break;
      }
    }
  }, [profile, loading, navigate, role]);

  if (loading || profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return <LandingPageComponent />;
};

export default LandingPage;
