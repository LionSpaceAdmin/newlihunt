import React, { useState, useCallback } from 'react';
// Remove direct gemini import - we'll use AWS API Gateway instead
import { FullAnalysisResult, Message } from '@/types/analysis';
import { fileToBase64, validateImageFile } from '@/utils/helpers';
import AnalysisPanel from './AnalysisPanel';

interface ScamAnalysisProps {
  lang?: 'en' | 'he';
  analysis?: FullAnalysisResult | null;
  conversation?: Message[];
}

const textContent = {
  en: {
    title: "Detection Engine",
    inputLabel: "Paste X link or @handle",
    placeholder: "Paste the link, @handle, or message content here...",
    uploadLabel: "Upload Image (Optional)",
    uploadButton: "Upload a file",
    uploadHint: "or drag and drop",
    uploadDesc: "PNG, JPG, GIF up to 10MB",
    analyzeButton: "Analyze",
    analyzingButton: "Analyzing...",
    error_missing_input: "Please provide a link, text, or an image to analyze.",
    error_api: "An error occurred during analysis. Please check your API key and try again.",
    loadingText: "Scam Hunter is on the case...",
    loadingSubtext: "Analyzing evidence for behavioral patterns.",
    newAnalysis: "Start New Analysis"
  },
  he: {
    title: "מנוע זיהוי",
    inputLabel: "הדבק קישור מ-X או @שם_משתמש",
    placeholder: "הדבק כאן את הקישור, שם המשתמש או תוכן ההודעה...",
    uploadLabel: "העלאת תמונה (אופציונלי)",
    uploadButton: "העלאת קובץ",
    uploadHint: "או גרור ושחרר",
    uploadDesc: "PNG, JPG, GIF עד 10MB",
    analyzeButton: "נתח",
    analyzingButton: "מנתח...",
    error_missing_input: "אנא ספק קישור, טקסט או תמונה לניתוח.",
    error_api: "אירעה שגיאה במהלך הניתוח. אנא בדוק את מפתח ה-API ונסה שוב.",
    loadingText: "צייד הרמאויות בפעולה...",
    loadingSubtext: "מנתח ראיות לדפוסי התנהגות.",
    newAnalysis: "התחל ניתוח חדש"
  }
};

const ScamAnalysis: React.FC<ScamAnalysisProps> = ({ lang = 'en', analysis = null, conversation = [] }) => {
  const [inputText, setInputText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<FullAnalysisResult | null>(analysis);
  const [error, setError] = useState<string | null>(null);

  const t = textContent[lang];

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (validation.isValid) {
        setUploadedFile(file);
        setError(null);
      } else {
        setError(validation.error || 'Invalid file');
      }
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const validation = validateImageFile(file);
      if (validation.isValid) {
        setUploadedFile(file);
        setError(null);
      } else {
        setError(validation.error || 'Invalid file');
      }
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!inputText.trim() && !uploadedFile) {
      setError(t.error_missing_input);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;

      if (uploadedFile) {
        imageBase64 = await fileToBase64(uploadedFile);
        imageMimeType = uploadedFile.type;
      }

      // Call AWS API Gateway instead of direct Gemini
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          imageBase64,
          imageMimeType
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const analysisResult = await response.json();
      setResult(analysisResult);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(t.error_api);
    } finally {
      setIsAnalyzing(false);
    }
  }, [inputText, uploadedFile, t]);

  const handleNewAnalysis = useCallback(() => {
    setInputText('');
    setUploadedFile(null);
    setResult(null);
    setError(null);
  }, []);

  const removeFile = useCallback(() => {
    setUploadedFile(null);
  }, []);

  if (result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden">
              <img 
                src="/lion-digital-guardian/report-card/analysis-dashboard_v1_16x9.webp" 
                alt="Analysis Report" 
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
          </div>
          <button
            onClick={handleNewAnalysis}
            className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t.newAnalysis}
          </button>
        </div>
        <AnalysisPanel analysis={result} conversation={conversation} lang={lang} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">{t.title}</h2>
      
      {/* Input Section */}
      <div className="bg-dark-gray p-6 rounded-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t.inputLabel}
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.placeholder}
            className="w-full h-32 px-3 py-2 bg-light-gray border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent resize-none"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t.uploadLabel}
          </label>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors"
          >
            {uploadedFile ? (
              <div className="flex items-center justify-between bg-light-gray p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-accent-blue rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-medium">IMG</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{uploadedFile.name}</p>
                    <p className="text-gray-400 text-xs">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex flex-col items-center"
                >
                  <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-gray-300">📎</span>
                  </div>
                  <span className="text-accent-blue font-medium">{t.uploadButton}</span>
                  <span className="text-gray-400 text-sm">{t.uploadHint}</span>
                  <span className="text-gray-500 text-xs mt-1">{t.uploadDesc}</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-600/30 p-3 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || (!inputText.trim() && !uploadedFile)}
          className="w-full py-3 bg-accent-blue text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzing ? t.analyzingButton : t.analyzeButton}
        </button>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="bg-dark-gray p-6 rounded-lg text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">{t.loadingText}</h3>
          <p className="text-gray-400">{t.loadingSubtext}</p>
        </div>
      )}
    </div>
  );
};

export default ScamAnalysis;