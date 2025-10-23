'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { getHistoryService } from '@/lib/history-service';
import { StoredAnalysis } from '@/lib/storage/types';
import { Classification } from '@/types/analysis';
import StatusIcon from '@/components/StatusIcon';

import ScamAnalysis from '@/components/ScamAnalysis';

const AnalysisDetailPage: React.FC = () => {
  const params = useParams();
  const reportId = params?.reportId as string;
  
  const [analysis, setAnalysis] = useState<StoredAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const historyService = getHistoryService();
      const response = await historyService.getAnalysis(reportId);
      
      if (response.success && response.analysis) {
        setAnalysis(response.analysis);
      } else {
        setError('Analysis not found');
      }
    } catch (err) {
      console.error('Failed to load analysis:', err);
      setError('Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) {
      loadAnalysis();
    }
  }, [reportId]);

  const submitFeedback = async (feedback: 'positive' | 'negative') => {
    if (!analysis) return;
    
    try {
      setFeedbackSubmitting(true);
      
      const historyService = getHistoryService();
      const response = await historyService.submitFeedback(analysis.id, feedback);
      
      if (response.success) {
        // Update local state
        setAnalysis(prev => prev ? { ...prev, feedback } : null);
      } else {
        console.error('Failed to submit feedback:', response.error);
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(date));
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analysis details...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-black">
        <header className="bg-dark-gray border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/history" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-gray-400">Back to History</span>
              </Link>
            </div>
          </div>
        </header>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="w-32 h-24 mx-auto mb-6 rounded-lg overflow-hidden">
              <Image 
                src="/lion-digital-guardian/empty-state/calm-guardian_v1_4x3.webp" 
                alt="Analysis Not Found" 
                width={256}
                height={192}
                className="w-full h-full object-cover opacity-50"
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Analysis Not Found</h1>
            <p className="text-gray-400 mb-6">
              {error || 'The requested analysis could not be found or may have been removed.'}
            </p>
            <div className="space-x-4">
              <Link 
                href="/history"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                View History
              </Link>
              <Link 
                href="/"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                New Analysis
              </Link>
            </div>
          </div>
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
              <Link href="/history" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-gray-400">History</span>
              </Link>
              
              <div className="flex items-center space-x-3">
                <StatusIcon 
                  classification={analysis.result.analysisData.classification} 
                  size="sm" 
                />
                <div>
                  <h1 className="text-lg font-bold text-white">Analysis Details</h1>
                  <p className="text-sm text-gray-400">
                    {formatDate(analysis.timestamp)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Feedback Buttons */}
              {!analysis.feedback && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Was this helpful?</span>
                  <button
                    onClick={() => submitFeedback('positive')}
                    disabled={feedbackSubmitting}
                    className="p-2 text-gray-400 hover:text-green-400 transition-colors disabled:opacity-50"
                    title="Helpful"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L9 7v13m-3-4h-2m0-4h2m0-4h2" />
                    </svg>
                  </button>
                  <button
                    onClick={() => submitFeedback('negative')}
                    disabled={feedbackSubmitting}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Not helpful"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L15 17V4m-3 4H9m1-4H9m1 4h1" />
                    </svg>
                  </button>
                </div>
              )}
              
              {analysis.feedback && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Feedback:</span>
                  <span className={`text-sm ${analysis.feedback === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                    {analysis.feedback === 'positive' ? '👍 Helpful' : '👎 Not helpful'}
                  </span>
                </div>
              )}
              
              <Link 
                href="/"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                New Analysis
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Original Input Section */}
        <div className="mb-8 bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Original Input</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-white whitespace-pre-wrap">{analysis.input.message}</p>
              </div>
            </div>
            
            {analysis.input.imageUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Attached Image</label>
                <div className="bg-gray-800 rounded-lg p-4">
                  <Image 
                    src={analysis.input.imageUrl} 
                    alt="Analysis input" 
                    width={400}
                    height={300}
                    className="max-w-full h-auto rounded-lg"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Analysis Results</h2>
          </div>
          
          <div className="p-6">
            <ScamAnalysis analysis={analysis.result} />
          </div>
        </div>

        {/* Metadata Section */}
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Analysis Metadata</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Analysis ID:</span>
              <span className="ml-2 text-white font-mono">{analysis.id}</span>
            </div>
            
            <div>
              <span className="text-gray-400">Processing Time:</span>
              <span className="ml-2 text-white">{analysis.metadata.processingTime}ms</span>
            </div>
            
            <div>
              <span className="text-gray-400">User Agent:</span>
              <span className="ml-2 text-white text-xs">{analysis.metadata.userAgent || 'Unknown'}</span>
            </div>
            
            <div>
              <span className="text-gray-400">IP Hash:</span>
              <span className="ml-2 text-white font-mono">{analysis.metadata.ipHash}</span>
            </div>
          </div>
        </div>

        {/* Conversation History */}
        {analysis.conversation.length > 0 && (
          <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Conversation History</h2>
            
            <div className="space-y-4">
              {analysis.conversation.map((message, index) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-3xl rounded-lg p-4 ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-100'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs opacity-75">
                        {message.role === 'user' ? 'You' : 'Scam Hunter'}
                      </span>
                      <span className="text-xs opacity-75">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {message.imageUrl && (
                      <div className="mt-3">
                        <Image 
                          src={message.imageUrl} 
                          alt="Message attachment" 
                          width={400}
                          height={300}
                          className="max-w-full h-auto rounded-lg"
                          style={{ objectFit: 'contain' }}
                        />
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
  );
};

export default AnalysisDetailPage;