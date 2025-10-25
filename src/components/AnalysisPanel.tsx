'use client';

import { copyToClipboard, downloadJSONReport, downloadTextReport } from '@/lib/exportUtils';
import { submitFeedback } from '@/lib/feedback-service';
import { FullAnalysisResult } from '@/types/analysis';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiShare2, FiThumbsDown, FiThumbsUp } from 'react-icons/fi';
import { FlagCard } from './FlagCard';

interface AnalysisPanelProps {
  analysisResult: FullAnalysisResult | null;
  isLoading: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function AnalysisPanel({
  analysisResult,
  isLoading,
}: AnalysisPanelProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleFeedback = async (feedbackType: 'up' | 'down') => {
    if (!analysisResult) return;
    await submitFeedback({
      analysisId: analysisResult.metadata.timestamp,
      feedbackType,
    });
    setFeedbackSubmitted(true);
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-4xl mx-auto p-6 bg-gray-900 rounded-lg shadow-lg"
      >
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-lg font-semibold text-gray-300">
            Analyzing...
          </p>
        </div>
      </motion.div>
    );
  }

  if (!analysisResult) {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl mx-auto p-8 bg-gray-800 rounded-lg shadow-2xl text-center"
      >
        <FiInfo className="mx-auto text-5xl text-blue-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Ready for Analysis
        </h2>
        <p className="text-gray-400">
          Submit a message, image, or social media profile to begin the scam
          analysis.
        </p>
      </motion.div>
    );
  }

  const { summary, analysisData, metadata } = analysisResult;
  const { classification } = analysisData;

  const renderIcon = () => {
    switch (classification) {
      case 'HIGH_RISK':
      case 'FAKE_SCAM':
        return (
          <FiAlertTriangle className="text-red-500 shrink-0 mr-4 text-4xl" />
        );
      case 'SUSPICIOUS':
        return (
          <FiInfo className="text-yellow-500 shrink-0 mr-4 text-4xl" />
        );
      case 'SAFE':
      case 'TRUSTED':
      case 'AUTHENTIC':
        return (
          <FiCheckCircle className="text-green-500 shrink-0 mr-4 text-4xl" />
        );
      default:
        return null;
    }
  };

  const getClassificationClass = () => {
    switch (classification) {
      case 'HIGH_RISK':
      case 'FAKE_SCAM':
        return 'text-red-400 border-red-500';
      case 'SUSPICIOUS':
        return 'text-yellow-400 border-yellow-500';
      case 'SAFE':
      case 'TRUSTED':
      case 'AUTHENTIC':
        return 'text-green-400 border-green-500';
      default:
        return 'text-gray-400 border-gray-500';
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-4xl mx-auto p-6 bg-gray-900 rounded-lg shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center pb-4 border-b border-gray-700">
        {renderIcon()}
        <div className="flex-1">
          <h2
            className={`text-2xl font-bold ${getClassificationClass()}`}
          >
            {classification.replace('_', ' ')}
          </h2>
          <p className="text-sm text-gray-400">
            Analysis complete - {new Date(metadata.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="relative ml-auto">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
            title="Export options"
          >
            <FiShare2 size={20} />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
              <button
                onClick={() => { copyToClipboard(analysisResult, 'summary'); setShowExportMenu(false); }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-t-lg"
              >
                Copy Summary
              </button>
              <button
                onClick={() => { copyToClipboard(analysisResult, 'full'); setShowExportMenu(false); }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                Copy Full Report
              </button>
              <button
                onClick={() => { downloadTextReport(analysisResult); setShowExportMenu(false); }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                Download Text
              </button>
              <button
                onClick={() => { downloadJSONReport(analysisResult); setShowExportMenu(false); }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-b-lg"
              >
                Download JSON
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="py-6">
        <h3 className="text-xl font-semibold text-white mb-3">Summary</h3>
        <p className="text-lg leading-relaxed text-gray-300">{summary}</p>
      </div>

      {/* Risk Factors */}
      {analysisData.riskFactors && analysisData.riskFactors.length > 0 && (
        <div className="py-6">
          <h3 className="text-xl font-semibold text-red-400 mb-4">
            <FiAlertTriangle className="inline-block mr-2" />
            Risk Factors
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysisData.riskFactors.map((factor, index) => (
              <FlagCard
                key={`risk-${index}`}
                text={factor}
                type="risk"
                icon={<FiAlertTriangle />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Credibility Factors */}
      {analysisData.credibilityFactors &&
        analysisData.credibilityFactors.length > 0 && (
          <div className="py-6">
            <h3 className="text-xl font-semibold text-green-400 mb-4">
              <FiCheckCircle className="inline-block mr-2" />
              Credibility Factors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisData.credibilityFactors.map((factor, index) => (
                <FlagCard
                  key={`cred-${index}`}
                  text={factor}
                  type="credibility"
                  icon={<FiCheckCircle />}
                />
              ))}
            </div>
          </div>
        )}

      {/* Recommendation */}
      {analysisData.recommendation && (
        <div className="pt-6 mt-6 border-t border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-3">
            Our Recommendation
          </h3>
          <p className="text-lg leading-relaxed text-gray-300">
            {analysisData.recommendation}
          </p>
        </div>
      )}

      {/* Feedback Section */}
      <div className="pt-6 mt-6 border-t border-gray-700 text-center">
        {!feedbackSubmitted ? (
          <>
            <h3 className="text-lg font-semibold text-white mb-3">Was this analysis helpful?</h3>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleFeedback('up')}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-green-800 hover:border-green-700 hover:text-white transition-colors"
              >
                <FiThumbsUp />
                <span>Yes</span>
              </button>
              <button
                onClick={() => handleFeedback('down')}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-red-800 hover:border-red-700 hover:text-white transition-colors"
              >
                <FiThumbsDown />
                <span>No</span>
              </button>
            </div>
          </>
        ) : (
          <p className="text-lg text-green-400">Thank you for your feedback!</p>
        )}
      </div>
    </motion.div>
  );
}
