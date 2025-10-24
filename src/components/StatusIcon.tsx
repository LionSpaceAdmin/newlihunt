import { Classification } from '@/types/analysis';
import React from 'react';

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
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const getIconAndColor = (classification: Classification) => {
    switch (classification) {
      case Classification.SAFE:
        return {
          icon: (
            <div className="w-full h-full relative">
              <img
                src="/lion-digital-guardian/status-success/digital-shield-success_v1_1x1.webp"
                alt="Safe"
                className="w-full h-full object-contain"
              />
            </div>
          ),
          color: 'text-success-green',
          bgColor: 'bg-success-green/10',
        };
      case Classification.SUSPICIOUS:
        return {
          icon: (
            <div className="w-full h-full relative">
              <img
                src="/lion-digital-guardian/status-warning/lion-warning-triangle_v1_1x1.webp"
                alt="Suspicious"
                className="w-full h-full object-contain filter brightness-110 hue-rotate-15"
              />
            </div>
          ),
          color: 'text-warning-yellow',
          bgColor: 'bg-warning-yellow/10',
        };
      case Classification.HIGH_RISK:
        return {
          icon: (
            <div className="w-full h-full relative">
              <img
                src="/lion-digital-guardian/status-warning/lion-warning-triangle_v1_1x1.webp"
                alt="High Risk"
                className="w-full h-full object-contain filter brightness-75 hue-rotate-0"
              />
            </div>
          ),
          color: 'text-danger-red',
          bgColor: 'bg-danger-red/10',
        };
      default:
        return {
          icon: (
            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          ),
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/20',
        };
    }
  };

  const { icon, color, bgColor } = getIconAndColor(classification);

  return (
    <div className={`${sizeClasses[size]} ${bgColor} ${color} rounded-full p-1 flex items-center justify-center ${className}`}>
      {icon}
    </div>
  );
};

export default StatusIcon;