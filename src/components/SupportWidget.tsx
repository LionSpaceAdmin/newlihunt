'use client';

import React, { useEffect, useState } from 'react';

interface SupportWidgetProps {
  lang?: 'en' | 'he';
}

const textContent = {
  en: {
    title: "Support Our Mission",
    description: "Help us keep the digital front strong — exposing fake accounts and defending truth online.",
    projectSupport: "Support This Project",
    generalSupport: "General Support",
    fidfSupport: "Support FIDF",
    closeButton: "Close"
  },
  he: {
    title: "תמכו במשימה שלנו",
    description: "עזרו לנו לשמור על החזית הדיגיטלית חזקה — חשיפת חשבונות מזויפים והגנה על האמת ברשת.",
    projectSupport: "תמכו בפרויקט",
    generalSupport: "תמיכה כללית",
    fidfSupport: "תמכו ב-FIDF",
    closeButton: "סגור"
  }
};

const SupportWidget: React.FC<SupportWidgetProps> = ({ lang = 'en' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const content = textContent[lang];

  useEffect(() => {
    // Load Buy Me a Coffee widget script
    const script = document.createElement('script');
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
    script.setAttribute('data-id', 'danielhanukayeb');
    script.setAttribute('data-description', 'Support me on Buy me a coffee!');
    script.setAttribute('data-message', '🦁 Thank you for visiting! Your support helps us keep the digital front strong — exposing fake accounts and defending truth online. Join the pride. Roar for Israel. 🇮🇱🔥');
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
        className="fixed bottom-6 left-6 w-14 h-14 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all duration-200 hover:scale-110 z-40 flex items-center justify-center"
        title={content.title}
      >
        <span className="text-2xl">🦁</span>
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
              <span>🦁</span>
              {content.title}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {content.description}
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Support Options */}
        <div className="p-6 space-y-4">
          {/* Project-Specific Support */}
          <button
            onClick={handleProjectSupport}
            className="w-full p-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-between"
          >
            <div className="text-left">
              <div className="font-medium">{content.projectSupport}</div>
              <div className="text-sm text-red-100">Direct support for Scam Hunter development</div>
            </div>
            <span className="text-2xl">🎯</span>
          </button>

          {/* General Support */}
          <button
            onClick={handleGeneralSupport}
            className="w-full p-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center justify-between"
          >
            <div className="text-left">
              <div className="font-medium">{content.generalSupport}</div>
              <div className="text-sm text-orange-100">Support the developer's work</div>
            </div>
            <span className="text-2xl">☕</span>
          </button>

          {/* FIDF Support */}
          <button
            onClick={handleFIDFSupport}
            className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-between"
          >
            <div className="text-left">
              <div className="font-medium">{content.fidfSupport}</div>
              <div className="text-sm text-blue-100">Support Friends of the IDF</div>
            </div>
            <span className="text-2xl">🇮🇱</span>
          </button>

          {/* Buy Me a Coffee Button */}
          <div className="pt-4 border-t border-gray-600">
            <a 
              href="https://www.buymeacoffee.com/danielhanukayeb" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full"
            >
              <img 
                src="https://img.buymeacoffee.com/button-api/?text=Buy me a lions&emoji=🦁&slug=danielhanukayeb&button_colour=f20707&font_colour=ffffff&font_family=Cookie&outline_colour=ffffff&coffee_colour=FFDD00" 
                alt="Buy Me A Coffee"
                className="w-full rounded-lg hover:opacity-90 transition-opacity"
              />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <p className="text-xs text-gray-500 text-center">
            🦁 Join the pride. Roar for Israel. 🇮🇱🔥
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupportWidget;