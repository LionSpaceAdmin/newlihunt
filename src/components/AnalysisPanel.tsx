import {
  copyToClipboard,
  downloadJSONReport,
  downloadTextReport,
  ExportOptions,
  shareAnalysis,
  validateSharingPrivacy,
} from '@/lib/exportUtils';
import { submitFeedback } from '@/lib/feedback-service';
import { FullAnalysisResult, Message } from '@/types/analysis';
import React, { useCallback, useState } from 'react';


interface AnalysisPanelProps {
  analysis: FullAnalysisResult;
  conversation?: Message[];
  lang?: 'en' | 'he';
}

const textContent = {
  en: {
    riskScore: 'Risk Score',
    credibilityScore: 'Credibility Score',
    classification: 'Classification',
    safe: 'SAFE',
    trusted: 'TRUSTED',
    authentic: 'AUTHENTIC',
    suspicious: 'SUSPICIOUS',
    highRisk: 'HIGH_RISK',
    fake_scam: 'FAKE / SCAM',
    summary: 'Summary',
    reasoning: 'Reasoning',
    recommendations: 'Recommendations',
    detectedRules: 'Detected Rules',
    debiasingStatus: 'Debiasing Status',
    anonymousProfileNeutralized: 'Anonymous Profile Neutralized',
    patrioticTokensNeutralized: 'Patriotic Language Neutralized',
    sentimentPenaltyCapped: 'Emotional Content Penalty Capped',
    feedbackPrompt: 'Was this analysis helpful?',
    copySuccess: 'Analysis copied to clipboard!',
    sharePrompt: 'Share this analysis',
    feedbackThanks: 'Thank you for your feedback!',
    feedbackError: 'Failed to submit feedback.',
    exportReport: 'Export Report',
    downloadText: 'Download as Text',
    downloadJSON: 'Download as JSON',
    copyFull: 'Copy Full Report',
    copySummary: 'Copy Summary',
    copySocial: 'Copy for Social Media',
    shareNative: 'Share',
    exportOptions: 'Export Options',
    privacyWarning: 'Privacy Warning',
    privacyNotice: 'This report may contain sensitive information. Review before sharing.',
  },
  he: {
    riskScore: 'ציון סיכון',
    credibilityScore: 'ציון אמינות',
    classification: 'סיווג',
    safe: 'בטוח',
    trusted: 'מהימן',
    authentic: 'אותנטי',
    suspicious: 'חשוד',
    highRisk: 'בסיכון גבוה',
    fake_scam: 'מזויף / הונאה',
    summary: 'סיכום',
    reasoning: 'הנמקה',
    recommendations: 'המלצות',
    detectedRules: 'כללים שזוהו',
    debiasingStatus: 'סטטוס נטרול הטיה',
    anonymousProfileNeutralized: 'פרופיל אנונימי נוטרל',
    patrioticTokensNeutralized: 'שפה פטריוטית נוטרלה',
    sentimentPenaltyCapped: 'עונש תוכן רגשי הוגבל',
    feedbackPrompt: 'האם ניתוח זה היה מועיל?',
    copySuccess: 'הניתוח הועתק ללוח!',
    sharePrompt: 'שתף ניתוח זה',
    feedbackThanks: 'תודה על המשוב שלך!',
    feedbackError: 'הגשת המשוב נכשלה.',
    exportReport: 'ייצא דוח',
    downloadText: 'הורד כטקסט',
    downloadJSON: 'הורד כ-JSON',
    copyFull: 'העתק דוח מלא',
    copySummary: 'העתק סיכום',
    copySocial: 'העתק לרשתות חברתיות',
    shareNative: 'שתף',
    exportOptions: 'אפשרויות ייצוא',
    privacyWarning: 'אזהרת פרטיות',
    privacyNotice: 'דוח זה עלול להכיל מידע רגיש. בדוק לפני שיתוף.',
  },
};

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, conversation, lang = 'en' }) => {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const t = textContent[lang];
  const { analysisData, summary } = analysis;



  const handleFeedback = useCallback(
    async (type: 'up' | 'down') => {
      setFeedback(type);
      try {
        await submitFeedback({
          analysisId: analysis.metadata.timestamp, // Using timestamp as a unique ID for now
          feedbackType: type,
        });
        alert(t.feedbackThanks);
      } catch {
        alert(t.feedbackError);
      }
    },
    [analysis.metadata.timestamp, t.feedbackThanks, t.feedbackError]
  );

  const handleCopy = useCallback(
    async (format: 'summary' | 'social' | 'full' = 'summary') => {
      const success = await copyToClipboard(analysis, format);
      if (success) {
        setCopyStatus(t.copySuccess);
        setTimeout(() => setCopyStatus(null), 3000);
      } else {
        setCopyStatus('Failed to copy');
        setTimeout(() => setCopyStatus(null), 3000);
      }
    },
    [analysis, t.copySuccess]
  );

  const handleDownload = useCallback(
    (format: 'text' | 'json') => {
      const options: ExportOptions = {
        includeConversation: true,
        includeTimestamp: true,
        privacy: 'anonymized',
      };

      if (format === 'text') {
        downloadTextReport(analysis, conversation, options);
      } else {
        downloadJSONReport(analysis, conversation, options);
      }
    },
    [analysis, conversation]
  );

  const handleNativeShare = useCallback(async () => {
    const success = await shareAnalysis(analysis);
    if (!success) {
      // Fallback to copy if native sharing not supported
      await handleCopy('social');
    }
  }, [analysis, handleCopy]);

  const privacyCheck = validateSharingPrivacy(analysis, conversation);

  return (
    <div className="space-y-6 text-gray-300">
      {/* Summary */}
      <div className="bg-dark-gray p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-4">{t.summary}</h2>
        <p className="text-lg leading-relaxed">{summary}</p>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">{t.feedbackPrompt}</span>
            <button
              onClick={() => handleFeedback('up')}
              className={`p-2 rounded-full ${feedback === 'up' ? 'bg-success-green' : 'bg-gray-700'} text-white hover:bg-success-green-dark transition-colors`}
            >
              👍
            </button>
            <button
              onClick={() => handleFeedback('down')}
              className={`p-2 rounded-full ${feedback === 'down' ? 'bg-danger-red' : 'bg-gray-700'} text-white hover:bg-danger-red-dark transition-colors`}
            >
              👎
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {copyStatus && <span className="text-sm text-green-400 mr-2">{copyStatus}</span>}

            {/* Quick Copy Button */}
            <button
              onClick={() => handleCopy('summary')}
              className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              title={t.copySummary}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Native Share Button */}
            <button
              onClick={handleNativeShare}
              className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              title={t.shareNative}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Export Menu */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 rounded-full bg-accent-blue text-white hover:bg-blue-600 transition-colors"
                title={t.exportReport}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                </svg>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-dark-gray border border-gray-600 rounded-lg shadow-lg z-10">
                  <div className="p-3">
                    <h4 className="text-white font-medium mb-3">{t.exportOptions}</h4>

                    {/* Privacy Warning */}
                    {!privacyCheck.safe && (
                      <div className="mb-3 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded text-xs">
                        <div className="flex items-center space-x-1 mb-1">
                          <div className="w-4 h-4">
                            <img
                              src="/lion-digital-guardian/status-warning/lion-warning-triangle_v1_1x1.webp"
                              alt="Warning"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-yellow-300 font-medium">{t.privacyWarning}</span>
                        </div>
                        <p className="text-yellow-200">{t.privacyNotice}</p>
                        <ul className="mt-1 text-yellow-200 text-xs">
                          {privacyCheck.warnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-2">
                      {/* Copy Options */}
                      <div className="border-b border-gray-600 pb-2">
                        <p className="text-gray-400 text-xs mb-2">Copy to Clipboard</p>
                        <button
                          onClick={() => {
                            handleCopy('summary');
                            setShowExportMenu(false);
                          }}
                          className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-gray-600 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>{t.copySummary}</span>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            handleCopy('full');
                            setShowExportMenu(false);
                          }}
                          className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-gray-600 rounded"
                        >
                          📄 {t.copyFull}
                        </button>
                        <button
                          onClick={() => {
                            handleCopy('social');
                            setShowExportMenu(false);
                          }}
                          className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-gray-600 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M17 3H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 16c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm2.5-6H9.5V7h5v6z" />
                            </svg>
                            <span>{t.copySocial}</span>
                          </div>
                        </button>
                      </div>

                      {/* Download Options */}
                      <div>
                        <p className="text-gray-400 text-xs mb-2">Download Report</p>
                        <button
                          onClick={() => {
                            handleDownload('text');
                            setShowExportMenu(false);
                          }}
                          className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-gray-600 rounded"
                        >
                          📝 {t.downloadText}
                        </button>
                        <button
                          onClick={() => {
                            handleDownload('json');
                            setShowExportMenu(false);
                          }}
                          className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-gray-600 rounded"
                        >
                          🔧 {t.downloadJSON}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-dark-gray p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-white mb-3">Risk Factors</h3>
          <ul className="list-disc list-inside space-y-2">
            {analysisData.riskFactors.map((factor, index) => (
              <li key={index} className="text-lg text-red-400">
                {factor}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-dark-gray p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-white mb-3">Credibility Factors</h3>
          <ul className="list-disc list-inside space-y-2">
            {analysisData.credibilityFactors.map((factor, index) => (
              <li key={index} className="text-lg text-green-400">
                {factor}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-dark-gray p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-4">{t.recommendations}</h2>
        <p className="text-lg leading-relaxed">{analysisData.recommendation}</p>

        {/* Support Information */}
        <div className="mt-6 pt-4 border-t border-gray-600">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8">
              <img
                src="/lion-digital-guardian/app-icon/68512281-D399-4756-9206-67C2C2E83BB0.webp"
                alt="Lion Guardian"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {lang === 'he' ? 'תמכו במשימה שלנו' : 'Support Our Mission'}
            </h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            {lang === 'he'
              ? 'עזרו לנו להמשיך לחשף חשבונות מזויפים ולהגן על האמת ברשת'
              : 'Help us continue exposing fake accounts and defending truth online'}
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://buymeacoffee.com/danielhanukayeb/e/471429"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
            >
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>{lang === 'he' ? 'תמכו בפרויקט' : 'Support Project'}</span>
              </div>
            </a>
            <a
              href="https://www.fidf.org/donate"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
            >
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <span>{lang === 'he' ? 'תמכו ב-FIDF' : 'Support FIDF'}</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
