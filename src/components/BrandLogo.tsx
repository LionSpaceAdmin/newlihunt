'use client';

import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-xl overflow-hidden animate-digital-pulse`}>
        <img 
          src="/lion-digital-guardian/app-icon/68512281-D399-4756-9206-67C2C2E83BB0.webp" 
          alt="Scam Hunter Logo" 
          className="w-full h-full object-cover"
        />
      </div>
      {showText && (
        <div>
          <h1 className={`${textSizeClasses[size]} font-bold text-white`}>
            Scam Hunter
          </h1>
          {size !== 'sm' && (
            <p className="text-xs text-gray-400">
              Digital Guardian
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;