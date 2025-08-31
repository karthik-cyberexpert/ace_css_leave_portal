import { useEffect } from 'react';

const LandingRedirect = () => {
  useEffect(() => {
    // Redirect to the static HTML landing page
    window.location.href = '/home.html';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting to landing page...</p>
    </div>
  );
};

export default LandingRedirect;
