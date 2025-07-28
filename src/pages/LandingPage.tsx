import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';

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

  const handleLoginClick = () => {
    navigate('/login');
  };

  if (loading || profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 p-4">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
          Welcome to Leave Portal
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-10">
          Discover a seamless experience designed to simplify your daily tasks and boost your productivity. Get started now!
        </p>
        <Button 
          size="lg" 
          className="px-8 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
          onClick={handleLoginClick}
        >
          Login
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;