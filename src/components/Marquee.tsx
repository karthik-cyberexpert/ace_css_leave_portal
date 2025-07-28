import React from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps {
  text: string;
  className?: string;
}

const Marquee: React.FC<MarqueeProps> = ({ text, className }) => {
  const marqueeContent = (
    <div className="flex items-center">
      <span className="text-sm mx-4">{text}</span>
      <span className="mx-4 opacity-75">•</span>
      <span className="text-sm mx-4">{text}</span>
      <span className="mx-4 opacity-75">•</span>
      <span className="text-sm mx-4">{text}</span>
      <span className="mx-4 opacity-75">•</span>
      <span className="text-sm mx-4">{text}</span>
    </div>
  );

  return (
    <div
      className={cn(
        'relative flex overflow-x-hidden bg-yellow-400 text-yellow-900 font-bold py-2 items-center',
        className
      )}
    >
      <div className="animate-marquee whitespace-nowrap flex items-center">
        {marqueeContent}
      </div>
      <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex items-center h-full">
        {marqueeContent}
      </div>
    </div>
  );
};

export default Marquee;