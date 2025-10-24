'use client';

import ErrorBoundary from '@/components/ErrorBoundary';
import Navigation from '@/components/Navigation';
import StatusIcon from '@/components/StatusIcon';
import { getHistoryService, HistoryEntry } from '@/lib/history-service';
import { Classification } from '@/types/analysis';
import { formatDate, formatTimestamp, timeAgo } from '@/utils/helpers';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const textContent = {
  en: {
    title: 'Analysis History',
    subtitle: 'Your previous scam analysis results',
    empty: 'No Analysis History',
    emptyDescription: 'You haven\'t run any analyses yet. Start by analyzing suspicious content on the main page.',
    startAnalyzing: 'Start Analyzing',
    loading: 'Loading history...',
    error: 'Failed to load history',
    retry: 'Retry',
    clearAll: 'Clear All History',
    confirmClear: 'Are you sure you want to clear all analysis history? This action cannot be undone.',
    cleared: 'History cleared successfully',
    viewDetails: 'View Details',
    riskScore: 'Risk',
    credibilityScore: 'Credibility',
    detectedRules: 'rules detected',
    recommendations: 'recommendations',
  },
  he: {
    title: 'היסטוריית ניתוחים',
    subtitle: 'תוצאות ניתוחי הרמאויות הקודמים שלך',
    empty: 'אין היסטוריית ניתוחים',
    emptyDescription: 'עדיין לא הרצת ניתוחים. התחל על ידי ניתוח תוכן חשוד בעמוד הראשי.',
    startAnalyzing: 'התחל לנתח',
    loading: 'טוען היסטוריה...',
    error: 'נכשל בטעינת ההיסטוריה',
    retry: 'נסה שוב',
    clearAll: 'נקה את כל ההיסטוריה',
    confirmClear: 'האם אתה בטוח שברצונך לנקות את כל היסטוריית הניתוחים? פעולה זו לא ניתנת לביטול.',
    cleared: 'ההיסטוריה נוקתה בהצלחה',
    viewDetails: 'צפה בפרטים',
    riskScore: 'סיכון',
    credibilityScore: 'אמינות',
    detectedRules: 'כללים זוהו',
    recommendations: 'המלצות',
  },
};

interface HistoryPageProps {
  lang?: 'en' | 'he';
}

const HistoryPage: React.FC<HistoryPageProps> = ({ lang = 'en' }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const t = textContent[lang];

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const historyService = getHistoryService();
      const entries = await historyService.getHistory();
      setHistory(entries);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm(t.confirmClear)) return;

    setIsClearing(true);
    try {
      const historyService = getHistoryService();
      await historyService.clearHistory();
      setHistory([]);
      alert(t.cleared);
    } catch (err) {
      console.error('Failed to clear history:', err);
      alert('Failed to clear history');
    } finally {
      setIsClearing(false);
    }
  };

  const getClassificationColor = (classification: Classification) => {
    switch (classification) {
      case Classification.SAFE:
        return 'text-success-green';
      case Classification.SUSPICIOUS:
        return 'text-warning-yellow';
      case Classification.HIGH_RISK:
        return 'text-danger-red';
      default:
        return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation lang={lang} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-400">{t.loading}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation lang={lang} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-900/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{t.error}</h3>
              <button
                onClick={loadHistory}
                className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t.retry}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black">
        <Navigation lang={lang} />

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
              <p className="text-gray-400">{t.subtitle}</p>
            </div>

            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                disabled={isClearing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isClearing ? 'Clearing...' : t.clearAll}
              </button>
            )}
          </div>

          {/* Content */}
          {history.length === 0 ? (
            // Empty State
            <div className="text-center py-16">
              <div className="w-32 h-24 mx-auto mb-6 rounded-lg overflow-hidden">
                <Image
                  src="/lion-digital-guardian/empty-state/calm-guardian_v1_4x3.webp"
                  alt="No History"
                  width={256}
                  height={192}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t.empty}</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">{t.emptyDescription}</p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-accent-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t.startAnalyzing}
              </Link>
            </div>
          ) : (
            // History List
            <div className="space-y-4">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-dark-gray rounded-lg p-6 hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Dashboard Icon */}
                      <div className="w-12 h-8 rounded overflow-hidden flex-shrink-0 mt-1">
                        <Image
                          src="/lion-digital-guardian/report-card/analysis-dashboard_v1_16x9.webp"
                          alt="Analysis Report"
                          width={48}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-center space-x-3 mb-3">
                          <StatusIcon
                            classification={entry.analysis.analysisData.classification}
                            size="sm"
                          />
                          <span className={`font-medium ${getClassificationColor(entry.analysis.analysisData.classification)}`}>
                            {entry.analysis.analysisData.classification}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {timeAgo(entry.timestamp, lang)}
                          </span>
                        </div>

                        {/* Summary */}
                        <p className="text-gray-300 mb-4 line-clamp-2">
                          {entry.analysis.summary}
                        </p>

                        {/* Scores */}
                        <div className="flex items-center space-x-6 mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400">{t.riskScore}:</span>
                            <span className={`font-medium ${entry.analysis.analysisData.riskScore > 69
                              ? 'text-danger-red'
                              : entry.analysis.analysisData.riskScore > 30
                                ? 'text-warning-yellow'
                                : 'text-success-green'
                              }`}>
                              {entry.analysis.analysisData.riskScore}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400">{t.credibilityScore}:</span>
                            <span className={`font-medium ${entry.analysis.analysisData.credibilityScore > 69
                              ? 'text-success-green'
                              : entry.analysis.analysisData.credibilityScore > 30
                                ? 'text-warning-yellow'
                                : 'text-danger-red'
                              }`}>
                              {entry.analysis.analysisData.credibilityScore}
                            </span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>
                            {entry.analysis.analysisData.detectedRules.length} {t.detectedRules}
                          </span>
                          <span>
                            {entry.analysis.analysisData.recommendations.length} {t.recommendations}
                          </span>
                          <span>
                            {formatDate(entry.timestamp)} {formatTimestamp(entry.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/history/${entry.id}`}
                      className="ml-4 px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      {t.viewDetails}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default HistoryPage;