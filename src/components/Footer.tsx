'use client';

import Link from 'next/link';
import { FiGithub, FiHeart, FiMail, FiTwitter } from 'react-icons/fi';

interface FooterProps {
    lang?: 'en' | 'he';
}

const textContent = {
    en: {
        tagline: 'Protecting the digital front against online impersonation scams',
        mission: 'Our Mission',
        missionText: 'Defending Israel supporters from online scams through AI-powered detection',
        quickLinks: 'Quick Links',
        home: 'Home',
        analyze: 'Analyze',
        history: 'History',
        profile: 'Profile',
        legal: 'Legal',
        contact: 'Contact',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        support: 'Support',
        supportProject: 'Support This Project',
        supportFIDF: 'Support FIDF',
        builtWith: 'Built with',
        forIsrael: 'for Israel supporters worldwide',
        copyright: '© 2025 Scam Hunt Platform. All rights reserved.',
        amYisraelChai: 'Am Yisrael Chai',
    },
    he: {
        tagline: 'הגנה על החזית הדיגיטלית מפני רמאויות אונליין',
        mission: 'המשימה שלנו',
        missionText: 'הגנה על תומכי ישראל מרמאויות אונליין באמצעות זיהוי מבוסס AI',
        quickLinks: 'קישורים מהירים',
        home: 'בית',
        analyze: 'ניתוח',
        history: 'היסטוריה',
        profile: 'פרופיל',
        legal: 'משפטי',
        contact: 'צור קשר',
        privacy: 'מדיניות פרטיות',
        terms: 'תנאי שימוש',
        support: 'תמיכה',
        supportProject: 'תמוך בפרויקט',
        supportFIDF: 'תמוך ב-FIDF',
        builtWith: 'נבנה עם',
        forIsrael: 'עבור תומכי ישראל ברחבי העולם',
        copyright: '© 2025 פלטפורמת ציד רמאויות. כל הזכויות שמורות.',
        amYisraelChai: 'עם ישראל חי',
    },
};

export function Footer({ lang = 'en' }: FooterProps) {
    const t = textContent[lang];

    return (
        <footer className="bg-dark-gray border-t border-gray-800 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10">
                                <img
                                    src="/lion-digital-guardian/app-icon/68512281-D399-4756-9206-67C2C2E83BB0.webp"
                                    alt="Lion Guardian"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Scam Hunt</h3>
                                <p className="text-sm text-gray-400">{t.tagline}</p>
                            </div>
                        </div>
                        <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4 mb-4">
                            <p className="text-sm text-gray-300 mb-2">
                                <strong className="text-white">{t.mission}:</strong> {t.missionText}
                            </p>
                            <p className="text-blue-400 font-semibold text-sm">🇮🇱 {t.amYisraelChai} 🇮🇱</p>
                        </div>
                        {/* Social Links */}
                        <div className="flex items-center space-x-4">
                            <a
                                href="https://github.com/LionSpaceAdmin/newlihunt"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                                aria-label="GitHub"
                            >
                                <FiGithub size={20} />
                            </a>
                            <a
                                href="https://twitter.com/scamhunter"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                                aria-label="Twitter"
                            >
                                <FiTwitter size={20} />
                            </a>
                            <a
                                href="mailto:contact@scamhunter.app"
                                className="text-gray-400 hover:text-white transition-colors"
                                aria-label="Email"
                            >
                                <FiMail size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t.quickLinks}</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    {t.home}
                                </Link>
                            </li>
                            <li>
                                <Link href="/analyze" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    {t.analyze}
                                </Link>
                            </li>
                            <li>
                                <Link href="/history" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    {t.history}
                                </Link>
                            </li>
                            <li>
                                <Link href="/profile" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    {t.profile}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal & Support */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t.legal}</h4>
                        <ul className="space-y-2 mb-6">
                            <li>
                                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    {t.contact}
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    {t.privacy}
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    {t.terms}
                                </Link>
                            </li>
                        </ul>

                        <h4 className="text-white font-semibold mb-4">{t.support}</h4>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="https://buymeacoffee.com/danielhanukayeb/e/471429"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-orange-400 hover:text-orange-300 transition-colors text-sm flex items-center space-x-1"
                                >
                                    <span>☕</span>
                                    <span>{t.supportProject}</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://www.fidf.org/donate"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center space-x-1"
                                >
                                    <FiHeart size={14} />
                                    <span>{t.supportFIDF}</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-800">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-sm text-gray-400 text-center md:text-left">
                            {t.copyright}
                        </p>
                        <p className="text-sm text-gray-400 text-center md:text-right">
                            {t.builtWith} <FiHeart className="inline text-red-500" size={14} /> {t.forIsrael}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
