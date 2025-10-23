'use client';

import React from 'react';
import Image from 'next/image';
import { Classification } from '@/types/analysis';

interface StatusIconProps {
  classification: Classification;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatusIcon: React.FC<StatusIconProps> = ({ 
  classification, 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  const getStatusImage = () => {
    switch (classification) {
      case 'SAFE':
        return "/lion-digital-guardian/status-success/digital-shield-success_v1_1x1.webp";
      case 'SUSPICIOUS':
      case 'HIGH_RISK':
        return "/lion-digital-guardian/status-warning/lion-warning-triangle_v1_1x1.webp";
      default:
        return "/lion-digital-guardian/app-icon/68512281-D399-4756-9206-67C2C2E83BB0.webp";
    }
  };

  return (
    <div className={`${sizeClasses[size]} rounded-lg overflow-hidden ${className}`}>
      <Image 
        src={getStatusImage()} 
        alt={`Status: ${classification}`} 
        width={64}
        height={64}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default StatusIcon;