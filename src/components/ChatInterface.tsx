'use client';

import { useScamAnalysis } from '@/hooks/useScamAnalysis';
import { FullAnalysisResult, Message } from '@/types/analysis';
import { formatTimestamp } from '@/utils/helpers';
import {
  createImagePreview,
  formatFileSize,
  uploadImage,
  UploadProgress,
  validateImageFile,
} from '@/utils/uploadService';
import {
  detectURLs,
  formatURLInspectionResult,
  inspectURL,
  isLikelySuspiciousURL,
} from '@/utils/urlUtils';
import Image from 'next/image';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface ChatInterfaceProps {
  onAnalysisComplete: (analysis: FullAnalysisResult) => void;
  lang?: 'en' | 'he';
}

const textContent = {
  en: {
    placeholder: 'Describe suspicious content, paste a link, or upload an image...',
    uploadHint: 'Drop an image here or click to upload',
    quickActions: {
      socialMedia: 'Analyze Social Media Post',
      email: 'Check Suspicious Email',
      donation: 'Verify Donation Request',
      website: 'Inspect Website',
      webSearch: 'Search the Web',
      analyzeXProfile: 'Analyze X Profile',
    },
    sending: 'Analyzing...',
    typing: 'Scam Hunter is typing...',
    error: 'Failed to send message. Please try again.',
    maxFileSize: 'File too large. Maximum size is 10MB.',
    invalidFileType: 'Invalid file type. Please upload JPEG, PNG, or WebP images only.',
    uploadError: 'Upload failed. Please try again.',
    uploading: 'Uploading image...',
    clearChat: 'Clear Chat',
    newAnalysis: 'New Analysis',
    urlDetected: 'URL detected in your message',
    inspectUrl: 'Inspect URL',
    urlInspecting: 'Inspecting URL...',
    urlSafetyWarning: 'Potentially suspicious URL detected',
  },
  he: {
    placeholder: 'תאר תוכן חשוד, הדבק קישור או העלה תמונה...',
    uploadHint: 'גרור תמונה לכאן או לחץ להעלאה',
    quickActions: {
      socialMedia: 'נתח פוסט ברשת חברתית',
      email: 'בדוק אימייל חשוד',
      donation: 'אמת בקשת תרומה',
      website: 'בדוק אתר אינטרנט',
      webSearch: 'חפש באינטרנט',
      analyzeXProfile: 'נתח פרופיל X',
    },
    sending: 'מנתח...',
    typing: 'צייד הרמאויות כותב...',
    error: 'שליחת ההודעה נכשלה. אנא נסה שוב.',
    maxFileSize: 'הקובץ גדול מדי. גודל מקסימלי 10MB.',
    invalidFileType: 'סוג קובץ לא תקין. אנא העלה תמונות JPEG, PNG או WebP בלבד.',
    uploadError: 'העלאה נכשלה. אנא נסה שוב.',
    uploading: 'מעלה תמונה...',
    clearChat: "נקה צ'אט",
    newAnalysis: 'ניתוח חדש',
    urlDetected: 'זוהה קישור בהודעה שלך',
    inspectUrl: 'בדוק קישור',
    urlInspecting: 'בודק קישור...',
    urlSafetyWarning: 'זוהה קישור חשוד',
  },
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onAnalysisComplete, lang = 'en' }) => {
  const [inputText, setInputText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [urlInspectionLoading, setUrlInspectionLoading] = useState<string | null>(null);
  const [webSearchLoading, setWebSearchLoading] = useState<string | null>(null);
  const [detectedURLs, setDetectedURLs] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    error,
    currentAnalysis,
    connectionStatus,
    storageStatus,
    sendMessage,
    clearConversation,
    retryLastAnalysis,
    addMessage,
  } = useScamAnalysis();

  const t = textContent[lang];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Trigger analysis complete callback when analysis is ready
  useEffect(() => {
    if (currentAnalysis) {
      onAnalysisComplete(currentAnalysis);
    }
  }, [currentAnalysis, onAnalysisComplete]);

  const handleSendMessage = useCallback(
    async (content: string, imageUrl?: string) => {
      if (!content.trim() && !imageUrl) return;

      // Clear input and detected URLs
      setInputText('');
      setDetectedURLs([]);

      try {
        await sendMessage(content.trim(), imageUrl);
      } catch (err) {
        console.error('Send message error:', err);
      }
    },
    [sendMessage]
  );

  const handleInputSubmit = useCallback(() => {
    if (inputText.trim() && !isLoading) {
      handleSendMessage(inputText);
    }
  }, [inputText, isLoading, handleSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleInputSubmit();
      }
    },
    [handleInputSubmit]
  );

  const handleQuickAction = useCallback((actionType: string) => {
    const prompts = {
      socialMedia:
        'I found this social media post asking for donations to help Israeli soldiers. Can you analyze if this is legitimate?',
      email:
        'I received an email claiming to be from an Israeli charity asking for urgent donations. The sender says they need money immediately for IDF equipment.',
      donation:
        "Someone is asking me to donate to help Israeli families affected by the conflict. They provided a link but I'm not sure if it's legitimate.",
      website:
        "I found this website claiming to collect donations for Israeli causes. Can you help me verify if it's trustworthy?",
      webSearch: 'I want to search the web for information about a specific topic.',
      analyzeXProfile: 'Analyze this X profile: ',
    };

    const prompt = prompts[actionType as keyof typeof prompts];
    if (prompt) {
      setInputText(prompt);
      inputRef.current?.focus();
    }
  }, []);

  // Handle URL detection in input text
  const handleInputChange = useCallback((value: string) => {
    setInputText(value);

    // Detect URLs in the input
    const urls = detectURLs(value);
    setDetectedURLs(urls);
  }, []);

  // Handle URL inspection
  const handleInspectURL = useCallback(
    async (url: string) => {
      setUrlInspectionLoading(url);

      try {
        const result = await inspectURL(url);

        if (result.success && result.result) {
          // Add URL inspection result as a system message
          const inspectionMessage = formatURLInspectionResult(result.result);
          await sendMessage(`URL Inspection Results:\n\n${inspectionMessage}`);
        } else {
          // Show error message
          await sendMessage(`⚠️ URL inspection failed: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('URL inspection error:', error);
        await sendMessage(
          `⚠️ URL inspection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      } finally {
        setUrlInspectionLoading(null);
      }
    },
    [sendMessage]
  );

  // Handle Web Search
  const handleWebSearch = useCallback(
    async (query: string) => {
      setWebSearchLoading(query);

      try {
        const response = await fetch('/api/web-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          throw new Error('Web search request failed');
        }

        const result = await response.json();
        await sendMessage(`Web Search Results for "${query}":\n\n${result.results}`);
      } catch (error) {
        console.error('Web search error:', error);
        // Don't send error message to analysis - just show it as a system message
        const errorMessage = `⚠️ Web search failed: ${error instanceof Error ? error.message : 'Internal server error'}`;

        // Add error message without triggering analysis
        addMessage({
          role: 'assistant',
          content: errorMessage,
        });
      } finally {
        setWebSearchLoading(null);
      }
    },
    [sendMessage]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        setUploadError(validation.error || t.invalidFileType);
        return;
      }

      try {
        setUploadError(null);
        setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });

        // Create preview
        const preview = await createImagePreview(file);
        setPreviewImage(preview);

        // Upload to S3
        const result = await uploadImage(file, {
          onProgress: progress => {
            setUploadProgress(progress);
          },
        });

        if (result.success && result.url) {
          // Send message with uploaded image URL
          await handleSendMessage(
            `Uploaded image: ${result.originalName || file.name} (${formatFileSize(result.size || file.size)})`,
            result.url
          );

          // Clear upload state
          setUploadProgress(null);
          setPreviewImage(null);
        } else {
          throw new Error(result.message || 'Upload failed');
        }
      } catch (err) {
        console.error('File upload error:', err);
        setUploadError(err instanceof Error ? err.message : t.error);
        setUploadProgress(null);
        setPreviewImage(null);
      }
    },
    [handleSendMessage, t.error, t.invalidFileType]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleClearChat = useCallback(() => {
    clearConversation();
    setInputText('');
    setUploadProgress(null);
    setUploadError(null);
    setPreviewImage(null);
    setDetectedURLs([]);
    setUrlInspectionLoading(null);
    inputRef.current?.focus();
  }, [clearConversation]);

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';

    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div
          className={`max-w-[80%] rounded-lg px-4 py-3 ${
            isUser ? 'bg-accent-blue text-white' : 'bg-dark-gray text-gray-100'
          }`}
        >
          {message.imageUrl && (
            <div className="mb-2">
              <Image
                src={message.imageUrl}
                alt="Uploaded content"
                width={400}
                height={200}
                className="max-w-full h-auto rounded-lg"
                style={{ objectFit: 'contain', maxHeight: '200px' }}
              />
            </div>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <div className={`text-xs mt-2 opacity-70 ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-black relative">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'url(/lion-digital-guardian/background-pattern/cyber-grid_v1_tile.webp)',
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 relative z-10">
        <div>
          <h2 className="text-lg font-semibold text-white">Scam Hunter Chat</h2>
          <p className="text-sm text-gray-400">AI-powered scam detection</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          {connectionStatus && (
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-500'
                    : connectionStatus === 'connecting'
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-gray-400">
                {connectionStatus === 'connected'
                  ? 'Live'
                  : connectionStatus === 'connecting'
                    ? 'Connecting...'
                    : 'Offline'}
              </span>
            </div>
          )}

          {/* Storage Status */}
          {storageStatus && storageStatus !== 'idle' && (
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  storageStatus === 'saved'
                    ? 'bg-green-500'
                    : storageStatus === 'saving'
                      ? 'bg-blue-500 animate-pulse'
                      : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-gray-400">
                {storageStatus === 'saved'
                  ? 'Saved'
                  : storageStatus === 'saving'
                    ? 'Saving...'
                    : 'Save failed'}
              </span>
            </div>
          )}

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
              {t.clearChat}
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-48 h-27 mx-auto mb-6 rounded-lg overflow-hidden">
              <Image
                src="/lion-digital-guardian/hero-banner/landing-visual_v1_16x9.webp"
                alt="Scam Hunter - Digital Guardian"
                width={384}
                height={216}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Welcome to Scam Hunter</h3>
            <p className="text-gray-400 mb-6">
              AI-powered protection against online impersonation scams
            </p>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto">
              {Object.entries(t.quickActions).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleQuickAction(key)}
                  className="p-3 text-sm bg-dark-gray hover:bg-light-gray text-gray-300 hover:text-white rounded-lg transition-all duration-200 text-left hover:scale-105 hover:shadow-lg animate-fade-in"
                  style={{ animationDelay: `${Object.keys(t.quickActions).indexOf(key) * 100}ms` }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(renderMessage)}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-dark-gray text-gray-300 rounded-lg px-4 py-3 max-w-[80%]">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  <Image
                    src="/lion-digital-guardian/loading-screen/lion-awakening_v1_3x4.webp"
                    alt="Analyzing..."
                    width={48}
                    height={48}
                    className="w-full h-full object-cover animate-lion-awakening"
                  />
                </div>
                <div>
                  <div className="flex space-x-1 mb-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                  <span className="text-sm">{t.typing}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 p-4 relative z-10">
        {error && (
          <div className="mb-3 p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-300 text-sm">{error}</p>
              {retryLastAnalysis && (
                <button
                  onClick={retryLastAnalysis}
                  className="ml-3 px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        {uploadError && (
          <div className="mb-3 p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-300 text-sm">{uploadError}</p>
              <button
                onClick={() => setUploadError(null)}
                className="ml-3 text-red-300 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {uploadProgress && (
          <div className="mb-3 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
            <div className="flex items-center space-x-3">
              {previewImage && (
                <Image
                  src={previewImage}
                  alt="Upload preview"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-blue-300 text-sm">Uploading image...</span>
                  <span className="text-blue-300 text-sm">{uploadProgress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* URL Detection and Inspection */}
        {detectedURLs.length > 0 && (
          <div className="mb-3 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <svg
                  className="w-5 h-5 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-yellow-300 text-sm font-medium mb-2">{t.urlDetected}</h4>
                <div className="space-y-2">
                  {detectedURLs.map((url, index) => {
                    const isSuspicious = isLikelySuspiciousURL(url);
                    const isInspecting = urlInspectionLoading === url;

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-800/50 rounded"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {isSuspicious && (
                            <svg
                              className="w-4 h-4 text-red-400 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                          )}
                          <span
                            className={`text-sm truncate ${isSuspicious ? 'text-red-300' : 'text-gray-300'}`}
                          >
                            {url}
                          </span>
                          {isSuspicious && (
                            <span className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded flex-shrink-0">
                              {t.urlSafetyWarning}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleInspectURL(url)}
                          disabled={isInspecting || isLoading}
                          className="ml-3 px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                        >
                          {isInspecting ? (
                            <>
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                              <span>{t.urlInspecting}</span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                              </svg>
                              <span>{t.inspectUrl}</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleWebSearch(url)}
                          disabled={webSearchLoading === url || isLoading}
                          className="ml-3 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                        >
                          {webSearchLoading === url ? (
                            <>
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                              <span>Searching...</span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                              </svg>
                              <span>Web Search</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {detectedURLs.some(isLikelySuspiciousURL) && (
                  <div className="mt-3 p-2 bg-red-900/20 border border-red-600/30 rounded text-xs text-red-300">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3">
                        <img
                          src="/lion-digital-guardian/status-warning/lion-warning-triangle_v1_1x1.webp"
                          alt="Warning"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span>
                        Suspicious URLs detected. Consider inspecting them before proceeding.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div
          className={`relative border-2 border-dashed rounded-lg transition-colors ${
            dragActive
              ? 'border-accent-blue bg-blue-900/10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex items-end space-x-3 p-3">
            {/* File Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex-shrink-0 p-3 sm:p-2 transition-colors touch-manipulation ${
                uploadProgress
                  ? 'text-blue-400 cursor-not-allowed'
                  : 'text-gray-400 hover:text-accent-blue active:text-accent-blue'
              }`}
              disabled={isLoading || uploadProgress !== null}
              title="Upload image"
              aria-label="Upload image"
            >
              {uploadProgress ? (
                <div className="w-6 h-6 sm:w-5 sm:h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-6 h-6 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              )}
            </button>

            {/* Text Input */}
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              className="flex-1 bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none min-h-[44px] sm:min-h-[40px] max-h-[120px] text-base"
              rows={1}
              disabled={isLoading || uploadProgress !== null}
              style={{ fontSize: '16px' }}
            />

            {/* Send Button */}
            <button
              onClick={handleInputSubmit}
              disabled={
                isLoading || uploadProgress !== null || (!inputText.trim() && !previewImage)
              }
              className="flex-shrink-0 p-3 sm:p-2 bg-accent-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
              aria-label="Send message"
            >
              {isLoading || uploadProgress !== null ? (
                <div className="w-6 h-6 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-6 h-6 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>

          {dragActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-900/20 rounded-lg">
              <p className="text-accent-blue font-medium">{t.uploadHint}</p>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ChatInterface;
