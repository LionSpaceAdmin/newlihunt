import React, { useState } from 'react';
import { DetectedRule, Severity } from '@/types/analysis';

interface FlagCardProps {
  rule: DetectedRule;
  lang?: 'en' | 'he';
}

const textContent = {
  en: {
    severity: 'Severity',
    points: 'Points',
    showDetails: 'Show Details',
    hideDetails: 'Hide Details',
  },
  he: {
    severity: 'חומרה',
    points: 'נקודות',
    showDetails: 'הצג פרטים',
    hideDetails: 'הסתר פרטים',
  },
};

const getSeverityColor = (severity: Severity) => {
  switch (severity) {
    case 'LOW':
      return 'bg-success-green';
    case 'MEDIUM':
      return 'bg-warning-yellow';
    case 'HIGH':
      return 'bg-danger-red';
    default:
      return 'bg-gray-500';
  }
};

const FlagCard: React.FC<FlagCardProps> = ({ rule, lang = 'en' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = textContent[lang];

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getSeverityColor(rule.severity)}`} />
          <h3 className="text-lg font-semibold text-white">{rule.name}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">
            {t.severity}: {rule.severity}
          </span>
          <span
            className={`text-sm font-medium ${rule.points > 0 ? 'text-danger-red' : 'text-success-green'}`}
          >
            {rule.points > 0 ? '+' : ''}
            {rule.points} {t.points}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-gray-300 leading-relaxed">{rule.description}</p>
        </div>
      )}
    </div>
  );
};

export default FlagCard;
