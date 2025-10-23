'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface OnboardingFlowProps {
  lang?: 'en' | 'he';
  onComplete: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  action?: {
    text: string;
    onClick: () => void;
  };
}

const onboardingContent = {
  en: {
    welcome: "Welcome to Scam Hunter",
    subtitle: "Your AI-powered protection against online scams",
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Scam Hunter',
        description: 'AI-powered protection against online impersonation scams',
        content: (
          <div className="text-center">
            <div className="w-32 h-24 mx-auto mb-6 rounded-lg overflow-hidden">
              <Image 
                src="/lion-digital-guardian/hero-banner/landing-visual_v1_16x9.webp" 
                alt="Scam Hunter Guardian" 
                width={256}
                height={192}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-gray-300 leading-relaxed mb-4">
              Scam Hunter uses advanced AI to analyze suspicious content and protect you from online scams, 
              especially those targeting supporters of Israel and the IDF.
            </p>
            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                🛡️ <strong>Your safety is our priority.</strong> We analyze content without storing personal information.
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'how-it-works',
        title: 'How Scam Hunter Works',
        description: 'Understanding our AI-powered analysis process',
        content: (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-dark-gray rounded-lg">
                <div className="w-12 h-12 mx-auto mb-3 bg-accent-blue rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">1</span>
                </div>
                <h4 className="font-medium text-white mb-2">Submit Content</h4>
                <p className="text-sm text-gray-400">
                  Paste suspicious messages, upload images, or share links
                </p>
              </div>
              
              <div className="text-center p-4 bg-dark-gray rounded-lg">
                <div className="w-12 h-12 mx-auto mb-3 bg-accent-blue rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">2</span>
                </div>
                <h4 className="font-medium text-white mb-2">AI Analysis</h4>
                <p className="text-sm text-gray-400">
                  Our AI examines patterns, language, and risk indicators
                </p>
              </div>
              
              <div className="text-center p-4 bg-dark-gray rounded-lg">
                <div className="w-12 h-12 mx-auto mb-3 bg-accent-blue rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">3</span>
                </div>
                <h4 className="font-medium text-white mb-2">Get Results</h4>
                <p className="text-sm text-gray-400">
                  Receive detailed risk assessment and recommendations
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
              <p className="text-yellow-300 text-sm">
                💡 <strong>Pro Tip:</strong> Include as much context as possible for more accurate analysis.
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'features',
        title: 'Key Features',
        description: 'Discover what Scam Hunter can do for you',
        content: (
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-dark-gray rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Dual-Score Analysis</h4>
                <p className="text-sm text-gray-400">
                  Get both Risk Score (0-100) and Credibility Score (0-100) for comprehensive assessment
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-dark-gray rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Multimodal Analysis</h4>
                <p className="text-sm text-gray-400">
                  Analyze both text and images for complete scam detection
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-dark-gray rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">URL Inspection</h4>
                <p className="text-sm text-gray-400">
                  Safely inspect suspicious links without visiting them directly
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-dark-gray rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Export & Share</h4>
                <p className="text-sm text-gray-400">
                  Export analysis results and share findings safely with privacy protection
                </p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'safety-tips',
        title: 'Stay Safe Online',
        description: 'Essential tips for avoiding online scams',
        content: (
          <div className="space-y-4">
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
              <h4 className="font-medium text-red-300 mb-2">🚨 Red Flags to Watch For:</h4>
              <ul className="text-sm text-red-200 space-y-1">
                <li>• Urgent requests for immediate donations</li>
                <li>• Requests for personal information or passwords</li>
                <li>• Suspicious links or attachments</li>
                <li>• Emotional manipulation tactics</li>
                <li>• Unverified social media accounts</li>
              </ul>
            </div>
            
            <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
              <h4 className="font-medium text-green-300 mb-2">✅ Safe Donation Practices:</h4>
              <ul className="text-sm text-green-200 space-y-1">
                <li>• Use official charity websites (like FIDF.org)</li>
                <li>• Verify organizations independently</li>
                <li>• Never donate via gift cards or cryptocurrency</li>
                <li>• Keep records of all donations</li>
                <li>• When in doubt, ask Scam Hunter!</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'ready',
        title: 'You\'re Ready to Go!',
        description: 'Start protecting yourself with Scam Hunter',
        content: (
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-success-green rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-300 leading-relaxed mb-6">
              You&apos;re all set! Start by typing a message, uploading an image, or pasting a suspicious link 
              in the chat interface. Scam Hunter will analyze it and provide you with detailed results.
            </p>
            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                💡 <strong>Remember:</strong> You can access help anytime by clicking the help button in the bottom-right corner.
              </p>
            </div>
          </div>
        )
      }
    ] as OnboardingStep[],
    navigation: {
      next: "Next",
      previous: "Previous",
      skip: "Skip Tour",
      finish: "Get Started",
      stepOf: "Step {{current}} of {{total}}"
    }
  },
  he: {
    welcome: "ברוכים הבאים לצייד הרמאויות",
    subtitle: "ההגנה המונעת בינה מלאכותית שלכם מפני רמאויות ברשת",
    steps: [
      {
        id: 'welcome',
        title: 'ברוכים הבאים לצייד הרמאויות',
        description: 'הגנה מונעת בינה מלאכותית מפני רמאויות התחזות ברשת',
        content: (
          <div className="text-center">
            <div className="w-32 h-24 mx-auto mb-6 rounded-lg overflow-hidden">
              <Image 
                src="/lion-digital-guardian/hero-banner/landing-visual_v1_16x9.webp" 
                alt="שומר צייד הרמאויות" 
                width={256}
                height={192}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-gray-300 leading-relaxed mb-4">
              צייד הרמאויות משתמש בבינה מלאכותית מתקדמת כדי לנתח תוכן חשוד ולהגן עליכם מפני רמאויות ברשת,
              במיוחד כאלה המכוונות לתומכי ישראל וצה&quot;ל.
            </p>
            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                🛡️ <strong>הבטיחות שלכם היא העדיפות שלנו.</strong> אנחנו מנתחים תוכן מבלי לשמור מידע אישי.
              </p>
            </div>
          </div>
        )
      }
    ] as OnboardingStep[],
    navigation: {
      next: "הבא",
      previous: "קודם",
      skip: "דלג על הסיור",
      finish: "התחל",
      stepOf: "שלב {{current}} מתוך {{total}}"
    }
  }
};

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ lang = 'en', onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const content = onboardingContent[lang];
  const steps = content.steps;

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    // Store completion in localStorage
    localStorage.setItem('scam-hunter-onboarding-completed', 'true');
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length, handleComplete]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  // Check if onboarding was already completed
  useEffect(() => {
    const completed = localStorage.getItem('scam-hunter-onboarding-completed');
    if (completed === 'true') {
      setIsVisible(false);
      onComplete();
    }
  }, [onComplete]);

  if (!isVisible) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-gray rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div>
            <h2 className="text-xl font-bold text-white">{currentStepData.title}</h2>
            <p className="text-sm text-gray-400">{currentStepData.description}</p>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            {content.navigation.skip}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 border-b border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              {content.navigation.stepOf
                .replace('{{current}}', (currentStep + 1).toString())
                .replace('{{total}}', steps.length.toString())}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-accent-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStepData.content}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-gray-600">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {content.navigation.previous}
          </button>
          
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-accent-blue'
                    : index < currentStep
                    ? 'bg-success-green'
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-accent-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {isLastStep ? content.navigation.finish : content.navigation.next}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;