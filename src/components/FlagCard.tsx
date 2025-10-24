import { DetectedRule, Severity } from '@/types/analysis';
import React, { useState } from 'react';

interface FlagCardProps {
  rule: DetectedRule;
  lang?: 'en' | 'he';
}

const textContent = {
  en: {
    points: 'points',
    expand: 'Show Details',
    collapse: 'Hide Details',
  },
  he: {
    points: 'נקודות',
    expand: 'הצג פרטים',
    collapse: 'הסתר פרטים',
  },
};

const FlagCard: React.FC<FlagCardProps> = ({ rule, lang = 'en' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = textContent[lang];

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case Severity.LOW:
        return {
          bg: 'bg-yellow-900/20',
          border: 'border-yellow-600/30',
          text: 'text-yellow-300',
          icon: (
            <div className="w-5 h-5">
              <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          ),
        };
      case Severity.MEDIUM:
        return {
          bg: 'bg-orange-900/20',
          border: 'border-orange-600/30',
          text: 'text-orange-300',
          icon: (
            <div className="w-5 h-5">
              <img
                src="/lion-digital-guardian/status-warning/lion-warning-triangle_v1_1x1.webp"
                alt="Medium Severity"
                className="w-full h-full object-contain filter brightness-110 hue-rotate-30"
              />
            </div>
          ),
        };
      case Severity.HIGH:
        return {
          bg: 'bg-red-900/20',
          border: 'border-red-600/30',
          text: 'text-red-300',
          icon: (
            <div className="w-5 h-5">
              <img
                src="/lion-digital-guardian/status-warning/lion-warning-triangle_v1_1x1.webp"
                alt="High Severity"
                className="w-full h-full object-contain"
              />
            </div>
          ),
        };
      default:
        return {
          bg: 'bg-gray-900/20',
          border: 'border-gray-600/30',
          text: 'text-gray-300',
          icon: (
            <div className="w-5 h-5">
              <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
          ),
        };
    }
  };

  const colors = getSeverityColor(rule.severity);
  const isPositivePoints = rule.points > 0;

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 transition-all duration-200 hover:shadow-lg`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex-shrink-0">{colors.icon}</div>
            <h3 className={`font-semibold ${colors.text}`}>{rule.name}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
              {rule.severity}
            </span>
          </div>

          <div className="flex items-center space-x-4 mb-2">
            <div className="flex items-center space-x-1">
              <span className={`text-sm ${isPositivePoints ? 'text-red-400' : 'text-green-400'}`}>
                {isPositivePoints ? '+' : ''}{rule.points} {t.points}
              </span>
              {isPositivePoints ? (
                <span className="text-xs text-red-300">(Risk)</span>
              ) : (
                <span className="text-xs text-green-300">(Credibility)</span>
              )}
            </div>
          </div>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <p className="text-gray-300 text-sm leading-relaxed">
                {rule.description}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
          title={isExpanded ? t.collapse : t.expand}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default FlagCard;