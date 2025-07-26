import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface MarqueeProps {
  text: string;
  className?: string;
}

const Marquee: React.FC<MarqueeProps> = ({ text, className }) => {
  return (
    <div
      className={cn(
        'relative flex overflow-x-hidden bg-yellow-400 text-yellow-900 font-bold py-2 items-center',
        className
      )}
    >
      <div className="animate-marquee whitespace-nowrap flex items-center">
        <AlertTriangle className="h-5 w-5 mx-4 flex-shrink-0" />
        <span className="text-sm mx-4">{text}</span>
        <AlertTriangle className="h-5 w-5 mx-4 flex-shrink-0" />
        <span className="text-sm mx-4">{text}</span>
      </div>
      <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex items-center h-full">
        <AlertTriangle className="h-5 w-5 mx-4 flex-shrink-0" />
        <span className="text-sm mx-4">{text}</span>
        <AlertTriangle className="h-5 w-5 mx-4 flex-shrink-0" />
        <span className="text-sm mx-4">{text}</span>
      </div>
    </div>
  );
};

export default Marquee;