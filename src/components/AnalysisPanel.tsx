'use client';

import { FullAnalysisResult } from '@/types/analysis';
import { FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { FlagCard } from './FlagCard';
import StatusIcon from './StatusIcon';

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
          <FiAlertTriangle className="text-red-500 flex-shrink-0 mr-4 text-4xl" />
        );
      case 'SUSPICIOUS':
        return (
          <FiInfo className="text-yellow-500 flex-shrink-0 mr-4 text-4xl" />
        );
      case 'SAFE':
      case 'TRUSTED':
      case 'AUTHENTIC':
        return (
          <FiCheckCircle className="text-green-500 flex-shrink-0 mr-4 text-4xl" />
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
        <div>
          <h2
            className={`text-2xl font-bold ${getClassificationClass()}`}
            style={{ textShadow: '0 0 10px currentColor' }}
          >
            {classification.replace('_', ' ')}
          </h2>
          <p className="text-sm text-gray-400">
            Analysis complete - {new Date(metadata.timestamp).toLocaleString()}
          </p>
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
    </motion.div>
  );
}

