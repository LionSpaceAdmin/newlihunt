'use client';

import { ConfirmModal } from '@/components/ConfirmModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import Navigation from '@/components/Navigation';
import StatusIcon from '@/components/StatusIcon';
import { getHistoryService, HistoryEntry } from '@/lib/history-service';
import { Classification } from '@/types/analysis';
import { formatDate, formatTimestamp, timeAgo } from '@/utils/helpers';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { FiChevronDown, FiFilter, FiSearch } from 'react-icons/fi';

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
    search: 'Search history...',
    filterBy: 'Filter by',
    sortBy: 'Sort by',
    all: 'All',
    safe: 'Safe',
    suspicious: 'Suspicious',
    highRisk: 'High Risk',
    newestFirst: 'Newest First',
    oldestFirst: 'Oldest First',
    highestRisk: 'Highest Risk',
    lowestRisk: 'Lowest Risk',
    noResults: 'No results found',
    noResultsDescription: 'Try adjusting your search or filters',
    showingResults: 'Showing',
    of: 'of',
    results: 'results',
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
    search: 'חפש בהיסטוריה...',
    filterBy: 'סנן לפי',
    sortBy: 'מיין לפי',
    all: 'הכל',
    safe: 'בטוח',
    suspicious: 'חשוד',
    highRisk: 'סיכון גבוה',
    newestFirst: 'החדשים ביותר',
    oldestFirst: 'הישנים ביותר',
    highestRisk: 'הסיכון הגבוה ביותר',
    lowestRisk: 'הסיכון הנמוך ביותר',
    noResults: 'לא נמצאו תוצאות',
    noResultsDescription: 'נסה לשנות את החיפוש או המסננים',
    showingResults: 'מציג',
    of: 'מתוך',
    results: 'תוצאות',
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
  const [showClearModal, setShowClearModal] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassification, setFilterClassification] = useState<Classification | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highRisk' | 'lowRisk'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    setIsClearing(true);
    try {
      const historyService = getHistoryService();
      await historyService.clearHistory();
      setHistory([]);
      setShowClearModal(false);
    } catch (err) {
      console.error('Failed to clear history:', err);
    } finally {
      setIsClearing(false);
    }
  };

  // Filter, search and sort logic
  const filteredAndSortedHistory = useMemo(() => {
    let filtered = [...history];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.analysis.summary.toLowerCase().includes(query) ||
        entry.input.message.toLowerCase().includes(query) ||
        entry.analysis.analysisData.recommendations.some(rec => rec.toLowerCase().includes(query))
      );
    }

    // Apply classification filter
    if (filterClassification !== 'all') {
      filtered = filtered.filter(entry => entry.analysis.analysisData.classification === filterClassification);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'highRisk':
          return b.analysis.analysisData.riskScore - a.analysis.analysisData.riskScore;
        case 'lowRisk':
          return a.analysis.analysisData.riskScore - b.analysis.analysisData.riskScore;
        default:
          return 0;
      }
    });

    return filtered;
  }, [history, searchQuery, filterClassification, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedHistory.length / itemsPerPage);
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedHistory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedHistory, currentPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterClassification, sortBy]);

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
                onClick={() => setShowClearModal(true)}
                disabled={isClearing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t.clearAll}
              </button>
            )}
          </div>

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
            <>
              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder={t.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-dark-gray text-white rounded-lg border border-gray-700 focus:border-accent-blue focus:outline-none"
                  />
                </div>

                {/* Filters and Sort */}
                <div className="flex flex-wrap gap-4">
                  {/* Classification Filter */}
                  <div className="relative">
                    <label htmlFor="filter-classification" className="block text-sm text-gray-400 mb-1">{t.filterBy}</label>
                    <select
                      id="filter-classification"
                      value={filterClassification}
                      onChange={(e) => setFilterClassification(e.target.value as Classification | 'all')}
                      className="px-4 py-2 bg-dark-gray text-white rounded-lg border border-gray-700 focus:border-accent-blue focus:outline-none appearance-none pr-8"
                      aria-label="Filter analyses by classification"
                    >
                      <option value="all">{t.all}</option>
                      <option value={Classification.SAFE}>{t.safe}</option>
                      <option value={Classification.SUSPICIOUS}>{t.suspicious}</option>
                      <option value={Classification.HIGH_RISK}>{t.highRisk}</option>
                    </select>
                    <FiChevronDown className="absolute right-2 top-9 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Sort */}
                  <div className="relative">
                    <label htmlFor="sort-by" className="block text-sm text-gray-400 mb-1">{t.sortBy}</label>
                    <select
                      id="sort-by"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="px-4 py-2 bg-dark-gray text-white rounded-lg border border-gray-700 focus:border-accent-blue focus:outline-none appearance-none pr-8"
                      aria-label="Sort analyses"
                    >
                      <option value="newest">{t.newestFirst}</option>
                      <option value="oldest">{t.oldestFirst}</option>
                      <option value="highRisk">{t.highestRisk}</option>
                      <option value="lowRisk">{t.lowestRisk}</option>
                    </select>
                    <FiChevronDown className="absolute right-2 top-9 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Results Count */}
                  <div className="flex items-end ml-auto">
                    <p className="text-sm text-gray-400">
                      {t.showingResults} {paginatedHistory.length} {t.of} {filteredAndSortedHistory.length} {t.results}
                    </p>
                  </div>
                </div>
              </div>

              {filteredAndSortedHistory.length === 0 ? (
                // No Results State
                <div className="text-center py-16">
                  <FiFilter className="mx-auto text-5xl text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">{t.noResults}</h3>
                  <p className="text-gray-400">{t.noResultsDescription}</p>
                </div>
              ) : (
                <>
                  {/* History List */}
                  <div className="space-y-4">
                    {paginatedHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-dark-gray rounded-lg p-6 hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            {/* Dashboard Icon */}
                            <div className="w-12 h-8 rounded overflow-hidden shrink-0 mt-1">
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-dark-gray text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg transition-colors ${currentPage === page
                            ? 'bg-accent-blue text-white'
                            : 'bg-dark-gray text-gray-400 hover:bg-gray-700'
                            }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-dark-gray text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Clear History Modal */}
        <ConfirmModal
          isOpen={showClearModal}
          onClose={() => setShowClearModal(false)}
          onConfirm={handleClearHistory}
          title={t.clearAll}
          message={t.confirmClear}
          confirmText="Clear"
          cancelText={lang === 'he' ? 'ביטול' : 'Cancel'}
          isDanger
          isLoading={isClearing}
        />
      </div>
    </ErrorBoundary>
  );
};

export default HistoryPage;