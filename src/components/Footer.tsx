import React, { useState } from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [karthikeyanClicks, setKarthikeyanClicks] = useState(0);
  const [kavivendhanClicks, setKavivendhanClicks] = useState(0);

  const handleKarthikeyanClick = () => {
    const newCount = karthikeyanClicks + 1;
    setKarthikeyanClicks(newCount);
    
    if (newCount === 11) {
      window.open('https://karthikeyan-web.vercel.app', '_blank');
      setKarthikeyanClicks(0); // Reset counter
    }
  };

  const handleKavivendhanClick = () => {
    const newCount = kavivendhanClicks + 1;
    setKavivendhanClicks(newCount);
    
    if (newCount === 11) {
      window.open('https://kavivendhan.netlify.app', '_blank');
      setKavivendhanClicks(0); // Reset counter
    }
  };

  return (
    <footer className="bg-background border-t mt-auto py-6">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-2">
          <div className="text-sm font-medium text-foreground">
            © {currentYear} ACE-CSE(CS) Department. All rights reserved.
          </div>
          <div className="text-xs text-muted-foreground">
            Developed by{' '}
            <span 
              onClick={handleKarthikeyanClick}
              className="cursor-default select-none"
              style={{ cursor: 'default' }}
            >
              Karthikeyan.S
            </span>
            {' '}and{' '}
            <span 
              onClick={handleKavivendhanClick}
              className="cursor-default select-none"
              style={{ cursor: 'default' }}
            >
              Kavivendhan.S
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
