'use client';

import React, { useEffect, useState } from 'react';

interface SupportWidgetProps {
  lang?: 'en' | 'he';
}

const textContent = {
  en: {
    title: 'Support Our Mission',
    description:
      'Help us keep the digital front strong — exposing fake accounts and defending truth online.',
    projectSupport: 'Support This Project',
    generalSupport: 'General Support',
    fidfSupport: 'Support FIDF',
    closeButton: 'Close',
    supportProject: 'Support the Project',
  },
  he: {
    title: 'תמכו במשימה שלנו',
    description:
      'עזרו לנו לשמור על החזית הדיגיטלית חזקה — חשיפת חשבונות מזויפים והגנה על האמת ברשת.',
    projectSupport: 'תמכו בפרויקט',
    generalSupport: 'תמיכה כללית',
    fidfSupport: 'תמכו ב-FIDF',
    closeButton: 'סגור',
    supportProject: 'לתמיכה בפרויקט',
  },
};

const SupportWidget: React.FC<SupportWidgetProps> = ({ lang = 'en' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [, setWidgetLoaded] = useState(false);
  const content = textContent[lang];

  useEffect(() => {
    // Load Buy Me a Coffee widget script - Only in production
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    const script = document.createElement('script');
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
    script.setAttribute('data-id', 'danielhanukayeb');
    script.setAttribute('data-description', 'Support me on Buy me a coffee!');
    script.setAttribute(
      'data-message',
      '🦁 Thank you for visiting! Your support helps us keep the digital front strong — exposing fake accounts and defending truth online. Join the pride. Roar for Israel. 🇮🇱🔥'
    );
    script.setAttribute('data-color', '#FF5F5F');
    script.setAttribute('data-position', 'Right');
    script.setAttribute('data-x_margin', '18');
    script.setAttribute('data-y_margin', '18');

    script.onload = () => setWidgetLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[data-name="BMC-Widget"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const handleProjectSupport = () => {
    window.open('https://buymeacoffee.com/danielhanukayeb/e/471429', '_blank');
  };

  const handleGeneralSupport = () => {
    window.open('https://www.buymeacoffee.com/danielhanukayeb', '_blank');
  };

  const handleFIDFSupport = () => {
    window.open('https://www.fidf.org/donate', '_blank');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-6 right-6 flex flex-col items-center gap-2 group z-40"
        title={content.title}
      >
        <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 ring-2 ring-red-500 hover:ring-red-400">
          <img
            src="/lion-digital-guardian/app-icon/68512281-D399-4756-9206-67C2C2E83BB0.webp"
            alt="Support"
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
          {content.supportProject}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-gray rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="w-6 h-6">
                <img
                  src="/lion-digital-guardian/app-icon/68512281-D399-4756-9206-67C2C2E83BB0.webp"
                  alt="Lion Guardian"
                  className="w-full h-full object-contain rounded"
                />
              </div>
              {content.title}
            </h2>
            <p className="text-sm text-gray-400 mt-1">{content.description}</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title={content.closeButton}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Support Options */}
        <div className="p-6 space-y-4">
          {/* Project-Specific Support */}
          {/* FIDF Support - First Priority */}
          <button
            onClick={handleFIDFSupport}
            className="w-full p-5 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 flex items-center justify-between shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <div className="text-left">
              <div className="font-bold text-lg">{content.fidfSupport}</div>
              <div className="text-sm text-blue-50 mt-1">Support Friends of the IDF</div>
            </div>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </button>

          {/* Project Support */}
          <button
            onClick={handleProjectSupport}
            className="w-full p-4 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-200 flex items-center justify-between shadow-md hover:shadow-lg transform hover:scale-[1.01]"
          >
            <div className="text-left">
              <div className="font-semibold">{content.projectSupport}</div>
              <div className="text-sm text-red-50 mt-1">
                Direct support for Scam Hunter development
              </div>
            </div>
            <div className="w-8 h-8">
              <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </button>

          {/* General Support */}
          <button
            onClick={handleGeneralSupport}
            className="w-full p-4 bg-linear-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl transition-all duration-200 flex items-center justify-between shadow-md hover:shadow-lg transform hover:scale-[1.01]"
          >
            <div className="text-left">
              <div className="font-semibold">{content.generalSupport}</div>
              <div className="text-sm text-orange-50 mt-1">Support the developer&apos;s work</div>
            </div>
            <span className="text-2xl">☕</span>
          </button>

          {/* Buy Me a Coffee Button */}
          <div className="pt-6 border-t border-gray-700">
            <a
              href="https://www.buymeacoffee.com/danielhanukayeb"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full transform hover:scale-[1.02] transition-transform duration-200"
            >
              <img
                src="https://img.buymeacoffee.com/button-api/?text=Buy me a lions&emoji=🦁&slug=danielhanukayeb&button_colour=f20707&font_colour=ffffff&font_family=Cookie&outline_colour=ffffff&coffee_colour=FFDD00"
                alt="Buy Me A Coffee"
                className="w-full rounded-xl hover:opacity-90 transition-opacity shadow-md hover:shadow-lg"
              />
            </a>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <p className="text-xs text-gray-500 text-center">
              🦁 Join the pride. Roar for Israel. 🇮🇱🔥
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportWidget;
