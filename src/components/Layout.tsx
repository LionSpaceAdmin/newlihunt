'use client';

import { useScamAnalysis } from '@/hooks/useScamAnalysis';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import ChatInterface from './ChatInterface';
import ErrorBoundary, { AnalysisErrorBoundary, ChatErrorBoundary } from './ErrorBoundary';
import HelpSystem from './HelpSystem';
import Navigation from './Navigation';
import OnboardingFlow from './OnboardingFlow';
import ScamAnalysis from './ScamAnalysis';
import StatusIcon from './StatusIcon';
import SupportWidget from './SupportWidget';

interface LayoutProps {
  lang?: 'en' | 'he';
}

const Layout: React.FC<LayoutProps> = ({ lang = 'en' }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Use the scam analysis hook to get conversation data
  const { currentAnalysis, messages } = useScamAnalysis();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if onboarding should be shown
  useEffect(() => {
    // Use setTimeout to avoid setState during render
    const timer = setTimeout(() => {
      const completed = localStorage.getItem('scam-hunter-onboarding-completed');
      if (completed !== 'true') {
        setShowOnboarding(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleAnalysisComplete = () => {
    if (isMobile) {
      setShowAnalysis(true);
    }
  };

  const handleBackToChat = () => {
    setShowAnalysis(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Mobile layout - single panel with navigation
  if (isMobile) {
    return (
      <ErrorBoundary>
        <div className="h-screen bg-black flex flex-col">
          {/* Mobile Navigation */}
          <Navigation lang={lang} />

          {/* Mobile Header */}
          {showAnalysis && (
            <header className="bg-dark-gray border-b border-gray-800 p-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBackToChat}
                  className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div>
                  <h1 className="text-lg font-bold text-white">Analysis Results</h1>
                  <p className="text-sm text-gray-400">Detailed security assessment</p>
                </div>
              </div>
            </header>
          )}

          {/* Mobile Content */}
          <div className="flex-1 overflow-hidden">
            {showAnalysis && currentAnalysis ? (
              <AnalysisErrorBoundary>
                <ScamAnalysis analysis={currentAnalysis} conversation={messages} lang={lang} />
              </AnalysisErrorBoundary>
            ) : (
              <ChatErrorBoundary>
                <ChatInterface onAnalysisComplete={handleAnalysisComplete} lang={lang} />
              </ChatErrorBoundary>
            )}
          </div>

          {/* Help System */}
          <HelpSystem lang={lang} />

          {/* Onboarding Flow */}
          {showOnboarding && <OnboardingFlow lang={lang} onComplete={handleOnboardingComplete} />}
        </div>
      </ErrorBoundary>
    );
  }

  // Desktop layout - dual panel
  return (
    <ErrorBoundary>
      <div className="h-screen bg-black flex flex-col relative">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: 'url(/lion-digital-guardian/background-pattern/cyber-grid_v1_tile.webp)',
            backgroundRepeat: 'repeat',
            backgroundSize: '400px 400px',
          }}
        />

        {/* Desktop Navigation */}
        <Navigation lang={lang} />

        <div className="flex-1 flex">
          {/* Left Panel - Chat Interface */}
          <div className="w-1/2 border-r border-gray-800 flex flex-col">
            <header className="bg-dark-gray border-b border-gray-800 p-6">
              <div>
                <h1 className="text-xl font-bold text-white mb-1">Scam Hunter</h1>
                <p className="text-sm text-gray-400">AI-powered scam detection</p>
              </div>
            </header>

            <div className="flex-1">
              <ChatErrorBoundary>
                <ChatInterface onAnalysisComplete={handleAnalysisComplete} lang={lang} />
              </ChatErrorBoundary>
            </div>
          </div>

          {/* Right Panel - Analysis Results */}
          <div className="w-1/2 flex flex-col">
            <header className="bg-dark-gray border-b border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Analysis Results</h2>
                  <p className="text-sm text-gray-400">
                    {currentAnalysis ? 'Security assessment complete' : 'Waiting for analysis...'}
                  </p>
                </div>

                {currentAnalysis && (
                  <div className="flex items-center space-x-2">
                    <StatusIcon
                      classification={currentAnalysis.analysisData.classification}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {currentAnalysis.analysisData.classification}
                    </span>
                  </div>
                )}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto">
              {currentAnalysis ? (
                <AnalysisErrorBoundary>
                  <div className="p-6">
                    <ScamAnalysis analysis={currentAnalysis} conversation={messages} lang={lang} />
                  </div>
                </AnalysisErrorBoundary>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center max-w-md">
                    <div className="w-32 h-24 mx-auto mb-6 rounded-lg overflow-hidden">
                      <Image
                        src="/lion-digital-guardian/empty-state/calm-guardian_v1_4x3.webp"
                        alt="Ready for Analysis"
                        width={256}
                        height={192}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Ready for Analysis</h3>
                    <p className="text-gray-400 leading-relaxed">
                      Submit suspicious content in the chat to receive a detailed security assessment
                      with risk scores and recommendations.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Help System */}
        <HelpSystem lang={lang} />

        {/* Support Widget */}
        <SupportWidget lang={lang} />

        {/* Onboarding Flow */}
        {showOnboarding && <OnboardingFlow lang={lang} onComplete={handleOnboardingComplete} />}
      </div>
    </ErrorBoundary>
  );
};

export default Layout;
