'use client';

import Image from 'next/image';
import React, { useCallback, useState } from 'react';

interface HelpSystemProps {
  lang?: 'en' | 'he';
}

interface HelpTopic {
  id: string;
  title: string;
  content: string;
  category: 'getting-started' | 'features' | 'troubleshooting' | 'security';
  keywords: string[];
}

const helpContent = {
  en: {
    title: 'Help & Guidance',
    searchPlaceholder: 'Search help topics...',
    categories: {
      'getting-started': 'Getting Started',
      features: 'Features',
      troubleshooting: 'Troubleshooting',
      security: 'Security Tips',
    },
    topics: [
      {
        id: 'how-to-analyze',
        title: 'How to Analyze Suspicious Content',
        content: `To analyze suspicious content with Scam Hunter:

1. **Text Analysis**: Simply type or paste the suspicious message, email, or social media post into the chat
2. **Image Analysis**: Upload screenshots of suspicious content by clicking the attachment button or dragging and dropping
3. **URL Inspection**: Paste suspicious links - we'll automatically detect and offer to inspect them safely
4. **Combined Analysis**: You can include both text and images for comprehensive analysis

**Tips for Better Results:**
• Include as much context as possible
• Mention where you found the content (email, social media, etc.)
• Describe any red flags you've noticed
• Ask specific questions about what concerns you`,
        category: 'getting-started' as const,
        keywords: ['analyze', 'how to', 'start', 'upload', 'text', 'image'],
      },
      {
        id: 'understanding-scores',
        title: 'Understanding Risk and Credibility Scores',
        content: `Scam Hunter provides two key scores:

**Risk Score (0-100):**
• 0-30: Low risk - Content appears legitimate
• 31-69: Moderate risk - Some suspicious elements detected
• 70-100: High risk - Strong indicators of scam activity

**Credibility Score (0-100):**
• 0-30: Low credibility - Likely fraudulent
• 31-69: Moderate credibility - Mixed signals
• 70-100: High credibility - Appears trustworthy

**Classification:**
• SAFE: Low risk, high credibility
• SUSPICIOUS: Mixed signals, proceed with caution
• HIGH_RISK: Strong scam indicators, avoid

The AI considers multiple factors including language patterns, urgency tactics, donation requests, and technical indicators.`,
        category: 'features' as const,
        keywords: ['score', 'risk', 'credibility', 'classification', 'safe', 'suspicious'],
      },
      {
        id: 'url-inspection',
        title: 'URL Inspection Feature',
        content: `When you paste a URL, Scam Hunter can safely inspect it:

**Automatic Detection:**
• URLs in your messages are automatically detected
• Suspicious URLs are flagged with warnings
• Click "Inspect URL" to analyze safely

**What We Check:**
• Domain reputation and age
• SSL certificate status
• Suspicious patterns in the URL
• Content analysis of the webpage
• Known phishing indicators

**Safety Features:**
• We never visit the URL directly from your device
• All inspection happens on our secure servers
• You get a detailed report without risk

**Red Flags:**
• Shortened URLs (bit.ly, tinyurl, etc.)
• Misspelled domain names
• Suspicious file extensions
• Non-HTTPS connections`,
        category: 'features' as const,
        keywords: ['url', 'link', 'inspect', 'website', 'domain', 'phishing'],
      },
      {
        id: 'export-share',
        title: 'Exporting and Sharing Results',
        content: `Share your analysis results safely:

**Quick Actions:**
• Copy summary to clipboard
• Share via native sharing (mobile)
• Access full export menu

**Export Options:**
• **Copy Summary**: Brief overview for quick sharing
• **Copy Full Report**: Detailed analysis with all findings
• **Copy for Social Media**: Formatted for social platforms
• **Download as Text**: Complete report as .txt file
• **Download as JSON**: Machine-readable format

**Privacy Protection:**
• Personal information is automatically filtered
• Sensitive data warnings are shown
• Choose between full or anonymized exports

**Best Practices:**
• Review content before sharing publicly
• Use anonymized exports for social media
• Keep full reports for personal records`,
        category: 'features' as const,
        keywords: ['export', 'share', 'download', 'copy', 'privacy', 'report'],
      },
      {
        id: 'analysis-not-working',
        title: 'Analysis Not Working',
        content: `If analysis isn't working properly:

**Check Your Input:**
• Ensure you've entered text or uploaded an image
• Try shorter messages if the content is very long
• Check that images are in supported formats (JPEG, PNG, WebP)

**Connection Issues:**
• Check your internet connection
• Try refreshing the page
• Clear your browser cache

**File Upload Problems:**
• Ensure images are under 10MB
• Try a different image format
• Check that the image isn't corrupted

**Still Having Issues:**
• Try the "Retry" button if it appears
• Start a new analysis session
• Contact support if problems persist

**Browser Compatibility:**
• Use a modern browser (Chrome, Firefox, Safari, Edge)
• Enable JavaScript
• Allow clipboard access for copy features`,
        category: 'troubleshooting' as const,
        keywords: ['not working', 'broken', 'error', 'upload', 'connection', 'retry'],
      },
      {
        id: 'donation-safety',
        title: 'Safe Donation Practices',
        content: `Protect yourself when donating online:

**Verify Organizations:**
• Only donate to officially verified charities
• Check charity registration numbers
• Look for official websites and contact information
• Verify through independent charity watchdogs

**Red Flags to Avoid:**
• Urgent pressure to donate immediately
• Requests for cash, gift cards, or cryptocurrency
• Vague descriptions of how funds will be used
• Emotional manipulation tactics
• Unsolicited donation requests

**Safe Donation Methods:**
• Use official charity websites directly
• Donate through established platforms
• Use credit cards (better fraud protection)
• Keep records of all donations
• Verify tax-deductible status

**For Israeli/IDF Support:**
• Use official channels like FIDF.org
• Verify through Israeli government sources
• Be wary of individual fundraisers
• Check with established Jewish organizations`,
        category: 'security' as const,
        keywords: ['donation', 'charity', 'safe', 'verify', 'scam', 'fidf', 'israeli'],
      },
      {
        id: 'privacy-security',
        title: 'Your Privacy and Security',
        content: `How we protect your privacy:

**Data Handling:**
• We don't store personal information
• Analysis history uses anonymous identifiers
• Images are processed securely and not permanently stored
• No tracking of individual users

**What We Analyze:**
• Only the content you explicitly submit
• We don't access your device or other data
• All processing happens on secure servers

**Your Control:**
• Clear your chat history anytime
• Choose what to include in exports
• Control sharing and privacy settings

**Security Measures:**
• All connections use HTTPS encryption
• Regular security audits and updates
• No third-party data sharing
• Secure cloud infrastructure

**Best Practices:**
• Don't include personal information in analysis
• Use the privacy-safe export options
• Be cautious when sharing results publicly`,
        category: 'security' as const,
        keywords: ['privacy', 'security', 'data', 'personal', 'safe', 'encryption'],
      },
    ] as HelpTopic[],
  },
  he: {
    title: 'עזרה והדרכה',
    searchPlaceholder: 'חפש נושאי עזרה...',
    categories: {
      'getting-started': 'תחילת העבודה',
      features: 'תכונות',
      troubleshooting: 'פתרון בעיות',
      security: 'טיפים לאבטחה',
    },
    topics: [
      {
        id: 'how-to-analyze',
        title: 'איך לנתח תוכן חשוד',
        content: `כדי לנתח תוכן חשוד עם צייד הרמאויות:

1. **ניתוח טקסט**: פשוט הקלד או הדבק את ההודעה החשודה, האימייל או הפוסט ברשת החברתית לצ'אט
2. **ניתוח תמונה**: העלה צילומי מסך של תוכן חשוד על ידי לחיצה על כפתור הקובץ או גרירה ושחרור
3. **בדיקת קישורים**: הדבק קישורים חשודים - נזהה אותם אוטומטית ונציע לבדוק אותם בבטחה
4. **ניתוח משולב**: אפשר לכלול גם טקסט וגם תמונות לניתוח מקיף

**טיפים לתוצאות טובות יותר:**
• כלול כמה שיותר הקשר
• ציין איפה מצאת את התוכן (אימייל, רשת חברתית וכו')
• תאר כל דגל אדום שהבחנת בו
• שאל שאלות ספציפיות על מה שמדאיג אותך`,
        category: 'getting-started' as const,
        keywords: ['ניתוח', 'איך', 'התחלה', 'העלאה', 'טקסט', 'תמונה'],
      },
      {
        id: 'understanding-scores',
        title: 'הבנת ציוני הסיכון והאמינות',
        content: `צייד הרמאויות מספק שני ציונים מרכזיים:

**ציון סיכון (0-100):**
• 0-30: סיכון נמוך - התוכן נראה לגיטימי
• 31-69: סיכון בינוני - זוהו אלמנטים חשודים
• 70-100: סיכון גבוה - אינדיקטורים חזקים לפעילות רמאות

**ציון אמינות (0-100):**
• 0-30: אמינות נמוכה - כנראה מזויף
• 31-69: אמינות בינונית - אותות מעורבים
• 70-100: אמינות גבוהה - נראה אמין

**סיווג:**
• בטוח: סיכון נמוך, אמינות גבוהה
• חשוד: אותות מעורבים, המשך בזהירות
• סיכון גבוה: אינדיקטורים חזקים לרמאות, הימנע

הבינה המלאכותית שוקלת גורמים מרובים כולל דפוסי שפה, טקטיקות דחיפות, בקשות תרומה ואינדיקטורים טכניים.`,
        category: 'features' as const,
        keywords: ['ציון', 'סיכון', 'אמינות', 'סיווג', 'בטוח', 'חשוד'],
      },
    ] as HelpTopic[],
  },
};

const HelpSystem: React.FC<HelpSystemProps> = ({ lang = 'en' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);

  const content = helpContent[lang];

  const filteredTopics = content.topics.filter(topic => {
    const matchesSearch =
      searchQuery === '' ||
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === null || topic.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleTopicSelect = useCallback((topic: HelpTopic) => {
    setSelectedTopic(topic);
  }, []);

  const handleBack = useCallback(() => {
    if (selectedTopic) {
      setSelectedTopic(null);
    } else {
      setIsOpen(false);
    }
  }, [selectedTopic]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSelectedTopic(null);
    setSearchQuery('');
    setSelectedCategory(null);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-accent-blue text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200 hover:scale-110 z-40 flex items-center justify-center"
        title="Help & Guidance"
        aria-label="Help & Guidance"
      >
        <Image
          src="/lion-digital-guardian/app-icon/72C93FB8-22F5-481E-B332-949C5ABF7B5F.png"
          alt="Help"
          width={32}
          height={32}
          className="rounded-full"
        />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-gray rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center space-x-3">
            {selectedTopic && (
              <button
                onClick={handleBack}
                className="p-1 text-gray-400 hover:text-white transition-colors"
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
            )}
            <h2 className="text-xl font-bold text-white">
              {selectedTopic ? selectedTopic.title : content.title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
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

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {selectedTopic ? (
            // Topic Detail View
            <div className="p-6 overflow-y-auto h-full">
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-line text-gray-300 leading-relaxed">
                  {selectedTopic.content}
                </div>
              </div>
            </div>
          ) : (
            // Topic List View
            <div className="flex flex-col h-full">
              {/* Search and Filters */}
              <div className="p-6 border-b border-gray-600">
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder={content.searchPlaceholder}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-light-gray border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedCategory === null
                      ? 'bg-accent-blue text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                  >
                    All Topics
                  </button>
                  {Object.entries(content.categories).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedCategory === key
                        ? 'bg-accent-blue text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topics List */}
              <div className="flex-1 overflow-y-auto p-6">
                {filteredTopics.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
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
                    </div>
                    <p className="text-gray-400">No help topics found matching your search.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTopics.map(topic => (
                      <button
                        key={topic.id}
                        onClick={() => handleTopicSelect(topic)}
                        className="w-full text-left p-4 bg-light-gray hover:bg-gray-600 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-white group-hover:text-accent-blue transition-colors">
                              {topic.title}
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">
                              {content.categories[topic.category]}
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover:text-accent-blue transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpSystem;
