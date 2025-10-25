'use client';

import ErrorBoundary from '@/components/ErrorBoundary';
import Navigation from '@/components/Navigation';
import React from 'react';

const PrivacyPage: React.FC = () => {
    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-black">
                <Navigation lang="en" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
                        <p className="text-gray-400">Last Updated: October 25, 2025</p>
                    </div>

                    {/* Content */}
                    <div className="prose prose-invert max-w-none">
                        <div className="bg-dark-gray border border-gray-700 rounded-lg p-8 mb-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Our Commitment to Privacy</h2>
                            <p className="text-gray-300 mb-4">
                                Scam Hunt Platform is committed to protecting your privacy. This policy explains how we handle your information when you use our AI-powered scam detection service.
                            </p>
                            <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
                                <p className="text-blue-300 font-semibold">
                                    🔒 TL;DR: All your data stays in your browser. We use anonymous identifiers and never collect personal information.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Data Collection */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>

                                <h3 className="text-xl font-semibold text-white mb-3 mt-6">Local Storage Only</h3>
                                <p className="text-gray-300 mb-4">
                                    All analysis results and history are stored locally in your browser using localStorage. This data includes:
                                </p>
                                <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                                    <li>Analysis results (risk scores, classifications, recommendations)</li>
                                    <li>Content you submitted for analysis (text, images, URLs)</li>
                                    <li>Timestamps of your analyses</li>
                                    <li>Anonymous user identifier (randomly generated)</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mb-3 mt-6">Anonymous Identification</h3>
                                <p className="text-gray-300 mb-4">
                                    We generate a random anonymous identifier stored in your browser to keep your analyses organized. This identifier:
                                </p>
                                <ul className="list-disc list-inside text-gray-300 space-y-2">
                                    <li>Contains no personal information</li>
                                    <li>Cannot be used to identify you</li>
                                    <li>Can be cleared at any time by clearing your browser data</li>
                                </ul>
                            </section>

                            {/* AI Processing */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">2. AI Processing</h2>
                                <p className="text-gray-300 mb-4">
                                    When you submit content for analysis, we send it to Google Gemini AI API for processing:
                                </p>
                                <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                                    <li>Content is processed in real-time and not stored by us</li>
                                    <li>Google's AI processes content according to their privacy policy</li>
                                    <li>No personal identifiers are sent with the content</li>
                                    <li>Analysis happens server-side for security</li>
                                </ul>
                                <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-4">
                                    <p className="text-yellow-300">
                                        ⚠️ <strong>Note:</strong> Google Gemini AI may process your submitted content according to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">Google's Privacy Policy</a>.
                                    </p>
                                </div>
                            </section>

                            {/* Data Usage */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Data</h2>
                                <p className="text-gray-300 mb-4">
                                    Your locally stored data is used to:
                                </p>
                                <ul className="list-disc list-inside text-gray-300 space-y-2">
                                    <li>Display your analysis history</li>
                                    <li>Show statistics on your profile page</li>
                                    <li>Improve your experience with the platform</li>
                                </ul>
                                <p className="text-gray-300 mt-4">
                                    <strong>We do NOT:</strong>
                                </p>
                                <ul className="list-disc list-inside text-gray-300 space-y-2">
                                    <li>Upload your data to our servers</li>
                                    <li>Share your data with third parties (except AI processing)</li>
                                    <li>Track you across websites</li>
                                    <li>Use cookies for advertising</li>
                                    <li>Collect personal information</li>
                                </ul>
                            </section>

                            {/* Security */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">4. Security Measures</h2>
                                <p className="text-gray-300 mb-4">
                                    We implement multiple security layers:
                                </p>
                                <ul className="list-disc list-inside text-gray-300 space-y-2">
                                    <li>Rate limiting to prevent abuse</li>
                                    <li>Input sanitization and validation</li>
                                    <li>Content Security Policy (CSP) headers</li>
                                    <li>HTTPS encryption for all communications</li>
                                    <li>API key protection</li>
                                </ul>
                            </section>

                            {/* User Rights */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">5. Your Rights and Control</h2>
                                <p className="text-gray-300 mb-4">
                                    You have complete control over your data:
                                </p>
                                <ul className="list-disc list-inside text-gray-300 space-y-2">
                                    <li><strong>Access:</strong> All your data is viewable in the History page</li>
                                    <li><strong>Delete:</strong> Clear individual analyses or all history at any time</li>
                                    <li><strong>Export:</strong> Download your analysis results as text or JSON</li>
                                    <li><strong>Portability:</strong> Your data is yours and can be exported</li>
                                </ul>
                            </section>

                            {/* Third-Party Services */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">6. Third-Party Services</h2>
                                <p className="text-gray-300 mb-4">We use the following third-party services:</p>

                                <h3 className="text-lg font-semibold text-white mb-2 mt-4">Google Gemini AI</h3>
                                <p className="text-gray-300 mb-4">
                                    For AI-powered scam analysis. Subject to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">Google's Privacy Policy</a>.
                                </p>

                                <h3 className="text-lg font-semibold text-white mb-2 mt-4">Vercel (Hosting)</h3>
                                <p className="text-gray-300 mb-4">
                                    For website hosting and edge functions. Subject to <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">Vercel's Privacy Policy</a>.
                                </p>

                                <h3 className="text-lg font-semibold text-white mb-2 mt-4">Buy Me a Coffee (Optional)</h3>
                                <p className="text-gray-300 mb-4">
                                    For voluntary donations. Subject to their privacy policy when you choose to donate.
                                </p>
                            </section>

                            {/* Children's Privacy */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">7. Children's Privacy</h2>
                                <p className="text-gray-300">
                                    Our service is not directed to children under 13. We do not knowingly collect information from children. If you believe a child has used our service, please contact us.
                                </p>
                            </section>

                            {/* Changes */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">8. Changes to This Policy</h2>
                                <p className="text-gray-300">
                                    We may update this policy from time to time. We will notify users of significant changes by updating the "Last Updated" date and, when appropriate, providing additional notice.
                                </p>
                            </section>

                            {/* Contact */}
                            <section className="bg-dark-gray border border-gray-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-4">9. Contact Us</h2>
                                <p className="text-gray-300 mb-4">
                                    If you have questions about this Privacy Policy, please contact us:
                                </p>
                                <ul className="list-none text-gray-300 space-y-2">
                                    <li>📧 Email: <a href="mailto:privacy@scamhunter.app" className="text-accent-blue hover:underline">privacy@scamhunter.app</a></li>
                                    <li>🌐 Website: <a href="/contact" className="text-accent-blue hover:underline">Contact Page</a></li>
                                    <li>💻 GitHub: <a href="https://github.com/LionSpaceAdmin/newlihunt" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">Repository</a></li>
                                </ul>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default PrivacyPage;
