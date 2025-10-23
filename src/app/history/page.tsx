'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getHistoryService } from '@/lib/history-service';
import { StoredAnalysis } from '@/lib/storage/types';
import { Classification } from '@/types/analysis';
import StatusIcon from '@/components/StatusIcon';
import BrandLogo from '@/components/BrandLogo';

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<StoredAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClassification, setFilterClassification] = useState<Classification | 'ALL'>('ALL');
  const [provider, setProvider] = useState<'dynamodb' | 'memory' | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const historyService = getHistoryService();
      const response = await historyService.getUserHistory(100);

      if (response.success && response.history) {
        setHistory(response.history);
        setProvider(response.provider || null);
      } else {
        setError(response.error || 'Failed to load history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(analysis => {
    const matchesSearch =
      searchTerm === '' ||
      analysis.input.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.result.summary.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterClassification === 'ALL' ||
      analysis.result.analysisData.classification === filterClassification;

    return matchesSearch && matchesFilter;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getClassificationColor = (classification: Classification) => {
    switch (classification) {
      case Classification.SAFE:
        return 'text-green-400';
      case Classification.SUSPICIOUS:
        return 'text-yellow-400';
      case Classification.HIGH_RISK:
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your analysis history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-dark-gray border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <BrandLogo size="sm" />
              </Link>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white">Analysis History</h1>
                <p className="text-sm text-gray-400">
                  {history.length} {history.length === 1 ? 'analysis' : 'analyses'}
                  {provider && (
                    <span className="ml-2 px-2 py-1 text-xs bg-gray-800 rounded">
                      {provider === 'memory' ? 'Session Only' : 'Persistent'}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              New Analysis
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-red-400">{error}</span>
            </div>
            <button
              onClick={loadHistory}
              className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search analyses..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterClassification}
            onChange={e => setFilterClassification(e.target.value as Classification | 'ALL')}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Classifications</option>
            <option value={Classification.SAFE}>Safe</option>
            <option value={Classification.SUSPICIOUS}>Suspicious</option>
            <option value={Classification.HIGH_RISK}>High Risk</option>
          </select>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-32 h-24 mx-auto mb-6 rounded-lg overflow-hidden">
              <Image
                src="/lion-digital-guardian/empty-state/calm-guardian_v1_4x3.webp"
                alt="No History"
                width={256}
                height={192}
                className="w-full h-full object-cover opacity-50"
              />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchTerm || filterClassification !== 'ALL'
                ? 'No matching analyses'
                : 'No analysis history'}
            </h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || filterClassification !== 'ALL'
                ? 'Try adjusting your search or filter criteria.'
                : 'Start by analyzing suspicious content to build your history.'}
            </p>
            {(searchTerm || filterClassification !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterClassification('ALL');
                }}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map(analysis => (
              <Link
                key={analysis.id}
                href={`/history/${analysis.id}`}
                className="block bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg p-6 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <StatusIcon
                        classification={analysis.result.analysisData.classification}
                        size="sm"
                      />
                      <span
                        className={`text-sm font-medium ${getClassificationColor(analysis.result.analysisData.classification)}`}
                      >
                        {analysis.result.analysisData.classification}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(analysis.timestamp)}
                      </span>
                    </div>

                    <h3 className="text-white font-medium mb-2">
                      {truncateText(analysis.input.message, 80)}
                    </h3>

                    <p className="text-gray-400 text-sm mb-3">
                      {truncateText(analysis.result.summary, 120)}
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Risk: {analysis.result.analysisData.riskScore}/100</span>
                      <span>Credibility: {analysis.result.analysisData.credibilityScore}/100</span>
                      {analysis.result.analysisData.detectedRules.length > 0 && (
                        <span>{analysis.result.analysisData.detectedRules.length} flags</span>
                      )}
                      {analysis.feedback && (
                        <span
                          className={
                            analysis.feedback === 'positive' ? 'text-green-400' : 'text-red-400'
                          }
                        >
                          {analysis.feedback === 'positive' ? '👍' : '👎'} Feedback given
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Support Footer */}
        {filteredHistory.length > 0 && (
          <div className="mt-8 p-6 bg-dark-gray rounded-lg border border-gray-600">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-2xl">🦁</span>
                <h3 className="text-lg font-semibold text-white">Support Our Mission</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Help us continue protecting the digital front and exposing fake accounts
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href="https://buymeacoffee.com/danielhanukayeb/e/471429"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  <span>🎯</span>
                  Support This Project
                </a>
                <a
                  href="https://www.fidf.org/donate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  <span>🇮🇱</span>
                  Support FIDF
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
