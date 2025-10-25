'use client';

import { AnalysisPanel } from '@/components/AnalysisPanel';
import ErrorBoundary from '@/components/ErrorBoundary';
import Navigation from '@/components/Navigation';
import { getHistoryService, HistoryEntry } from '@/lib/history-service';
import { Message } from '@/types/analysis';
import { formatDate, formatTimestamp } from '@/utils/helpers';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const textContent = {
  en: {
    title: 'Analysis Report',
    backToHistory: 'Back to History',
    loading: 'Loading analysis...',
    notFound: 'Analysis Not Found',
    notFoundDescription: 'The requested analysis could not be found. It may have been deleted or the link is invalid.',
    error: 'Failed to Load Analysis',
    retry: 'Retry',
    analysisDate: 'Analysis Date',
    processingTime: 'Processing Time',
    inputContent: 'Original Input',
    conversationHistory: 'Conversation History',
    user: 'You',
    assistant: 'Scam Hunter',
    deleteAnalysis: 'Delete Analysis',
    confirmDelete: 'Are you sure you want to delete this analysis? This action cannot be undone.',
    deleted: 'Analysis deleted successfully',
  },
  he: {
    title: 'דוח ניתוח',
    backToHistory: 'חזור להיסטוריה',
    loading: 'טוען ניתוח...',
    notFound: 'ניתוח לא נמצא',
    notFoundDescription: 'הניתוח המבוקש לא נמצא. ייתכן שהוא נמחק או שהקישור לא תקין.',
    error: 'נכשל בטעינת הניתוח',
    retry: 'נסה שוב',
    analysisDate: 'תאריך ניתוח',
    processingTime: 'זמן עיבוד',
    inputContent: 'תוכן מקורי',
    conversationHistory: 'היסטוריית שיחה',
    user: 'אתה',
    assistant: 'צייד הרמאויות',
    deleteAnalysis: 'מחק ניתוח',
    confirmDelete: 'האם אתה בטוח שברצונך למחוק ניתוח זה? פעולה זו לא ניתנת לביטול.',
    deleted: 'הניתוח נמחק בהצלחה',
  },
};

interface ReportPageProps {
  lang?: 'en' | 'he';
}

const ReportPage: React.FC<ReportPageProps> = ({ lang = 'en' }) => {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.reportId as string;

  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const t = textContent[lang];

  useEffect(() => {
    if (reportId) {
      loadAnalysis();
    }
  }, [reportId]);

  const loadAnalysis = async () => {
    if (!reportId) return;

    setIsLoading(true);
    setError(null);

    try {
      const historyService = getHistoryService();
      const analysisEntry = await historyService.getAnalysisById(reportId);

      if (!analysisEntry) {
        setError('not_found');
      } else {
        setEntry(analysisEntry);
      }
    } catch (err) {
      console.error('Failed to load analysis:', err);
      setError('load_error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entry || !confirm(t.confirmDelete)) return;

    setIsDeleting(true);
    try {
      const historyService = getHistoryService();
      const success = await historyService.deleteAnalysis(entry.id);

      if (success) {
        alert(t.deleted);
        router.push('/history');
      } else {
        alert('Failed to delete analysis');
      }
    } catch (err) {
      console.error('Failed to delete analysis:', err);
      alert('Failed to delete analysis');
    } finally {
      setIsDeleting(false);
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

  if (error === 'not_found') {
    return (
      <div className="min-h-screen bg-black">
        <Navigation lang={lang} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{t.notFound}</h3>
              <p className="text-gray-400 mb-6">{t.notFoundDescription}</p>
              <Link
                href="/history"
                className="inline-flex items-center px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t.backToHistory}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'load_error') {
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
              <div className="space-x-4">
                <button
                  onClick={loadAnalysis}
                  className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {t.retry}
                </button>
                <Link
                  href="/history"
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {t.backToHistory}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black">
        <Navigation lang={lang} />

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link
                href="/history"
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">{t.title}</h1>
                <p className="text-gray-400">
                  {t.analysisDate}: {formatDate(entry.timestamp)} {formatTimestamp(entry.timestamp)}
                </p>
              </div>
            </div>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting ? 'Deleting...' : t.deleteAnalysis}
            </button>
          </div>

          {/* Metadata */}
          <div className="bg-dark-gray rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">{t.analysisDate}:</span>
                <span className="text-white ml-2">
                  {formatDate(entry.timestamp)} {formatTimestamp(entry.timestamp)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">{t.processingTime}:</span>
                <span className="text-white ml-2">{entry.processingTime}ms</span>
              </div>
              <div>
                <span className="text-gray-400">ID:</span>
                <span className="text-white ml-2 font-mono text-xs">{entry.id}</span>
              </div>
            </div>
          </div>

          {/* Original Input */}
          {entry.input && (
            <div className="bg-dark-gray rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-4">{t.inputContent}</h2>
              <div className="bg-light-gray rounded-lg p-4">
                <p className="text-gray-300 whitespace-pre-wrap">{entry.input.message}</p>
                {entry.input.imageUrl && (
                  <div className="mt-3 text-sm text-gray-400">
                    📎 Image attached
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analysis Results */}
          <AnalysisPanel
            analysisResult={entry.analysis}
            isLoading={false}
          />

          {/* Conversation History */}
          {entry.conversation && entry.conversation.length > 0 && (
            <div className="bg-dark-gray rounded-lg p-6 mt-8">
              <h2 className="text-xl font-bold text-white mb-4">{t.conversationHistory}</h2>
              <div className="space-y-4">
                {entry.conversation.map((message: Message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${message.role === 'user'
                          ? 'bg-accent-blue text-white'
                          : 'bg-light-gray text-gray-300'
                        }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-medium opacity-75">
                          {message.role === 'user' ? t.user : t.assistant}
                        </span>
                        <span className="text-xs opacity-50">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.imageUrl && (
                        <div className="mt-2 text-xs opacity-75">
                          📎 Image attached
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ReportPage;
