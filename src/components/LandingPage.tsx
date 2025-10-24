'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface LandingPageProps {
    lang?: 'en' | 'he';
}

const textContent = {
    en: {
        hero: {
            title: 'Scam Hunter',
            subtitle: 'AI-Powered Protection Against Online Scams',
            description: 'Protect yourself from online impersonation scams targeting supporters of Israel and the IDF with our advanced AI analysis platform.',
            cta: 'Start Analysis',
            learnMore: 'Learn More',
        },
        features: {
            title: 'Powerful Protection Features',
            items: [
                {
                    icon: '🤖',
                    title: 'AI-Powered Analysis',
                    description: 'Advanced artificial intelligence analyzes suspicious content and identifies scam patterns in real-time.',
                },
                {
                    icon: (
                        <div className="w-12 h-12 mx-auto">
                            <img
                                src="/lion-digital-guardian/status-success/digital-shield-success_v1_1x1.webp"
                                alt="Shield"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ),
                    title: 'Dual-Score System',
                    description: 'Get both Risk and Credibility scores for comprehensive assessment of suspicious content.',
                },
                {
                    icon: (
                        <div className="w-12 h-12 mx-auto">
                            <svg className="w-full h-full text-accent-blue" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17 3H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 16c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm2.5-6H9.5V7h5v6z" />
                            </svg>
                        </div>
                    ),
                    title: 'Multi-Modal Detection',
                    description: 'Analyze text, images, and URLs to detect sophisticated impersonation attempts.',
                },
                {
                    icon: (
                        <div className="w-12 h-12 mx-auto">
                            <div className="w-full h-full bg-blue-600 rounded-lg flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            </div>
                        </div>
                    ),
                    title: 'Israel-Focused Protection',
                    description: 'Specialized detection for scams targeting supporters of Israel and the IDF.',
                },
            ],
        },
        mission: {
            title: 'Our Mission',
            description: 'Protecting supporters of Israel and the IDF from online impersonation scams and fake accounts. Together, we defend the digital front and expose those who seek to deceive and exploit.',
            badge: 'Lions of Zion',
        },
        cta: {
            title: 'Ready to Get Protected?',
            description: 'Start analyzing suspicious content now and protect yourself from online scams.',
            button: 'Start Free Analysis',
        },
    },
    he: {
        hero: {
            title: 'צייד הרמאויות',
            subtitle: 'הגנה מונעת בינה מלאכותית מפני רמאויות ברשת',
            description: 'הגן על עצמך מפני רמאויות התחזות ברשת המכוונות לתומכי ישראל וצה"ל עם פלטפורמת הניתוח המתקדמת שלנו.',
            cta: 'התחל ניתוח',
            learnMore: 'למד עוד',
        },
        features: {
            title: 'תכונות הגנה חזקות',
            items: [
                {
                    icon: '🤖',
                    title: 'ניתוח מונע בינה מלאכותית',
                    description: 'בינה מלאכותית מתקדמת מנתחת תוכן חשוד ומזהה דפוסי רמאות בזמן אמת.',
                },
                {
                    icon: (
                        <div className="w-12 h-12 mx-auto">
                            <img
                                src="/lion-digital-guardian/status-success/digital-shield-success_v1_1x1.webp"
                                alt="Shield"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ),
                    title: 'מערכת ציון כפולה',
                    description: 'קבל ציוני סיכון ואמינות להערכה מקיפה של תוכן חשוד.',
                },
                {
                    icon: (
                        <div className="w-12 h-12 mx-auto">
                            <svg className="w-full h-full text-accent-blue" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17 3H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 16c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm2.5-6H9.5V7h5v6z" />
                            </svg>
                        </div>
                    ),
                    title: 'זיהוי רב-מודלי',
                    description: 'נתח טקסט, תמונות וקישורים כדי לזהות ניסיונות התחזות מתוחכמים.',
                },
                {
                    icon: (
                        <div className="w-12 h-12 mx-auto">
                            <div className="w-full h-full bg-blue-600 rounded-lg flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            </div>
                        </div>
                    ),
                    title: 'הגנה ממוקדת ישראל',
                    description: 'זיהוי מיוחד לרמאויות המכוונות לתומכי ישראל וצה"ל.',
                },
            ],
        },
        mission: {
            title: 'המשימה שלנו',
            description: 'הגנה על תומכי ישראל וצה"ל מפני רמאויות התחזות ברשת וחשבונות מזויפים. יחד, אנו מגנים על החזית הדיגיטלית וחושפים את אלה המבקשים להטעות ולנצל.',
            badge: 'אריות ציון',
        },
        cta: {
            title: 'מוכן להגנה?',
            description: 'התחל לנתח תוכן חשוד עכשיו והגן על עצמך מפני רמאויות ברשת.',
            button: 'התחל ניתוח חינם',
        },
    },
};

const LandingPage: React.FC<LandingPageProps> = ({ lang = 'en' }) => {
    const t = textContent[lang];

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div
                        className="w-full h-full bg-repeat"
                        style={{
                            backgroundImage: 'url(/lion-digital-guardian/background-pattern/cyber-grid_v1_tile.webp)',
                            backgroundSize: '200px 200px',
                        }}
                    />
                </div>

                <div className="relative container mx-auto px-4 py-20">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Logo */}
                        <div className="w-32 h-32 mx-auto mb-8 rounded-2xl overflow-hidden animate-digital-pulse">
                            <Image
                                src="/lion-digital-guardian/app-icon/68512281-D399-4756-9206-67C2C2E83BB0.webp"
                                alt="Scam Hunter Logo"
                                width={128}
                                height={128}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Hero Text */}
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient-blue">
                            {t.hero.title}
                        </h1>

                        <h2 className="text-xl md:text-2xl text-gray-300 mb-6">
                            {t.hero.subtitle}
                        </h2>

                        <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                            {t.hero.description}
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/analyze"
                                className="px-8 py-4 bg-accent-blue text-white font-semibold rounded-lg hover:bg-blue-600 transition-all duration-200 hover:scale-105 shadow-lg"
                            >
                                {t.hero.cta}
                            </Link>
                            <button className="px-8 py-4 border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800 hover:border-gray-500 transition-colors">
                                {t.hero.learnMore}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-dark-gray">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
                            {t.features.title}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {t.features.items.map((feature, index) => (
                                <div
                                    key={index}
                                    className="bg-light-gray rounded-xl p-6 text-center hover:bg-gray-700 transition-colors"
                                >
                                    <div className="text-4xl mb-4">{feature.icon}</div>
                                    <h3 className="text-xl font-semibold mb-3 text-white">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="flex items-center justify-center space-x-3 mb-6">
                            <div className="w-12 h-12">
                                <img
                                    src="/lion-digital-guardian/app-icon/68512281-D399-4756-9206-67C2C2E83BB0.webp"
                                    alt="Lion Guardian"
                                    className="w-full h-full object-contain rounded-lg"
                                />
                            </div>
                            <span className="px-4 py-2 bg-blue-900/20 border border-blue-600/30 rounded-full text-blue-300 text-sm font-medium">
                                {t.mission.badge}
                            </span>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold mb-8">
                            {t.mission.title}
                        </h2>

                        <p className="text-lg text-gray-300 leading-relaxed mb-12">
                            {t.mission.description}
                        </p>

                        {/* Hero Image */}
                        <div className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
                            <Image
                                src="/lion-digital-guardian/hero-banner/landing-visual_v1_16x9.webp"
                                alt="Digital Guardian"
                                width={800}
                                height={450}
                                className="w-full h-auto"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            {t.cta.title}
                        </h2>

                        <p className="text-lg text-gray-300 mb-8">
                            {t.cta.description}
                        </p>

                        <Link
                            href="/analyze"
                            className="inline-flex items-center px-8 py-4 bg-accent-blue text-white font-semibold rounded-lg hover:bg-blue-600 transition-all duration-200 hover:scale-105 shadow-lg"
                        >
                            <div className="w-5 h-5 mr-2">
                                <img
                                    src="/lion-digital-guardian/status-success/digital-shield-success_v1_1x1.webp"
                                    alt="Shield"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            {t.cta.button}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Support Section */}
            <section className="py-16 bg-dark-gray border-t border-gray-800">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    {lang === 'he' ? 'תמכו במשימה שלנו' : 'Support Our Mission'}
                                </h3>
                                <p className="text-gray-400">
                                    {lang === 'he'
                                        ? 'עזרו לנו להמשיך לחשף חשבונות מזויפים ולהגן על האמת ברשת'
                                        : 'Help us continue exposing fake accounts and defending truth online'
                                    }
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <a
                                    href="https://www.fidf.org/donate"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
                                            <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                        </div>
                                        <span>{lang === 'he' ? 'תמכו ב-FIDF' : 'Support FIDF'}</span>
                                    </div>
                                </a>

                                <a
                                    href="https://buymeacoffee.com/danielhanukayeb"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                                >
                                    <span>☕</span>
                                    <span>{lang === 'he' ? 'קנה לי קפה' : 'Buy Me Coffee'}</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;